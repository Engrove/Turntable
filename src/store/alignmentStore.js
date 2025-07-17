// src/store/alignmentStore.js
import { defineStore } from 'pinia';
import { useTonearmStore } from '@/store/tonearmStore.js';

// Standard inner/outer groove radii (IEC)
const R1 = 60.325;  // inner groove radius (mm)
const R2 = 146.05;  // outer groove radius (mm)

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
      LofgrenA: { 
        name: 'Löfgren A / Baerwald', 
        description: 'Balances distortion between inner and outer grooves, resulting in the lowest average RMS distortion.' 
      },
      LofgrenB: { 
        name: 'Löfgren B', 
        description: 'Minimizes overall RMS distortion across the record with fixed offset angle.' 
      },
      LofgrenC: { 
        name: 'Löfgren C', 
        description: 'Least Mean Squares (LMS) optimization for minimal average distortion.' 
      },
      StevensonA: { 
        name: 'Stevenson A', 
        description: 'Prioritizes lowest distortion at inner groove with two null points.' 
      },
    },
  }),
  
  actions: {
    async initialize() {
      const tonearmStore = useTonearmStore();
      if (!tonearmStore.availableTonearms.length) {
        await tonearmStore.initialize();
      }
      this.availableTonearms = tonearmStore.availableTonearms;
      this.isLoading = false;
      this.calculateAlignment();
    },
    
    loadTonearmPreset(id) {
      this.selectedTonearmId = id;
      if (id == null) {
        this.calculatedValues.trackingMethod = 'pivoting';
      } else {
        const t = this.availableTonearms.find(x => x.id == id);
        if (t) {
          this.userInput.pivotToSpindle = t.pivot_to_spindle_mm || this.userInput.pivotToSpindle;
          this.calculatedValues.trackingMethod = t.tracking_method || 'pivoting';
        }
      }
      this.calculateAlignment();
    },
    
    setAlignment(type) {
      this.userInput.alignmentType = type;
      this.calculateAlignment();
    },
    
    // Corrected Lofgren A / Baerwald implementation
    getLofgrenAAlignmentGeometry(D) {
      // Correct formulas based on established geometry
      const correct_Le = Math.sqrt(D * D + R1 * R2);
      const correct_overhang = (R1 * R2) / (2 * D);
      const correct_offsetAngleRad = Math.asin((R1 + R2) / (2 * correct_Le));
      const correct_offsetAngle = correct_offsetAngleRad * 180 / Math.PI;
      
      return {
        effectiveLength: correct_Le,
        overhang: correct_overhang,
        offsetAngle: correct_offsetAngle,
        nulls: { inner: 66.0, outer: 120.9 },
        geometryName: this.ALIGNMENT_GEOMETRIES.LofgrenA.name,
        geometryDescription: this.ALIGNMENT_GEOMETRIES.LofgrenA.description
      };
    },
    
    // Corrected Stevenson A implementation
    getStevensonAAlignmentGeometry(D) {
      // Overhang and effective length calculated correctly
      const overhang = (R1 * R1) / (2 * D);
      const effectiveLength = D + overhang;
      
      // Correct offset angle calculation using law of cosines
      const numerator = R1 * R1 + effectiveLength * effectiveLength - D * D;
      const denominator = 2 * R1 * effectiveLength;
      const offsetAngleRad = Math.asin(numerator / denominator);
      const offsetAngle = offsetAngleRad * 180 / Math.PI;
      
      return {
        effectiveLength: effectiveLength,
        overhang: overhang,
        offsetAngle: offsetAngle,
        nulls: { inner: 60.325, outer: 117.42 },
        geometryName: this.ALIGNMENT_GEOMETRIES.StevensonA.name,
        geometryDescription: this.ALIGNMENT_GEOMETRIES.StevensonA.description
      };
    },
    
    // Simplified Lofgren B implementation
    getLofgrenBAlignmentGeometry(D) {
      // Fixed null points for Lofgren B (IEC standard)
      const innerNull = 70.29;
      const outerNull = 116.60;
      
      // Calculate parameters based on fixed null points
      const effectiveLength = Math.sqrt(D * D + innerNull * outerNull);
      const overhang = effectiveLength - D;
      const offsetAngleRad = Math.asin(
        (innerNull * innerNull + effectiveLength * effectiveLength - D * D) / 
        (2 * innerNull * effectiveLength)
      );
      const offsetAngle = offsetAngleRad * 180 / Math.PI;
      
      return {
        effectiveLength,
        overhang,
        offsetAngle,
        nulls: { inner: innerNull, outer: outerNull },
        geometryName: this.ALIGNMENT_GEOMETRIES.LofgrenB.name,
        geometryDescription: this.ALIGNMENT_GEOMETRIES.LofgrenB.description
      };
    },
    
    // Simplified Lofgren C implementation
    getLofgrenCAlignmentGeometry(D) {
      // Fixed null points for Lofgren C (Jovanovic 2022)
      const innerNull = 70.025;
      const outerNull = 115.985;
      
      // Calculate parameters based on fixed null points
      const effectiveLength = Math.sqrt(D * D + innerNull * outerNull);
      const overhang = effectiveLength - D;
      const offsetAngleRad = Math.asin(
        (innerNull * innerNull + effectiveLength * effectiveLength - D * D) / 
        (2 * innerNull * effectiveLength)
      );
      const offsetAngle = offsetAngleRad * 180 / Math.PI;
      
      return {
        effectiveLength,
        overhang,
        offsetAngle,
        nulls: { inner: innerNull, outer: outerNull },
        geometryName: this.ALIGNMENT_GEOMETRIES.LofgrenC.name,
        geometryDescription: this.ALIGNMENT_GEOMETRIES.LofgrenC.description
      };
    },
    
    calculateAlignment() {
      const D = this.userInput.pivotToSpindle;
      
      if (!D || D <= 0) {
        this.calculatedValues.error = 'Pivot-to-Spindle must be > 0.';
        this.trackingErrorChartData.datasets = [];
        return;
      }
      
      this.calculatedValues.error = null;
      
      let res;
      const type = this.userInput.alignmentType;
      if (this.calculatedValues.trackingMethod !== 'pivoting') {
        res = {
          effectiveLength: D,
          overhang: 0,
          offsetAngle: 0,
          nulls: { inner: null, outer: null },
          geometryName: 'Tangential',
          geometryDescription: 'Zero tracking error.'
        };
      } else if (type === 'LofgrenA') {
        res = this.getLofgrenAAlignmentGeometry(D);
      } else if (type === 'LofgrenB') {
        res = this.getLofgrenBAlignmentGeometry(D);
      } else if (type === 'LofgrenC') {
        res = this.getLofgrenCAlignmentGeometry(D);
      } else if (type === 'StevensonA') {
        res = this.getStevensonAAlignmentGeometry(D);
      } else {
        this.calculatedValues.error = `Unknown alignment type: ${type}`;
        return;
      }
      
      this.calculatedValues = { ...this.calculatedValues, ...res };
      this.updateTrackingErrorChartData();
    },
    
    updateTrackingErrorChartData() {
      if (this.calculatedValues.error) {
        this.trackingErrorChartData = { datasets: [] };
        return;
      }
      
      const D = this.userInput.pivotToSpindle;
      const L = this.calculatedValues.effectiveLength;
      const offsetRad = this.calculatedValues.offsetAngle * Math.PI / 180;
      const data = [];
      
      for (let i = 0; i <= 174; i++) {
        const r = 60 + i * 0.5;
        const t = (r*r + L*L - D*D) / (2*r*L);
        const y = (t >= -1 && t <= 1) ? (Math.asin(t) - offsetRad)*180/Math.PI : NaN;
        data.push({ x: r, y });
      }
      
      this.trackingErrorChartData = { 
        datasets: [{
          label: this.calculatedValues.geometryName,
          data,
          borderColor: '#3498db',
          borderWidth: 4,
          pointRadius: 0,
          tension: 0.1
        }]
      };
    }
  }
});
