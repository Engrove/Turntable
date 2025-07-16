// src/store/alignmentStore.js
import { defineStore } from 'pinia';
import { useTonearmStore } from './tonearmStore.js';

// --- Konstanter för IEC-standard ---
const R1 = 60.325; // Inre spårradie (mm)
const R2 = 146.05; // Yttre spårradie (mm)

export const useAlignmentStore = defineStore('alignment', {
  state: () => ({
    availableTonearms: [],
    isLoading: true,
    error: null,
    selectedTonearmId: null,
    
    // Användarinput med standardvärden
    userInput: {
      pivotToSpindle: 222.0,
      alignmentType: 'LofgrenA', // Kan vara 'LofgrenA', 'LofgrenB', 'Stevenson'
    },
    
    // Beräknade värden
    calculatedValues: {
      overhang: 0,
      offsetAngle: 0,
      effectiveLength: 0,
      nulls: { inner: 0, outer: 0 },
      geometryName: '',
      geometryDescription: '',
      error: null,
    },

    // NYTT: State för diagramdata
    trackingErrorChartData: {
      datasets: []
    },

    // Geometrispecifika konstanter och beskrivningar
    ALIGNMENT_GEOMETRIES: {
      LofgrenA: {
        name: 'Löfgren A / Baerwald',
        description: 'Balances distortion between inner and outer grooves, resulting in the lowest average RMS distortion. A very popular all-round choice.'
      },
      LofgrenB: {
        name: 'Löfgren B',
        description: 'Minimizes distortion across the entire playing surface, but allows higher distortion peaks at the beginning and end compared to Baerwald.'
      },
      StevensonA: {
        name: 'Stevenson A',
        description: 'Prioritizes the lowest possible distortion at the inner groove, where it is typically most audible, at the expense of higher distortion elsewhere.'
      },
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
      if (id === null) {
        this.selectedTonearmId = null;
        this.userInput.pivotToSpindle = 222.0; // Standardvärde
      } else {
        const tonearm = this.availableTonearms.find(t => t.id == id);
        if (tonearm && tonearm.pivot_to_spindle_mm) {
          this.selectedTonearmId = id;
          this.userInput.pivotToSpindle = tonearm.pivot_to_spindle_mm;
        }
      }
      this.calculateAlignment();
    },

    setAlignment(type) {
        this.userInput.alignmentType = type;
        this.calculateAlignment();
    },

    // ---- Huvudberäkningsfunktion ----
    calculateAlignment() {
      const D = this.userInput.pivotToSpindle;

      if (!D || D <= 0) {
        this.calculatedValues.error = "Pivot to Spindle distance must be a positive number.";
        this.trackingErrorChartData.datasets = []; // Rensa diagramdata
        return;
      }
      this.calculatedValues.error = null;

      let overhang, offsetAngleRad;

      // Beräkningar enligt vald geometri
      switch (this.userInput.alignmentType) {
        case 'LofgrenA': {
          const term1 = (R1 + R2);
          const term2 = (R1 * R2);
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
           const term1 = (R1 + R2);
           const term2 = (R1 * R2);
           overhang = (2 * term2) / term1;
           const sinOffset = (term1 / 2) / (D + overhang);
           offsetAngleRad = Math.asin(sinOffset);
           break;
        }
        default:
          return;
      }
      
      const offsetAngleDeg = offsetAngleRad * (180 / Math.PI);
      const effectiveLength = D + overhang;
      const termForNulls = Math.sqrt(effectiveLength**2 - D**2);
      const nulls = {
        inner: (D**2 - termForNulls**2) / (2 * (D - termForNulls * Math.cos(offsetAngleRad))),
        outer: (D**2 - termForNulls**2) / (2 * (D + termForNulls * Math.cos(offsetAngleRad)))
      };

      this.calculatedValues = {
        ...this.calculatedValues,
        overhang,
        offsetAngle: offsetAngleDeg,
        effectiveLength,
        nulls,
        geometryName: this.ALIGNMENT_GEOMETRIES[this.userInput.alignmentType]?.name || 'Unknown',
        geometryDescription: this.ALIGNMENT_GEOMETRIES[this.userInput.alignmentType]?.description || ''
      };

      // NYTT: Anropa funktionen som genererar diagramdata
      this.updateTrackingErrorChartData();
    },

    // --- NYA FUNKTIONER FÖR DIAGRAM ---

    calculateTrackingErrorCurve(pivotToSpindle, effectiveLength, overhang, offsetAngle, label, color) {
        const dataPoints = [];
        const L = effectiveLength;
        const D = pivotToSpindle;
        const offsetRad = offsetAngle * (Math.PI / 180);

        if (!L || L <= 0) return { label, data: [] };

        for (let r = 60; r <= 147; r += 0.5) {
            // HTE formula δ = arcsin((r² + L² - D²) / (2rL)) - β
            // This is more direct than using overhang
            const term = (r**2 + L**2 - D**2) / (2 * r * L);
            
            // Säkerställ att termen är inom arcsin's domän [-1, 1]
            if (term >= -1 && term <= 1) {
                const trackingErrorRad = Math.asin(term) - offsetRad;
                const trackingErrorDeg = trackingErrorRad * (180 / Math.PI);
                dataPoints.push({ x: r, y: trackingErrorDeg });
            }
        }
        return {
            label,
            data: dataPoints,
            borderColor: color,
            backgroundColor: `${color}33`, // Lätt transparent färg
            borderWidth: 2,
            pointRadius: 0,
            tension: 0.1,
        };
    },

    updateTrackingErrorChartData() {
        if (this.calculatedValues.error) {
            this.trackingErrorChartData = { datasets: [] };
            return;
        }

        const D = this.userInput.pivotToSpindle;

        // Beräkna data för alla tre geometrier
        const geometries = ['LofgrenA', 'LofgrenB', 'StevensonA'];
        const datasets = geometries.map(type => {
            // Beräkna specifika värden för denna geometri
            let overhang, offsetAngleRad, effectiveLength;
            switch (type) {
                case 'LofgrenA': {
                  const term1 = (R1 + R2);
                  const term2 = (R1 * R2);
                  overhang = term2 / term1;
                  effectiveLength = D + overhang;
                  const sinOffset = term1 / (2 * effectiveLength);
                  offsetAngleRad = Math.asin(sinOffset);
                  break;
                }
                case 'LofgrenB': {
                  const C1 = (R2 - R1) / 2;
                  const C2 = (R2 * R1) * Math.log(R2 / R1) / (R2 - R1);
                  overhang = (C1 * C2) / (C1 + C2);
                  effectiveLength = D + overhang;
                  const sinOffset = (C1 + C2) / effectiveLength;
                  offsetAngleRad = Math.asin(sinOffset);
                  break;
                }
                case 'StevensonA': {
                   const term1 = (R1 + R2);
                   const term2 = (R1 * R2);
                   overhang = (2 * term2) / term1;
                   effectiveLength = D + overhang;
                   const sinOffset = (term1 / 2) / effectiveLength;
                   offsetAngleRad = Math.asin(sinOffset);
                   break;
                }
            }
            const offsetAngleDeg = offsetAngleRad * (180 / Math.PI);

            const colors = { LofgrenA: '#3498db', LofgrenB: '#2ecc71', StevensonA: '#e74c3c' };
            const dataset = this.calculateTrackingErrorCurve(
                D,
                effectiveLength,
                overhang,
                offsetAngleDeg,
                this.ALIGNMENT_GEOMETRIES[type].name.split(' / ')[0], // Använd kort namn
                colors[type]
            );

            // Gör den aktiva kurvan tjockare
            if (type === this.userInput.alignmentType) {
                dataset.borderWidth = 4;
                dataset.order = 1; // Ritas ovanpå
            } else {
                dataset.borderWidth = 2;
                dataset.order = 2; // Ritas under
            }

            return dataset;
        });

        this.trackingErrorChartData = { datasets };
    },
  },
});
