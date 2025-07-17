// src/store/alignmentStore.js
import { defineStore } from 'pinia';
import { useTonearmStore } from '@/store/tonearmStore.js';

// Standard inner/outer groove radii (IEC)
const R1 = 60.325;
const R2 = 146.05;

export const useAlignmentStore = defineStore('alignment', {
  state: () => ({
    availableTonearms: [],
    isLoading: true,
    error: null,
    selectedTonearmId: null,

    userInput: {
      pivotToSpindle: 222.0,
      alignmentType: 'LofgrenA',
    },

    calculatedValues: {
      overhang: 0,
      offsetAngle: 0,
      effectiveLength: 0,
      nulls: { inner: 0, outer: 0 },
      geometryName: '',
      geometryDescription: '',
      trackingMethod: 'pivoting',
      error: null,
    },

    trackingErrorChartData: {
      datasets: []
    },

    ALIGNMENT_GEOMETRIES: {
      LofgrenA: { name: 'Löfgren A / Baerwald', description: 'Balances distortion between inner and outer grooves, resulting in the lowest average RMS distortion.' },
      LofgrenB: { name: 'Löfgren B', description: 'Minimizes overall RMS distortion across the record with fixed offset angle.' },
      LofgrenC: { name: 'Löfgren C', description: 'Least Mean Squares (LMS) optimization for minimal average distortion.' },
      StevensonA: { name: 'Stevenson A', description: 'Prioritizes lowest distortion at inner groove with two null points.' },
    },
  }),

  actions: {
    async initialize() {
      const tonearmStore = useTonearmStore();
      if (!tonearmStore.availableTonearms.length) {
        await tonearmStore.initialize();
      }
      this.availableTonearms = tonearmStore.availableTonearms;
      this.isLoading = false;
      this.calculateAlignment();
    },

    loadTonearmPreset(id) {
      this.selectedTonearmId = id;
      if (id == null) {
        this.calculatedValues.trackingMethod = 'pivoting';
      } else {
        const t = this.availableTonearms.find(x => x.id == id);
        if (t) {
          this.userInput.pivotToSpindle = t.pivot_to_spindle_mm || this.userInput.pivotToSpindle;
          this.calculatedValues.trackingMethod = t.tracking_method || 'pivoting';
        }
      }
      this.calculateAlignment();
    },

    setAlignment(type) {
      this.userInput.alignmentType = type;
      this.calculateAlignment();
    },

    // Lofgren A / Baerwald exact per Jovanović JAES 2022
    getLofgrenAAlignmentGeometry(D) {
      const L = Math.sqrt(D * D + (8 * R1 * R1 * R2 * R2) / (R1*R1 + 6*R1*R2 + R2*R2));
      const overhang = L - D;
      const betaRad = Math.asin((4 * R1 * R2 * (R1 + R2)) / (L * (R1*R1 + 6*R1*R2 + R2*R2)));
      const offsetAngle = betaRad * 180 / Math.PI;

      const invSqrt2 = 1/Math.sqrt(2);
      const innerNull = (2 * R1 * R2 * (1 - invSqrt2)) / (R2 + (1 + invSqrt2) * R1);
      const outerNull = (2 * R1 * R2 * (1 + invSqrt2)) / (R2 + (1 - invSqrt2) * R1);

      return { 
        effectiveLength: L, 
        overhang, 
        offsetAngle, 
        nulls: { inner: innerNull, outer: outerNull }, 
        geometryName: this.ALIGNMENT_GEOMETRIES.LofgrenA.name, 
        geometryDescription: this.ALIGNMENT_GEOMETRIES.LofgrenA.description 
      };
    },

    // Lofgren B exact per Eq (22) in Jovanović JAES 2022
    getLofgrenBAlignmentGeometry(D) {
      // Compute Löfgren A parameters for reference
      const L0 = Math.sqrt(D * D + (8 * R1 * R1 * R2 * R2) / (R1*R1 + 6*R1*R2 + R2*R2));
      // FIX: Removed extra parenthesis in Math.asin
      const betaRad = Math.asin((4 * R1 * R2 * (R1 + R2)) / (L0 * (R1*R1 + 6*R1*R2 + R2*R2));
      
      // Exact H_B per Eq (22)
      const numerator = 3 * R1 * R2 * L0 * Math.sin(betaRad) * (R1 + R2) - R1 * R2;
      const denominator = R1*R1 + R1*R2 + R2*R2;
      const term = numerator / denominator;
      
      // Handle potential negative values
      let H;
      if (L0*L0 - term >= 0) {
        H = L0 - Math.sqrt(L0*L0 - term);
      } else {
        H = (3 * R1 * R2 * (L0 * Math.sin(betaRad) * (R1 + R2) - R1 * R2) / (2 * L0 * denominator);
      }
      
      // Calculate effective length
      const L_effective = Math.sqrt(D*D + H*H);

      // Compute null points by finding tracking error roots
      const computeError = (r) => {
        const t = (r*r + L_effective*L_effective - D*D) / (2 * r * L_effective);
        if (t < -1 || t > 1) return NaN;
        return Math.asin(t) - betaRad;
      };

      // Root-finding algorithm
      const roots = [];
      const step = 0.1;
      let prev = computeError(R1);
      
      for (let r = R1 + step; r <= R2; r += step) {
        const current = computeError(r);
        if (isNaN(current)) continue;
        
        if (!isNaN(prev) && Math.sign(prev) !== Math.sign(current)) {
          // Linear interpolation for accuracy
          const r0 = r - step;
          const root = r0 - prev * step / (current - prev);
          roots.push(root);
        }
        prev = current;
      }

      // Sort found roots
      roots.sort((a, b) => a - b);

      return { 
        effectiveLength: L_effective, 
        overhang: H, 
        offsetAngle: betaRad * 180 / Math.PI, 
        nulls: { 
          inner: roots[0] || 0,
          outer: roots[1] || 0 
        },
        geometryName: this.ALIGNMENT_GEOMETRIES.LofgrenB.name,
        geometryDescription: this.ALIGNMENT_GEOMETRIES.LofgrenB.description 
      };
    },

    // Lofgren C exact per Jovanović JAES 2022 (Eqs 27-31)
    getLofgrenCAlignmentGeometry(D) {
      // Solve for effective length (L) using numerical iteration
      let L = Math.sqrt(D*D + 100); // Initial guess
      const tolerance = 0.0001;
      let diff = 10;
      let iterations = 0;
      
      while (Math.abs(diff) > tolerance && iterations < 100) {
        // Eq (27): Compute linear offset (p)
        const R_diff = R2 - R1;
        const R_diff6 = Math.pow(R_diff, 6);
        const L2 = L*L;
        const L2_R1R2 = L2 + R1*R2;
        const logR = Math.log(R2/R1);
        
        const numeratorPart = 2*(R1*R1 + R1*R2 + R2*R2)*logR - 3*(R2*R2 - R1*R1);
        const innerRoot = R_diff6 * L2_R1R2*L2_R1R2 - 4*L2*R1*R1*R2*R2*numeratorPart*numeratorPart;
        
        let p;
        if (innerRoot >= 0) {
          p = ((L2_R1R2 * Math.pow(R_diff,3)) - Math.sqrt(innerRoot)) /
              (4*R1*R2*(R1*R1 + R1*R2 + R2*R2)*logR - 6*R1*R2*(R2*R2 - R1*R1));
        } else {
          p = (4 * R1 * R2 * (R1 + R2)) / (R1*R1 + 6*R1*R2 + R2*R2);
        }
        
        // Eq (28): Compute a²
        const a2 = (3 * R1 * R2 * (p * (R1 + R2) - R1*R2)) / (R1*R1 + R1*R2 + R2*R2);
        
        // Eq (30): Compute overhang (H)
        const H = L - Math.sqrt(L*L - a2);
        
        // Update L using Pythagoras: D^2 = L^2 - H^2
        const newL = Math.sqrt(D*D + H*H);
        diff = newL - L;
        L = newL;
        iterations++;
      }
      
      // Recompute parameters with final L
      const R_diff = R2 - R1;
      const R_diff6 = Math.pow(R_diff, 6);
      const L2 = L*L;
      const L2_R1R2 = L2 + R1*R2;
      const logR = Math.log(R2/R1);
      
      const numeratorPart = 2*(R1*R1 + R1*R2 + R2*R2)*logR - 3*(R2*R2 - R1*R1);
      const innerRoot = R_diff6 * L2_R1R2*L2_R1R2 - 4*L2*R1*R1*R2*R2*numeratorPart*numeratorPart;
      
      let p;
      if (innerRoot >= 0) {
        p = ((L2_R1R2 * Math.pow(R_diff,3)) - Math.sqrt(innerRoot)) /
            (4*R1*R2*(R1*R1 + R1*R2 + R2*R2)*logR - 6*R1*R2*(R2*R2 - R1*R1));
      } else {
        p = (4 * R1 * R2 * (R1 + R2)) / (R1*R1 + 6*R1*R2 + R2*R2);
      }
      
      // Eq (28): a²
      const a2 = (3 * R1 * R2 * (p * (R1 + R2) - R1*R2)) / (R1*R1 + R1*R2 + R2*R2);
      
      // Eq (29): Offset angle (β)
      const betaRad = Math.asin(p / L);
      const offsetAngle = betaRad * 180 / Math.PI;
      
      // Eq (30): Overhang (H)
      const H = L - Math.sqrt(L*L - a2);
      
      // Eq (31): Null points
      const innerNull = p - Math.sqrt(p*p - a2);
      const outerNull = p + Math.sqrt(p*p - a2);
      
      return { 
        effectiveLength: L, 
        overhang: H, 
        offsetAngle, 
        nulls: { inner: innerNull, outer: outerNull }, 
        geometryName: this.ALIGNMENT_GEOMETRIES.LofgrenC.name, 
        geometryDescription: this.ALIGNMENT_GEOMETRIES.LofgrenC.description 
      };
    },

    // Stevenson A with inner/outer null at 129.5/136.9 mm
    getStevensonAAlignmentGeometry(D) {
      const inner = 129.5;
      const outer = 136.9;
      // Stevenson effective length per average null radius
      const avgNull = 0.5 * (inner + outer);
      const L = Math.sqrt(D * D + avgNull * avgNull);
      const overhang = L - D;
      const beta = Math.asin((outer - inner) / (2 * L));
      return { 
        effectiveLength: L, 
        overhang, 
        offsetAngle: beta * 180 / Math.PI, 
        nulls: { inner, outer }, 
        geometryName: this.ALIGNMENT_GEOMETRIES.StevensonA.name, 
        geometryDescription: this.ALIGNMENT_GEOMETRIES.StevensonA.description 
      };
    },

    calculateAlignment() {
      const D = this.userInput.pivotToSpindle;
      if (!D || D <= 0) {
        this.calculatedValues.error = 'Pivot-to-Spindle must be > 0.';
        this.trackingErrorChartData.datasets = [];
        return;
      }
      this.calculatedValues.error = null;

      let res;
      const type = this.userInput.alignmentType;
      if (this.calculatedValues.trackingMethod !== 'pivoting') {
        res = { 
          effectiveLength: D, 
          overhang: 0, 
          offsetAngle: 0, 
          nulls: { inner: null, outer: null }, 
          geometryName: 'Tangential', 
          geometryDescription: 'Zero error.' 
        };
      } else if (type === 'LofgrenA') {
        res = this.getLofgrenAAlignmentGeometry(D);
      } else if (type === 'LofgrenB') {
        res = this.getLofgrenBAlignmentGeometry(D);
      } else if (type === 'LofgrenC') {
        res = this.getLofgrenCAlignmentGeometry(D);
      } else if (type === 'StevensonA') {
        res = this.getStevensonAAlignmentGeometry(D);
      } else {
        this.calculatedValues.error = `Unknown alignment type: ${type}`;
        return;
      }

      this.calculatedValues = { ...this.calculatedValues, ...res };
      this.updateTrackingErrorChartData();
    },

    updateTrackingErrorChartData() {
      if (this.calculatedValues.error) {
        this.trackingErrorChartData = { datasets: [] };
        return;
      }
      const D = this.userInput.pivotToSpindle;
      const L = this.calculatedValues.effectiveLength;
      const offsetRad = this.calculatedValues.offsetAngle * Math.PI / 180;
      const data = [];
      for (let i = 0; i <= 174; i++) {
        const r = 60 + i * 0.5;
        const t = (r*r + L*L - D*D) / (2*r*L);
        const y = (t >= -1 && t <= 1) ? (Math.asin(t) - offsetRad)*180/Math.PI : NaN;
        data.push({ x: r, y });
      }
      this.trackingErrorChartData = { datasets: [{ 
        label: this.calculatedValues.geometryName, 
        data, 
        borderColor: '#3498db', 
        borderWidth: 4, 
        pointRadius: 0, 
        tension: 0.1 
      }] };
    }
  }
});
