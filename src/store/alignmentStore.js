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
        // Återställ till manuellt läge
        this.calculatedValues.trackingMethod = 'pivoting';
      } else {
        const tonearm = this.availableTonearms.find(t => t.id == id);
        if (tonearm) {
          this.userInput.pivotToSpindle = tonearm.pivot_to_spindle_mm || 222.0;
          // KORRIGERING: Uppdatera alltid trackingMethod när en preset laddas.
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
      this.calculatedValues.error = (!D || D <= 0) ? "Pivot to Spindle distance must be a positive number." : null;
      if (this.calculatedValues.error) {
        this.trackingErrorChartData.datasets = [];
        return;
      }
      
      if (this.calculatedValues.trackingMethod !== 'pivoting') {
        this.calculateForTangentialArm(D);
      } else {
        this.calculateForPivotingArm(D);
      }
      this.updateTrackingErrorChartData(D);
    },

    calculateForPivotingArm(D) {
      let overhang, offsetAngleRad;
      switch (this.userInput.alignmentType) {
        case 'LofgrenA': {
          const term1 = R1 + R2;
          const term2 = R1 * R2;
          overhang = term2 / term1;
          const sinOffset = term1 / (2 * (D + overhang));
          offsetAngleRad = Math.asin(sinOffset);
          break;
        }
        case 'LofgrenB': {
          const C1 = (R2 - R1) / 2;
          const C2 = (R2 * R1) * Math.log(R2 / R1) / (R2 - R1);
          overhang = (C1 * C2) / (C1 + C2);
          const sinOffset = (C1 + C2) / (D + overhang);
          offsetAngleRad = Math.asin(sinOffset);
          break;
        }
        case 'StevensonA': {
           const term1 = R1 + R2;
           const term2 = R1 * R2;
           overhang = (2 * term2) / term1;
           const sinOffset = (term1 / 2) / (D + overhang);
           offsetAngleRad = Math.asin(sinOffset);
           break;
        }
      }
      
      const effectiveLength = D + overhang;
      this.calculatedValues = {
        ...this.calculatedValues,
        overhang,
        offsetAngle: offsetAngleRad * (180 / Math.PI),
        effectiveLength,
        nulls: this.calculateNulls(D, effectiveLength, offsetAngleRad),
        geometryName: this.ALIGNMENT_GEOMETRIES[this.userInput.alignmentType]?.name || '',
        geometryDescription: this.ALIGNMENT_GEOMETRIES[this.userInput.alignmentType]?.description || ''
      };
    },

    calculateForTangentialArm(D) {
      this.calculatedValues = {
        ...this.calculatedValues,
        overhang: 0,
        offsetAngle: 0,
        effectiveLength: D,
        nulls: { inner: null, outer: null },
        geometryName: 'Tangential',
        geometryDescription: 'This arm maintains tangency across the entire record, resulting in zero tracking error.'
      };
    },

    calculateNulls(D, L, beta) {
        if (!D || !L || isNaN(beta)) return { inner: 0, outer: 0 };
        const termForNulls = Math.sqrt(L**2 - D**2);
        return {
          inner: (D**2 - termForNulls**2) / (2 * (D - termForNulls * Math.cos(beta))),
          outer: (D**2 - termForNulls**2) / (2 * (D + termForNulls * Math.cos(beta)))
        };
    },

    calculateTrackingError(radius, L, D, offsetRad) {
      const term = (radius**2 + L**2 - D**2) / (2 * radius * L);
      if (term < -1 || term > 1) return NaN;
      return (Math.asin(term) - offsetRad) * (180 / Math.PI);
    },

    updateTrackingErrorChartData(D) {
      if (this.calculatedValues.error) {
        this.trackingErrorChartData = { datasets: [] };
        return;
      }
      if (this.calculatedValues.trackingMethod !== 'pivoting') {
        const tangentialData = Array.from({ length: 175 }, (_, i) => ({ x: 60 + i * 0.5, y: 0 }));
        this.trackingErrorChartData = {
          datasets: [{
            label: 'Tangential Arm',
            data: tangentialData,
            borderColor: '#2ecc71',
            borderWidth: 4,
            pointRadius: 0,
            tension: 0.1,
          }]
        };
        return;
      }
      
      const geometries = ['LofgrenA', 'LofgrenB', 'StevensonA'];
      const colors = { LofgrenA: '#3498db', LofgrenB: '#2ecc71', StevensonA: '#e74c3c' };
      const datasets = geometries.map(type => {
        let overhang, offsetAngleRad, effectiveLength;
        switch (type) {
            case 'LofgrenA': {
              const term1 = R1 + R2;
              const term2 = R1 * R2;
              overhang = term2 / term1;
              effectiveLength = D + overhang;
              offsetAngleRad = Math.asin(term1 / (2 * effectiveLength));
              break;
            }
            case 'LofgrenB': {
              const C1 = (R2 - R1) / 2;
              const C2 = (R2 * R1) * Math.log(R2 / R1) / (R2 - R1);
              overhang = (C1 * C2) / (C1 + C2);
              effectiveLength = D + overhang;
              offsetAngleRad = Math.asin((C1 + C2) / effectiveLength);
              break;
            }
            case 'StevensonA': {
               const term1 = R1 + R2;
               const term2 = R1 * R2;
               overhang = (2 * term2) / term1;
               effectiveLength = D + overhang;
               offsetAngleRad = Math.asin((term1 / 2) / effectiveLength);
               break;
            }
        }

        const dataPoints = Array.from({ length: 175 }, (_, i) => {
            const r = 60 + i * 0.5;
            return { x: r, y: this.calculateTrackingError(r, effectiveLength, D, offsetAngleRad) };
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
