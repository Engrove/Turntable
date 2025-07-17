import { defineStore } from 'pinia';
import { useTonearmStore } from '@/store/tonearmStore.js';

const R1 = 60.325; // IEC inner groove radius (mm)
const R2 = 146.05; // IEC outer groove radius (mm)

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

    // Lofgren A-beräkning enligt Jovanović (JAES 2022)
    getLofgrenAAlignmentGeometry(D) {
      const L = D;
      const r1sq = R1 ** 2;
      const r2sq = R2 ** 2;
      const num = 8 * r1sq * r2sq;
      const den = r1sq + 6 * R1 * R2 + r2sq;

      const effectiveLength = Math.sqrt(L ** 2 - num / den);
      const overhang = effectiveLength - L;

      const betaRad = Math.asin((4 * R1 * R2 * (R1 + R2)) / (effectiveLength * den));
      const offsetAngle = betaRad * (180 / Math.PI);

      const sqrt2inv = 1 / Math.sqrt(2);
      const inner = (2 * R1 * R2 * (1 - sqrt2inv)) / (R2 + (1 + sqrt2inv) * R1);
      const outer = (2 * R1 * R2 * (1 + sqrt2inv)) / (R2 + (1 - sqrt2inv) * R1);

      return {
        effectiveLength,
        overhang,
        offsetAngle,
        nulls: { inner, outer },
        geometryName: "Löfgren A / Baerwald",
        geometryDescription: "Optimized to minimize average tracking distortion across playing surface."
      };
    },

    calculateAlignment() {
      const D = this.userInput.pivotToSpindle;
      this.calculatedValues.error = (!D || D <= 0) ? "Pivot-to-Spindle distance must be a positive number." : null;
      if (this.calculatedValues.error) {
        this.trackingErrorChartData.datasets = [];
        return;
      }

      const { alignmentType } = this.userInput;

      let result = null;
      if (this.calculatedValues.trackingMethod !== 'pivoting') {
        result = {
          effectiveLength: D,
          overhang: 0,
          offsetAngle: 0,
          nulls: { inner: null, outer: null },
          geometryName: 'Tangential',
          geometryDescription: 'Zero tracking error across entire record.'
        };
      } else if (alignmentType === 'LofgrenA') {
        result = this.getLofgrenAAlignmentGeometry(D);
      } else {
        this.calculatedValues.error = `Alignment type "${alignmentType}" not yet implemented.`;
        return;
      }

      this.calculatedValues = {
        ...this.calculatedValues,
        ...result
      };

      this.updateTrackingErrorChartData();
    },

    calculateTrackingError(radius, L, D, offsetRad) {
      if (!L || !D || radius <= 0) return NaN;
      const term = (radius**2 + L**2 - D**2) / (2 * radius * L);
      if (term < -1 || term > 1) return NaN;
      return (Math.asin(term) - offsetRad) * (180 / Math.PI);
    },

    // Tracking error-graf (för valt alignmentType)
    updateTrackingErrorChartData() {
      if (this.calculatedValues.error) {
        this.trackingErrorChartData = { datasets: [] };
        return;
      }

      const D = this.userInput.pivotToSpindle;
      const offsetRad = this.calculatedValues.offsetAngle * (Math.PI / 180);
      const L = this.calculatedValues.effectiveLength;

      const data = Array.from({ length: 175 }, (_, i) => {
        const r = 60 + i * 0.5;
        const term = (r ** 2 + L ** 2 - D ** 2) / (2 * r * L);
        if (term < -1 || term > 1) return { x: r, y: NaN };
        const angle = Math.asin(term) - offsetRad;
        return { x: r, y: angle * (180 / Math.PI) };
      });

      this.trackingErrorChartData = {
        datasets: [{
          label: this.calculatedValues.geometryName,
          data,
          borderColor: '#3498db',
          borderWidth: 4,
          pointRadius: 0,
          tension: 0.1,
        }]
      };
    }
  }
});
