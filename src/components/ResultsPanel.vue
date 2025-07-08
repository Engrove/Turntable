<template>
  <div class="panel">
    <h2>Calculated Results</h2>

    <div class="result-item">
        <span class="label">Total Front Mass (m1):</span>
        <span class="value">{{ store.m1.toFixed(1) }} g</span>
    </div>
    <div class="result-item" v-if="results">
        <span class="label">Adj. CW Distance (D):</span>
        <span class="value">{{ results.isUnbalanced ? 'Unbalanced' : `${results.L4_adj_cw.toFixed(1)} mm` }}</span>
    </div>
    <div class="result-item" v-if="results && !results.isUnbalanced">
        <span class="label">Effective Mass (M_eff):</span>
        <span class="value">{{ results.M_eff.toFixed(1) }} g</span>
    </div>
    <div class="result-item" v-if="results && !results.isUnbalanced">
        <span class="label">System Resonance Frequency:</span>
        <span class="value" id="resonance-freq-value">{{ results.F.toFixed(1) }} Hz</span>
    </div>

    <div class="diagnosis" :class="store.diagnosis.className">
        {{ store.diagnosis.text }}
    </div>
  </div>
</template>

<script setup>
import { useTonearmStore } from '@/store/tonearmStore';
import { computed } from 'vue';

const store = useTonearmStore();
const results = computed(() => store.calculatedResults);
</script>
