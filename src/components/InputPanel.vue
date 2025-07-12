<!-- src/components/InputPanel.vue -->
<script setup>
import { computed, ref, watch } from 'vue';
import { useTonearmStore } from '@/store/tonearmStore.js';

const store = useTonearmStore();

// --- Logik för Presets ---
const selectedTonearmManufacturer = ref(null);
const tonearmManufacturers = computed(() => [...new Set(store.availableTonearms.map(t => t.manufacturer))].sort());
const filteredTonearms = computed(() => selectedTonearmManufacturer.value ? store.availableTonearms.filter(t => t.manufacturer === selectedTonearmManufacturer.value) : []);

const selectedPickupManufacturer = ref(null);
const pickupManufacturers = computed(() => [...new Set(store.availablePickups.map(p => p.manufacturer))].sort());
const filteredPickups = computed(() => selectedPickupManufacturer.value ? store.availablePickups.filter(p => p.manufacturer === selectedPickupManufacturer.value) : []);

watch(selectedTonearmManufacturer, () => { store.selectedTonearmId = null; });
watch(selectedPickupManufacturer, () => { store.selectedPickupId = null; });

function resetTonearmSelection() {
  selectedTonearmManufacturer.value = null;
  store.loadTonearmPreset(null);
}
function resetPickupSelection() {
  selectedPickupManufacturer.value = null;
  store.loadCartridgePreset(null);
}

const isTonearmSelected = computed(() => store.selectedTonearmId !== null);
const isPickupSelected = computed(() => store.selectedPickupId !== null);
const isHeadshellIntegrated = computed(() => store.currentTonearm?.has_integrated_headshell === true);

const parameterDefinitions = {
    m_headshell:       { label: 'Headshell Mass (g)',                  min: 0,   max: 25,   step: 0.1,  disabled: computed(() => isHeadshellIntegrated.value) },
    m_pickup:          { label: 'Cartridge Mass (g)',                  min: 2,   max: 20,   step: 0.1,  disabled: isPickupSelected },
    m_screws:          { label: 'Mounting Screws Mass (g)',            min: 0,   max: 5,    step: 0.1,  disabled: ref(false) },
    m_rear_assembly:   { label: 'Armwand + Fixed CW Mass (g)',       min: 10,  max: 200,  step: 0.5,  disabled: isTonearmSelected },
    m_tube_percentage: { label: 'Armwand % of Rear Mass',            min: 0,   max: 100,  step: 1,    disabled: isTonearmSelected },
    m4_adj_cw:         { label: 'Adjustable CW Mass (g)',              min: 40,  max: 200,  step: 1,    disabled: ref(false) },
    L1:                { label: 'Effective Length (mm)',               min: 200, max: 350,  step: 0.5,  disabled: isTonearmSelected },
    L2:                { label: 'Armwand CoG Distance (mm)',           min: 0,   max: 50,   step: 0.5,  disabled: isTonearmSelected },
    L3_fixed_cw:       { label: 'Fixed CW CoG Distance (mm)',          min: 0,   max: 50,   step: 0.5,  disabled: isTonearmSelected },
    vtf:               { label: 'Vertical Tracking Force (g)',         min: 0.5, max: 5,    step: 0.05, disabled: isPickupSelected },
    compliance:        { label: 'Cartridge Compliance @ 10Hz',        min: 5,   max: 40,   step: 0.5,  disabled: isPickupSelected },
    // NYTT (1b)
    directEffectiveMass: { label: 'Effective Mass (g)',                min: 3,   max: 40,   step: 0.1,  disabled: ref(false) },
};

// NYTT (1b): Definierar vilka parametrar som tillhör "Detailed" mode
const detailedParams = ['m_rear_assembly', 'm_tube_percentage', 'm4_adj_cw', 'L1', 'L2', 'L3_fixed_cw'];
</script>

