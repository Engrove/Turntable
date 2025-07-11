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
  // Extra säkerhetskoll för att undvika fel om storen inte laddats korrekt
  if (store && typeof store.resetInput === 'function') {
    store.resetInput();
  }
});
</script>

<template>
  <div>
    <!-- 1. Visa ett laddningsmeddelande medan storen initieras -->
    <div v-if="store.isLoading" class="status-container">
      <h2>Loading Estimator...</h2>
      <p>Fetching analysis rules and database...</p>
    </div>

    <!-- 2. Visa ett felmeddelande om något gick fel under laddningen -->
    <div v-else-if="store.error" class="status-container error">
      <h2>Initialization Failed</h2>
      <p>Could not load the necessary data for the estimator. Please try refreshing the page.</p>
      <pre>{{ store.error }}</pre>
    </div>

    <!-- 3. Visa verktyget ENDAST när all data är bekräftat laddad och klar -->
    <div v-else-if="store.estimationRules && store.allPickups.length > 0" class="tool-view">
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

        <EstimatorChart 
          v-if="store.result.chartData && store.result.chartData.dataPoints.length > 0"
          :data-points="store.result.chartData.dataPoints"
          :median-ratio="store.result.chartData.medianRatio"
        />
      </div>

      <div class="data-summary-panel panel">
        <h3>Data Source Information</h3>
        <div class="summary-items">
          <div class="summary-item">
            <span class="label">Total Cartridges in Database:</span>
            <span class="value">{{ store.allPickups.length }}</span>
          </div>
          <div v-if="store.estimationRules.timestamp" class="summary-item">
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

    <!-- 4. Fallback-vy om datan av någon anledning inte laddats korrekt men inget fel fångats -->
     <div v-else class="status-container error">
      <h2>An Unexpected Error Occurred</h2>
      <p>Could not render the tool. Please try refreshing the page.</p>
    </div>

  </div>
</template>

<style scoped>
.status-container {
  padding: 2rem;
  text-align: center;
  background-color: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}
.status-container.error {
  background-color: var(--danger-color);
  color: var(--danger-text);
  border-color: #f5c6cb;
}
.status-container pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  text-align: left;
  background-color: rgba(0,0,0,0.05);
  padding: 1rem;
  border-radius: 4px;
}

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
  grid-column: 1 / -1;
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
