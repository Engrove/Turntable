// src/store/alignmentStore.js
import { defineStore } from 'pinia';
import { calculateAlignmentGeometries, GROOVE_STANDARDS, trackingError, solveFromNulls, calculateBaerwald, calculateLofgrenB, calculateStevenson } from '@/services/alignmentCalculations.js';

export const useAlignmentStore = defineStore('alignment', {
state: () => ({
isLoading: true,
error: null,
availableTonearms: [],
selectedTonearmId: null,


userInput: {
  pivotToSpindle: 222,
  alignmentType: 'Baerwald',
  standard: 'IEC',
  paperFormat: 'A4',
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

allGeometries: {}, // To store results for all three types for the chart
trackingErrorChartData: {},


}),

getters: {
ALIGNMENT_GEOMETRIES: () => ({
Baerwald: { name: 'Baerwald (Löfgren A)', description: 'Also known as Löfgren A. Aims for the lowest average distortion across the entire record by balancing the error peaks.' },
LofgrenB: { name: 'Löfgren B', description: 'Minimizes the absolute maximum distortion. The error peaks at the inner and outer grooves are lower than with Baerwald.' },
Stevenson: { name: 'Stevenson', description: 'Prioritizes minimizing distortion at the innermost groove, where it is most audible, at the cost of higher error elsewhere.' },
}),
GROOVE_STANDARDS: () => GROOVE_STANDARDS,
},

actions: {
async initialize() {
this.isLoading = true;
this.error = null;
try {
const response = await fetch('/data/tonearm_data.json');
if (!response.ok) throw new Error(HTTP error! status: ${response.status});
this.availableTonearms = await response.json();
this.calculateAlignment();
} catch (e) {
this.error = Failed to load tonearm database: ${e.message};
console.error(e);
} finally {
this.isLoading = false;
}
},


loadTonearmPreset(tonearmId) {
  this.selectedTonearmId = tonearmId;
  if (!tonearmId) {
    this.userInput.pivotToSpindle = 222; // Reset to default
    this.calculatedValues.trackingMethod = 'pivoting'; // Reset
  } else {
    const selected = this.availableTonearms.find(t => t.id === parseInt(tonearmId));
    if (selected) {
      this.userInput.pivotToSpindle = selected.pivot_to_spindle_mm;
      this.calculatedValues.trackingMethod = selected.tracking_method || 'pivoting';
    }
  }
  this.calculateAlignment();
},

setAlignment(type) {
  this.userInput.alignmentType = type;
  this.calculateAlignment();
},

setStandard(standard) {
  this.userInput.standard = standard;
  this.calculateAlignment();
},

setPaperFormat(format) {
  this.userInput.paperFormat = format;
},

calculateAlignment() {
  if (this.calculatedValues.trackingMethod !== 'pivoting') {
    const selected = this.availableTonearms.find(t => t.id === parseInt(this.selectedTonearmId));
    this.calculatedValues = {
      overhang: null,
      offsetAngle: null,
      effectiveLength: selected ? selected.effective_length_mm : 'N/A',
      nulls: { inner: null, outer: null },
      geometryName: 'Tangential',
      geometryDescription: '',
      trackingMethod: 'tangential',
      error: null,
    };
    this.trackingErrorChartData = { datasets: [] };
    return;
  }

  const results = calculateAlignmentGeometries(this.userInput);
  if (!results) {
      this.error = "Calculation service failed to return a valid result.";
      this.calculatedValues.error = "Calculation service failed.";
      return;
  }

  this.allGeometries = results;
  const currentResult = this.allGeometries[this.userInput.alignmentType];
  
  this.calculatedValues = {
    ...this.calculatedValues,
    ...currentResult,
    geometryName: this.ALIGNMENT_GEOMETRIES[this.userInput.alignmentType].name,
    geometryDescription: this.ALIGNMENT_GEOMETRIES[this.userInput.alignmentType].description,
  };

  this.updateChartData();
},

updateChartData() {
    const geometryColors = {
        Baerwald: '#3498db', // Blå
        LofgrenB: '#27ae60', // Grön
        Stevenson: '#8e44ad', // Lila
    };
    const activeColor = '#c0392b'; // Röd för aktiv

    const datasets = Object.entries(this.allGeometries).map(([key, geo]) => {
        const isActive = key === this.userInput.alignmentType;
        return {
            label: key,
            data: geo.data,
            borderColor: isActive ? activeColor : geometryColors[key],
            borderWidth: isActive ? 3 : 1.5,
            borderDash: isActive ? [] :,
            pointRadius: 0,
            tension: 0.1,
            fill: false,
        };
    });
    this.trackingErrorChartData = { datasets };
},

}
});
// src/store/alignmentStore.js
