import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

import pickupData from '../../data/pickup_data.json';
import classifications from '../../data/classifications.json';
import confidenceData from '../../data/confidence_levels.json';

function calculateMedian(arr) {
    if (!arr || arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export const useEstimatorStore = defineStore('estimator', () => {
    // ---- STATE ----
    const userInput = ref({
        cu_dynamic_100hz: null,
        cu_static: null,
        type: null,
        cantilever_class: null,
        stylus_family: null,
    });
    
    const trainingData = pickupData.filter(p => !p.is_estimated_10hz && p.cu_dynamic_10hz > 0);

    // ---- GETTERS ----
    
    // Definition av våra scenarion. Detta gör logiken tydligare.
    const scenarios = {
        'A1': { base: '100hz', props: ['type', 'cantilever_class', 'stylus_family'] },
        'A2': { base: '100hz', props: ['type', 'cantilever_class'] },
        'A3': { base: '100hz', props: ['type'] },
        'B1': { base: 'static', props: ['type', 'cantilever_class', 'stylus_family'] },
        'B2': { base: 'static', props: ['type', 'cantilever_class'] },
        'B3': { base: 'static', props: ['type'] },
    };

    // Denna logik är korrekt och bestämmer vilket scenario som är aktivt.
    const activeScenarioKey = computed(() => {
        const { cu_dynamic_100hz, cu_static, type, cantilever_class, stylus_family } = userInput.value;
        if (!type) return null;
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
        return null;
    });

    // **HÄR ÄR DEN KORRIGERADE BERÄKNINGSLOGIKEN**
    const estimatedCompliance = computed(() => {
        const key = activeScenarioKey.value;
        if (!key) return null; // Avsluta direkt om inget scenario är aktivt

        const scenario = scenarios[key]; // Hämta reglerna för det aktiva scenariot
        const { cu_dynamic_100hz, cu_static } = userInput.value;

        // Börja med all träningsdata
        let matchingGroup = trainingData;

        // Filtrera gruppen baserat på de egenskaper som definieras av det aktiva scenariot
        for (const prop of scenario.props) {
            if (userInput.value[prop]) {
                matchingGroup = matchingGroup.filter(p => p[prop] === userInput.value[prop]);
            }
        }
        
        // Om vi hittade en matchande grupp, utför beräkningen
        if (matchingGroup.length > 0) {
            if (scenario.base === '100hz' && cu_dynamic_100hz > 0) {
                const ratios = matchingGroup
                    .filter(p => p.cu_dynamic_100hz > 0)
                    .map(p => p.cu_dynamic_10hz / p.cu_dynamic_100hz);
                if (ratios.length > 0) {
                    return cu_dynamic_100hz * calculateMedian(ratios);
                }
            } else if (scenario.base === 'static' && cu_static > 0) {
                const ratios = matchingGroup
                    .filter(p => p.cu_static > 0)
                    .map(p => p.cu_dynamic_10hz / p.cu_static);
                if (ratios.length > 0) {
                    return cu_static * calculateMedian(ratios);
                }
            }
        }

        // Om ingen beräkning kunde göras (t.ex. inga matchande pickuper med rätt data), returnera null
        return null;
    });

    const confidence = computed(() => {
        if (activeScenarioKey.value && confidenceData[activeScenarioKey.value]) {
            return confidenceData[activeScenarioKey.value];
        }
        return { confidence: 0, sampleSize: 0, description: 'Not enough data provided.' };
    });
    
    const availableCantileverClasses = computed(() => classifications.cantilever_class.categories.map(c => c.id));
    const availableStylusFamilies = computed(() => classifications.stylus_family.categories.map(c => c.id));
    
    // ---- ACTIONS ----
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
        userInput,
        estimatedCompliance,
        confidence,
        activeScenarioKey,
        availableCantileverClasses,
        availableStylusFamilies,
        resetInput
    };
});
