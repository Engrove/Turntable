<!-- src/views/AlignmentCalculatorView.vue -->
<script setup>
import { onMounted } from 'vue';
import { useHead } from '@unhead/vue';
import { useAlignmentStore } from '@/store/alignmentStore.js';
import AlignmentInputPanel from '@/components/AlignmentInputPanel.vue';
import AlignmentResultsPanel from '@/components/AlignmentResultsPanel.vue';

const store = useAlignmentStore();

useHead({
  title: 'Tonearm Alignment Calculator | Engrove Audio Toolkit',
  meta: [
    { 
      name: 'description', 
      content: 'Dynamically generate printable protractors and visualize tracking error for various tonearm alignment geometries like Baerwald, Löfgren, and Stevenson.' 
    },
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
    <!-- Under Construction Panel -->
      <div class="under-construction-panel">
        <div class="icon-wrapper">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
        </div>
        <h3>Visualizations Under Construction</h3>
        <p>The protractor visualization and tracking error chart are currently being rebuilt to provide a better and more accurate experience. Thank you for your patience!</p>
      </div>
    <div class="tool-header">
      <h1>Alignment Calculator</h1>
    </div>
    <p class="tool-description">
      An interactive tool to calculate optimal tonearm alignment, visualize tracking error, and generate custom-fit protractors for printing.
    </p>

    <div v-if="store.isLoading" class="status-container">
      <h2>Loading Database...</h2>
    </div>
    <div v-else-if="store.error" class="status-container error">
      <h2>Failed to load data</h2>
      <p>{{ store.error }}</p>
    </div>

    <div v-else class="main-grid">
      <AlignmentInputPanel />
      <AlignmentResultsPanel />
      
      

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
  padding-bottom: 1.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}
.tool-header h1 {
  margin: 0;
  font-size: 1.75rem;
  color: var(--header-color);
}
.tool-description {
  margin-top: 0;
  margin-bottom: 2rem;
  color: var(--label-color);
  max-width: 80ch;
}
.status-container {
  padding: 4rem 2rem;
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
.main-grid {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 2rem;
  align-items: start;
}

.under-construction-panel {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem 2rem;
  background-color: var(--warning-color);
  border: 1px solid #ffeeba;
  border-radius: 8px;
  color: var(--warning-text);
}
.icon-wrapper {
  background-color: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  padding: 1rem;
  margin-bottom: 1rem;
}
.under-construction-panel h3 {
  margin: 0 0 0.5rem 0;
  color: var(--warning-text);
  font-size: 1.5rem;
}
.under-construction-panel p {
  margin: 0;
  max-width: 60ch;
}

@media (max-width: 900px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
}
</style>
