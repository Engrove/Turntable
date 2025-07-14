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
  // Ladda datan för tonarms-presets när komponenten monteras
  store.initialize();
});
</script>

<template>
  <div class="tool-view">
    <div class="tool-header">
      <h1>Alignment Calculator</h1>
      <div class="header-buttons">
        <!-- Knappar för print, reset, etc. kommer att läggas till här senare -->
      </div>
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
.status-container h2 {
  margin: 0;
  color: var(--header-color);
}
.main-grid {
  display: grid;
  grid-template-columns: 400px 1fr;
  gap: 2rem;
  align-items: start;
}

@media (max-width: 900px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
}
</style>
