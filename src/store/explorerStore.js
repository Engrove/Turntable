// src/store/explorerStore.js
import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useExplorerStore = defineStore('explorer', () => {
  // --- STATE ---
  const allData = ref({ cartridges: [], tonearms: [], cartridgeClassifications: {}, tonearmClassifications: {} });
  const isLoading = ref(true);
  const error = ref(null);
  
  // Filter-state
  const dataType = ref(null);
  const filters = ref({}); // För kategorier
  const numericFilters = ref({}); // NYTT: För numeriska intervall
  const searchTerm = ref('');
  
  // Paginering & Sortering
  const currentPage = ref(1);
  const itemsPerPage = ref(25);
  const sortKey = ref('manufacturer');
  const sortOrder = ref('asc');

  // --- ACTIONS ---
  async function initialize() { /* ... oförändrad ... */
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
    } catch (e) { error.value = e.message; } finally { isLoading.value = false; }
  }

  function setDataType(type) {
    dataType.value = type;
    resetFilters();
  }

  function updateFilter(filterKey, value) {
    currentPage.value = 1;
    if (value === 'all' || !value) delete filters.value[filterKey];
    else filters.value[filterKey] = value;
  }

  // NY ACTION för numeriska filter
  function updateNumericFilter(filterKey, range) {
    currentPage.value = 1;
    if ((range.min === null || range.min === '') && (range.max === null || range.max === '')) {
      delete numericFilters.value[filterKey];
    } else {
      numericFilters.value[filterKey] = range;
    }
  }

  function resetFilters() {
    filters.value = {};
    numericFilters.value = {}; // Återställ även numeriska filter
    searchTerm.value = '';
    currentPage.value = 1;
    sortKey.value = 'manufacturer';
    sortOrder.value = 'asc';
  }

  function setSortKey(key) { /* ... oförändrad ... */
    if (sortKey.value === key) { sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
    } else { sortKey.value = key; sortOrder.value = 'asc'; }
    currentPage.value = 1;
  }

  function nextPage() { if (canGoNext.value) currentPage.value++; }
  function prevPage() { if (canGoPrev.value) currentPage.value--; }

  // --- COMPUTED ---

  const availableFilters = computed(() => { /* ... oförändrad ... */
    if (!dataType.value) return [];
    if (dataType.value === 'tonearms') {
      return Object.keys(allData.value.tonearmClassifications).map(key => ({
        key: key, name: allData.value.tonearmClassifications[key].name,
        options: allData.value.tonearmClassifications[key].categories.map(cat => ({ id: cat.id, name: cat.name })).sort((a, b) => a.name.localeCompare(b.name))
      }));
    }
    if (dataType.value === 'cartridges') {
      const { cartridges, cartridgeClassifications } = allData.value;
      if (!cartridges.length || !cartridgeClassifications) return [];
      const createFilterFromKey = (key, name) => ({ key, name, options: [...new Set(cartridges.map(item => item[key]).filter(Boolean))].sort().map(opt => ({ id: opt, name: opt })) });
      const createFilterFromClassification = (key) => {
        const classification = cartridgeClassifications[key];
        if (!classification) return null;
        return { key: key, name: classification.name, options: classification.categories.map(cat => ({ id: cat.id, name: cat.name })).sort((a,b) => a.name.localeCompare(b.name)) };
      };
      return [ createFilterFromKey('type', 'Type'), createFilterFromClassification('compliance_level'), createFilterFromClassification('stylus_family'), createFilterFromClassification('cantilever_class') ].filter(Boolean);
    }
    return [];
  });

  // NY COMPUTED för numeriska filter
  const availableNumericFilters = computed(() => {
    if (!dataType.value) return [];
    if (dataType.value === 'cartridges') {
      return [
        { key: 'weight_g', label: 'Weight', unit: 'g' },
        { key: 'cu_dynamic_10hz', label: 'Compliance @ 10Hz', unit: 'cu' }
      ];
    }
    if (dataType.value === 'tonearms') {
      return [
        { key: 'effective_mass_g', label: 'Effective Mass', unit: 'g' },
        { key: 'effective_length_mm', label: 'Effective Length', unit: 'mm' }
      ];
    }
    return [];
  });

  const filteredResults = computed(() => {
    const noSearch = !searchTerm.value.trim();
    const noCatFilters = Object.keys(filters.value).length === 0;
    const noNumFilters = Object.keys(numericFilters.value).length === 0;

    if (noSearch && noCatFilters && noNumFilters) return [];
    if (!dataType.value) return [];

    let sourceData = [...allData.value[dataType.value]];
    
    // UTÖKAD FILTRERINGSLOGIK
    const results = sourceData.filter(item => {
      // 1. Fritextsökning
      const termMatch = noSearch ? true : (item.manufacturer?.toLowerCase().includes(searchTerm.value.toLowerCase()) || item.model?.toLowerCase().includes(searchTerm.value.toLowerCase()));
      // 2. Kategorifilter
      const catMatch = noCatFilters ? true : Object.entries(filters.value).every(([key, value]) => item[key] === value);
      // 3. Numeriska intervallfilter
      const numMatch = noNumFilters ? true : Object.entries(numericFilters.value).every(([key, range]) => {
        const itemValue = item[key];
        if (itemValue === null || itemValue === undefined) return false; // Exkludera om värde saknas
        const minOk = (range.min === null || range.min === '') ? true : itemValue >= range.min;
        const maxOk = (range.max === null || range.max === '') ? true : itemValue <= range.max;
        return minOk && maxOk;
      });
      return termMatch && catMatch && numMatch;
    });

    // Sortering (oförändrad)
    results.sort((a, b) => {
      let valA = a[sortKey.value]; let valB = b[sortKey.value];
      if (valA == null) valA = sortOrder.value === 'asc' ? Infinity : -Infinity;
      if (valB == null) valB = sortOrder.value === 'asc' ? Infinity : -Infinity;
      if (typeof valA === 'number' && typeof valB === 'number') return sortOrder.value === 'asc' ? valA - valB : valB - valA;
      return sortOrder.value === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
    });

    return results;
  });

  const paginatedResults = computed(() => { /* ... oförändrad ... */
    const start = (currentPage.value - 1) * itemsPerPage.value;
    const end = start + itemsPerPage.value;
    return filteredResults.value.slice(start, end);
  });
  
  const totalResultsCount = computed(() => filteredResults.value.length);
  const canGoNext = computed(() => currentPage.value * itemsPerPage.value < totalResultsCount.value);
  const canGoPrev = computed(() => currentPage.value > 1);
  
  initialize();

  return {
    isLoading, error, dataType, filters, searchTerm, currentPage, itemsPerPage, sortKey, sortOrder,
    numericFilters, // Exportera nya state
    setDataType, updateFilter, resetFilters, setSortKey, nextPage, prevPage,
    updateNumericFilter, // Exportera nya action
    availableFilters, availableNumericFilters, // Exportera nya computed
    paginatedResults, totalResultsCount,
    canGoNext, canGoPrev
  };
});
