<!-- src/components/AlignmentInputPanel.vue -->
<script setup>
/**
* @file src/components/AlignmentInputPanel.vue
* @description Komponent för all användarinteraktion i Alignment Calculator.
* Hanterar val av tonarmspreset, manuell input, val av geometri och pappersformat.
*/
import { computed, ref, watch } from 'vue';
import { useAlignmentStore } from '@/store/alignmentStore.js';

const store = useAlignmentStore();

const selectedTonearmManufacturer = ref(null);
const tonearmManufacturers = computed(() => [...new Set(store.availableTonearms.map(t => t.manufacturer))].sort());
const filteredTonearms = computed(() => {
if (!selectedTonearmManufacturer.value) return [];
return store.availableTonearms.filter(t => t.manufacturer === selectedTonearmManufacturer.value);
});

const isPivotingArm = computed(() => store.calculatedValues.trackingMethod === 'pivoting');

watch(selectedTonarmManufacturer, () => {
store.selectedTonearmId = null;
});

function resetTonearmSelection() {
selectedTonearmManufacturer.value = null;
store.loadTonearmPreset(null);
}

const selectedStandardInfo = computed(() => {
return store.GROOVE_STANDARDS[store.userInput.standard] || {};
});
</script>

<template>
<div class="input-panel panel">
<h2>Setup & Controls</h2>

<template v-if="!store.isLoading">
<fieldset>
<legend>1. Tonearm Setup</legend>
<p class="fieldset-description">
Start by loading a preset or manually entering your tonearm's Pivot-to-Spindle distance.
</p>


<div class="preset-group">
  <label>Load Tonearm Preset (Optional)</label>
  <div class="preset-selectors">
    <select v-model="selectedTonearmManufacturer" class="value-select manufacturer">
      <option :value="null" disabled>Select Manufacturer</option>
      <option v-for="man in tonearmManufacturers" :key="man" :value="man">{{ man }}</option>
    </select>
    <select v-model="store.selectedTonearmId" @change="store.loadTonearmPreset($event.target.value)" :disabled="!selectedTonearmManufacturer" class="value-select model">
      <option :value="null" disabled>Select Model</option>
      <option v-for="arm in filteredTonearms" :key="arm.id" :value="arm.id">{{ arm.model }}</option>
    </select>
    <button v-if="store.selectedTonearmId" @click="resetTonearmSelection" class="reset-preset-btn" title="Clear tonearm selection">×</button>
  </div>
</div>

<div class="input-group">
  <label for="p2s">Pivot-to-Spindle Distance (mm)</label>
  <div class="input-control">
    <input type="range" id="p2s" min="150" max="400" step="0.1" v-model.number="store.userInput.pivotToSpindle" @input="store.calculateAlignment" :disabled="!isPivotingArm">
    <input type="number" class="value-display" step="0.1" v-model.number="store.userInput.pivotToSpindle" @change="store.calculateAlignment" :disabled="!isPivotingArm">
  </div>
</div>

</fieldset>

<fieldset>
<legend>2. Alignment Geometry</legend>
<p v-if="isPivotingArm" class="fieldset-description">
Choose the alignment geometry you want to use. Each offers a different trade-off in tracking error across the record.
</p>


<div class="mode-switch">
  <button
    v-for="(geo, key) in store.ALIGNMENT_GEOMETRIES"
    :key="key"
    :class="{ active: store.userInput.alignmentType === key }"
    @click="store.setAlignment(key)"
    :title="geo.description"
    :disabled="!isPivotingArm"
  >
    {{ key }}
  </button>
</div>

<div v-if="isPivotingArm" class="geometry-info">
    <strong>{{ store.calculatedValues.geometryName }}:</strong>
    <span>{{ store.calculatedValues.geometryDescription }}</span>
</div>

<div v-else class="non-pivoting-info">
    <strong>{{ store.calculatedValues.geometryName }} Arm Detected</strong>
    <span>This is a tangential tracking tonearm. Standard alignment geometries do not apply.</span>
</div>

</fieldset>

<fieldset>
<legend>3. Groove Standard</legend>
<p v-if="isPivotingArm" class="fieldset-description">
Select the recording standard for groove radii. This affects the calculated null points.
</p>
<div class="mode-switch">
<button
v-for="(standard, key) in store.GROOVE_STANDARDS"
:key="key"
:class="{ active: store.userInput.standard === key }"
@click="store.setStandard(key)"
:title="`${standard.name} (Inner: ${standard.inner}mm, Outer: ${standard.outer}mm)`"
:disabled="!isPivotingArm"
>
{{ key }}
</button>
</div>
<div v-if="isPivotingArm" class="geometry-info">
<strong>{{ selectedStandardInfo.name }}:</strong>
<span>Inner Groove at {{ selectedStandardInfo.inner }}mm, Outer Groove at {{ selectedStandardInfo.outer }}mm.</span>
</div>
</fieldset>

