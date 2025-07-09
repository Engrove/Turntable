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

    /**
     * Helper-funktion för att köra ett specifikt scenario.
     */
    function runScenario(baseType, propsToMatch) {
        let matchingGroup = trainingData;
        for (const prop of propsToMatch) {
            if (userInput.value[prop]) {
                matchingGroup = matchingGroup.filter(p => p[prop] === userInput.value[prop]);
            } else {
                return null; // Kräver att alla props för scenariot finns
            }
        }
        
        let ratios = [];
        if (baseType === '100hz') {
            ratios = matchingGroup
                .filter(p => p.cu_dynamic_100hz > 0)
                .map(p => p.cu_dynamic_10hz / p.cu_dynamic_100hz);
        } else { // baseType === 'static'
            ratios = matchingGroup
                .filter(p => p.cu_static > 0)
                .map(p => p.cu_dynamic_10hz / p.cu_static);
        }

        if (ratios.length > 0) {
            const baseValue = baseType === '100hz' ? userInput.value.cu_dynamic_100hz : userInput.value.cu_static;
            return baseValue * calculateMedian(ratios);
        }
        return null;
    }

    /**
     * Central beräkningsfunktion med korrekt fallback-logik.
     */
    const estimationResult = computed(() => {
        const { cu_dynamic_100hz, cu_static, type } = userInput.value;
        if (!type) return { value: null, key: null };

        // Prioritera 100Hz-beräkningar
        if (cu_dynamic_100hz > 0) {
            const scenarios100Hz = [
                { key: 'A1', props: ['type', 'cantilever_class', 'stylus_family'] },
                { key: 'A2', props: ['type', 'cantilever_class'] },
                { key: 'A3', props: ['type'] },
            ];
            for (const scenario of scenarios100Hz) {
                const result = runScenario('100hz', scenario.props);
                if (result !== null) return { value: result, key: scenario.key };
            }
        }

        // Fallback till statiska beräkningar om 100Hz misslyckades eller saknas
        if (cu_static > 0) {
            const scenariosStatic = [
                { key: 'B1', props: ['type', 'cantilever_class', 'stylus_family'] },
                { key: 'B2', props: ['type', 'cantilever_class'] },
                { key: 'B3', props: ['type'] },
            ];
            for (const scenario of scenariosStatic) {
                const result = runScenario('static', scenario.props);
                if (result !== null) return { value: result, key: scenario.key };
            }
        }
        
        return { value: null, key: null };
    });
    
    const estimatedCompliance = computed(() => estimationResult.value.value);
    const activeScenarioKey = computed(() => estimationResult.value.key);

    const confidence = computed(() => {
        const key = activeScenarioKey.value;
        if (key && confidenceData[key]) {
            return confidenceData[key];
        }
        return { confidence: 0, sampleSize: 0, description: 'Not enough data provided.' };
    });
    
    const availableCantileverClasses = computed(() => classifications.cantilever_class.categories.map(c => c.id));
    const availableStylusFamilies = computed(() => classifications.stylus_family.categories.map(c => c.id));
    
    function resetInput() {
        userInput.value = {
            cu_dynamic_100hz: null,
            cu_static: null,
            type: null,
            cantilever_class: null,
            stylus_family: null,
        };
    }

    return { userInput, estimatedCompliance, confidence, activeScenarioKey, availableCantileverClasses, availableStylusFamilies, resetInput };
});
