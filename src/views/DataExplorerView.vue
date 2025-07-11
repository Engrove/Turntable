<!-- src/views/DataExplorerView.vue -->
<template>
  <div class="tool-view">
    <div class="tool-header">
      <h1>Data Explorer</h1>
    </div>
    <p class="tool-description">
      Search, filter, and explore the complete database of tonearms and cartridges. Select a data type to begin.
    </p>

    <div v-if="store.isLoading" class="status-container">Loading databases...</div>
    <div v-else-if="store.error" class="status-container error">{{ store.error }}</div>
    
    <div v-else class="explorer-layout">
      <aside class="filter-panel">
        <h3>Controls</h3>
        <div class="control-group">
          <label>1. Select Data Type</label>
          <div class="button-group">
            <button @click="store.setDataType('tonearms')" :class="{ active: store.dataType === 'tonearms' }">Tonearms</button>
            <button @click="store.setDataType('cartridges')" :class="{ active: store.dataType === 'cartridges' }">Cartridges</button>
          </div>
        </div>
        <div v-if="store.dataType" class="filter-controls">
          <label>2. Filter Results</label>
          <div class="control-group">
            <input type="text" placeholder="Search by name..." v-model="store.searchTerm" class="search-input">
          </div>
          <div v-for="filter in store.availableFilters" :key="filter.key" class="control-group">
            <label :for="filter.key">{{ filter.name }}</label>
            <select :id="filter.key" @change="store.updateFilter(filter.key, $event.target.value)" class="filter-select">
              <option value="all">All</option>
              <option v-for="option in filter.options" :key="option" :value="option">{{ option }}</option>
            </select>
          </div>
          <button @click="store.resetFilters" class="reset-filters-btn">Reset All Filters</button>
        </div>
      </aside>

      <main class="results-area">
        <div v-if="!store.dataType" class="results-placeholder">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <p>Please select a data type to start exploring.</p>
        </div>
        <div v-else>
          <h3>Showing {{ store.filteredResults.length }} {{ store.dataType }}</h3>
          <ResultsTable :items="store.filteredResults" :headers="currentHeaders" />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useExplorerStore } from '@/store/explorerStore.js';
import ResultsTable from '@/components/ResultsTable.vue';

const store = useExplorerStore();
const cartridgeHeaders = [
  { key: 'manufacturer', label: 'Manufacturer' }, { key: 'model', label: 'Model' }, { key: 'type', label: 'Type' },
  { key: 'cu_dynamic_10hz', label: 'Compliance @ 10Hz' }, { key: 'weight_g', label: 'Weight (g)' }, { key: 'stylus_family', label: 'Stylus' }
];
const tonearmHeaders = [
  { key: 'manufacturer', label: 'Manufacturer' }, { key: 'model', label: 'Model' }, { key: 'effective_mass_g', label: 'Effective Mass (g)' },
  { key: 'effective_length_mm', label: 'Length (mm)' }, { key: 'bearing_type', label: 'Bearing' }, { key: 'headshell_connector', label: 'Headshell' }
];
const currentHeaders = computed(() => store.dataType === 'cartridges' ? cartridgeHeaders : tonearmHeaders);
</script>

<style scoped>
.tool-view { display: flex; flex-direction: column; }
.tool-header { padding-bottom: 1rem; margin-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); }
.tool-header h1 { margin: 0; font-size: 1.75rem; color: var(--header-color); }
.tool-description { margin-top: 0; margin-bottom: 2rem; color: var(--label-color); max-width: 80ch; }
.explorer-layout { display: grid; grid-template-columns: 280px 1fr; gap: 2rem; align-items: flex-start; }
.filter-panel { background: var(--panel-bg); padding: 1.5rem; border-radius: 8px; border: 1px solid var(--border-color); position: sticky; top: 2rem; }
.filter-panel h3 { margin-top: 0; color: var(--header-color); border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; margin-bottom: 1.5rem; }
.control-group { margin-bottom: 1.5rem; }
.control-group label, .filter-controls > label { display: block; font-weight: 600; color: var(--label-color); margin-bottom: 0.75rem; font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.5px; }
.button-group { display: flex; width: 100%; }
.button-group button { flex-grow: 1; padding: 0.75rem 0.5rem; font-size: 1rem; font-weight: 600; background-color: #fff; border: 1px solid var(--border-color); cursor: pointer; transition: all 0.2s ease; color: var(--accent-color); }
.button-group button:first-child { border-top-left-radius: 6px; border-bottom-left-radius: 6px; }
.button-group button:last-child { border-top-right-radius: 6px; border-bottom-right-radius: 6px; border-left-width: 0; }
.button-group button.active { background-color: var(--accent-color); color: white; border-color: var(--accent-color); z-index: 2; }
.search-input, .filter-select { width: 100%; padding: 0.5rem 0.75rem; font-size: 1rem; background-color: #fff; border: 1px solid #ced4da; border-radius: 4px; box-sizing: border-box; }
.reset-filters-btn { width: 100%; padding: 0.6rem; font-size: 0.9rem; font-weight: 600; color: var(--danger-text); background-color: transparent; border: 1px solid #f5c6cb; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; margin-top: 1rem; }
.reset-filters-btn:hover { background-color: var(--danger-color); color: white; border-color: var(--danger-text); }
.results-area { min-height: 500px; }
.results-area h3 { color: var(--header-color); }
.results-placeholder { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 400px; border: 2px dashed var(--border-color); border-radius: 8px; color: var(--label-color); }
.results-placeholder svg { color: #bdc3c7; margin-bottom: 1rem; }
.results-placeholder p { font-size: 1.25rem; font-weight: 500; }
.status-container { padding: 2rem; text-align: center; background-color: var(--panel-bg); border-radius: 6px; }
.status-container.error { background-color: var(--danger-color); color: var(--danger-text); }
@media (max-width: 900px) { .explorer-layout { grid-template-columns: 1fr; } .filter-panel { position: static; } }
</style>
