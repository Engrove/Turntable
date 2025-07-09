<script setup>
import { onUnmounted } from 'vue';
import { useEstimatorStore } from '@/store/estimatorStore.js';
import EstimatorInputPanel from '@/components/EstimatorInputPanel.vue';
import EstimatorResultsPanel from '@/components/EstimatorResultsPanel.vue';

const store = useEstimatorStore();

// Återställ inputfälten när komponenten lämnas,
// så att användaren får en ren start nästa gång de besöker sidan.
onUnmounted(() => {
  store.resetInput();
});
</script>

<template>
  <div class="tool-view">
    <div class="tool-header">
      <h1>Compliance Estimator</h1>
      <button @click="store.resetInput()" class="reset-button">
        Reset Fields
      </button>
    </div>
    <p class="tool-description">
      Estimate a cartridge's dynamic compliance at 10Hz based on other known specifications.
      The more details you provide, the higher the confidence in the result. The calculation updates in real-time.
    </p>

    <div class="estimator-grid">
      <EstimatorInputPanel />
      <EstimatorResultsPanel
        :estimated-compliance="store.estimatedCompliance"
        :confidence="store.confidence.confidence"
        :sample-size="store.confidence.sampleSize"
        :description="store.confidence.description"
      />
    </div>
  </div>
</template>

<style scoped>
.tool-view {
  display: flex;
  flex-direction: column;
}

.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1rem;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}

.tool-header h1 {
  margin: 0;
  font-size: 1.75rem;
  color: var(--header-color);
}

.reset-button {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--label-color);
  background-color: transparent;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.reset-button:hover {
  background-color: #f8f9fa;
  border-color: #adb5bd;
  color: var(--text-color);
}

.tool-description {
  margin-top: 0;
  margin-bottom: 2rem;
  color: var(--label-color);
  max-width: 80ch;
}

.estimator-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
  align-items: start;
}
</style>
