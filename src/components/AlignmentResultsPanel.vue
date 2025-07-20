Absolut. Här är den andra filen enligt planen, AlignmentResultsPanel.vue, uppdaterad för att korrekt visa felmeddelanden från storen.

<!-- src/components/AlignmentResultsPanel.vue -->

<script setup>
/**
* @file src/components/AlignmentResultsPanel.vue
* @description Visar de beräknade, optimala justeringsvärdena.
* Hanterar olika vyer för pivoterande och tangentiella tonarmar samt felmeddelanden.
*/
import { computed } from 'vue';
import { useAlignmentStore } from '@/store/alignmentStore.js';

const store = useAlignmentStore();

/**
* @description En beräknad egenskap (computed property) som returnerar true om den valda
* eller beräknade tonarmen är av typen 'pivoting'. Detta förenklar logiken i template-delen.
* @returns {boolean}
*/
const isPivotingArm = computed(() => store.calculatedValues.trackingMethod === 'pivoting');
</script>

<template>
<div class="results-panel panel">
<h2>Optimal Alignment Values</h2>


<!-- KORRIGERING: Ny logik för att visa felmeddelandet från storen -->
<div v-if="store.calculatedValues.error" class="error-box">
  <p>{{ store.calculatedValues.error }}</p>
</div>

<div v-else-if="isPivotingArm" class="results-grid">
  <div class="result-item">
    <span class="label">Overhang</span>
    <span class="value">{{ store.calculatedValues.overhang.toFixed(2) }} <span class="unit">mm</span></span>
  </div>
  <div class="result-item">
    <span class="label">Offset Angle</span>
    <span class="value">{{ store.calculatedValues.offsetAngle.toFixed(2) }} <span class="unit">°</span></span>
  </div>
  <div class="result-item full-width">
    <span class="label">Effective Length</span>
    <span class="value">{{ store.calculatedValues.effectiveLength.toFixed(2) }} <span class="unit">mm</span></span>
  </div>
  <div class="result-item">
    <span class="label">Inner Null Point</span>
    <span class="value">{{ store.calculatedValues.nulls.inner.toFixed(2) }} <span class="unit">mm</span></span>
  </div>
  <div class="result-item">
    <span class="label">Outer Null Point</span>
    <span class="value">{{ store.calculatedValues.nulls.outer.toFixed(2) }} <span class="unit">mm</span></span>
  </div>
</div>

<div v-else class="tangential-results results-grid">
  <div class="result-item special full-width">
    <span class="label">Tracking Error</span>
    <span class="value">0°<span class="unit"> (Theoretical)</span></span>
  </div>
  <div class="result-item">
    <span class="label">Overhang</span>
    <span class="value">N/A</span>
  </div>
  <div class="result-item">
    <span class="label">Offset Angle</span>
    <span class="value">N/A</span>
  </div>
  <div class="result-item">
    <span class="label">Null Points</span>
    <span class="value">Full Radius</span>
  </div>
  <div class="result-item">
    <span class="label">Effective Length</span>
    <span class="value">{{ store.calculatedValues.effectiveLength }} <span class="unit">mm</span></span>
  </div>
</div>

</div>
</template>

<style scoped>
.results-panel {
display: flex;
flex-direction: column;
}
.error-box {
background-color: var(--danger-color);
color: var(--danger-text);
padding: 1rem;
border-radius: 6px;
font-weight: 500;
text-align: center;
}
.results-grid {
display: grid;
grid-template-columns: repeat(2, 1fr);
gap: 1rem;
}
.result-item {
background-color: #fff;
border: 1px solid #e9ecef;
padding: 1rem;
border-radius: 6px;
text-align: center;
display: flex;
flex-direction: column;
justify-content: center;
}
.result-item.full-width {
grid-column: 1 / -1;
}
.result-item.special {
background-color: var(--ideal-color);
border-color: var(--ideal-text);
}
.result-item.special .value {
color: var(--ideal-text);
font-size: 2.25rem;
}
.result-item .label {
font-size: 0.85rem;
font-weight: 600;
color: var(--label-color);
margin-bottom: 0.5rem;
text-transform: uppercase;
letter-spacing: 0.5px;
}
.result-item .value {
font-size: 1.75rem;
font-weight: 700;
color: var(--header-color);
line-height: 1.2;
}
.result-item .unit {
font-size: 1rem;
font-weight: 400;
color: var(--accent-color);
margin-left: 0.25rem;
}
.result-item.special .unit {
color: var(--ideal-text);
opacity: 0.8;
}
</style>

<!-- src/components/AlignmentResultsPanel.vue -->
