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
    const userInput = ref({
        cu_dynamic_100hz: null,
        cu_static: null,
        type: null,
        cantilever_class: null,
        stylus_family: null,
    });

    const estimationResult = computed(() => {
        const { cu_dynamic_100hz, cu_static, type } = userInput.value;
        if (!type) return { value: null, key: null };

        const tryGetEstimate = (baseType, scenarios) => {
            for (const scenario of scenarios) {
                // Skapa korrekt referensgrupp FÖR DETTA SCENARIO
                let referenceGroup;
                if (baseType === '100hz') {
                    // Behöver pickuper med BÅDE 100Hz och 10Hz värden för att skapa ett förhållande
                    referenceGroup = pickupData.filter(p => !p.is_estimated_10hz && p.cu_dynamic_100hz > 0 && p.cu_dynamic_10hz > 0);
                } else { // baseType === 'static'
                    // Behöver pickuper med BÅDE statiskt och 10Hz värden
                    referenceGroup = pickupData.filter(p => !p.is_estimated_10hz && p.cu_static > 0 && p.cu_dynamic_10hz > 0);
                }

                // Filtrera referensgruppen baserat på användarens val
                let matchingGroup = referenceGroup;
                if (scenario.props.every(p => !!userInput.value[p])) {
                    for (const prop of scenario.props) {
                        matchingGroup = matchingGroup.filter(p => p[prop] === userInput.value[prop]);
                    }

                    if (matchingGroup.length > 0) {
                        let ratios;
                        if (baseType === '100hz') {
                             ratios = matchingGroup.map(p => p.cu_dynamic_10hz / p.cu_dynamic_100hz);
                        } else {
                             ratios = matchingGroup.map(p => p.cu_dynamic_10hz / p.cu_static);
                        }
                        
                        if (ratios.length > 0) {
                            const baseValue = baseType === '100hz' ? cu_dynamic_100hz : cu_static;
                            return { value: baseValue * calculateMedian(ratios), key: scenario.key };
                        }
                    }
                }
            }
            return null; // Inget resultat hittades för denna bas-typ
        };

        // KÖRHÅLLNING: Prioritera 100Hz
        if (cu_dynamic_100hz > 0) {
            const scenarios100Hz = [
                { key: 'A1', props: ['type', 'cantilever_class', 'stylus_family'] },
                { key: 'A2', props: ['type', 'cantilever_class'] },
                { key: 'A3', props: ['type'] },
            ];
            const result = tryGetEstimate('100hz', scenarios100Hz);
            if (result) return result;
        }

        // FALLBACK: Om 100Hz misslyckades eller saknas, försök med statisk
        if (cu_static > 0) {
            const scenariosStatic = [
                { key: 'B1', props: ['type', 'cantilever_class', 'stylus_family'] },
                { key: 'B2', props: ['type', 'cantilever_class'] },
                { key: 'B3', props: ['type'] },
            ];
            const result = tryGetEstimate('static', scenariosStatic);
            if (result) return result;
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
        return { confidence: 0, sampleSize: 0, description: 'Please provide more data...' };
    });
    
    const availableCantileverClasses = computed(() => classifications.cantilever_class.categories.map(c => c.id));
    const availableStylusFamilies = computed(() => classifications.stylus_family.categories.map(c => c.id));
    
    function resetInput() {
        userInput.value = { cu_dynamic_100hz: null, cu_static: null, type: null, cantilever_class: null, stylus_family: null };
    }

    return { userInput, estimatedCompliance, confidence, activeScenarioKey, availableCantileverClasses, availableStylusFamilies, resetInput };
});
