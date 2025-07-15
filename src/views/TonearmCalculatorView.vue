<!-- src/views/TonearmCalculatorView.vue -->
<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import { useTonearmStore } from '@/store/tonearmStore.js';
import { useReportStore } from '@/store/reportStore.js'; // Importera den nya storen
import InputPanel from '@/components/InputPanel.vue';
import ResultsPanel from '@/components/ResultsPanel.vue';
import InfoPanel from '@/components/InfoPanel.vue';
import HelpModal from '@/components/HelpModal.vue';
import { html as resonanceContent } from '@/content/tonearmResonance.md';

const store = useTonearmStore();
const reportStore = useReportStore(); // Använd den nya storen
const showHelp = ref(false);
const router = useRouter();

useHead({
  title: 'Tonearm Resonance Calculator | Engrove Audio Toolkit',
  meta: [
    { 
      name: 'description', 
      content: 'Calculate tonearm effective mass and system resonance. An interactive simulator for vinyl enthusiasts to perfect their tonearm and cartridge matching.' 
    },
    { property: 'og:title', content: 'Tonearm Resonance Calculator | Engrove Audio Toolkit' },
    { property: 'og:description', content: 'An interactive simulator for tonearm and cartridge matching.' },
  ],
});

onMounted(() => {
  if (!store.availableTonearms.length) {
    store.initialize();
  }
});

function generateReport() {
  // Hämta rapportdata från den primära storen
  const data = store.getReportData();
  // Spara datan i den dedikerade rapport-storen
  reportStore.setReportData(data);
  // Navigera till rapport-sidan (utan query-parametrar)
  router.push({ name: 'report' });
}
</script>

<template>
  <div class="tool-view">
    <div class="tool-header">
      <h1>Tonearm Resonance Calculator</h1>
      <div class="header-buttons">
          <button @click="generateReport" class="report-button">Generate Report</button>
          <button @click="showHelp = true" class="icon-help-button" title="Help & Methodology">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
          </button>
      </div>
    </div>

    <InfoPanel 
      :content-html="resonanceContent" 
      @open-technical-help="showHelp = true" 
    />

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
    </div>
    
    <HelpModal :isOpen="showHelp" @close="showHelp = false">
        <!-- HelpModal content remains the same -->
        <template #header><h2>Methodology & User Guide</h2></template>
        <!-- ... all the existing help text ... -->
    </HelpModal>
  </div>
</template>

<style scoped>
/* All existing styles remain the same */
.status-container { padding: 4rem 2rem; text-align: center; background-color: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 6px; }
.status-container.error { background-color: var(--danger-color); color: var(--danger-text); border-color: #f5c6cb; }
.status-container h2 { margin: 0; color: var(--header-color); }
.tool-view { display: flex; flex-direction: column; }
.tool-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 0; margin-bottom: 0; border-bottom: none; }
.tool-header h1 { margin: 0; font-size: 1.75rem; color: var(--header-color); }
.main-content { display: flex; flex-direction: column; gap: 2rem; margin-top: 0; }
.calculator-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem; }
.header-buttons { display: flex; align-items: center; gap: 0.5rem; }
.report-button, .icon-help-button { transition: all 0.2s ease; }
.report-button { padding: 0.5rem 1rem; font-size: 0.9rem; font-weight: 600; color: var(--accent-color); background-color: transparent; border: 1px solid var(--accent-color); border-radius: 6px; cursor: pointer; }
.report-button:hover { background-color: var(--accent-color); color: white; }
.icon-help-button { background: none; border: 1px solid transparent; border-radius: 50%; cursor: pointer; color: var(--label-color); display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; padding: 0; }
.icon-help-button:hover { background-color: #e9ecef; border-color: var(--border-color); color: var(--text-color); }
</style>
