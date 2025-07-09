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
     * Detta är nu den centrala beräkningsfunktionen.
     * Den loopar igenom scenarion i prioriteringsordning och returnerar det första som lyckas.
     * Den returnerar ett helt objekt med all nödvändig information.
     */
    const estimationResult = computed(() => {
        const { cu_dynamic_100hz, cu_static, type, cantilever_class, stylus_family } = userInput.value;

        // Om grundläggande krav inte är uppfyllda, avsluta tidigt.
        if (!type || (!cu_dynamic_100hz && !cu_static)) {
            return { value: null, key: null };
        }

        // Definiera scenarion i prioriteringsordning (mest specifik först)
        const scenarioHierarchy = [
            { key: 'A1', base: '100hz', props: ['type', 'cantilever_class', 'stylus_family'] },
            { key: 'B1', base: 'static', props: ['type', 'cantilever_class', 'stylus_family'] },
            { key: 'A2', base: '100hz', props: ['type', 'cantilever_class'] },
            { key: 'B2', base: 'static', props: ['type', 'cantilever_class'] },
            { key: 'A3', base: '100hz', props: ['type'] },
            { key: 'B3', base: 'static', props: ['type'] },
        ];

        for (const scenario of scenarioHierarchy) {
            // Kontrollera om scenariot är relevant baserat på indata
            const isBaseValueAvailable = (scenario.base === '100hz' && cu_dynamic_100hz > 0) || (scenario.base === 'static' && cu_static > 0);
            const hasAllProps = scenario.props.every(p => !!userInput.value[p]);
            
            if (isBaseValueAvailable && hasAllProps) {
                // Filtrera fram den matchande gruppen
                let matchingGroup = trainingData;
                for (const prop of scenario.props) {
                    matchingGroup = matchingGroup.filter(p => p[prop] === userInput.value[prop]);
                }

                // Försök utföra beräkningen
                let ratios = [];
                if (scenario.base === '100hz') {
                    ratios = matchingGroup
                        .filter(p => p.cu_dynamic_100hz > 0)
                        .map(p => p.cu_dynamic_10hz / p.cu_dynamic_100hz);
                } else { // scenario.base === 'static'
                    ratios = matchingGroup
                        .filter(p => p.cu_static > 0)
                        .map(p => p.cu_dynamic_10hz / p.cu_static);
                }
                
                // Om vi kunde beräkna ett förhållande, har vi ett resultat!
                if (ratios.length > 0) {
                    const baseValue = scenario.base === '100hz' ? cu_dynamic_100hz : cu_static;
                    const calculatedValue = baseValue * calculateMedian(ratios);
                    // Returnera det första lyckade resultatet.
                    return { value: calculatedValue, key: scenario.key };
                }
            }
        }
        
        // Om loopen slutförs utan att hitta ett resultat
        return { value: null, key: null };
    });
    
    // De andra getters blir nu enkla avläsare från det centrala resultatobjektet
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
