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
        <span id="resonance-freq-value" class="value">{{ store.calculatedResults.isUnbalanced ? '--' : store.calculatedResults.F.toFixed(1) }} Hz</span>
    </div>

    <div class="diagnosis" :class="store.diagnosis.className">
        {{ store.diagnosis.text }}
    </div>
  </div>
</template>
