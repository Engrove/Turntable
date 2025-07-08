<script setup>
import { useTonearmStore } from '@/store/tonearmStore.js'

const store = useTonearmStore()

// Definitioner för varje parameter
const parameterDefinitions = {
m_headshell: { label: 'Headshell Mass (g)', min: 2, max: 25, step: 0.1 },
m_pickup: { label: 'Cartridge Mass (g)', min: 4, max: 12, step: 0.1 },
m_screws: { label: 'Mounting Screws Mass (g)', min: 0, max: 3, step: 0.1 },
m_rear_assembly: { label: 'Armwand + Fixed Counterweight Mass (g)', min: 10, max: 100, step: 0.5 },
m_tube_percentage: { label: 'Armwand Percentage of Rear Mass (%)', min: 0, max: 100, step: 1 },
m4_adj_cw: { label: 'Adjustable Counterweight Mass (g)', min: 40, max: 200, step: 1 },
L1: { label: 'Effective Length (pivot to stylus) (mm)', min: 200, max: 320, step: 0.5 },
L2: { label: 'Armwand CoG Distance (mm)', min: 0, max: 50, step: 0.5 },
L3_fixed_cw: { label: 'Fixed CW CoG Distance (mm)', min: 0, max: 50, step: 0.5 },
vtf: { label: 'Vertical Tracking Force (VTF) (g)', min: 0.5, max: 3.5, step: 0.05 },
compliance: { label: 'Cartridge Dynamic Compliance (µm/mN)', min: 5, max: 40, step: 0.5 },
}
</script>

<template>
<div class="input-panel panel">
<h2>Input Parameters</h2>

<div v-for="(param, key) in parameterDefinitions" :key="key" class="input-group">
  <label :for="key">{{ param.label }}</label>
  <div class="input-control">
    <input 
      type="range" 
      :id="key + '-range'"
      :min="param.min" 
      :max="param.max" 
      :step="param.step" 
      v-model.number="store.params[key]"
    >
    <!-- Helt ny numerisk input, synkad med slidern -->
    <input
      type="number"
      class="value-input"
      :id="key"
      :min="param.min"
      :max="param.max"
      :step="param.step"
      v-model.number="store.params[key]"
    >
  </div>
</div>
</div>
</template>

<style scoped>
.value-input {
font-weight: 600;
width: 80px;
text-align: right;
background-color: #fff;
padding: 0.5rem;
border-radius: 4px;
border: 1px solid var(--border-color);
font-size: 0.9rem;
}
</style>


    
