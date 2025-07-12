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
    
    // NYTT & FÖRBÄTTRAT (1f): Funktion för att exportera data till CSV med anpassad avgränsare
    function exportToCSV() {
        if (!dataType.value) return;
        
        // Välj den data som ska exporteras, dvs. den filtrerade datamängden
        const itemsToExport = filteredResults.value;
        if (itemsToExport.length === 0) return;

        // Välj avgränsare. Semikolon (;) är säkrare för internationella versioner av Excel.
        const delimiter = ';';
        const decimalSeparator = '.'; // Vi håller datan med punkt, Excel konverterar oftast rätt.

        // Använd headers från den första posten för att skapa CSV-huvudet
        const headers = Object.keys(itemsToExport[0]);
        // Ta bort kolumner som inte är meningsfulla i en platt fil
        const filteredHeaders = headers.filter(h => h !== 'sources' && h !== 'tags' && h !== 'example_params_for_calculator');
        
        let csvContent = filteredHeaders.join(delimiter) + '\n';

        itemsToExport.forEach(item => {
            const row = filteredHeaders.map(header => {
                let cell = item[header];
                if (cell === null || cell === undefined) {
                    return '';
                }

                // För numeriska värden, ersätt eventuell punkt med den valda decimalavgränsaren
                if (typeof cell === 'number') {
                    cell = String(cell).replace('.', decimalSeparator);
                }
                
                let cellString = String(cell);
                
                // Hantera citattecken och avgränsare inuti en cell
                if (cellString.includes(delimiter) || cellString.includes('"') || cellString.includes('\n')) {
                    cellString = '"' + cellString.replace(/"/g, '""') + '"';
                }
                return cellString;
            });
            csvContent += row.join(delimiter) + '\n';
        });

        // Skapa och ladda ner filen
        const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); // \uFEFF är BOM för UTF-8
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            const filename = `engrove_${dataType.value}_database.csv`;
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    // --- GETTERS ---
    const availableFilters = computed(() => {
        if (!dataType.value || !classifications.value[dataType.value === 'cartridges' ? 'compliance_level' : 'bearing_type']) return [];
        if (dataType.value === 'cartridges') {
            return [
                { key: 'compliance_level', name: 'Compliance Level', options: classifications.value.compliance_level.categories },
                { key: 'stylus_family', name: 'Stylus Family', options: classifications.value.stylus_family.categories },
                { key: 'cantilever_class', name: 'Cantilever Class', options: classifications.value.cantilever_class.categories }
            ];
        } else {
            return [
                { key: 'bearing_type', name: 'Bearing Type', options: classifications.value.bearing_type.categories },
                { key: 'headshell_connector', name: 'Headshell Type', options: classifications.value.headshell_connector.categories }
            ];
        }
    });
    
    const availableNumericFilters = computed(() => {
        if (!dataType.value) return [];
        if (dataType.value === 'cartridges') {
            return [
                { key: 'weight_g', label: 'Cartridge Weight', unit: 'g' },
                { key: 'cu_dynamic_10hz', label: 'Compliance @ 10Hz', unit: 'cu' }
            ];
        } else {
            return [
                { key: 'effective_mass_g', label: 'Effective Mass', unit: 'g' },
                { key: 'effective_length_mm', label: 'Effective Length', unit: 'mm' }
            ];
        }
    });

    const filteredResults = computed(() => {
        if (!dataType.value) return [];
        let items = [...allData.value[dataType.value]];
        if (searchTerm.value) {
            const lowerCaseSearch = searchTerm.value.toLowerCase();
            items = items.filter(item =>
                (item.manufacturer?.toLowerCase().includes(lowerCaseSearch)) ||
                (item.model?.toLowerCase().includes(lowerCaseSearch))
            );
        }
        for (const key in filters.value) {
            const value = filters.value[key];
            if (value) items = items.filter(item => item[key] === value);
        }
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
        initialize, setDataType, resetFilters, setSortKey, nextPage, prevPage, updateNumericFilter, exportToCSV,
        availableFilters, availableNumericFilters,
        filteredResults, totalResultsCount, paginatedResults, canGoNext, canGoPrev
    };
});
