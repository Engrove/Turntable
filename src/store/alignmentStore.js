// src/store/alignmentStore.js
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
  // StevensonA hanteras separat och använder inte denna struktur.
};

const ALIGNMENT_GEOMETRIES = {
  LofgrenA: { name: 'Löfgren A / Baerwald', description: 'Balanserar distorsionen jämnt över skivan för lägst genomsnittlig RMS-distorsion. En utmärkt allround-justering.' },
  LofgrenB: { name: 'Löfgren B', description: 'Minimerar den totala RMS-distorsionen, vilket ger lägst distorsion i mitten av skivan på bekostnad av något högre i början och slutet.' },
  LofgrenC: { name: 'Löfgren C (Jovanovic)', description: 'En LMS-optimering (Least Mean Squares) baserad på den senaste forskningen. Ger en alternativ balans av distorsion.' },
  StevensonA: { name: 'Stevenson A', description: 'Prioriterar lägsta möjliga distorsion vid det kritiska inre spåret, vilket är idealiskt för klassisk musik och långa skivsidor.' }
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
      datasets: [] // Korrigerat: Initieras som tom array
    },
    constants: {
      STANDARDS,
      ALIGNMENT_GEOMETRIES
    }
  }),

  getters: {
    currentStandard: (state) => {
      return STANDARDS[state.userInput.standard] || STANDARDS.IEC; // Korrigerat: Använder korrekt fallback
    },
    currentGeometryInfo: (state) => {
      return ALIGNMENT_GEOMETRIES[state.userInput.alignmentType] || {}; // Korrigerat: Använder korrekt fallback
    }
  },

  actions: {
    initialize() {
      this.calculateAlignment();
    },

    updateUserInput(key, value) {
      if (this.userInput.hasOwnProperty(key)) {
        if (key === 'pivotToSpindle') {
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            this.userInput[key] = numValue;
          }
        } else {
          this.userInput[key] = value;
        }
        this.calculateAlignment();
      }
    },

    calculateAlignment() {
      this.calculatedValues.error = null;
      this.trackingErrorChartData = { datasets: [] }; // Korrigerat: Initierar tom dataset vid beräkning

      const D = this.userInput.pivotToSpindle;
      if (!D || D <= 0) {
        this.calculatedValues.error = 'Monteringsavstånd (D) måste vara ett positivt tal.';
        return;
      }

      const alignmentType = this.userInput.alignmentType;
      const standardKey = this.userInput.standard;
      const R1 = this.currentStandard.inner;

      let res;
      if (alignmentType === 'StevensonA') {
        res = this.calculateStevensonA(D, R1);
      } else {
        // Korrigerat: Använder optional chaining för säkrare null-check
        const nulls = NULL_POINTS[alignmentType]?.[standardKey];
        if (!nulls) {
          this.calculatedValues.error = `Nollpunkter för ${alignmentType}/${standardKey} ej definierade.`;
          return;
        }
        res = this.calculateFromNulls(D, nulls);
      }

      if (isNaN(res.effectiveLength) || 
          isNaN(res.offsetAngle) || 
          res.effectiveLength < D) {
        this.calculatedValues.error = 'Ogiltig geometri. Kontrollera att monteringsavståndet är tillräckligt långt.';
        this.calculatedValues = {...this.calculatedValues, ...res, effectiveLength: 0, overhang: 0, offsetAngle: 0 };
        return;
      }
      
      this.calculatedValues = {
        ...this.calculatedValues,
        ...res,
        geometryName: this.currentGeometryInfo.name,
        geometryDescription: this.currentGeometryInfo.description,
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
        this.trackingErrorChartData = { datasets: [] }; // Korrigerat: Initierar tom dataset vid fel
        return;
      }

      const D = this.userInput.pivotToSpindle;
      const L = this.calculatedValues.effectiveLength;
      const offsetRad = this.calculatedValues.offsetAngle * (Math.PI / 180);
      
      const data = []; // Korrigerat: Initierar data-array
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

      this.trackingErrorChartData = {
        datasets: [ // Korrigerat: Rätt struktur för dataset
          {
            label: 'Spårfel (grader)',
            data: data,
            borderColor: '#4f46e5',
            backgroundColor: 'rgba(79, 70, 229, 0.1)',
            tension: 0.4,
            pointRadius: 0,
            fill: true
          }
        ]
      };
    }
  }
});
