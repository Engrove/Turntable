<script setup>
import { useTonearmStore } from '@/store/tonearmStore.js'

const store = useTonearmStore()

// Definitioner för varje parameter
const frontAssembly = {
    m_headshell: { label: 'Headshell Mass (g)', min: 2, max: 25, step: 0.1 },
    m_pickup: { label: 'Cartridge Mass (g)', min: 4, max: 12, step: 0.1 },
    m_screws: { label: 'Mounting Screws Mass (g)', min: 0, max: 3, step: 0.1 },
}
const rearAssembly = {
    m_rear_assembly: { label: 'Armwand + Fixed CW Mass (g)', min: 10, max: 100, step: 0.5 },
    m4_adj_cw: { label: 'Adjustable Counterweight Mass (g)', min: 40, max: 200, step: 1 },
}
const systemParams = {
    L1: { label: 'Effective Length (mm)', min: 200, max: 320, step: 0.5 },
    vtf: { label: 'Vertical Tracking Force (g)', min: 0.5, max: 3.5, step: 0.05 },
    compliance: { label: 'Cartridge Dynamic Compliance (µm/mN)', min: 5, max: 40, step: 0.5 },
}
</script>

<template>
  <div class="input-panel panel">
    <h2>Input Parameters</h2>
    
    <fieldset>
      <legend>Front Assembly</legend>
      <div v-for="(param, key) in frontAssembly" :key="key" class="input-group">
        <label :for="key">{{ param.label }}</label>
        <div class="input-control">
          <input type="range" :id="key" :min="param.min" :max="param.max" :step="param.step" v-model.number="store.params[key]">
          <input type="number" :step="param.step" v-model.number="store.params[key]" class="value-display">
        </div>
      </div>
    </fieldset>

    <fieldset>
      <legend>Rear Assembly</legend>
      <div v-for="(param, key) in rearAssembly" :key="key" class="input-group">
        <label :for="key">{{ param.label }}</label>
        <div class="input-control">
          <input type="range" :id="key" :min="param.min" :max="param.max" :step="param.step" v-model.number="store.params[key]">
          <input type="number" :step="param.step" v-model.number="store.params[key]" class="value-display">
        </div>
      </div>
    </fieldset>
    
    <fieldset>
      <legend>System Parameters</legend>
      <div v-for="(param, key) in systemParams" :key="key" class="input-group">
        <label :for="key">{{ param.label }}</label>
        <div class="input-control">
          <input type="range" :id="key" :min="param.min" :max="param.max" :step="param.step" v-model.number="store.params[key]">
          <input type="number" :step="param.step" v-model.number="store.params[key]" class="value-display">
        </div>
      </div>
    </fieldset>

  </div>
</template>

<style scoped>
fieldset {
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 1rem 1rem 0.25rem 1rem;
  margin-bottom: 1.5rem;
}
legend {
  font-weight: 600;
  color: var(--header-color);
  padding: 0 0.5rem;
}
.value-display {
  width: 70px;
}
</style>
