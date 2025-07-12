// src/store/explorerStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useExplorerStore = defineStore('explorer', () => {
    // --- STATE ---
    const allData = ref({ tonearms: [], cartridges: [] });
    const classifications = ref({});
    const isLoading = ref(true);
    const error = ref(null);

    const dataType = ref(null);
    const searchTerm = ref('');
    const filters = ref({});
    // NYTT (1e): State för numeriska filter
    const numericFilters = ref({});

    const currentPage = ref(1);
    const itemsPerPage = 15;
    const sortKey = ref('');
    const sortOrder = ref('asc');

    // --- ACTIONS ---
    async function initialize() {
        isLoading.value = true;
        error.value = null;
        try {
            const [tonearmsRes, cartridgesRes, classificationsRes] = await Promise.all([
                fetch('/data/tonearm_data.json'),
                fetch('/data/pickup_data.json'),
                fetch('/data/classifications.json')
            ]);
            if (!tonearmsRes.ok) throw new Error('Failed to load tonearm data');
            if (!cartridgesRes.ok) throw new Error('Failed to load cartridge data');
            if (!classificationsRes.ok) throw new Error('Failed to load classification data');

            allData.value.tonearms = await tonearmsRes.json();
            allData.value.cartridges = await cartridgesRes.json();
            classifications.value = await classificationsRes.json();
        } catch (e) {
            error.value = e.message;
        } finally {
            isLoading.value = false;
        }
    }

    function setDataType(type) {
        if (dataType.value !== type) {
            dataType.value = type;
            resetFilters();
        }
    }
    
    // NYTT (1e): Action för att uppdatera ett numeriskt filter
    function updateNumericFilter(key, newRange) {
        numericFilters.value[key] = newRange;
        currentPage.value = 1;
    }

    function resetFilters() {
        searchTerm.value = '';
        filters.value = {};
        numericFilters.value = {};
        currentPage.value = 1;
        sortKey.value = '';
        sortOrder.value = 'asc';
    }

    function setSortKey(key) {
        if (sortKey.value === key) {
            sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
        } else {
            sortKey.value = key;
            sortOrder.value = 'asc';
        }
    }

    function nextPage() { if (canGoNext.value) currentPage.value++; }
    function prevPage() { if (canGoPrev.value) currentPage.value--; }

    // --- GETTERS ---
    const availableFilters = computed(() => {
        if (!dataType.value || !classifications.value[dataType.value === 'cartridges' ? 'compliance_level' : 'bearing_type']) return [];
        if (dataType.value === 'cartridges') {
            return [
                { key: 'compliance_level', name: 'Compliance Level', options: classifications.value.compliance_level.categories },
                { key: 'stylus_family', name: 'Stylus Family', options: classifications.value.stylus_family.categories },
                { key: 'cantilever_class', name: 'Cantilever Class', options: classifications.value.cantilever_class.categories }
            ];
        } else { // tonearms
            return [
                { key: 'bearing_type', name: 'Bearing Type', options: classifications.value[dataType.value === 'cartridges' ? 'compliance_level' : 'bearing_type'].categories },
                { key: 'headshell_connector', name: 'Headshell Type', options: classifications.value.headshell_connector.categories }
            ];
        }
    });
    
    // NYTT (1e): Definitioner för numeriska filter
    const availableNumericFilters = computed(() => {
        if (!dataType.value) return [];
        if (dataType.value === 'cartridges') {
            return [
                { key: 'weight_g', label: 'Cartridge Weight', unit: 'g' },
                { key: 'cu_dynamic_10hz', label: 'Compliance @ 10Hz', unit: 'cu' }
            ];
        } else { // tonearms
            return [
                { key: 'effective_mass_g', label: 'Effective Mass', unit: 'g' },
                { key: 'effective_length_mm', label: 'Effective Length', unit: 'mm' }
            ];
        }
    });

    const filteredResults = computed(() => {
        if (!dataType.value) return [];

        let items = [...allData.value[dataType.value]];

        // 1. Text Search
        if (searchTerm.value) {
            const lowerCaseSearch = searchTerm.value.toLowerCase();
            items = items.filter(item =>
                (item.manufacturer?.toLowerCase().includes(lowerCaseSearch)) ||
                (item.model?.toLowerCase().includes(lowerCaseSearch))
            );
        }

        // 2. Categorical Filters
        for (const key in filters.value) {
            const value = filters.value[key];
            if (value) {
                items = items.filter(item => item[key] === value);
            }
        }

        // NYTT (1e): 3. Numeric Range Filters
        for (const key in numericFilters.value) {
            const range = numericFilters.value[key];
            const { min, max } = range;

            if (min !== null || max !== null) {
                items = items.filter(item => {
                    const itemValue = item[key];
                    if (itemValue === null || itemValue === undefined) return false;

                    const passesMin = (min === null) || (itemValue >= min);
                    const passesMax = (max === null) || (itemValue <= max);
                    
                    return passesMin && passesMax;
                });
            }
        }

        // 4. Sorting
        if (sortKey.value) {
            items.sort((a, b) => {
                let valA = a[sortKey.value];
                let valB = b[sortKey.value];
                
                if (typeof valA === 'string') valA = valA.toLowerCase();
                if (typeof valB === 'string') valB = valB.toLowerCase();
                
                if (valA === null || valA === undefined) return 1;
                if (valB === null || valB === undefined) return -1;
                
                if (valA < valB) return sortOrder.value === 'asc' ? -1 : 1;
                if (valA > valB) return sortOrder.value === 'asc' ? 1 : -1;
                return 0;
            });
        }
        
        return items;
    });

    const totalResultsCount = computed(() => filteredResults.value.length);
    const paginatedResults = computed(() => {
        const start = (currentPage.value - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return filteredResults.value.slice(start, end);
    });
    const canGoNext = computed(() => currentPage.value * itemsPerPage < totalResultsCount.value);
    const canGoPrev = computed(() => currentPage.value > 1);

    initialize();

    return {
        isLoading, error, dataType, searchTerm, filters, numericFilters, currentPage, itemsPerPage, sortKey, sortOrder,
        initialize, setDataType, resetFilters, setSortKey, nextPage, prevPage, updateNumericFilter,
        availableFilters, availableNumericFilters,
        filteredResults, totalResultsCount, paginatedResults, canGoNext, canGoPrev
    };
});
