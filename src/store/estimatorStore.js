// src/store/estimatorStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useEstimatorStore = defineStore('estimator', () => {
    const allPickups = ref([]);
    const estimationRules = ref(null);
    const isLoading = ref(true);
    const error = ref(null);
    const debugLog = ref([]);

    const userInput = ref({
        cu_dynamic_100hz: null,
        cu_static: null,
        type: null,
        cantilever_class: null,
        stylus_family: null,
        weight_g: null,
    });

    const getPercentile = (data, percentile) => {
        if (!data || data.length === 0) return null;
        const sortedData = [...data].sort((a, b) => a - b);
        const index = (percentile / 100) * (sortedData.length - 1);
        if (index < 0) return sortedData[0];
        if (index >= sortedData.length - 1) return sortedData[sortedData.length - 1];
        
        const lower = Math.floor(index);
        const upper = lower + 1;
        const weight = index - lower;
        
        return sortedData[lower] * (1 - weight) + sortedData[upper] * weight;
    };

    const initialize = async () => {
        isLoading.value = true;
        error.value = null;
        debugLog.value = [];
        try {
            const [rulesRes, pickupsRes] = await Promise.all([
                fetch('/data/estimation_rules.json'),
                fetch('/data/pickup_data.json')
            ]);
            if (!rulesRes.ok) throw new Error(`Could not load rules (${rulesRes.status})`);
            if (!pickupsRes.ok) throw new Error(`Could not load pickup data (${pickupsRes.status})`);
            estimationRules.value = await rulesRes.json();
            allPickups.value = await pickupsRes.json();
        } catch (e) {
            console.error("Error initializing estimator store:", e);
            error.value = e.message;
        } finally {
            isLoading.value = false;
        }
    };

    const resetInput = () => {
        userInput.value = {
            cu_dynamic_100hz: null, cu_static: null, type: null,
            cantilever_class: null, stylus_family: null, weight_g: null,
        };
    };

    const result = computed(() => {
        const { cu_dynamic_100hz, cu_static, type, cantilever_class, stylus_family } = userInput.value;
        const usingStatic = !cu_dynamic_100hz && cu_static;
        const baseValue = cu_dynamic_100hz || (usingStatic ? cu_static : null);

        if (!baseValue || !type) {
            return {
                compliance_min: null, compliance_median: null, compliance_max: null, confidence: 0,
                description: 'Please provide a compliance value and a pickup type to begin.',
                sampleSize: 0, chartConfig: null
            };
        }

        if (usingStatic) {
            const staticResult = baseValue * 0.5;
            return {
                compliance_min: staticResult, compliance_median: staticResult, compliance_max: staticResult,
                confidence: 50,
                description: 'Using static compliance fallback: Estimated 10Hz value is 50% of the static value. This is a general rule of thumb.',
                sampleSize: 0, chartConfig: null
            };
        }

        // --- Korrekt Hierarkisk Regelmatchning ---
        let matchedRule = null;
        let description = "";

        // Prio 1: Matcha Type, Cantilever, Stylus
        if (type && cantilever_class && stylus_family) {
            matchedRule = estimationRules.value.segmented_rules.find(r => 
                r.conditions.type === type &&
                r.conditions.cantilever_class === cantilever_class &&
                r.conditions.stylus_family === stylus_family
            );
            if(matchedRule) description = "Using a highly specific rule (Type, Cantilever, Stylus).";
        }

        // Prio 2: Matcha Type, Cantilever
        if (!matchedRule && type && cantilever_class) {
            matchedRule = estimationRules.value.segmented_rules.find(r => 
                r.conditions.type === type &&
                r.conditions.cantilever_class === cantilever_class &&
                Object.keys(r.conditions).length === 2
            );
            if(matchedRule) description = "Using a specific rule (Type, Cantilever).";
        }
        
        // Prio 3: Matcha Type
        if (!matchedRule && type) {
            matchedRule = estimationRules.value.segmented_rules.find(r => 
                r.conditions.type === type &&
                Object.keys(r.conditions).length === 1
            );
            if(matchedRule) description = "Using a general rule (Type only).";
        }

        // Prio 4: Global Fallback
        if (!matchedRule) {
            matchedRule = estimationRules.value.global_fallback;
            description = "Using Global Fallback rule (no specific match found).";
        }

        const ruleDataSource = allPickups.value.filter(p => {
            if (!p.cu_dynamic_100hz || !p.cu_dynamic_10hz) return false;
            if (!matchedRule.conditions || Object.keys(matchedRule.conditions).length === 0) return true;
            return Object.entries(matchedRule.conditions).every(([key, value]) => p[key] === value);
        });

        const ratios = ruleDataSource.length > 1 ? ruleDataSource.map(p => p.cu_dynamic_10hz / p.cu_dynamic_100hz) : [];
        
        const medianRatio = getPercentile(ratios, 50) ?? matchedRule.median_ratio;
        const minRatio = getPercentile(ratios, 25) ?? medianRatio * 0.9;
        const maxRatio = getPercentile(ratios, 75) ?? medianRatio * 1.1;

        const compliance_median = baseValue * medianRatio;
        const compliance_min = baseValue * minRatio;
        const compliance_max = baseValue * maxRatio;
        
        const confidence = Math.round(matchedRule.priority * 10 + Math.min(60, matchedRule.sample_size * 2));

        const chartConfig = {
            dataPoints: ruleDataSource.map(p => ({ x: p.cu_dynamic_100hz, y: p.cu_dynamic_10hz, model: p.model })).slice(0, 100),
            medianRatio: medianRatio,
            labels: {
                x: 'Compliance @ 100Hz', y: 'Compliance @ 10Hz',
                title: `Analysis based on: ${Object.values(matchedRule.conditions).join(' & ') || 'All Pickups'}`,
                lineLabel: `Median Ratio: ${medianRatio.toFixed(2)}x`
            },
            scales: { suggestedMax: { x: 20, y: 40 } }
        };

        return {
            compliance_min, compliance_median, compliance_max,
            confidence, description,
            sampleSize: matchedRule.sample_size, chartConfig
        };
    });

    const availableCantileverClasses = computed(() => [...new Set(allPickups.value.map(p => p.cantilever_class).filter(Boolean))].sort());
    const availableStylusFamilies = computed(() => [...new Set(allPickups.value.map(p => p.stylus_family).filter(Boolean))].sort());
    
    initialize();

    return {
        allPickups, estimationRules, isLoading, error, debugLog, userInput,
        resetInput, result, availableCantileverClasses, availableStylusFamilies, initialize
    };
});
