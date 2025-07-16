import { defineStore } from 'pinia';
// KORRIGERING: Använder nu korrekt sökvägsalias.
import { useTonearmStore } from '@/store/tonearmStore.js';
import { usePickupStore } from '@/store/pickupStore.js';

export const useExplorerStore = defineStore('explorer', {
  state: () => ({
    dataType: 'tonearms', // 'tonearms' or 'cartridges'
    searchTerm: '',
    filters: {},
    numericFilters: {}, // Håller { min: null, max: null } för varje numeriskt filter
    sortKey: 'manufacturer',
    sortOrder: 'asc',
    currentPage: 1,
    itemsPerPage: 20,
    // Datakällor
    allTonearms: [],
    allPickups: [],
    pickupClassifications: {},
    tonearmClassifications: {},
    isLoading: true,
    error: null,
  }),

  getters: {
    // Returnerar tillgängliga filter baserat på vald datatyp
    availableFilters(state) {
      if (state.dataType === 'cartridges' && state.pickupClassifications) {
        return Object.entries(state.pickupClassifications)
          .filter(([key]) => key !== 'tags') // Filtrera bort 'tags' från dropdowns
          .map(([key, value]) => ({
            key: key,
            name: value.name,
            options: value.categories,
          }));
      }
      if (state.dataType === 'tonearms' && state.tonearmClassifications) {
        return Object.entries(state.tonearmClassifications).map(([key, value]) => ({
          key: key,
          name: value.name,
          options: value.categories,
        }));
      }
      return [];
    },

    // Returnerar definitioner för numeriska filter
    availableNumericFilters(state) {
        if (state.dataType === 'cartridges') {
            return [
                { key: 'weight_g', label: 'Cartridge Weight', unit: 'g' },
                { key: 'cu_dynamic_10hz', label: 'Compliance @ 10Hz', unit: 'cu' },
            ];
        }
        if (state.dataType === 'tonearms') {
            return [
                { key: 'effective_mass_g', label: 'Effective Mass', unit: 'g' },
                { key: 'effective_length_mm', label: 'Effective Length', unit: 'mm' },
            ];
        }
        return [];
    },

    // Den centrala filtrerings- och sorteringslogiken
    filteredResults(state) {
      let results = state.dataType === 'tonearms' ? state.allTonearms : state.allPickups;

      // 1. Text-sökning
      if (state.searchTerm) {
        const term = state.searchTerm.toLowerCase();
        results = results.filter(item =>
          `${item.manufacturer} ${item.model}`.toLowerCase().includes(term)
        );
      }

      // 2. Kategoriska filter (dropdowns)
      for (const key in state.filters) {
        if (state.filters[key]) {
          results = results.filter(item => item[key] === state.filters[key]);
        }
      }

      // 3. Numeriska filter (min/max)
      for (const key in state.numericFilters) {
        const filter = state.numericFilters[key];
        if (filter && (filter.min !== null || filter.max !== null)) {
            results = results.filter(item => {
                const value = item[key];
                if (value === null || value === undefined) return false;
                const passesMin = filter.min === null || value >= filter.min;
                const passesMax = filter.max === null || value <= filter.max;
                return passesMin && passesMax;
            });
        }
      }

      // 4. Sortering
      if (state.sortKey) {
        results.sort((a, b) => {
          let valA = a[state.sortKey];
          let valB = b[state.sortKey];
          
          if (typeof valA === 'string') valA = valA.toLowerCase();
          if (typeof valB === 'string') valB = valB.toLowerCase();
          if (valA === null || valA === undefined) valA = state.sortOrder === 'asc' ? Infinity : -Infinity;
          if (valB === null || valB === undefined) valB = state.sortOrder === 'asc' ? Infinity : -Infinity;

          if (valA < valB) return state.sortOrder === 'asc' ? -1 : 1;
          if (valA > valB) return state.sortOrder === 'asc' ? 1 : -1;
          return 0;
        });
      }
      return results;
    },

    totalResultsCount(state) {
        return this.filteredResults.length;
    },
    
    paginatedResults(state) {
        const start = (state.currentPage - 1) * state.itemsPerPage;
        const end = start + state.itemsPerPage;
        return this.filteredResults.slice(start, end);
    },

    canGoPrev(state) {
        return state.currentPage > 1;
    },
    canGoNext(state) {
        return state.currentPage * state.itemsPerPage < this.totalResultsCount;
    }
  },

  actions: {
    async initialize() {
      this.isLoading = true;
      this.error = null;
      try {
        const tonearmStore = useTonearmStore();
        const pickupStore = usePickupStore();
        
        await Promise.all([
          tonearmStore.initialize(),
          pickupStore.initialize(),
        ]);
        
        this.allTonearms = tonearmStore.availableTonearms;
        this.allPickups = pickupStore.availablePickups;
        this.pickupClassifications = pickupStore.classifications;
        
        // NYTT: Ladda tonarmsklassificeringar
        const classificationsResponse = await fetch('/data/tonearm_classifications.json');
        if (!classificationsResponse.ok) throw new Error('Failed to fetch tonearm classifications');
        this.tonearmClassifications = await classificationsResponse.json();

        this.isLoading = false;
      } catch (e) {
        this.error = `Database initialization failed: ${e.message}`;
        console.error(e);
        this.isLoading = false;
      }
    },

    setDataType(type) {
      if (this.dataType !== type) {
        this.dataType = type;
        this.resetFilters();
        this.sortKey = 'manufacturer';
        this.sortOrder = 'asc';
      }
    },

    resetFilters() {
      this.searchTerm = '';
      this.filters = {};
      this.numericFilters = {};
      this.currentPage = 1;
    },
    
    updateNumericFilter(key, newValue) {
        this.numericFilters[key] = newValue;
        this.currentPage = 1;
    },

    setSortKey(key) {
      if (this.sortKey === key) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortKey = key;
        this.sortOrder = 'asc';
      }
    },
    
    nextPage() {
        if (this.canGoNext) {
            this.currentPage++;
        }
    },

    prevPage() {
        if (this.canGoPrev) {
            this.currentPage--;
        }
    },

    exportToCSV() {
        const items = this.filteredResults;
        if (items.length === 0) return;

        const headers = Object.keys(items[0]);
        const replacer = (key, value) => value === null ? '' : value;
        
        let csv = items.map(row => 
            headers.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(',')
        );
        csv.unshift(headers.join(','));
        csv = csv.join('\r\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', `${this.dataType}_export.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
  },
});
