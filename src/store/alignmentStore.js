// src/store/alignmentStore.js
import { defineStore } from 'pinia';
import { ref, reactive, computed } from 'vue';
import { calculateAlignmentGeometry, calculateTrackingErrorData } from '@/services/alignmentCalculations.js';
import { useTonearmStore } from '@/store/tonearmStore.js';

export const useAlignmentStore = defineStore('alignment', () => {
const tonearmStore = useTonearmStore();

const ALIGNMENT_GEOMETRIES = {
Baerwald: { name: 'Löfgren A / Baerwald', description: 'Aims for the lowest average distortion across the entire record by balancing the error peaks.' },
LofgrenB: { name: 'Löfgren B', description: 'Minimizes distortion across the entire playing surface, but allows higher distortion at the absolute outer and inner grooves.' },
Stevenson: { name: 'Stevenson A', description: 'Prioritizes lowest distortion at the innermost groove, where distortion is typically most audible.' }
};

const GROOVE_STANDARDS = {
IEC: { name: 'IEC (1958/1964)', inner: 60.325, outer: 146.05 },
DIN: { name: 'DIN (1962)', inner: 57.5, outer: 146.05 },
JIS: { name: 'JIS (1964)', inner: 55.4, outer: 145.4 }
};

const isLoading = ref(true);
const error = ref(null);
const selectedTonearmId = ref(null);

const userInput = reactive({
pivotToSpindle: 222,
alignmentType: 'Baerwald',
standard: 'IEC',
paperFormat: 'A4'
});

const calculatedValues = reactive({
overhang: 0,
offsetAngle: 0,
effectiveLength: 0,
nulls: { inner: 0, outer: 0 },
geometryName: '',
geometryDescription: '',
trackingMethod: 'pivoting',
error: null
});

const availableTonearms = computed(() => tonearmStore.availableTonearms || []);

async function initialize() {
isLoading.value = true;
error.value = null;
try {
if (!tonearmStore.isInitialized) {
await tonearmStore.initialize();
}
calculateAlignment();
} catch (e) {
error.value = e.message || 'An unknown error occurred during initialization.';
} finally {
isLoading.value = false;
}
}

function calculateAlignment() {
const standard = GROOVE_STANDARDS[userInput.standard];
const results = calculateAlignmentGeometry(
userInput.pivotToSpindle,
userInput.alignmentType,
standard.inner,
standard.outer
);


if (results.error) {
  calculatedValues.error = results.error;
  calculatedValues.overhang = 0;
  calculatedValues.offsetAngle = 0;
  calculatedValues.effectiveLength = 0;
  calculatedValues.nulls = { inner: 0, outer: 0 };
} else {
  calculatedValues.error = null;
  calculatedValues.overhang = results.overhang;
  calculatedValues.offsetAngle = results.offsetAngle;
  calculatedValues.effectiveLength = results.effectiveLength;
  calculatedValues.nulls = results.nulls;
}

calculatedValues.geometryName = ALIGNMENT_GEOMETRIES[userInput.alignmentType]?.name || userInput.alignmentType;
calculatedValues.geometryDescription = ALIGNMENT_GEOMETRIES[userInput.alignmentType]?.description || '';


}

function loadTonearmPreset(id) {
selectedTonearmId.value = id;
if (id) {
const tonearm = availableTonearms.value.find(t => t.id === parseInt(id));
if (tonearm) {
userInput.pivotToSpindle = tonearm.pivot_to_spindle_mm;
calculatedValues.trackingMethod = tonearm.tracking_method || 'pivoting';


if (tonearm.tracking_method !== 'pivoting') {
       // För icke-pivoterande armar, rensa och sätt fasta värden
        calculatedValues.error = null;
        calculatedValues.overhang = 0;
        calculatedValues.offsetAngle = 0;
        calculatedValues.effectiveLength = tonearm.effective_length_mm;
        calculatedValues.nulls = { inner: 0, outer: 0 };
        calculatedValues.geometryName = tonearm.tracking_method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        calculatedValues.geometryDescription = "This arm tracks tangentially, eliminating tracking error by design.";
    } else {
        calculateAlignment();
    }
  }
} else {
  calculatedValues.trackingMethod = 'pivoting';
  calculateAlignment();
}


}

function setAlignment(type) {
userInput.alignmentType = type;
calculateAlignment();
}

function setStandard(standard) {
userInput.standard = standard;
calculateAlignment();
}

function setPaperFormat(format) {
userInput.paperFormat = format;
}

const trackingErrorChartData = computed(() => {
if (calculatedValues.error || calculatedValues.trackingMethod !== 'pivoting') {
return { datasets: [] };
}
const datasets = Object.keys(ALIGNMENT_GEOMETRIES).map(type => {
const standard = GROOVE_STANDARDS[userInput.standard];
const data = calculateTrackingErrorData(userInput.pivotToSpindle, type, standard.inner, standard.outer);
const isActive = type === userInput.alignmentType;
const colors = { Baerwald: '220, 53, 69', LofgrenB: '40, 167, 69', Stevenson: '23, 162, 184' };


return {
    label: ALIGNMENT_GEOMETRIES[type].name.split(' / ') || ALIGNMENT_GEOMETRIES[type].name,
    data: data,
    borderColor: `rgba(${colors[type]}, ${isActive ? 1 : 0.3})`,
    borderWidth: isActive ? 3 : 2,
    pointRadius: 0,
    tension: 0.1,
    // KORRIGERING: Lade till ett giltigt värde för "else"-villkoret.
    borderDash: isActive ? [] :
  };
});
return { datasets };


});

return {
isLoading, error, userInput, calculatedValues, availableTonearms,
ALIGNMENT_GEOMETRIES, GROOVE_STANDARDS, selectedTonearmId,
initialize, loadTonearmPreset, setAlignment, setStandard, setPaperFormat,
calculateAlignment, trackingErrorChartData
};
});
// src/store/alignmentStore.js
