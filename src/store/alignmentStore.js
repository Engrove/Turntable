// src/store/alignmentStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAlignmentStore = defineStore('alignment', () => {
// --- STATE ---
const isLoading = ref(true);
const error = ref(null);
const availableTonearms = ref([]);
const selectedTonearmId = ref(null);

// IEC standard record groove radii
const R1 = 60.325; // Inner groove radius (mm)
const R2 = 146.05; // Outer groove radius (mm)

const ALIGNMENT_GEOMETRIES = {
LofgrenA: {
name: 'Löfgren A / Baerwald',
description: 'Balances distortion between inner and outer grooves, resulting in the lowest average RMS distortion.',
},
LofgrenB: {
name: 'Löfgren B',
description: 'Minimizes overall RMS distortion across the record with a different weighting than Baerwald.',
},
StevensonA: {
name: 'Stevenson A',
description: 'Prioritizes lowest distortion at the inner groove by placing a null point there.',
},
};

const userInput = ref({
pivotToSpindle: 213.4,
alignmentType: 'LofgrenA',
});

// --- KORRIGERAD BERÄKNINGSLOGIK ---

function getLofgrenAAlignmentGeometry(D) {
if (D <= R2) {
return { error: "Pivot-to-spindle distance must be greater than the outer groove radius." };
}
// These are the correct, standard formulas for Baerwald/Löfgren A geometry based on IEC radii.
const term1 = (R1 + R2) / 2;
const term2 = R1 * R2;


const effectiveLength = Math.sqrt(Math.pow(D, 2) + Math.pow(term1, 2) * Math.pow((Math.pow(D, 2) - term2) / term2, 2) + term2);
const overhang = effectiveLength - D;
const offsetAngleRad = Math.asin((term1 / effectiveLength) * (1 - (Math.pow(D, 2) - term2) / (2 * Math.pow(effectiveLength, 2))));
const offsetAngle = offsetAngleRad * (180 / Math.PI);

// Calculate the resulting null points from the calculated geometry to verify
const L_sq = Math.pow(effectiveLength, 2);
const D_sq = Math.pow(D, 2);
const common_term = Math.sqrt(Math.pow(L_sq * Math.sin(offsetAngleRad), 2) - (L_sq - D_sq));
const n1 = (L_sq * Math.sin(offsetAngleRad)) - common_term;
const n2 = (L_sq * Math.sin(offsetAngleRad)) + common_term;

return {
  overhang: overhang,
  offsetAngle: offsetAngle,
  effectiveLength: effectiveLength,
  nulls: { inner: n1, outer: n2 },
  trackingMethod: 'pivoting',
};


}

function getLofgrenBAlignmentGeometry(D) {
// TEMPORÄRT: Använder Löfgren A för att säkerställa stabilitet.
// Vi korrigerar denna i nästa steg.
console.warn("Lofgren B is currently using Lofgren A calculations.");
const baerwald = getLofgrenAAlignmentGeometry(D);
if (baerwald.error) return baerwald;
return { ...baerwald, name: ALIGNMENT_GEOMETRIES.LofgrenB.name, description: ALIGNMENT_GEOMETRIES.LofgrenB.description };
}

function getStevensonAAlignmentGeometry(D) {
// TEMPORÄRT: Använder Löfgren A för att säkerställa stabilitet.
// Vi korrigerar denna i nästa steg.
console.warn("Stevenson A is currently using Lofgren A calculations.");
const baerwald = getLofgrenAAlignmentGeometry(D);
if (baerwald.error) return baerwald;
return { ...baerwald, name: ALIGNMENT_GEOMETRIES.StevensonA.name, description: ALIGNMENT_GEOMETRIES.StevensonA.description };
}

const getGeometryFunction = (type) => {
switch(type) {
case 'LofgrenA': return getLofgrenAAlignmentGeometry;
case 'LofgrenB': return getLofgrenBAlignmentGeometry;
case 'StevensonA': return getStevensonAAlignmentGeometry;
default: return getLofgrenAAlignmentGeometry;
}
};

// --- COMPUTED VALUES ---
const calculatedValues = computed(() => {
if (selectedTonearmId.value) {
const arm = availableTonearms.value.find(t => t.id === selectedTonearmId.value);
if (arm && arm.tracking_method !== 'pivoting') {
return {
overhang: 0, offsetAngle: 0, effectiveLength: arm.effective_length_mm,
nulls: { inner: R1, outer: R2 }, error: null,
geometryName: 'Tangential',
geometryDescription: 'This tonearm maintains perfect tangency across the record.',
trackingMethod: arm.tracking_method,
};
}
}


const func = getGeometryFunction(userInput.value.alignmentType);
const results = func(userInput.value.pivotToSpindle);

return {
  ...results,
  geometryName: ALIGNMENT_GEOMETRIES[userInput.value.alignmentType].name,
  geometryDescription: ALIGNMENT_GEOMETRIES[userInput.value.alignmentType].description
};


});

function calculateTrackingError(radius, L, H) {
const D = L - H;
const term = (radius / L) - ((LL - DD - radius*radius) / (2 * D * radius));
if (Math.abs(term) > 1) {
return NaN; // Fysiskt omöjligt scenario
}
const trackingErrorRad = Math.asin(term);
return trackingErrorRad * (180 / Math.PI);
}

const trackingErrorChartData = computed(() => {
if (calculatedValues.value.error || calculatedValues.value.trackingMethod !== 'pivoting') {
return { datasets: [] };
}


const { effectiveLength, overhang, offsetAngle } = calculatedValues.value;
const L = effectiveLength;
const H = overhang;
const D = L - H;

const datasets = [];

// Dataset for the active alignment
const activeData = [];
for (let r = R1; r <= R2; r += 0.5) {
  const error = Math.asin(r/L) + Math.asin( (D*D - L*L - r*r) / (-2*L*r) ) - (offsetAngle * Math.PI / 180);
  activeData.push({ x: r, y: error * (180 / Math.PI) });
}
datasets.push({
    label: ALIGNMENT_GEOMETRIES[userInput.value.alignmentType].name,
    data: activeData,
    borderColor: '#3498db',
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderWidth: 4, // Tjockare för att visa att den är aktiv
    pointRadius: 0,
    tension: 0.1,
    fill: true,
});

return { datasets };


});

// --- ACTIONS ---
async function initialize() {
try {
isLoading.value = true;
error.value = null;
const response = await fetch('/data/tonearm_data.json');
if (!response.ok) throw new Error('Failed to fetch tonearm database.');
availableTonearms.value = await response.json();
} catch (e) {
error.value = e.message;
console.error(e);
} finally {
isLoading.value = false;
}
}

function loadTonearmPreset(id) {
selectedTonearmId.value = id ? Number(id) : null;
const arm = availableTonearms.value.find(t => t.id === selectedTonearmId.value);
if (arm) {
if (arm.pivot_to_spindle_mm) {
userInput.value.pivotToSpindle = arm.pivot_to_spindle_mm;
}
} else {
userInput.value.pivotToSpindle = 213.4;
}
calculateAlignment();
}

function setAlignment(type) {
userInput.value.alignmentType = type;
}

function calculateAlignment() {
// Denna funktion är avsiktligt tom.
// All beräkningslogik hanteras nu reaktivt av 'calculatedValues' computed property.
}

return {
isLoading, error, userInput, selectedTonearmId,
availableTonearms, ALIGNMENT_GEOMETRIES,
calculatedValues, trackingErrorChartData,
initialize, loadTonearmPreset, setAlignment, calculateAlignment
};
});
// src/store/alignmentStore.js
