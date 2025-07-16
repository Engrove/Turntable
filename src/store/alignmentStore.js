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

    calculateForPivotingArm(D) {
      let overhang, offsetAngleRad, innerNull, outerNull;

      switch (this.userInput.alignmentType) {
        case 'LofgrenA':
          innerNull = R1 * Math.sqrt((14 * R1**2 + 11 * R1 * R2 + 14 * R2**2) / (14 * R1**2 + 39 * R1 * R2 + 14 * R2**2));
          outerNull = R2 * Math.sqrt((14 * R1**2 + 11 * R1 * R2 + 14 * R2**2) / (14 * R1**2 - 9 * R1 * R2 + 14 * R2**2));
          break;
        case 'StevensonA':
          innerNull = R1 / (1 - (R1 / (2 * R2)) + Math.sqrt(1 - (R1 / R2) + (R1**2 / (4 * R2**2))));
          outerNull = R1 / (1 - (R1 / (2 * R2)) - Math.sqrt(1 - (R1 / R2) + (R1**2 / (4 * R2**2))));
          break;
        case 'LofgrenB':
          const logRatio = Math.log(R2 / R1);
          innerNull = (R2 - R1) / logRatio;
          outerNull = Math.sqrt(R1 * R2);
          break;
        default:
          return;
      }
      
      // Dessa formler är universella när nollpunkterna är kända
      overhang = ((innerNull + outerNull) * (R1**2 + R1*R2 + R2**2 - innerNull*outerNull)) / (2 * (R1**2 + R1*R2 + R2**2));
      offsetAngleRad = Math.acos((D**2 - (innerNull**2 + outerNull**2)/2) / (D**2 - (innerNull - outerNull)**2 / 2));
      
      // Fallback om acos-argumentet är ogiltigt
      if (isNaN(offsetAngleRad)) {
        const R = (innerNull + outerNull) / 2;
        offsetAngleRad = Math.asin((R / D) * (1 - (innerNull*outerNull)/(R*D)));
      }
      
      const effectiveLength = D + overhang;

      this.calculatedValues = {
        ...this.calculatedValues,
        overhang,
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
        overhang: 0,
        offsetAngle: 0,
        effectiveLength: D,
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
      const D = this.userInput.pivotToSpindle;

      const datasets = Object.keys(this.ALIGNMENT_GEOMETRIES).map(type => {
        let tempOverhang, tempOffsetRad, tempInnerNull, tempOuterNull;

        switch (type) {
            case 'LofgrenA':
              tempInnerNull = R1 * Math.sqrt((14 * R1**2 + 11 * R1 * R2 + 14 * R2**2) / (14 * R1**2 + 39 * R1 * R2 + 14 * R2**2));
              tempOuterNull = R2 * Math.sqrt((14 * R1**2 + 11 * R1 * R2 + 14 * R2**2) / (14 * R1**2 - 9 * R1 * R2 + 14 * R2**2));
              break;
            case 'StevensonA':
              tempInnerNull = R1 / (1 - (R1 / (2 * R2)) + Math.sqrt(1 - (R1 / R2) + (R1**2 / (4 * R2**2))));
              tempOuterNull = R1 / (1 - (R1 / (2 * R2)) - Math.sqrt(1 - (R1 / R2) + (R1**2 / (4 * R2**2))));
              break;
            case 'LofgrenB':
              tempInnerNull = (R2 - R1) / Math.log(R2 / R1);
              tempOuterNull = Math.sqrt(R1 * R2);
              break;
        }

        tempOverhang = ((tempInnerNull + tempOuterNull) * (R1**2 + R1*R2 + R2**2 - tempInnerNull*tempOuterNull)) / (2 * (R1**2 + R1*R2 + R2**2));
        tempOffsetRad = Math.acos((D**2 - (tempInnerNull**2 + tempOuterNull**2)/2) / (D**2 - (tempInnerNull - tempOuterNull)**2 / 2));
        const tempEffectiveLength = D + tempOverhang;
        
        const dataPoints = Array.from({ length: 175 }, (_, i) => {
            const r = 60 + i * 0.5;
            return { x: r, y: this.calculateTrackingError(r, tempEffectiveLength, D, tempOffsetRad) };
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
