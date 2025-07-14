<!-- src/components/AlignmentResultsPanel.vue -->
<script setup>
import { useAlignmentStore } from '@/store/alignmentStore.js';

const store = useAlignmentStore();
</script>

<template>
  <div class="results-panel panel">
    <h2>Optimal Alignment Values</h2>
    <div v-if="store.calculatedValues.error" class="error-box">
      <p>{{ store.calculatedValues.error }}</p>
    </div>
    <div v-else class="results-grid">
      <div class="result-item">
        <span class="label">Overhang</span>
        <span class="value">{{ store.calculatedValues.overhang.toFixed(2) }} <span class="unit">mm</span></span>
      </div>
      <div class="result-item">
        <span class="label">Offset Angle</span>
        <span class="value">{{ store.calculatedValues.offsetAngle.toFixed(2) }} <span class="unit">°</span></span>
      </div>
      <div class="result-item">
        <span class="label">Effective Length</span>
        <span class="value">{{ store.calculatedValues.effectiveLength.toFixed(2) }} <span class="unit">mm</span></span>
      </div>
      <div class="result-item">
        <span class="label">Inner Null Point</span>
        <span class="value">{{ store.calculatedValues.nulls.inner.toFixed(2) }} <span class="unit">mm</span></span>
      </div>
       <div class="result-item">
        <span class="label">Outer Null Point</span>
        <span class="value">{{ store.calculatedValues.nulls.outer.toFixed(2) }} <span class="unit">mm</span></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.results-panel {
  display: flex;
  flex-direction: column;
}
.error-box {
  background-color: var(--danger-color);
  color: var(--danger-text);
  padding: 1rem;
  border-radius: 6px;
  font-weight: 500;
  text-align: center;
}
.results-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1.5rem;
}
.result-item {
  background-color: #fff;
  border: 1px solid #e9ecef;
  padding: 1rem;
  border-radius: 6px;
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.result-item .label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--label-color);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.result-item .value {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--header-color);
  line-height: 1.2;
}
.result-item .unit {
  font-size: 1rem;
  font-weight: 400;
  color: var(--accent-color);
  margin-left: 0.25rem;
}
</style>
