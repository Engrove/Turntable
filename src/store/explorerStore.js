// src/store/explorerStore.js
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useExplorerStore = defineStore('explorer', () => {
  // --- STATE ---
  const allData = ref({
    cartridges: [], tonearms: [],
    cartridgeClassifications: {}, tonearmClassifications: {}
  });
  const isLoading = ref(true);
  const error = ref(null);
  const dataType = ref(null);
  const filters = ref({});
  const searchTerm = ref('');
  const currentPage = ref(1);
  const itemsPerPage = ref(25);
  // NY STATE FÖR SORTERING
  const sortKey = ref('manufacturer');
  const sortOrder = ref('asc');

  // --- ACTIONS ---
  async function initialize() {
    isLoading.value = true;
    try {
      const [cartridgesRes, tonearmsRes, cartClassRes, tonearmClassRes] = await Promise.all([
        fetch('/data/pickup_data.json'), fetch('/data/tonearm_data.json'),
        fetch('/data/classifications.json'), fetch('/data/tonearm_classifications.json')
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
    resetFilters();
  }

  function updateFilter(filterKey, value) {
    currentPage.value = 1;
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
    sortKey.value = 'manufacturer';
    sortOrder.value = 'asc';
  }

  // NY ACTION FÖR SORTERING
  function setSortKey(key) {
    if (sortKey.value === key) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortKey.value = key;
      sortOrder.value = 'asc';
    }
    currentPage.value = 1;
  }

  function nextPage() { if (canGoNext.value) currentPage.value++; }
  function prevPage() { if (canGoPrev.value) currentPage.value--; }

  // --- COMPUTED ---

  // KORRIGERAD LOGIK FÖR ATT HÄMTA BÅDE ID OCH NAMN
  const availableFilters = computed(() => {
    if (!dataType.value) return [];
    let classifications = {};
    if (dataType.value === 'cartridges') {
      classifications = allData.value.cartridgeClassifications;
    } else if (dataType.value === 'tonearms') {
      classifications = allData.value.tonearmClassifications;
    }

    return Object.keys(classifications).map(key => ({
      key: key,
      name: classifications[key].name,
      options: classifications[key].categories.map(cat => ({
        id: cat.id,
        name: cat.name
      })).sort((a, b) => a.name.localeCompare(b.name))
    }));
  });

  const filteredResults = computed(() => {
    const noSearchTerm = searchTerm.value.trim() === '';
    const noFilters = Object.keys(filters.value).length === 0;
    if (noSearchTerm && noFilters) return [];

    if (!dataType.value) return [];
    let sourceData = [...allData.value[dataType.value]]; // Skapa en kopia för att kunna sortera

    // Filtrering
    const results = sourceData.filter(item => {
      const termMatch = noSearchTerm ? true : (item.manufacturer?.toLowerCase().includes(searchTerm.value.toLowerCase()) || item.model?.toLowerCase().includes(searchTerm.value.toLowerCase()));
      const filterMatch = noFilters ? true : Object.entries(filters.value).every(([key, value]) => item[key] === value);
      return termMatch && filterMatch;
    });

    // NY SORTERINGSLOGIK
    results.sort((a, b) => {
      let valA = a[sortKey.value];
      let valB = b[sortKey.value];
      
      if (valA === null || valA === undefined) valA = sortOrder.value === 'asc' ? Infinity : -Infinity;
      if (valB === null || valB === undefined) valB = sortOrder.value === 'asc' ? Infinity : -Infinity;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder.value === 'asc' ? valA - valB : valB - valA;
      } else {
        return sortOrder.value === 'asc' 
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      }
    });

    return results;
  });

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
    currentPage, itemsPerPage, sortKey, sortOrder,
    setDataType, updateFilter, resetFilters, setSortKey, nextPage, prevPage,
    availableFilters, paginatedResults, totalResultsCount,
    canGoNext, canGoPrev
  };
});
