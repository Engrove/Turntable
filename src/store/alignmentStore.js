// src/store/alignmentStore.js
import { defineStore } from 'pinia';
// Antagande: en separat store för tonarmsdata finns, men är inte nödvändig för kärnberäkningarna.
// import { useTonearmStore } from '@/store/tonearmStore.js';

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
      trackingMethod: 'pivoting', // Kan utökas för t.ex. 'tangential'
      error: null
    },
    trackingErrorChartData: {
      datasets:
    },
    // Exponera konstanter till komponenter om det behövs
    constants: {
      STANDARDS,
      ALIGNMENT_GEOMETRIES
    }
  }),

  getters: {
    /**
     * Returnerar det fullständiga objektet för den valda standarden.
     */
    currentStandard: (state) => {
      return STANDARDS[state.userInput.standard] |

| STANDARDS.IEC;
    },
    /**
     * Returnerar det fullständiga objektet för den valda geometrin.
     */
    currentGeometryInfo: (state) => {
      return ALIGNMENT_GEOMETRIES |

| {};
    }
  },

  actions: {
    /**
     * Initierar storen och kör den första beräkningen.
     */
    initialize() {
      this.calculateAlignment();
    },

    /**
     * Uppdaterar en användarparameter och kör en ny beräkning.
     * @param {string} key - Nyckeln i userInput som ska uppdateras.
     * @param {any} value - Det nya värdet.
     */
    updateUserInput(key, value) {
      if (this.userInput.hasOwnProperty(key)) {
        // Konvertera numeriska värden från strängar om nödvändigt
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

    /**
     * Huvudfunktionen som orkestrerar alla beräkningar.
     */
    calculateAlignment() {
      this.calculatedValues.error = null; // Återställ felmeddelande

      const D = this.userInput.pivotToSpindle;
      if (!D |

| D <= 0) {
        this.calculatedValues.error = 'Monteringsavstånd (D) måste vara ett positivt tal.';
        this.trackingErrorChartData = { datasets: };
        return;
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
          this.calculatedValues.error = `Nollpunkter för ${alignmentType}/${standardKey} ej definierade.`;
          this.trackingErrorChartData = { datasets: };
          return;
        }
        res = this.calculateFromNulls(D, nulls);
      }

      // Kontrollera för geometriskt omöjliga resultat
      if (isNaN(res.effectiveLength) |

| isNaN(res.offsetAngle) |
| res.effectiveLength < D) {
        this.calculatedValues.error = 'Ogiltig geometri. Kontrollera att monteringsavståndet är tillräckligt långt.';
        this.calculatedValues = {...this.calculatedValues,...res, effectiveLength: 0, overhang: 0, offsetAngle: 0 };
        this.trackingErrorChartData = { datasets: };
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

    /**
     * Beräknar tonarmsparametrar från givna nollpunkter.
     * Används för Löfgren A, B, och C.
     * @param {number} D - Monteringsavstånd (pivot-to-spindle).
     * @param {number} nulls - En array med två nollpunkter [N1, N2].
     */
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

    /**
     * Beräknar tonarmsparametrar för Stevenson A.
     * Denna metod är unik då den härleds från R1 och D, inte från två fasta nollpunkter.
     * @param {number} D - Monteringsavstånd (pivot-to-spindle).
     * @param {number} R1 - Inre spårradie från vald standard.
     */
    calculateStevensonA(D, R1) {
      // För Stevenson A är den inre nollpunkten per definition R1.
      // Den yttre nollpunkten är fastställd till 117.42 mm.
      const N1 = R1;
      const N2 = 117.42;

      // Beräkningarna följer samma logik som för de andra metoderna
      // när nollpunkterna väl är fastställda.
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

    /**
     * Uppdaterar datan för spårföljningsfeldiagrammet.
     */
    updateTrackingErrorChartData() {
      if (this.calculatedValues.error) {
        this.trackingErrorChartData = { datasets: };
        return;
      }

      const D = this.userInput.pivotToSpindle;
      const L = this.calculatedValues.effectiveLength;
      const offsetRad = this.calculatedValues.offsetAngle * (Math.PI / 180);
      
      const data =;
      const { inner: minR, outer: maxR } = this.currentStandard;
      
      const start = Math.floor(minR - 5);
      const end = Math.ceil(maxR + 5);
      const step = 0.5;

      for (let r = start; r <= end; r += step) {
        const term = (r * r + L * L - D * D) / (2 * r * L);
        
        let trackingError = NaN;
        if (term >= -1 && term <= 1) {
          const phi = Math.asin(term); // Vinkeln för tonarmen relativt linjen mellan spindel och pivot
          trackingError = (phi - offsetRad) * (180 / Math.PI);
        }
        data.push({ x: r, y: trackingError });
      }

      this.trackingErrorChartData = {
        datasets:
      };
    }
  }
});
