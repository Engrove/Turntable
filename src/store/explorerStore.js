// src/store/explorerStore.js

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useExplorerStore = defineStore('explorer', () => {
  // --- STATE ---
  const allData = ref({
    cartridges: [],
    tonearms: [],
    cartridgeClassifications: {},
    tonearmClassifications: {}
  });

  const isLoading = ref(true);
  const error = ref(null);

  // Sök, filter och paginerings-state
  const dataType = ref(null);
  const filters = ref({});
  const searchTerm = ref('');
  const currentPage = ref(1);
  const itemsPerPage = ref(25);

  // --- ACTIONS ---
  async function initialize() {
    // ... (oförändrad från tidigare)
    isLoading.value = true;
    try {
      const [cartridgesRes, tonearmsRes, cartClassRes, tonearmClassRes] = await Promise.all([
        fetch('/data/pickup_data.json'),
        fetch('/data/tonearm_data.json'),
        fetch('/data/classifications.json'),
        fetch('/data/tonearm_classifications.json')
      ]);
      if (!cartridgesRes.ok) throw new Error('Failed to load cartridge data');
      if (!tonearmsRes.ok) throw new Error('Failed to load tonearm data');
      if (!cartClassRes.ok) throw new Error('Failed to load cartridge classifications');
      if (!tonearmClassRes.ok) throw new Error('Failed to load tonearm classifications');
      allData.value.cartridges = await cartridgesRes.json();
      allData.value.tonearms = await tonearmsRes.json();
      allData.value.cartridgeClassifications = await cartClassRes.json();
      allData.value.tonearmClassifications = await tonearmClassRes.json();
    } catch (e) {
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  }

  function setDataType(type) {
    dataType.value = type;
    resetFilters(); // Återställ allt vid byte av datatyp
  }

  function updateFilter(filterKey, value) {
    currentPage.value = 1; // Återställ till första sidan vid varje filterändring
    if (value === 'all' || !value) {
      delete filters.value[filterKey];
    } else {
      filters.value[filterKey] = value;
    }
  }

  function resetFilters() {
    filters.value = {};
    searchTerm.value = '';
    currentPage.value = 1;
  }
  
  function nextPage() {
    if (currentPage.value * itemsPerPage.value < filteredResults.value.length) {
      currentPage.value++;
    }
  }

  function prevPage() {
    if (currentPage.value > 1) {
      currentPage.value--;
    }
  }

  // --- COMPUTED ---

  const availableFilters = computed(() => {
    // ... (oförändrad från tidigare) ...
    if (!dataType.value) return [];
    if (dataType.value === 'cartridges') {
      const classificationKeys = ['type', 'compliance_level', 'stylus_family', 'cantilever_class'];
      return classificationKeys.map(key => ({
            key: key,
            name: allData.value.cartridgeClassifications[key]?.name || key.replace('_', ' '),
            options: [...new Set(allData.value.cartridges.map(item => item[key]).filter(Boolean))].sort()
        }));
    }
    if (dataType.value === 'tonearms') {
      return Object.keys(allData.value.tonearmClassifications).map(key => ({
        key: key,
        name: allData.value.tonearmClassifications[key].name,
        options: allData.value.tonearmClassifications[key].categories.map(cat => cat.id).sort()
      }));
    }
    return [];
  });

  // Returnerar ALLA resultat som matchar filter, o-paginerat
  const filteredResults = computed(() => {
    // NY VILLKORLIG LOGIK
    const noSearchTerm = searchTerm.value.trim() === '';
    const noFilters = Object.keys(filters.value).length === 0;
    if (noSearchTerm && noFilters) {
      return []; // Returnera tomt om inga filter är aktiva
    }

    if (!dataType.value) return [];
    const sourceData = allData.value[dataType.value];
    
    const searchedData = sourceData.filter(item => {
      const term = searchTerm.value.toLowerCase();
      if (!term) return true;
      return (item.manufacturer?.toLowerCase().includes(term) || item.model?.toLowerCase().includes(term));
    });

    return searchedData.filter(item => {
      return Object.entries(filters.value).every(([key, value]) => item[key] === value);
    });
  });

  // NY COMPUTED PROPERTY FÖR PAGINERING
  const paginatedResults = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return filteredResults.value.slice(start, end);
  });

  const totalResultsCount = computed(() => filteredResults.value.length);
  const canGoNext = computed(() => currentPage.value * itemsPerPage.value < totalResultsCount.value);
  const canGoPrev = computed(() => currentPage.value > 1);
  
  initialize();

  return {
    isLoading, error, dataType, filters, searchTerm,
    currentPage, itemsPerPage,
    setDataType, updateFilter, resetFilters, nextPage, prevPage,
    availableFilters, paginatedResults, totalResultsCount,
    canGoNext, canGoPrev
  };
});