<fieldset>
<legend>4. Protractor Paper Format</legend>
<p class="fieldset-description">
Choose the paper size for the printable protractor.
</p>
<div class="mode-switch paper-format">
<button
:class="{ active: store.userInput.paperFormat === 'A4' }"
@click="store.setPaperFormat('A4')"
title="A4 Landscape (297 x 210 mm)"
>
A4
</button>
<button
:class="{ active: store.userInput.paperFormat === 'Letter' }"
@click="store.setPaperFormat('Letter')"
title="US Letter Landscape (279.4 x 215.9 mm)"
>
Letter
</button>
</div>
</fieldset>
</template>

<div v-else class="loading-placeholder">
<p>Loading presets...</p>
</div>

</div>
</template>

<style scoped>
.input-panel { display: flex; flex-direction: column; gap: 1rem; }
fieldset { border: 1px solid var(--border-color); border-radius: 6px; padding: 1rem 1.5rem 0.5rem; margin: 0; }
legend { font-weight: 600; color: var(--header-color); padding: 0 0.5rem; font-size: 1.1rem; }
.fieldset-description { font-size: 0.875rem; color: var(--label-color); margin-top: -0.5rem; margin-bottom: 1.5rem; }
.preset-group { margin-bottom: 1.5rem; }
.preset-group label { display: block; font-weight: 500; color: var(--label-color); margin-bottom: 0.5rem; }
.preset-selectors { display: flex; gap: 0.5rem; align-items: center; }
.value-select { width: 100%; padding: 0.5rem 0.75rem; font-size: 1rem; background-color: #fff; border: 1px solid #ced4da; border-radius: 4px; box-sizing: border-box; transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out; cursor: pointer; }
.value-select.manufacturer { flex: 1 1 40%; }
.value-select.model { flex: 1 1 60%; }
.reset-preset-btn { background: none; border: 1px solid var(--border-color); color: var(--danger-text); cursor: pointer; border-radius: 50%; width: 34px; height: 34px; flex-shrink: 0; line-height: 1; font-size: 1.2rem; font-weight: bold; transition: all 0.2s ease; }
.reset-preset-btn:hover { background-color: var(--danger-color); color: white; }
.input-group { margin-bottom: 1.25rem; }
.input-group label { display: block; font-weight: 500; color: var(--label-color); margin-bottom: 0.5rem; }
.input-control { display: flex; align-items: center; gap: 1rem; }
input[type="range"] { flex-grow: 1; cursor: pointer; }
input[type="number"].value-display { font-weight: 600; width: 80px; text-align: right; background-color: #fff; padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color); }
input:disabled { background-color: #e9ecef; cursor: not-allowed; }
.mode-switch { display: flex; width: 100%; margin-bottom: 1rem; border-radius: 6px; overflow: hidden; border: 1px solid var(--border-color); }
.mode-switch.paper-format { max-width: 200px; }
.mode-switch button { flex-grow: 1; padding: 0.75rem 0.5rem; font-size: 1rem; font-weight: 600; background-color: #fff; border: none; cursor: pointer; transition: all 0.2s ease; color: var(--accent-color); }
.mode-switch button:not(:last-child) { border-right: 1px solid var(--border-color); }
.mode-switch button.active { background-color: var(--accent-color); color: white; z-index: 2; }
.mode-switch button:disabled { background-color: #e9ecef; color: #adb5bd; cursor: not-allowed; }
.geometry-info { background-color: #e9ecef; padding: 0.75rem 1rem; border-radius: 4px; font-size: 0.9rem; line-height: 1.5; color: var(--label-color); margin-bottom: 1rem; }
.geometry-info strong { color: var(--text-color); }
.non-pivoting-info { background-color: var(--ideal-color); border: 1px solid var(--ideal-text); padding: 0.75rem 1rem; border-radius: 4px; font-size: 0.9rem; line-height: 1.5; color: var(--ideal-text); margin-bottom: 1rem; text-align: center; }
.non-pivoting-info strong { display: block; font-size: 1rem; margin-bottom: 0.25rem; }
.loading-placeholder { text-align: center; padding: 2rem; color: var(--label-color); font-style: italic; }
</style>

<!-- src/components/AlignmentInputPanel.vue -->
