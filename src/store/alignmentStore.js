import { defineStore } from 'pinia';

// --- Authoritative Data (Frozen for Performance) ---
// By freezing these objects, we tell Vue it doesn't need to make them reactive,
// saving memory and CPU cycles.[11]
const STANDARDS = Object.freeze({
  IEC: { name: 'IEC 60098 / RIAA', inner: 60.325, outer: 146.05 },
  DIN: { name: 'DIN 45547', inner: 57.50, outer: 146.30 },
  JIS: { name: 'JIS S8502', inner: 57.60, outer: 146.50 }
});

const NULL_POINTS = Object.freeze({
  LofgrenA: { IEC: [66.00, 120.90], DIN: [63.24, 122.25], JIS: [63.34, 122.18] },
  LofgrenB: { IEC: [70.29, 116.60], DIN: [67.54, 118.57], JIS: [67.64, 118.51] },
  LofgrenC: { IEC: [70.025, 115.985], DIN: [67.28, 117.96], JIS: [67.38, 117.90] }
});

const ALIGNMENT_GEOMETRIES = Object.freeze({
  LofgrenA: { name: 'Löfgren A / Baerwald', description: 'Balanserar distorsionen jämnt över skivan för lägst genomsnittlig RMS-distorsion.' },
  LofgrenB: { name: 'Löfgren B', description: 'Minimerar den totala RMS-distorsionen.' },
  LofgrenC: { name: 'Löfgren C (Jovanovic)', description: 'En LMS-optimering baserad på den senaste forskningen.' },
  StevensonA: { name: 'Stevenson A', description: 'Prioriterar lägsta möjliga distorsion vid det kritiska inre spåret.' }
});

export const useAlignmentStore = defineStore('alignment', {
  state: () => ({
    status: 'idle', // 'idle', 'calculating', 'success', 'error'
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
      error: null
    },
    trackingErrorChartData: {
      datasets:
    }
  }),

  getters: {
    currentStandard: (state) => STANDARDS[state.userInput.standard] |

| STANDARDS.IEC,
    currentGeometryInfo: (state) => ALIGNMENT_GEOMETRIES |

| {},
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
      if (this.userInput.hasOwnProperty(key)) {
        this.userInput[key] = (key === 'pivotToSpindle')? parseFloat(value) : value;
        this.calculateAlignment();
      }
    },

    calculateAlignment() {
      this.status = 'calculating';
      try {
        const D = this.userInput.pivotToSpindle;
        if (!D |

| D <= 0) {
          throw new Error('Monteringsavstånd (D) måste vara ett positivt tal.');
        }

        const alignmentType = this.userInput.alignmentType;
        const standardKey = this.userInput.standard;
        const R1 = this.currentStandard.inner;

        let res;
        if (alignmentType === 'StevensonA') {
          res = this.calculateStevensonA(D, R1);
        } else {
          const nulls = NULL_POINTS?.[standardKey];
          if (!nulls) {
            throw new Error(`Nollpunkter för ${alignmentType}/${standardKey} ej definierade.`);
          }
          res = this.calculateFromNulls(D, nulls);
        }

        if (isNaN(res.effectiveLength) |

| isNaN(res.offsetAngle) |
| res.effectiveLength < D) {
          throw new Error('Ogiltig geometri. Kontrollera monteringsavståndet.');
        }

        // --- Success State Update ---
        this.calculatedValues = {
         ...res,
          geometryName: this.currentGeometryInfo.name |

| '',
          geometryDescription: this.currentGeometryInfo.description |

| '',
          error: null
        };
        this.updateTrackingErrorChartData();
        this.status = 'success';

      } catch (e) {
        // --- Error State Update (Atomic) ---
        this.status = 'error';
        this.calculatedValues = {
         ...this.calculatedValues,
          effectiveLength: 0,
          overhang: 0,
          offsetAngle: 0,
          error: e.message
        };
        this.trackingErrorChartData.datasets =;
      }
    },

    calculateFromNulls(D, [N1, N2]) {
      const L = Math.sqrt(D * D + N1 * N2);
      const overhang = L - D;
      const offsetAngleRad = Math.asin((N1 + N2) / (2 * L));
      const offsetAngle = offsetAngleRad * (180 / Math.PI);
      return { effectiveLength: L, overhang, offsetAngle, nulls: { inner: N1, outer: N2 } };
    },

    calculateStevensonA(D, R1) {
      const N1 = R1;
      const N2 = 117.42;
      return this.calculateFromNulls(D, [N1, N2]);
    },

    updateTrackingErrorChartData() {
      const D = this.userInput.pivotToSpindle;
      const L = this.calculatedValues.effectiveLength;
      const offsetRad = this.calculatedValues.offsetAngle * (Math.PI / 180);

      const data =;
      const { inner: minR, outer: maxR } = this.currentStandard;
      const start = Math.floor(minR - 5);
      const end = Math.ceil(maxR + 5);

      for (let r = start; r <= end; r += 0.5) {
        const term = (r * r + L * L - D * D) / (2 * r * L);
        let trackingError = NaN;
        if (term >= -1 && term <= 1) {
          const phi = Math.asin(term);
          trackingError = (phi - offsetRad) * (180 / Math.PI);
        }
        data.push({ x: r, y: trackingError });
      }

      // Mutate the existing array for a more direct update
      this.trackingErrorChartData.datasets =;
    }
  }
});
