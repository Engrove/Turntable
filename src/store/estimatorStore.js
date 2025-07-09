import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// Importera vår data
// import pickupData from '@/data/pickup_data.json';
// import classifications from '@/data/classifications.json';
// import confidenceData from '@/data/confidence_levels.json';

import pickupData from '../../data/pickup_data.json';
import classifications from '../../data/classifications.json';
import confidenceData from '../../data/confidence_levels.json';

// --- Hjälpfunktioner (kan ligga i en separat fil vid behov) ---
function calculateMedian(arr) {
    if (!arr || arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export const useEstimatorStore = defineStore('estimator', () => {
    // ---- STATE ----
    // Användarens indata
    const userInput = ref({
        cu_dynamic_100hz: null,
        cu_static: null,
        type: null,
        cantilever_class: null,
        stylus_family: null,
    });
    
    // Vår "träningsdata" - kända, icke-estimerade pickuper
    const trainingData = pickupData.filter(p => !p.is_estimated_10hz && p.cu_dynamic_10hz > 0);

    // ---- GETTERS (Computed Properties) ----

    /**
     * Bestämmer vilket scenario (A1, B2 etc.) som är tillämpligt
     * baserat på användarens nuvarande indata.
     */
    const activeScenarioKey = computed(() => {
        const { cu_dynamic_100hz, cu_static, type, cantilever_class, stylus_family } = userInput.value;

        if (!type) return null; // Typ är alltid obligatorisk

        const has100Hz = cu_dynamic_100hz > 0;
        const hasStatic = cu_static > 0;
        const hasCantilever = !!cantilever_class;
        const hasStylus = !!stylus_family;

        if (has100Hz) {
            if (hasCantilever && hasStylus) return 'A1';
            if (hasCantilever) return 'A2';
            return 'A3';
        } else if (hasStatic) {
            if (hasCantilever && hasStylus) return 'B1';
            if (hasCantilever) return 'B2';
            return 'B3';
        }
        return null; // Inget giltigt scenario
    });

    /**
     * Den huvudsakliga "Frankenstein"-beräkningen.
     * Returnerar det uppskattade 10Hz-värdet.
     */
    const estimatedCompliance = computed(() => {
        if (!activeScenarioKey.value) return null;

        const { cu_dynamic_100hz, cu_static, type, cantilever_class, stylus_family } = userInput.value;
        
        const has100Hz = cu_dynamic_100hz > 0;
        const hasStatic = cu_static > 0;

        const propertyMatchOrder = [
            ['type', 'cantilever_class', 'stylus_family'],
            ['type', 'cantilever_class'],
            ['type']
        ];

        for (const propertiesToMatch of propertyMatchOrder) {
            let matchingGroup = trainingData;
            let currentTarget = { type, cantilever_class, stylus_family };
            let matchesCurrentScenario = propertiesToMatch.every(prop => currentTarget[prop]);

            if (matchesCurrentScenario) {
                 for (const prop of propertiesToMatch) {
                    if (currentTarget[prop]) {
                        matchingGroup = matchingGroup.filter(p => p[prop] === currentTarget[prop]);
                    }
                }

                if (matchingGroup.length > 0) {
                     if (has100Hz) {
                        const ratios = matchingGroup
                            .filter(p => p.cu_dynamic_100hz > 0)
                            .map(p => p.cu_dynamic_10hz / p.cu_dynamic_100hz);
                        if (ratios.length > 0) {
                            return cu_dynamic_100hz * calculateMedian(ratios);
                        }
                    } else if (hasStatic) {
                        const ratios = matchingGroup
                            .filter(p => p.cu_static > 0)
                            .map(p => p.cu_dynamic_10hz / p.cu_static);
                        if (ratios.length > 0) {
                            return cu_static * calculateMedian(ratios);
                        }
                    }
                }
            }
        }
        return null;
    });

    /**
     * Hämtar konfidensnivån för det aktiva scenariot.
     */
    const confidence = computed(() => {
        if (activeScenarioKey.value && confidenceData[activeScenarioKey.value]) {
            return confidenceData[activeScenarioKey.value];
        }
        return { confidence: 0, sampleSize: 0, description: 'Not enough data provided.' };
    });

    /**
     * Exponerar listor för dropdown-menyerna i UI.
     */
    const availableTypes = computed(() => Object.keys(classifications));
    const availableCantileverClasses = computed(() => classifications.cantilever_class.categories.map(c => c.id));
    const availableStylusFamilies = computed(() => classifications.stylus_family.categories.map(c => c.id));
    
    // ---- ACTIONS ----
    
    /**
     * En åtgärd för att rensa all indata.
     */
    function resetInput() {
        userInput.value = {
            cu_dynamic_100hz: null,
            cu_static: null,
            type: null,
            cantilever_class: null,
            stylus_family: null,
        };
    }

    return {
        // State
        userInput,
        // Getters
        estimatedCompliance,
        confidence,
        activeScenarioKey,
        availableTypes,
        availableCantileverClasses,
        availableStylusFamilies,
        // Actions
        resetInput
    };
});
