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
      const inner = (2 * R1 * R2 * (1 - invSqrt2)) / (R2 + (1 + invSqrt2) * R1);
      const outer = (2 * R1 * R2 * (1 + invSqrt2)) / (R2 + (1 - invSqrt2) * R1);

      return { effectiveLength: L, overhang, offsetAngle, nulls: { inner, outer }, geometryName: this.ALIGNMENT_GEOMETRIES.LofgrenA.name, geometryDescription: this.ALIGNMENT_GEOMETRIES.LofgrenA.description };
    },

    // Lofgren B approximate per Jovanović (fixed offset = βA)
    getLofgrenBAlignmentGeometry(D) {
      // compute βA
      const L0 = Math.sqrt(D * D + (8 * R1*R1 * R2*R2) / (R1*R1 + 6*R1*R2 + R2*R2));
      const betaRad = Math.asin((4 * R1 * R2 * (R1 + R2)) / (L0 * (R1*R1 + 6*R1*R2 + R2*R2)));
      const beta = betaRad;
      // approximate H_B per eq (23)
      const a2 = 2 * L0 * (L0 - D) - (L0 - D)**2; // unused here
      const num = 3 * R1 * R2 * (L0 * Math.sin(beta) * (R1 + R2) - R1 * R2);
      const den = 2 * L0 * (R1*R1 + R1*R2 + R2*R2);
      const H = num / den;
      const L = D + H;
      return { effectiveLength: L, overhang: H, offsetAngle: beta * 180 / Math.PI, nulls: { inner: null, outer: null }, geometryName: this.ALIGNMENT_GEOMETRIES.LofgrenB.name, geometryDescription: this.ALIGNMENT_GEOMETRIES.LofgrenB.description };
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
      return { effectiveLength: L, overhang, offsetAngle: beta * 180 / Math.PI, nulls: { inner, outer }, geometryName: this.ALIGNMENT_GEOMETRIES.StevensonA.name, geometryDescription: this.ALIGNMENT_GEOMETRIES.StevensonA.description };
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
        res = { effectiveLength: D, overhang: 0, offsetAngle: 0, nulls: { inner: null, outer: null }, geometryName: 'Tangential', geometryDescription: 'Zero error.' };
      } else if (type === 'LofgrenA') {
        res = this.getLofgrenAAlignmentGeometry(D);
      } else if (type === 'LofgrenB') {
        res = this.getLofgrenBAlignmentGeometry(D);
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
      this.trackingErrorChartData = { datasets: [{ label: this.calculatedValues.geometryName, data, borderColor: '#3498db', borderWidth: 4, pointRadius: 0, tension: 0.1 }] };
    }
  }
});