<template>
  <div class="input-panel panel">
    <h2>Parameters</h2>

    <fieldset>
      <legend>Load Presets</legend>
       <div class="preset-group">
        <label>Load Tonearm Preset</label>
        <div class="preset-selectors">
          <select v-model="selectedTonearmManufacturer" class="value-select manufacturer">
            <option :value="null" disabled>Select Manufacturer</option>
            <option v-for="man in tonearmManufacturers" :key="man" :value="man">{{ man }}</option>
          </select>
          <select v-model="store.selectedTonearmId" @change="store.loadTonearmPreset($event.target.value)" :disabled="!selectedTonearmManufacturer" class="value-select model">
            <option :value="null" disabled>Select Model</option>
            <option v-for="arm in filteredTonearms" :key="arm.id" :value="arm.id">{{ arm.model }}</option>
          </select>
          <button v-if="store.selectedTonearmId" @click="resetTonearmSelection" class="reset-preset-btn" title="Clear tonearm selection">✖</button>
        </div>
      </div>
      <div class="preset-group">
        <label>Load Cartridge Preset</label>
        <div class="preset-selectors">
          <select v-model="selectedPickupManufacturer" class="value-select manufacturer">
            <option :value="null" disabled>Select Manufacturer</option>
            <option v-for="man in pickupManufacturers" :key="man" :value="man">{{ man }}</option>
          </select>
          <select v-model="store.selectedPickupId" @change="store.loadCartridgePreset($event.target.value)" :disabled="!selectedPickupManufacturer" class="value-select model">
            <option :value="null" disabled>Select Model</option>
            <option v-for="pickup in filteredPickups" :key="pickup.id" :value="pickup.id">{{ pickup.model }}</option>
          </select>
           <button v-if="store.selectedPickupId" @click="resetPickupSelection" class="reset-preset-btn" title="Clear cartridge selection">✖</button>
        </div>
      </div>
    </fieldset>

    <!-- NYTT (1b): Fieldset för lägesväljare -->
    <fieldset>
      <legend>Calculation Mode</legend>
        <div class="mode-switch">
          <button :class="{ active: store.params.calculationMode === 'detailed' }" @click="store.setCalculationMode('detailed')">
            Detailed
          </button>
          <button :class="{ active: store.params.calculationMode === 'direct' }" @click="store.setCalculationMode('direct')">
            Direct
          </button>
        </div>
    </fieldset>

    <fieldset>
      <legend>Manual Adjustment</legend>
      <!-- Allmänna parametrar som visas i båda lägena -->
      <div v-if="store.params.calculationMode === 'direct'">
          <div v-for="key in ['m_pickup', 'compliance', 'vtf']" :key="key" class="input-group">
              <label :for="key">{{ parameterDefinitions[key].label }}</label>
              <div class="input-control">
                  <input type="range" :id="key" :min="parameterDefinitions[key].min" :max="parameterDefinitions[key].max" :step="parameterDefinitions[key].step" v-model.number="store.params[key]" :disabled="parameterDefinitions[key].disabled.value">
                  <input type="number" class="value-display" :step="parameterDefinitions[key].step" v-model.number="store.params[key]" :disabled="parameterDefinitions[key].disabled.value">
              </div>
              <small v-if="key === 'compliance'" class="help-text">Note: This calculation requires the 10Hz dynamic compliance value. Use the Compliance Estimator tool if you only have a 100Hz or static value.</small>
              <small v-if="parameterDefinitions[key].disabled.value" class="disabled-note">This value is controlled by the selected preset.</small>
          </div>
      </div>
      
      <div v-if="store.params.calculationMode === 'detailed'">
          <div v-for="key in ['m_headshell', 'm_pickup', 'm_screws', 'vtf', 'compliance']" :key="key" class="input-group">
              <label :for="key">{{ parameterDefinitions[key].label }}</label>
              <div class="input-control">
                  <input type="range" :id="key" :min="parameterDefinitions[key].min" :max="parameterDefinitions[key].max" :step="parameterDefinitions[key].step" v-model.number="store.params[key]" :disabled="parameterDefinitions[key].disabled.value">
                  <input type="number" class="value-display" :step="parameterDefinitions[key].step" v-model.number="store.params[key]" :disabled="parameterDefinitions[key].disabled.value">
              </div>
              <small v-if="key === 'compliance'" class="help-text">Note: This calculation requires the 10Hz dynamic compliance value. Use the Compliance Estimator tool if you only have a 100Hz or static value.</small>
              <small v-if="parameterDefinitions[key].disabled.value" class="disabled-note">This value is controlled by the selected preset.</small>
          </div>
      </div>

      <!-- NYTT (1b): Block för direktinmatning -->
      <div v-if="store.params.calculationMode === 'direct'">
           <div class="input-group">
              <label :for="'directEffectiveMass'">{{ parameterDefinitions['directEffectiveMass'].label }}</label>
              <div class="input-control">
                  <input type="range" :id="'directEffectiveMass'" :min="parameterDefinitions['directEffectiveMass'].min" :max="parameterDefinitions['directEffectiveMass'].max" :step="parameterDefinitions['directEffectiveMass'].step" v-model.number="store.params.directEffectiveMass">
                  <input type="number" class="value-display" :step="parameterDefinitions['directEffectiveMass'].step" v-model.number="store.params.directEffectiveMass">
              </div>
          </div>
      </div>

      <!-- NYTT (1b): Block för detaljerade parametrar -->
      <div v-if="store.params.calculationMode === 'detailed'">
          <div v-for="key in detailedParams" :key="key" class="input-group">
              <label :for="key">{{ parameterDefinitions[key].label }}</label>
              <div class="input-control">
                  <input type="range" :id="key" :min="parameterDefinitions[key].min" :max="parameterDefinitions[key].max" :step="parameterDefinitions[key].step" v-model.number="store.params[key]" :disabled="parameterDefinitions[key].disabled.value">
                  <input type="number" class="value-display" :step="parameterDefinitions[key].step" v-model.number="store.params[key]" :disabled="parameterDefinitions[key].disabled.value">
              </div>
              <small v-if="parameterDefinitions[key].disabled.value" class="disabled-note">This value is controlled by the selected preset.</small>
          </div>
      </div>
    </fieldset>
  </div>
