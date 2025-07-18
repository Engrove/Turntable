// src/store/alignmentStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as calculator from '@/services/alignmentCalculations.js';

export const useAlignmentStore = defineStore('alignment', () => {
// --- STATE ---
const isLoading = ref(true);
const error = ref(null);

// Importera standarder direkt från källan för att hålla det konsekvent
const GROOVE_STANDARDS = calculator.GROOVE_STANDARDS;

const ALIGNMENT_GEOMETRIES = {
Baerwald: {
solver: calculator.calculateBaerwald,
description: "Also known as Löfgren A. Aims for the lowest average distortion across the entire record by balancing the error peaks.",
},
LofgrenB: {
solver: calculator.calculateLofgrenB,
description: "Minimizes the absolute maximum distortion. The error peaks at the inner and outer grooves are lower than with Baerwald.",
},
StevensonA: {
solver: calculator.calculateStevensonA,
description: "Prioritizes minimizing distortion at the innermost groove, where it is most audible, at the cost of higher error elsewhere.",
}
};

const userInput = ref({
pivotToSpindle: 222, // Default to a common Rega value
alignmentType: 'Baerwald',
standard: 'IEC', // Nytt state för att hantera vald standard
});

const availableTonearms = ref([]);
const selectedTonearmId = ref(null);

const calculatedValues = ref({
overhang: 0,
offsetAngle: 0,
effectiveLength: 0,
nulls: { inner: 0, outer: 0 },
geometryName: '',
geometryDescription: '',
trackingMethod: 'pivoting',
error: null
});

const trackingErrorChartData = ref({ datasets: [] });

// --- GETTERS ---
const currentTonearm = computed(() => {
if (!selectedTonearmId.value) return null;
return availableTonearms.value.find(t => t.id === selectedTonearmId.value);
});

// --- ACTIONS ---
async function initialize() {
isLoading.value = true;
error.value = null;
try {
const response = await fetch('/data/tonearm_data.json');
if (!response.ok) throw new Error('Network response was not ok.');
availableTonearms.value = await response.json();
calculateAlignment(); // Gör en initial beräkning med default-värden
} catch (e) {
error.value = Failed to load tonearm database: ${e.message};
console.error(error.value);
} finally {
isLoading.value = false;
}
}

function setAlignment(type) {
if (ALIGNMENT_GEOMETRIES[type]) {
userInput.value.alignmentType = type;
calculateAlignment();
}
}

function setStandard(standard) {
if (GROOVE_STANDARDS[standard]) {
userInput.value.standard = standard;
calculateAlignment();
}
}

function loadTonearmPreset(id) {
selectedTonearmId.value = id ? parseInt(id, 10) : null;
if (currentTonearm.value && currentTonearm.value.pivot_to_spindle_mm) {
userInput.value.pivotToSpindle = currentTonearm.value.pivot_to_spindle_mm;
}
calculateAlignment();
}

function calculateAlignment() {
const p2s = userInput.value.pivotToSpindle;
const standard = userInput.value.standard;


// Hantera icke-pivoterande armar från presets
if (currentTonearm.value && currentTonearm.value.tracking_method !== 'pivoting') {
  calculatedValues.value = {
    overhang: 0,
    offsetAngle: 0,
    effectiveLength: currentTonearm.value.effective_length_mm || 'N/A',
    nulls: { inner: 0, outer: 0 },
    geometryName: currentTonearm.value.tracking_method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    geometryDescription: 'Tangential arms have theoretically zero tracking error across the entire record.',
    trackingMethod: currentTonearm.value.tracking_method,
    error: null
  };
  trackingErrorChartData.value = { datasets: [] };
  return;
}

// Återställ till pivoterande om en sådan var vald innan
calculatedValues.value.trackingMethod = 'pivoting';

// Validera input
if (!p2s || p2s < 150 || p2s > 400) {
  calculatedValues.value.error = "Pivot-to-Spindle distance must be between 150 and 400 mm.";
  trackingErrorChartData.value = { datasets: [] };
  return;
}

calculatedValues.value.error = null;

const chartDatasets = [];
for (const [key, geo] of Object.entries(ALIGNMENT_GEOMETRIES)) {
  const result = geo.solver(p2s, standard);
  const isActive = key === userInput.value.alignmentType;
  
  chartDatasets.push({
    label: key.replace('A', ''),
    data: calculator.generateTrackingErrorCurve(p2s, result.overhang, result.offsetAngle, standard),
    borderColor: isActive ? '#c0392b' : '#bdc3c7',
    borderWidth: isActive ? 3 : 1.5,
    pointRadius: 0,
    tension: 0.1,
  });

  if (isActive) {
    calculatedValues.value.overhang = result.overhang;
    calculatedValues.value.offsetAngle = result.offsetAngle;
    calculatedValues.value.effectiveLength = result.effectiveLength;
    calculatedValues.value.nulls = result.nulls;
    calculatedValues.value.geometryName = key.replace('A', '');
    calculatedValues.value.geometryDescription = geo.description;
  }
}
trackingErrorChartData.value = { datasets: chartDatasets };


}

return {
isLoading,
error,
userInput,
availableTonearms,
selectedTonearmId,
calculatedValues,
trackingErrorChartData,
ALIGNMENT_GEOMETRIES,
GROOVE_STANDARDS,
currentTonearm,
initialize,
setAlignment,
setStandard,
loadTonearmPreset,
calculateAlignment
};
});
// src/store/alignmentStore.js
