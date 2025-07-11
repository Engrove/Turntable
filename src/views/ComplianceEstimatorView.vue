<!-- src/views/ComplianceEstimatorView.vue -->

<script setup>
import { onUnmounted } from 'vue';
import { useEstimatorStore } from '@/store/estimatorStore.js';
import EstimatorInputPanel from '@/components/EstimatorInputPanel.vue';
import EstimatorResultsPanel from '@/components/EstimatorResultsPanel.vue';
import EstimatorChart from '@/components/EstimatorChart.vue';

const store = useEstimatorStore();

// Återställ inputfälten när komponenten lämnas
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
      <EstimatorResultsPanel :result="store.result" />

      <!-- Graf-komponenten, visas villkorligt -->
      <EstimatorChart 
        v-if="store.result.chartData && store.result.chartData.dataPoints.length > 0"
        :data-points="store.result.chartData.dataPoints"
        :median-ratio="store.result.chartData.medianRatio"
      />
    </div>

    <!-- Databasöversikt-panelen -->
    <div class="data-summary-panel panel">
      <h3>Data Source Information</h3>
      <div class="summary-items">
        <div class="summary-item">
          <span class="label">Total Cartridges in Database:</span>
          <!-- Vi behöver hämta totala antalet från storen -->
          <span class="value">{{ store.allPickups.length }}</span>
        </div>
        <div v-if="store.estimationRules" class="summary-item">
          <span class="label">Analysis Last Updated:</span>
          <span class="value">{{ new Date(store.estimationRules.timestamp).toLocaleDateString() }}</span>
        </div>
      </div>
      <p class="summary-note">
        This tool's intelligence relies on our growing open-source database.
        The analysis is periodically updated by running a machine learning script on the available data.
      </p>
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

.data-summary-panel {
  margin-top: 2rem;
  padding: 1rem 1.5rem;
  background-color: #f8f9fa;
  grid-column: 1 / -1; /* Säkerställer att den spänner över hela grid-bredden */
}

.data-summary-panel h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.1rem;
  color: var(--header-color);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

.summary-items {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.summary-item {
  display: flex;
  flex-direction: column;
}

.summary-item .label {
  font-size: 0.9rem;
  color: var(--label-color);
  margin-bottom: 0.25rem;
}

.summary-item .value {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
}

.summary-note {
  font-size: 0.85rem;
  color: #6c757d;
  font-style: italic;
  margin: 0;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}
</style>
