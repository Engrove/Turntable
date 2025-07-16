// src/store/alignmentStore.js
import { defineStore } from 'pinia';
import { useTonearmStore } from '@/store/tonearmStore.js';

const R1 = 60.325; // IEC inre spårradie (mm)
const R2 = 146.05; // IEC yttre spårradie (mm)

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
      LofgrenA: { name: 'Löfgren A / Baerwald', description: 'Balances distortion between inner and outer grooves, resulting in the lowest average RMS distortion. A very popular all-round choice.' },
      LofgrenB: { name: 'Löfgren B', description: 'Minimizes distortion across the entire playing surface, but allows higher distortion peaks at the beginning and end compared to Baerwald.' },
      StevensonA: { name: 'Stevenson A', description: 'Prioritizes the lowest possible distortion at the inner groove, where it is typically most audible, at the expense of higher distortion elsewhere.' },
    },
  }),

  actions: {
    async initialize() {
      const tonearmStore = useTonearmStore();
      if (tonearmStore.availableTonearms.length === 0) {
        await tonearmStore.initialize();
      }
      this.availableTonearms = tonearmStore.availableTonearms;
      this.isLoading = false;
      this.calculateAlignment();
    },

    loadTonearmPreset(id) {
      this.selectedTonearmId = id;
      if (id === null) {
        this.calculatedValues.trackingMethod = 'pivoting';
      } else {
        const tonearm = this.availableTonearms.find(t => t.id == id);
        if (tonearm) {
          this.userInput.pivotToSpindle = tonearm.pivot_to_spindle_mm || 222.0;
          this.calculatedValues.trackingMethod = tonearm.tracking_method || 'pivoting';
        }
      }
      this.calculateAlignment();
    },

    setAlignment(type) {
      this.userInput.alignmentType = type;
      this.calculateAlignment();
    },

    calculateAlignment() {
      const D = this.userInput.pivotToSpindle;
      this.calculatedValues.error = (!D || D <= 0) ? "Pivot-to-Spindle distance must be a positive number." : null;
      if (this.calculatedValues.error) {
        this.trackingErrorChartData.datasets = [];
        return;
      }
      
      if (this.calculatedValues.trackingMethod !== 'pivoting') {
        this.calculateForTangentialArm(D);
      } else {
        this.calculateForPivotingArm(D);
      }
      this.updateTrackingErrorChartData();
    },

    // NY, KORRIGERAD OCH ROBUST IMPLEMENTERING
    calculateForPivotingArm(D) {
      let overhang, offsetAngleRad, effectiveLength;

      switch (this.userInput.alignmentType) {
        case 'LofgrenA': { // Baerwald
          const r1_sq = R1 * R1;
          const r2_sq = R2 * R2;
          overhang = (r1_sq + r2_sq) / (2 * (R1 + R2)); // Approximation
          offsetAngleRad = Math.asin( ((R1 + R2) / (2 * (D + overhang))) - (R1 - R2)**2 / (8*D*(D+overhang)) );
          effectiveLength = D + overhang;
          break;
        }
        case 'StevensonA': {
          overhang = (2.6 * R1) / (1 + (R1 / R2)); // Approximation
          effectiveLength = D + overhang;
          const term = (R1 * (D + R1)) / (D * effectiveLength);
          offsetAngleRad = Math.asin(term);
          break;
        }
        case 'LofgrenB': {
          const R1_plus_R2 = R1 + R2;
          const R1_times_R2 = R1 * R2;
          const term1 = Math.log(R2 / R1);
          const term2 = (R2 - R1);
          effectiveLength = D * (1 + (R1_times_R2 * term1**2) / (2 * D**2 * term2**2));
          overhang = effectiveLength - D;
          offsetAngleRad = Math.asin((term2 / (2 * D)) * (1 + ((R1_times_R2 * term1) / (D * term2)) - (R1_plus_R2**2 / (12*D**2)) ));
          break;
        }
      }

      // Beräkna om för att säkerställa precision
      const sinOffset = Math.sin(offsetAngleRad);
      const cosOffset = Math.cos(offsetAngleRad);

      const a = D/effectiveLength;
      const b = effectiveLength/(4*D);
      const c = (R1**2 + R2**2)/(2 * effectiveLength * D);

      const null1 = D * (1-b*(1+c)/a) / (cosOffset - a * sinOffset);
      const null2 = D * (1-b*(1-c)/a) / (cosOffset + a * sinOffset);

      // Sista sanity check och beräkning av nollpunkter från grunden
      const p = effectiveLength * Math.sin(offsetAngleRad);
      const a_sq = effectiveLength**2 - (D+p)**2 + 2*D*p; // Overhang from p
      const H = D+p - Math.sqrt(D**2 - a_sq + 2*D*p);
      effectiveLength = D + H;
      offsetAngleRad = Math.asin(p/effectiveLength);

      const null_term = Math.sqrt(D**2 - p**2);
      const innerNull = (D**2 - p**2) / (D + null_term);
      const outerNull = (D**2 - p**2) / (D - null_term);


      this.calculatedValues = {
        ...this.calculatedValues,
        overhang: H,
        offsetAngle: offsetAngleRad * (180 / Math.PI),
        effectiveLength,
        nulls: { inner: innerNull, outer: outerNull },
        geometryName: this.ALIGNMENT_GEOMETRIES[this.userInput.alignmentType]?.name || '',
        geometryDescription: this.ALIGNMENT_GEOMETRIES[this.userInput.alignmentType]?.description || ''
      };
    },

    calculateForTangentialArm(D) {
      this.calculatedValues = {
        ...this.calculatedValues,
        overhang: 0, offsetAngle: 0, effectiveLength: D,
        nulls: { inner: null, outer: null },
        geometryName: 'Tangential',
        geometryDescription: 'This arm maintains tangency across the entire record, resulting in zero tracking error.'
      };
    },

    calculateTrackingError(radius, L, D, offsetRad) {
      const term = (radius**2 + L**2 - D**2) / (2 * radius * L);
      if (term < -1 || term > 1) return NaN;
      return (Math.asin(term) - offsetRad) * (180 / Math.PI);
    },

    updateTrackingErrorChartData() {
      if (this.calculatedValues.error) {
        this.trackingErrorChartData = { datasets: [] }; return;
      }
      if (this.calculatedValues.trackingMethod !== 'pivoting') {
        const data = Array.from({ length: 175 }, (_, i) => ({ x: 60 + i * 0.5, y: 0 }));
        this.trackingErrorChartData = { datasets: [{ label: 'Tangential Arm', data, borderColor: '#2ecc71', borderWidth: 4, pointRadius: 0, tension: 0.1 }] };
        return;
      }
      
      const colors = { LofgrenA: '#3498db', LofgrenB: '#2ecc71', StevensonA: '#e74c3c' };
      const D_base = this.userInput.pivotToSpindle;

      const datasets = Object.keys(this.ALIGNMENT_GEOMETRIES).map(type => {
        // Temporära beräkningar för varje kurva
        const tempStore = { ...this.$state, userInput: { ...this.userInput, alignmentType: type }};
        this.calculateForPivotingArm.call(tempStore, D_base);
        const { effectiveLength, offsetAngle } = tempStore.calculatedValues;
        
        const dataPoints = Array.from({ length: 175 }, (_, i) => {
            const r = 60 + i * 0.5;
            return { x: r, y: this.calculateTrackingError(r, effectiveLength, D_base, offsetAngle * (Math.PI/180)) };
        });

        return {
            label: this.ALIGNMENT_GEOMETRIES[type].name.split(' / ')[0],
            data: dataPoints,
            borderColor: colors[type],
            borderWidth: type === this.userInput.alignmentType ? 4 : 2,
            order: type === this.userInput.alignmentType ? 1 : 2,
            pointRadius: 0,
            tension: 0.1,
        };
      });
      this.trackingErrorChartData = { datasets };
    },
  },
});
// src/store/alignmentStore.js
