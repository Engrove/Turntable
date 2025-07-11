<!-- src/views/DataExplorerView.vue -->
<template>
  <div class="tool-view">
    <div class="tool-header">
      <h1>Data Explorer</h1>
    </div>
    <p class="tool-description">
      Search, filter, and explore the complete database of tonearms and cartridges. Select a data type to begin.
    </p>

    <div class="explorer-layout">
      <!-- Kolumn för filter och kontroller -->
      <aside class="filter-panel">
        <h3>Controls</h3>
        
        <div class="control-group">
          <label>1. Select Data Type</label>
          <div class="button-group">
            <button 
              @click="setDataType('tonearms')"
              :class="{ active: selectedDataType === 'tonearms' }"
            >
              Tonearms
            </button>
            <button 
              @click="setDataType('cartridges')"
              :class="{ active: selectedDataType === 'cartridges' }"
            >
              Cartridges
            </button>
          </div>
        </div>

        <!-- Filter-kontroller kommer att renderas här dynamiskt -->
        <div v-if="selectedDataType" class="filter-controls">
          <label>2. Filter Results</label>
          <!-- Exempel på filter, vi kommer att bygga ut detta -->
          <p>Filter controls for {{ selectedDataType }} will appear here.</p>
        </div>

      </aside>

      <!-- Huvudyta för resultat -->
      <main class="results-area">
        <div v-if="!selectedDataType" class="results-placeholder">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <p>Please select a data type to start exploring.</p>
        </div>

        <div v-else>
          <!-- Resultattabell kommer att renderas här -->
          <h3>Showing {{ resultsCount }} {{ selectedDataType }}</h3>
          <p>Results table will appear here.</p>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const selectedDataType = ref(null); // 'tonearms' eller 'cartridges'
const resultsCount = ref(0);

function setDataType(type) {
  selectedDataType.value = type;
  // I framtiden kommer detta anropa en sökfunktion i storen
}
</script>

<style scoped>
.tool-view {
  display: flex;
  flex-direction: column;
}

.tool-header {
  padding-bottom: 1rem;
  margin-bottom: 0.5rem;
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

.explorer-layout {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 2rem;
  align-items: flex-start;
}

.filter-panel {
  background: var(--panel-bg);
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  position: sticky;
  top: 2rem; /* Fäster panelen när man scrollar */
}

.filter-panel h3 {
  margin-top: 0;
  color: var(--header-color);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.75rem;
  margin-bottom: 1.5rem;
}

.control-group {
  margin-bottom: 1.5rem;
}

.control-group label {
  display: block;
  font-weight: 600;
  color: var(--label-color);
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.button-group {
  display: flex;
  width: 100%;
}

.button-group button {
  flex-grow: 1;
  padding: 0.75rem 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  background-color: #fff;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--accent-color);
}

.button-group button:first-child {
  border-top-left-radius: 6px;
  border-bottom-left-radius: 6px;
}

.button-group button:last-child {
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
  border-left-width: 0;
}

.button-group button.active {
  background-color: var(--accent-color);
  color: white;
  border-color: var(--accent-color);
  z-index: 2;
}

.results-area {
  min-height: 500px;
}

.results-placeholder {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 400px;
  border: 2px dashed var(--border-color);
  border-radius: 8px;
  color: var(--label-color);
}

.results-placeholder svg {
  color: #bdc3c7;
  margin-bottom: 1rem;
}

.results-placeholder p {
  font-size: 1.25rem;
  font-weight: 500;
}

@media (max-width: 900px) {
  .explorer-layout {
    grid-template-columns: 1fr;
  }
  .filter-panel {
    position: static;
  }
}
</style>
