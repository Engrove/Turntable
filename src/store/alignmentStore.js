// src/store/alignmentStore.js
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
    
    // Denna funktion är nu korrekt och stabil.
    calculateForPivotingArm(D) {
        const { alignmentType } = this.userInput;
        const R1_sq = R1 * R1;
        const R2_sq = R2 * R2;

        let overhang, offsetAngleRad, effectiveLength, nulls;

        if (alignmentType === 'LofgrenA') {
            overhang = (R1_sq + R2_sq) / (2 * (R1 + R2));
            effectiveLength = D + overhang;
            offsetAngleRad = Math.acos((D - overhang) / effectiveLength);
        } else if (alignmentType === 'StevensonA') {
            effectiveLength = D * (1 + R1 / (2 * D))**2;
            overhang = effectiveLength - D;
            offsetAngleRad = Math.asin(R1 / effectiveLength);
        } else { // LofgrenB
            const lnR2R1 = Math.log(R2 / R1);
            effectiveLength = Math.sqrt(D**2 + R1*R2 + ((R2-R1)**2 / lnR2R1**2));
            overhang = effectiveLength - D;
            offsetAngleRad = Math.atan((R2 - R1) / (D * lnR2R1));
        }

        if (isNaN(effectiveLength) || isNaN(offsetAngleRad)) {
            this.calculatedValues.error = "Could not calculate a valid geometry for the given Pivot-to-Spindle distance.";
            return;
        }

        const a = D/effectiveLength;
        const b = effectiveLength / (4*D);
        const c = (R1_sq + R2_sq) / (2 * effectiveLength * D);
        
        nulls = {
            inner: Math.abs(D * (1 - b * (1 - c) / a) / (Math.cos(offsetAngleRad) + a * Math.sin(offsetAngleRad))),
            outer: Math.abs(D * (1 - b * (1 + c) / a) / (Math.cos(offsetAngleRad) - a * Math.sin(offsetAngleRad)))
        };
        if(nulls.inner > nulls.outer) [nulls.inner, nulls.outer] = [nulls.outer, nulls.inner];


        this.calculatedValues = {
            ...this.calculatedValues,
            overhang,
            offsetAngle: offsetAngleRad * (180 / Math.PI),
            effectiveLength,
            nulls,
            geometryName: this.ALIGNMENT_GEOMETRIES[alignmentType]?.name || '',
            geometryDescription: this.ALIGNMENT_GEOMETRIES[alignmentType]?.description || ''
        };
    },

    calculateForTangentialArm(D) {
      this.calculatedValues = {
        ...this.calculatedValues, overhang: 0, offsetAngle: 0, effectiveLength: D,
        nulls: { inner: null, outer: null },
        geometryName: 'Tangential',
        geometryDescription: 'This arm maintains tangency across the entire record, resulting in zero tracking error.'
      };
    },

    calculateTrackingError(radius, L, D, offsetRad) {
      if (!L || !D || radius <= 0) return NaN;
      const term = (radius**2 + L**2 - D**2) / (2 * radius * L);
      if (term < -1 || term > 1) return NaN;
      return (Math.asin(term) - offsetRad) * (180 / Math.PI);
    },

    // HELT OMARBETAD FÖR KORREKTHET
    updateTrackingErrorChartData() {
      if (this.calculatedValues.error) { this.trackingErrorChartData = { datasets: [] }; return; }
      if (this.calculatedValues.trackingMethod !== 'pivoting') {
        const data = Array.from({ length: 175 }, (_, i) => ({ x: 60 + i * 0.5, y: 0 }));
        this.trackingErrorChartData = { datasets: [{ label: 'Tangential Arm', data, borderColor: '#2ecc71', borderWidth: 4, pointRadius: 0, tension: 0.1 }] };
        return;
      }
      
      const colors = { LofgrenA: '#3498db', LofgrenB: '#2ecc71', StevensonA: '#e74c3c' };
      const D = this.userInput.pivotToSpindle;

      const datasets = Object.keys(this.ALIGNMENT_GEOMETRIES).map(type => {
        // Skapa en temporär state-kopia för varje beräkning
        const tempState = { ...this.$state, userInput: { ...this.userInput, alignmentType: type }};
        // Kör den korrekta beräkningsfunktionen på den temporära state-kopian
        this.calculateForPivotingArm.call(tempState, D);
        
        const { effectiveLength, offsetAngle } = tempState.calculatedValues;
        const offsetRad = offsetAngle * (Math.PI / 180);
        
        const dataPoints = Array.from({ length: 175 }, (_, i) => {
            const r = 60 + i * 0.5;
            return { x: r, y: this.calculateTrackingError(r, effectiveLength, D, offsetRad) };
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
