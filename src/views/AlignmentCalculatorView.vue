<!-- src/views/AlignmentCalculatorView.vue -->
<script setup>
import { ref, onMounted } from 'vue';
import { useHead } from '@unhead/vue';
import { useAlignmentStore } from '@/store/alignmentStore.js';
import AlignmentInputPanel from '@/components/AlignmentInputPanel.vue';
import AlignmentResultsPanel from '@/components/AlignmentResultsPanel.vue';
import InfoPanel from '@/components/InfoPanel.vue';
import HelpModal from '@/components/HelpModal.vue';
import TrackingErrorChart from '@/components/TrackingErrorChart.vue';
import { html as alignmentContent } from '@/content/alignmentCalculator.md';

const store = useAlignmentStore();
const showHelp = ref(false);

useHead({
  title: 'Tonearm Alignment Calculator | Engrove Audio Toolkit',
  meta: [
    { name: 'description', content: 'Dynamically generate printable protractors and visualize tracking error for various tonearm alignment geometries like Baerwald, Löfgren, and Stevenson.' },
    { property: 'og:title', content: 'Tonearm Alignment Calculator | Engrove Audio Toolkit' },
    { property: 'og:description', content: 'Visualize and generate custom alignment protractors for your specific tonearm.' },
  ],
});

onMounted(() => {
  store.initialize();
});
</script>

<template>
  <div class="tool-view">
    <div class="tool-header">
      <h1>Alignment Calculator</h1>
      <div class="header-buttons">
        <button @click="showHelp = true" class="icon-help-button" title="Help & Methodology">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
        </button>
      </div>
    </div>

    <!-- NYTT: Varningsbalk högst upp -->
    <div class="construction-banner">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="info-icon"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" x2="12" y1="9" y2="13"></line><line x1="12" x2="12.01" y1="17" y2="17"></line></svg>
        <span><strong>Work in Progress:</strong> The printable protractor visualization is planned for a future update. The tracking error chart is fully functional.</span>
    </div>

    <InfoPanel 
      :content-html="alignmentContent"
      @open-technical-help="showHelp = true"
    />

    <div v-if="store.isLoading" class="status-container">
      <h2>Loading Database...</h2>
    </div>
    <div v-else-if="store.error" class="status-container error">
      <h2>Failed to load data</h2>
      <p>{{ store.error }}</p>
    </div>

    <div v-else class="main-grid">
      <AlignmentInputPanel />
      
      <div class="results-and-visuals-column">
        <AlignmentResultsPanel />

        <TrackingErrorChart 
          v-if="store.trackingErrorChartData.datasets.length > 0 && !store.calculatedValues.error"
          :chartData="store.trackingErrorChartData"
          :nullPoints="store.calculatedValues.nulls"
          class="tracking-chart"
        />
      </div>
    </div>

    <HelpModal :isOpen="showHelp" @close="showHelp = false">
      <template #header>
        <h2>Alignment Calculator Methodology</h2>
      </template>
      <template #default>
        <p>This section will contain a more detailed breakdown of the alignment formulas, tracking error charts, and a full FAQ, as mentioned in the quick guide.</p>
      </template>
    </HelpModal>

  </div>
</template>

<style scoped>
.tool-view { display: flex; flex-direction: column; }
.tool-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0; border-bottom: none; }
.tool-header h1 { margin: 0; font-size: 1.75rem; color: var(--header-color); }
.header-buttons { display: flex; align-items: center; gap: 0.5rem; }
.icon-help-button { background: none; border: 1px solid transparent; border-radius: 50%; cursor: pointer; color: var(--label-color); display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; transition: all 0.2s ease; padding: 0; }
.icon-help-button:hover { background-color: #e9ecef; border-color: var(--border-color); color: var(--text-color); }

/* NY STYLING FÖR VARNINGSBALKEN */
.construction-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: var(--warning-color);
  color: var(--warning-text);
  padding: 0.75rem 1.25rem;
  border-radius: 6px;
  border: 1px solid #ffeeba;
  font-size: 0.9rem;
  font-weight: 500;
  margin-top: 1rem; /* Ger lite luft från titeln */
}
.construction-banner .info-icon {
    flex-shrink: 0;
}

.status-container { padding: 4rem 2rem; text-align: center; background-color: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 6px; }
.status-container.error { background-color: var(--danger-color); color: var(--danger-text); border-color: #f5c6cb; }

.main-grid { display: grid; grid-template-columns: 400px 1fr; gap: 2rem; align-items: start; margin-top: 2rem; }

.results-and-visuals-column {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.tracking-chart {
  margin-top: 0;
}

@media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }
</style>
