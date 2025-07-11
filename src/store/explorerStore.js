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

  const dataType = ref(null); // 'cartridges' or 'tonearms'
  const filters = ref({}); // Ex: { type: 'MC', cantilever_class: 'Aluminum' }
  const searchTerm = ref('');

  // --- ACTIONS ---
  async function initialize() {
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
      console.error("Error initializing explorer store:", e);
    } finally {
      isLoading.value = false;
    }
  }

  function setDataType(type) {
    dataType.value = type;
    // Återställ filter när man byter datatyp
    filters.value = {};
    searchTerm.value = '';
  }

  function updateFilter(filterKey, value) {
    if (value === 'all' || !value) {
      // Ta bort filtret om "All" väljs eller värdet är tomt
      delete filters.value[filterKey];
    } else {
      filters.value[filterKey] = value;
    }
  }

  function resetFilters() {
    filters.value = {};
    searchTerm.value = '';
  }

  // --- COMPUTED ---

  // Returnerar en lista över tillgängliga filter för den valda datatypen
  const availableFilters = computed(() => {
    if (!dataType.value) return [];
    if (dataType.value === 'cartridges') {
      // För pickuper, använd 'type', 'cantilever_class', 'stylus_family'
      return Object.keys(allData.value.cartridgeClassifications)
        .filter(key => ['type', 'cantilever_class', 'stylus_family'].includes(key)) // Förenklad mappning, kan göras mer robust
        .map(key => ({
            key: key,
            name: allData.value.cartridgeClassifications[key]?.name || key,
            options: [...new Set(allData.value.cartridges.map(item => item[key]).filter(Boolean))].sort()
        }));
    }
    if (dataType.value === 'tonearms') {
      // För tonarmar, använd 'bearing_type', 'arm_material', 'headshell_connector'
      return Object.keys(allData.value.tonearmClassifications).map(key => ({
        key: key,
        name: allData.value.tonearmClassifications[key].name,
        options: allData.value.tonearmClassifications[key].categories.map(cat => cat.id).sort()
      }));
    }
    return [];
  });

  // Returnerar den filtrerade listan med resultat
  const filteredResults = computed(() => {
    if (!dataType.value) return [];

    const sourceData = allData.value[dataType.value];
    
    // 1. Fritextsökning
    const searchedData = sourceData.filter(item => {
        const term = searchTerm.value.toLowerCase();
        if (!term) return true;
        return (
            item.manufacturer?.toLowerCase().includes(term) ||
            item.model?.toLowerCase().includes(term)
        );
    });

    // 2. Kategorifiltrering
    const filteredData = searchedData.filter(item => {
        return Object.entries(filters.value).every(([key, value]) => {
            return item[key] === value;
        });
    });

    return filteredData;
  });
  
  // Kör initialiseringen
  initialize();

  return {
    // State
    isLoading,
    error,
    dataType,
    filters,
    searchTerm,
    
    // Actions
    setDataType,
    updateFilter,
    resetFilters,

    // Computed
    availableFilters,
    filteredResults
  };
});
