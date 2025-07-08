<template>
  <div class="panel">
    <h2>Input Parameters</h2>
    
    <div class="input-group" v-for="(param, key) in inputParams" :key="key">
        <label :for="key">{{ param.label }}</label>
        <div class="input-control">
            <input 
              type="range" 
              :id="key" 
              :min="param.min" 
              :max="param.max" 
              :step="param.step" 
              v-model.number="store.params[key]">
            <span class="value-display">{{ store.params[key].toFixed(param.step < 1 ? 2 : 1) }}</span>
        </div>
    </div>
  </div>
</template>

<script setup>
import { useTonearmStore } from '@/store/tonearmStore';

const store = useTonearmStore();

// Definition av våra sliders för att rendera dem i en loop
const inputParams = {
    m_headshell: { label: 'Headshell Mass (g)', min: 2, max: 25, step: 0.1 },
    m_pickup: { label: 'Cartridge Mass (g)', min: 4, max: 12, step: 0.1 },
    m_screws: { label: 'Mounting Screws Mass (g)', min: 0, max: 3, step: 0.1 },
    m_rear_assembly: { label: 'Armwand + Fixed CW Mass (g)', min: 10, max: 100, step: 0.5 },
    m4_adj_cw: { label: 'Adjustable Counterweight Mass (g)', min: 40, max: 200, step: 1 },
    L1: { label: 'Effective Length (mm)', min: 200, max: 320, step: 0.5 },
    vtf: { label: 'Vertical Tracking Force (VTF) (g)', min: 0.5, max: 3.5, step: 0.05 },
    compliance: { label: 'Cartridge Compliance (µm/mN)', min: 5, max: 40, step: 0.5 },
};
</script>
