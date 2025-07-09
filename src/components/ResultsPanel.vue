<script setup>
import { useTonearmStore } from '@/store/tonearmStore.js'
const store = useTonearmStore()
</script>
<template>
  <div class="results-panel panel">
    <h2>Calculated Results</h2>
    <div class="result-item">
        <span class="label">Total Front Mass (m1):</span>
        <span class="value">{{ store.m1.toFixed(1) }} g</span>
    </div>
    <div class="result-item">
        <span class="label">Adj. CW Distance (D):</span>
        <span class="value">
            {{ store.calculatedResults.isUnbalanced ? 'Unbalanced' : `${store.calculatedResults.L4_adj_cw.toFixed(1)} mm` }}
        </span>
    </div>
    <div class="result-item">
        <span class="label">Effective Mass (M_eff):</span>
        <span class="value">{{ store.calculatedResults.isUnbalanced ? '--' : store.calculatedResults.M_eff.toFixed(1) }} g</span>
    </div>
    <div class="result-item">
        <span class="label">System Resonance Frequency:</span>
        <span class="value resonance">{{ store.calculatedResults.isUnbalanced ? '--' : store.calculatedResults.F.toFixed(1) }} Hz</span>
    </div>

    <div class="diagnosis" :class="store.diagnosis.status">
        <h4 class="diagnosis-title">{{ store.diagnosis.title }}</h4>
        <ul>
            <li v-for="(rec, index) in store.diagnosis.recommendations" :key="index">{{ rec }}</li>
        </ul>
    </div>
  </div>
</template>
<style scoped>
.value.resonance{font-size:1.5rem}.diagnosis{margin-top:1.5rem;padding:1rem;border-radius:6px;font-weight:500}.diagnosis.ideal{background-color:var(--ideal-color);color:var(--ideal-text)}.diagnosis.warning{background-color:var(--warning-color);color:var(--warning-text)}.diagnosis.danger{background-color:var(--danger-color);color:var(--danger-text)}.diagnosis-title{margin-top:0;margin-bottom:.5rem;font-size:1rem}.diagnosis ul{padding-left:1.25rem;margin:0}.diagnosis li{margin-bottom:.25rem}
</style>
