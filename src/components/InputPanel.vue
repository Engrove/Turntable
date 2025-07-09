<script setup>
import { useTonearmStore } from '@/store/tonearmStore.js'
const store = useTonearmStore()
const parameterDefinitions = {
    m_headshell: { label: 'Headshell Mass (g)', min: 2, max: 25, step: 0.1 },
    m_pickup: { label: 'Cartridge Mass (g)', min: 4, max: 12, step: 0.1 },
    m_screws: { label: 'Mounting Screws Mass (g)', min: 0, max: 5, step: 0.1 },
    m_rear_assembly: { label: 'Armwand + Fixed CW Mass (g)', min: 10, max: 100, step: 0.5 },
    m_tube_percentage: { label: 'Armwand % of Rear Mass', min: 0, max: 100, step: 1 },
    m4_adj_cw: { label: 'Adjustable CW Mass (g)', min: 40, max: 200, step: 1 },
    L1: { label: 'Effective Length (mm)', min: 200, max: 320, step: 0.5 },
    L2: { label: 'Armwand CoG Distance (mm)', min: 0, max: 50, step: 0.5 },
    L3_fixed_cw: { label: 'Fixed CW CoG Distance (mm)', min: 0, max: 50, step: 0.5 },
    vtf: { label: 'Vertical Tracking Force (g)', min: 0.5, max: 3.5, step: 0.05 },
    compliance: { label: 'Cartridge Compliance (µm/mN)', min: 5, max: 40, step: 0.5 },
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
          :id="key" 
          :min="param.min" 
          :max="param.max" 
          :step="param.step" 
          v-model.number="store.params[key]"
        >
        <input 
          type="number"
          class="value-display"
          :step="param.step"
          v-model.number="store.params[key]"
        >
      </div>
    </div>
  </div>
</template>
<style scoped>
.value-display{width:70px;text-align:right;padding:.375rem .75rem;font-size:1rem;font-weight:400;line-height:1.5;color:var(--text-color);background-color:#fff;background-clip:padding-box;border:1px solid #ced4da;border-radius:.25rem;transition:border-color .15s ease-in-out,box-shadow .15s ease-in-out}.input-control{gap:.5rem}
</style>
