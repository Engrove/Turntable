<!-- src/views/TonearmCalculatorView.vue -->
<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useTonearmStore } from '@/store/tonearmStore.js';
import InputPanel from '@/components/InputPanel.vue';
import ResultsPanel from '@/components/ResultsPanel.vue';
import TonearmVisualizer from '@/components/TonearmVisualizer.vue';
import SensitivityCharts from '@/components/SensitivityCharts.vue';
import CounterweightChart from '@/components/CounterweightChart.vue';
import HelpModal from '@/components/HelpModal.vue';

const store = useTonearmStore();
const showHelp = ref(false);
const router = useRouter();

// NYTT (1g): Funktion för att skapa och öppna rapporten
function openReport() {
  const reportPayload = {
    type: 'tonearm',
    params: store.params,
    results: store.calculatedResults,
    diagnosis: store.diagnosis,
  };
  
  const dataString = JSON.stringify(reportPayload);
  const encodedData = btoa(dataString);

  const url = router.resolve({ name: 'report', query: { data: encodedData } }).href;
  window.open(url, '_blank');
}

onMounted(() => {
  if (!store.availableTonearms.length) {
    store.initialize();
  }
});
</script>

<template>
  <div class="tool-view">
    <div class="tool-header">
      <h1>Tonearm Resonance Calculator</h1>
      <div class="header-buttons">
          <!-- NYTT (1g): Knapp för att skriva ut rapport -->
          <button @click="openReport" class="print-report-btn" title="Print Report">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          </button>
          <button @click="showHelp = true" class="icon-help-button" title="Help & Methodology">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </button>
      </div>
    </div>

    <div v-if="store.isLoading" class="status-container">
      <h2>Loading Database...</h2>
    </div>
    <div v-else-if="store.error" class="status-container error">
      <h2>Failed to load data</h2>
      <p>{{ store.error }}</p>
    </div>

    <div v-else class="main-content">
      <div class="calculator-grid">
        <InputPanel />
        <ResultsPanel />
      </div>
      <template v-if="store.params.calculationMode === 'detailed'">
        <TonearmVisualizer />
        <SensitivityCharts />
        <CounterweightChart />
      </template>
    </div>

    <HelpModal :isOpen="showHelp" @close="showHelp = false">
      <template #header>
        <h2>Methodology & User Guide</h2>
      </template>
      <template #default>
        <h4>How to Use This Tool</h4>
        <p>This calculator is a design aid for exploring the relationship between a tonearm's physical properties and its resonant frequency when paired with a specific cartridge. Adjust the sliders or enter values directly to see the results update in real-time.</p>
        <ul>
            <li><strong>Detailed Mode:</strong> Use sliders to manipulate all physical properties of a theoretical tonearm. Ideal for designing an arm from scratch and understanding physical trade-offs.</li>
            <li><strong>Direct Mode:</strong> If you already know your tonearm's effective mass, use this mode for a quick resonance calculation. This bypasses the detailed geometrical calculations.</li>
        </ul>
        <hr>
        <h4>The Core Physics</h4>
        <p>...</p>
        <h4>Disclaimer and Limitations</h4>
        <p>...</p>
      </template>
    </HelpModal>
  </div>
</template>

<style scoped>
.status-container { padding: 4rem 2rem; text-align: center; background-color: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 6px; }
.status-container.error { background-color: var(--danger-color); color: var(--danger-text); border-color: #f5c6cb; }
.status-container h2 { margin: 0; color: var(--header-color); }
.tool-view { display: flex; flex-direction: column; }
.tool-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 1.5rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); }
.tool-header h1 { margin: 0; font-size: 1.75rem; color: var(--header-color); }
.main-content { display: flex; flex-direction: column; gap: 2rem; }
.calculator-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem; }
.header-buttons { display: flex; align-items: center; gap: 0.5rem; }
.print-report-btn {
    background: none; border: 1px solid var(--border-color); border-radius: 50%; cursor: pointer; color: var(--label-color); display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; transition: all 0.2s ease; padding: 0;
}
.print-report-btn:hover {
    background-color: #e9ecef; color: var(--text-color);
}
.icon-help-button { background: none; border: 1px solid transparent; border-radius: 50%; cursor: pointer; color: var(--label-color); display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; transition: all 0.2s ease; padding: 0; }
.icon-help-button:hover { background-color: #e9ecef; border-color: var(--border-color); color: var(--text-color); }
</style>