</template>

<style scoped>
fieldset { border: 1px solid var(--border-color); border-radius: 6px; padding: 1rem 1.5rem 0.5rem; margin-bottom: 2rem; }
legend { font-weight: 600; color: var(--header-color); padding: 0 0.5rem; }
/* NYTT (1b): Styling för mode-switch */
.mode-switch {
  display: flex;
  width: 100%;
  margin-bottom: 1.5rem;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--border-color);
}
.mode-switch button {
  flex-grow: 1;
  padding: 0.75rem 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  background-color: #fff;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--accent-color);
}
.mode-switch button:not(:last-child) {
  border-right: 1px solid var(--border-color);
}
.mode-switch button.active {
  background-color: var(--accent-color);
  color: white;
  z-index: 2;
}
.preset-group { margin-bottom: 1.5rem; }
.preset-group label { display: block; font-weight: 500; color: var(--label-color); margin-bottom: 0.5rem; }
.preset-selectors { display: flex; gap: 0.5rem; align-items: center; }
.value-select.manufacturer { flex: 1 1 40%; }
.value-select.model { flex: 1 1 60%; }
.reset-preset-btn { background: none; border: 1px solid var(--border-color); color: var(--danger-text); cursor: pointer; border-radius: 50%; width: 28px; height: 28px; flex-shrink: 0; line-height: 1; font-weight: bold; transition: all 0.2s ease; }
.reset-preset-btn:hover { background-color: var(--danger-color); color: white; }
.input-group { margin-bottom: 1.25rem; }
.input-control { display: flex; align-items: center; gap: 1rem; }
.value-display { font-weight: 600; width: 70px; text-align: right; background-color: #fff; padding: 0.25rem 0.5rem; border-radius: 4px; border: 1px solid var(--border-color); }
.value-select { width: 100%; padding: 0.5rem 0.75rem; font-size: 1rem; background-color: #fff; border: 1px solid #ced4da; border-radius: 4px; box-sizing: border-box; transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out; cursor: pointer;}
.value-select:disabled { background-color: #e9ecef; cursor: not-allowed; }
.disabled-note { font-size: 0.8rem; font-style: italic; color: var(--label-color); display: block; margin-top: 0.25rem; }
.help-text { font-size: 0.8rem; font-style: italic; color: var(--label-color); display: block; margin-top: 0.35rem; background-color: #e9ecef; padding: 0.4rem 0.6rem; border-radius: 4px; }
input[type="range"]:disabled { background-color: #e9ecef; cursor: not-allowed; }
input[type="number"]:disabled { background-color: #e9ecef; }
</style>
