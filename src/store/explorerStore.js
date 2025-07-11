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

  const availableFilters = computed(() => {
    if (!dataType.value) return [];
    
    if (dataType.value === 'tonearms') {
      return Object.keys(allData.value.tonearmClassifications).map(key => ({
        key: key,
        name: allData.value.tonearmClassifications[key].name,
        options: allData.value.tonearmClassifications[key].categories.map(cat => ({
          id: cat.id,
          name: cat.name
        })).sort((a, b) => a.name.localeCompare(b.name))
      }));
    }

    if (dataType.value === 'cartridges') {
      const { cartridges, cartridgeClassifications } = allData.value;
      if (!cartridges.length || !cartridgeClassifications) return [];

      const createFilterFromKey = (key, name) => {
        const options = [...new Set(cartridges.map(item => item[key]).filter(Boolean))].sort();
        return { key, name, options: options.map(opt => ({ id: opt, name: opt })) };
      };
      
      const createFilterFromClassification = (key) => {
          const classification = cartridgeClassifications[key];
          if (!classification) return null;
          return {
              key: key,
              name: classification.name,
              options: classification.categories.map(cat => ({ id: cat.id, name: cat.name })).sort((a,b) => a.name.localeCompare(b.name))
          }
      };

      return [
        createFilterFromKey('type', 'Type'),
        createFilterFromClassification('compliance_level'),
        createFilterFromClassification('stylus_family'),
        createFilterFromClassification('cantilever_class')
      ].filter(Boolean); // Ta bort eventuella null-värden
    }

    return [];
  });

  const filteredResults = computed(() => {
    const noSearchTerm = searchTerm.value.trim() === '';
    const noFilters = Object.keys(filters.value).length === 0;
    if (noSearchTerm && noFilters) return [];

    if (!dataType.value) return [];
    let sourceData = [...allData.value[dataType.value]]; 

    const results = sourceData.filter(item => {
      const termMatch = noSearchTerm ? true : (item.manufacturer?.toLowerCase().includes(searchTerm.value.toLowerCase()) || item.model?.toLowerCase().includes(searchTerm.value.toLowerCase()));
      const filterMatch = noFilters ? true : Object.entries(filters.value).every(([key, value]) => item[key] === value);
      return termMatch && filterMatch;
    });

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
