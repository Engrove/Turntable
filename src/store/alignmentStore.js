import { defineStore } from 'pinia';

// --- Auktoritativ Data ---

const STANDARDS = {
  IEC: { name: 'IEC 60098 / RIAA', inner: 60.325, outer: 146.05 },
  DIN: { name: 'DIN 45547', inner: 57.50, outer: 146.30 },
  JIS: { name: 'JIS S8502', inner: 57.60, outer: 146.50 }
};

const NULL_POINTS = {
  LofgrenA: { IEC: [66.00, 120.90], DIN: [63.24, 122.25], JIS: [63.34, 122.18] },
  LofgrenB: { IEC: [70.29, 116.60], DIN: [67.54, 118.57], JIS: [67.64, 118.51] },
  LofgrenC: { IEC: [70.025, 115.985], DIN: [67.28, 117.96], JIS: [67.38, 117.90] }
};

const ALIGNMENT_GEOMETRIES = {
  LofgrenA: { name: 'Löfgren A / Baerwald', description: 'Balanserar distorsionen jämnt över skivan för lägst genomsnittlig RMS-distorsion.' },
  LofgrenB: { name: 'Löfgren B', description: 'Minimerar den totala RMS-distorsionen.' },
  LofgrenC: { name: 'Löfgren C (Jovanovic)', description: 'En LMS-optimering baserad på den senaste forskningen.' },
  StevensonA: { name: 'Stevenson A', description: 'Prioriterar lägsta möjliga distorsion vid det kritiska inre spåret.' }
};

export const useAlignmentStore = defineStore('alignment', {
  state: () => ({
    userInput: {
      pivotToSpindle: 222.0,
      alignmentType: 'LofgrenA',
      standard: 'IEC'
    },
    calculatedValues: {
      effectiveLength: 0,
      overhang: 0,
      offsetAngle: 0,
      nulls: { inner: 0, outer: 0 },
      geometryName: '',
      geometryDescription: '',
      trackingMethod: 'pivoting',
      error: null
    },
    trackingErrorChartData: {
      datasets: [] // FIX: Initialize as empty array
    }
  }),

  getters: {
    currentStandard: (state) => {
      // FIX: Proper value return
      return STANDARDS[state.userInput.standard] || STANDARDS.IEC;
    },
    currentGeometryInfo: (state) => {
      // FIX: Proper value return
      return ALIGNMENT_GEOMETRIES[state.userInput.alignmentType] || {};
    },
    availableStandards: () => Object.keys(STANDARDS).map(key => ({
      value: key,
      label: STANDARDS[key].name
    })),
    availableGeometries: () => Object.keys(ALIGNMENT_GEOMETRIES).map(key => ({
      value: key,
      name: ALIGNMENT_GEOMETRIES[key].name,
      description: ALIGNMENT_GEOMETRIES[key].description
    }))
  },

  actions: {
    initialize() {
      this.calculateAlignment();
    },

    updateUserInput(key, value) {
      if (key in this.userInput) {
        if (key === 'pivotToSpindle') {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) this.userInput[key] = numValue;
        } else {
          this.userInput[key] = value;
        }
        this.calculateAlignment();
      }
    },

    calculateAlignment() {
      this.calculatedValues.error = null;
      const D = this.userInput.pivotToSpindle;

      // FIX: Added proper error handling
      if (!D || D <= 0) {
        this.calculatedValues.error = 'Monteringsavstånd (D) måste vara ett positivt tal.';
        this.trackingErrorChartData = { datasets: [] };
        return;
      }

      const alignmentType = this.userInput.alignmentType;
      const standardKey = this.userInput.standard;
      const R1 = this.currentStandard.inner;

      let res;
      if (alignmentType === 'StevensonA') {
        res = this.calculateStevensonA(D, R1);
      } else {
        // FIX: Proper null points lookup
        const nulls = NULL_POINTS[alignmentType]?.[standardKey];
        if (!nulls) {
          this.calculatedValues.error = `Nollpunkter för ${alignmentType}/${standardKey} ej definierade.`;
          this.trackingErrorChartData = { datasets: [] };
          return;
        }
        res = this.calculateFromNulls(D, nulls);
      }

      // FIX: Logical OR (||) instead of bitwise (|)
      if (isNaN(res.effectiveLength) || isNaN(res.offsetAngle) || res.effectiveLength < D) {
        this.calculatedValues.error = 'Ogiltig geometri. Kontrollera monteringsavståndet.';
        this.calculatedValues = {...this.calculatedValues, ...res, effectiveLength: 0, overhang: 0, offsetAngle: 0 };
        this.trackingErrorChartData = { datasets: [] };
        return;
      }
      
      this.calculatedValues = {
        ...this.calculatedValues,
        ...res,
        geometryName: this.currentGeometryInfo.name || '',
        geometryDescription: this.currentGeometryInfo.description || ''
      };

      this.updateTrackingErrorChartData();
    },

    calculateFromNulls(D, [N1, N2]) {
      const L = Math.sqrt(D * D + N1 * N2);
      const overhang = L - D;
      const offsetAngleRad = Math.asin((N1 + N2) / (2 * L));
      const offsetAngle = offsetAngleRad * (180 / Math.PI);

      return {
        effectiveLength: L,
        overhang,
        offsetAngle,
        nulls: { inner: N1, outer: N2 }
      };
    },

    calculateStevensonA(D, R1) {
      const N1 = R1;
      const N2 = 117.42;

      const L = Math.sqrt(D * D + N1 * N2);
      const overhang = L - D;
      const offsetAngleRad = Math.asin((N1 + N2) / (2 * L));
      const offsetAngle = offsetAngleRad * (180 / Math.PI);
      
      return {
        effectiveLength: L,
        overhang,
        offsetAngle,
        nulls: { inner: N1, outer: N2 }
      };
    },

    updateTrackingErrorChartData() {
      if (this.calculatedValues.error) {
        this.trackingErrorChartData = { datasets: [] };
        return;
      }

      const D = this.userInput.pivotToSpindle;
      const L = this.calculatedValues.effectiveLength;
      const offsetRad = this.calculatedValues.offsetAngle * (Math.PI / 180);
      
      // FIX: Initialize data array
      const data = [];
      const { inner: minR, outer: maxR } = this.currentStandard;
      
      const start = Math.floor(minR - 5);
      const end = Math.ceil(maxR + 5);
      const step = 0.5;

      for (let r = start; r <= end; r += step) {
        const term = (r * r + L * L - D * D) / (2 * r * L);
        
        let trackingError = NaN;
        if (term >= -1 && term <= 1) {
          const phi = Math.asin(term);
          trackingError = (phi - offsetRad) * (180 / Math.PI);
        }
        data.push({ x: r, y: trackingError });
      }

      // FIX: Proper dataset assignment
      this.trackingErrorChartData = {
        datasets: [{
          label: 'Tracking Error',
          data: data,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          pointRadius: 0,
          borderWidth: 2
        }]
      };
    }
  }
});
