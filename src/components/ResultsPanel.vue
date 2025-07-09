<!-- src/components/ResultsPanel.vue -->
<script setup>
import { useTonearmStore } from '@/store/tonearmStore'
const store = useTonearmStore()
</script>

<template>
  <div>
    <h2>Calculated Results</h2>
    <div class="results-list">
      <div class="result-item">
        <span class="label">Total Front Mass (m1):</span>
        <span class="value">{{ store.totalFrontMass.toFixed(1) }} g</span>
      </div>
      <div class="result-item">
        <span class="label">Adj. CW Distance (D):</span>
        <span class="value">{{ store.adjCWDistance.toFixed(1) }} mm</span>
      </div>
      <div class="result-item">
        <span class="label">Effective Mass (M_eff):</span>
        <span class="value">{{ store.effectiveMass.toFixed(1) }} g</span>
      </div>
      <div class="result-item">
        <span class="label">System Resonance Frequency:</span>
        <span class="value">{{ store.resonanceFrequency.toFixed(1) }} Hz</span>
      </div>
    </div>
    <div v-if="store.resonanceFrequency > 0" :class="['feedback-box', store.resonanceStatus]">
      <div class="title">{{ store.resonanceStatus.charAt(0).toUpperCase() + store.resonanceStatus.slice(1) }} Match</div>
      <div class="description">
        <span v-if="store.resonanceStatus === 'excellent'">The system resonance is perfectly within the ideal range (8-11 Hz).</span>
        <span v-else-if="store.resonanceStatus === 'acceptable'">The resonance is acceptable, but not in the ideal range.</span>
        <span v-else>The resonance is outside the recommended range.</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Din ursprungliga CSS för ResultsPanel */
h2 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.25rem;
  border-bottom: 1px solid #dee2e6;
  padding-bottom: 0.75rem;
}
.result-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e9ecef;
}
.result-item:last-child {
  border-bottom: none;
}
.label {
  color: #6c757d;
}
.value {
  font-weight: 600;
  font-size: 1.1rem;
}
.feedback-box {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
  border: 1px solid;
  transition: background-color 0.3s, color 0.3s, border-color 0.3s;
}
.title {
  font-weight: bold;
}
.excellent {
  background-color: #d1e7dd;
  color: #0f5132;
  border-color: #b6d7c4;
}
.acceptable {
  background-color: #fff3cd;
  color: #664d03;
  border-color: #ffecb5;
}
.poor {
  background-color: #f8d7da;
  color: #842029;
  border-color: #f5c2c7;
}
</style>
