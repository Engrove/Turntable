<!-- src/views/ComplianceEstimatorView.vue -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router'; // NYTT (1g)
import { useEstimatorStore } from '@/store/estimatorStore.js';
import EstimatorInputPanel from '@/components/EstimatorInputPanel.vue';
import EstimatorResultsPanel from '@/components/EstimatorResultsPanel.vue';
import EstimatorChart from '@/components/EstimatorChart.vue';
import HelpModal from '@/components/HelpModal.vue';

const store = useEstimatorStore();
const showHelp = ref(false);
const router = useRouter(); // NYTT (1g)

// NYTT (1g): Funktion för att skapa och öppna rapporten
function openReport() {
  if (store.result.compliance_median === null) {
      alert("Cannot generate a report without a valid estimation. Please enter data first.");
      return;
  }
  const reportPayload = {
    type: 'estimator',
    userInput: store.userInput,
    result: store.result,
  };
  const dataString = JSON.stringify(reportPayload);
  const encodedData = btoa(dataString);
  const url = router.resolve({ name: 'report', query: { data: encodedData } }).href;
  window.open(url, '_blank');
}

onMounted(() => {
  if (!store.estimationRules) {
    store.initialize();
  }
});

onUnmounted(() => {
  if (store && typeof store.resetInput === 'function') {
    store.resetInput();
  }
});
</script>

<template>
  <div>
    <div v-if="store.isLoading" class="status-container">
      <h2>Loading Estimator...</h2>
      <p>Fetching analysis rules and database...</p>
    </div>
    <div v-else-if="store.error" class="status-container error">
      <h2>Initialization Failed</h2>
      <p>{{ store.error }}</p>
    </div>
    
    <div v-else class="tool-view">
      <div class="tool-header">
        <h1>Compliance Estimator</h1>
        <div class="header-buttons">
          <!-- NYTT (1g): Print-knapp och Reset-knapp -->
          <button @click="openReport" class="print-report-btn" title="Print Report">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          </button>
          <button @click="store.resetInput()" class="reset-button">Reset Fields</button>
          <button @click="showHelp = true" class="icon-help-button" title="Help & Methodology">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </button>
        </div>
      </div>
      <p class="tool-description">
        Estimate a cartridge's dynamic compliance at 10Hz based on other known specifications.
        The more details you provide, the higher the confidence in the result. The calculation updates in real-time.
      </p>

      <div class="estimator-grid">
        <EstimatorInputPanel />
        <EstimatorResultsPanel :result="store.result" />
        <EstimatorChart 
          v-if="store.result.chartConfig && store.result.chartConfig.dataPoints.length > 0"
          :chart-config="store.result.chartConfig"
        />
      </div>
      
      <HelpModal :isOpen="showHelp" @close="showHelp = false">
        <template #header>
          <h2>Estimator Methodology</h2>
        </template>
        <template #default>
          <p>...</p>
        </template>
      </HelpModal>
    </div>
  </div>
</template>

<style scoped>
.status-container { padding: 4rem 2rem; text-align: center; background-color: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 6px; }
.status-container.error { background-color: var(--danger-color); color: var(--danger-text); border-color: #f5c6cb; }
.tool-view { display: flex; flex-direction: column; }
.tool-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding-bottom: 1rem; margin-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); }
.tool-header h1 { margin: 0; font-size: 1.75rem; color: var(--header-color); }
.header-buttons { display: flex; align-items: center; gap: 0.5rem; }
.reset-button { padding: 0.5rem 1rem; font-size: 0.9rem; font-weight: 600; color: var(--label-color); background-color: transparent; border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; transition: all 0.2s ease; }
.reset-button:hover { background-color: #f8f9fa; border-color: #adb5bd; color: var(--text-color); }
.print-report-btn { background: none; border: 1px solid var(--border-color); border-radius: 50%; cursor: pointer; color: var(--label-color); display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; transition: all 0.2s ease; padding: 0; }
.print-report-btn:hover { background-color: #e9ecef; color: var(--text-color); }
.icon-help-button { background: none; border: 1px solid transparent; border-radius: 50%; cursor: pointer; color: var(--label-color); display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; transition: all 0.2s ease; padding: 0; }
.icon-help-button:hover { background-color: #e9ecef; border-color: var(--border-color); color: var(--text-color); }
.tool-description { margin-top: 0; margin-bottom: 2rem; color: var(--label-color); max-width: 80ch; }
.estimator-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem; align-items: start; }
</style>
