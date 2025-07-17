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
nulls: { inner: 66.0, outer: 120.9 }
},
LofgrenB: {
name: 'Löfgren B',
description: 'Minimizes overall RMS distortion across the record with a different weighting than Baerwald.',
// These will be corrected in a later step
nulls: { inner: 70.3, outer: 116.6 }
},
StevensonA: {
name: 'Stevenson A',
description: 'Prioritizes lowest distortion at the inner groove by placing a null point there.',
// These will be corrected in a later step
nulls: { inner: 60.325, outer: 117.42 }
},
};

const userInput = ref({
pivotToSpindle: 213.4,
alignmentType: 'LofgrenA',
});

// --- KORRIGERAD BERÄKNINGSLOGIK ---

/**

Calculates the optimal tonearm geometry based on two given null points and the pivot-to-spindle distance.

This is the core geometric calculation used by all alignment types.

@param {number} D - Pivot-to-spindle distance in mm.

@param {object} nulls - An object with { inner, outer } null point radii in mm.

@returns {object} - An object containing overhang, offsetAngle, effectiveLength.
*/
function calculateGeometryFromNulls(D, nulls) {
const n1 = nulls.inner;
const n2 = nulls.outer;

if (D <= R2) {
  return { error: "Pivot-to-spindle distance must be greater than the outer groove radius." };
}

// This robust set of formulas calculates the geometry directly from D and the two null points.
const term = D + (n1 * n2) / D;
const offsetAngleRad = Math.asin((n1 + n2) / term);
const effectiveLength = term / (2 * Math.cos(offsetAngleRad));
const overhang = effectiveLength - D;
const offsetAngleDeg = offsetAngleRad * (180 / Math.PI);

return {
  overhang: overhang,
  offsetAngle: offsetAngleDeg,
  effectiveLength: effectiveLength,
  nulls: { inner: n1, outer: n2 },
  trackingMethod: 'pivoting',
  error: null
};


}

function getLofgrenAAlignmentGeometry(D) {
return calculateGeometryFromNulls(D, ALIGNMENT_GEOMETRIES.LofgrenA.nulls);
}

function getLofgrenBAlignmentGeometry(D) {
// TEMPORÄRT: Använder Löfgren A för att säkerställa stabilitet. Vi korrigerar denna i nästa steg.
console.warn("Lofgren B is currently using Lofgren A calculations for stability.");
const geom = getLofgrenAAlignmentGeometry(D);
return { ...geom, name: ALIGNMENT_GEOMETRIES.LofgrenB.name, description: ALIGNMENT_GEOMETRIES.LofgrenB.description };
}

function getStevensonAAlignmentGeometry(D) {
// TEMPORÄRT: Använder Löfgren A för att säkerställa stabilitet. Vi korrigerar denna i nästa steg.
console.warn("Stevenson A is currently using Lofgren A calculations for stability.");
const geom = getLofgrenAAlignmentGeometry(D);
return { ...geom, name: ALIGNMENT_GEOMETRIES.StevensonA.name, description: ALIGNMENT_GEOMETRIES.StevensonA.description };
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

Generated code
return {
  ...results,
  geometryName: ALIGNMENT_GEOMETRIES[userInput.value.alignmentType].name,
  geometryDescription: ALIGNMENT_GEOMETRIES[userInput.value.alignmentType].description
};


});

const trackingErrorChartData = computed(() => {
if (calculatedValues.value.error || calculatedValues.value.trackingMethod !== 'pivoting') {
return { datasets: [] };
}


const { effectiveLength, overhang, offsetAngle } = calculatedValues.value;
const L = effectiveLength;
const H = overhang;

const datasets = [];

// Dataset for the active alignment
const activeData = [];
for (let r = R1; r <= R2; r += 0.5) {
  // Correct formula for tracking error in degrees
  const errorRad = Math.asin(r / L) - Math.acos((L*L + r*r - (L-H)**2) / (2 * L * r)) + (offsetAngle * Math.PI / 180);
  activeData.push({ x: r, y: errorRad * (180 / Math.PI) });
}
datasets.push({
    label: ALIGNMENT_GEOMETRIES[userInput.value.alignmentType].name,
    data: activeData,
    borderColor: '#3498db',
    backgroundColor: 'rgba(52, 152, 219, 0.1)',
    borderWidth: 4,
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
}

function setAlignment(type) {
userInput.value.alignmentType = type;
}

function calculateAlignment() {
// Tom - beräkning sker reaktivt.
}

return {
isLoading, error, userInput, selectedTonearmId,
availableTonearms, ALIGNMENT_GEOMETRIES,
calculatedValues, trackingErrorChartData,
initialize, loadTonearmPreset, setAlignment, calculateAlignment
};
});
// src/store/alignmentStore.js
