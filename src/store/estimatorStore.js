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

    // Hjälpfunktion för att beräkna percentiler
    const getPercentile = (data, percentile) => {
        if (!data || data.length === 0) return null;
        data.sort((a, b) => a - b);
        const index = (percentile / 100) * (data.length - 1);
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index - lower;
        if (upper === lower) return data[lower];
        return data[lower] * (1 - weight) + data[upper] * weight;
    };

    const initialize = async () => {
        isLoading.value = true;
        error.value = null;
        debugLog.value = [];
        try {
            debugLog.value.push("Startar initialisering...");

            const [rulesRes, pickupsRes] = await Promise.all([
                fetch('/data/estimation_rules.json').catch(e => { throw new Error(`Regler: ${e.message}`); }),
                fetch('/data/pickup_data.json').catch(e => { throw new Error(`Pickups: ${e.message}`); })
            ]);

            debugLog.value.push("Fetch-anrop slutförda.");

            if (!rulesRes.ok) throw new Error(`Kunde inte ladda regler (${rulesRes.status})`);
            if (!pickupsRes.ok) throw new Error(`Kunde inte ladda pickup-data (${pickupsRes.status})`);

            estimationRules.value = await rulesRes.json();
            debugLog.value.push("Regler laddade.");
            allPickups.value = await pickupsRes.json();
            debugLog.value.push("Pickup-data laddad.");

        } catch (e) {
            console.error("Fel vid initiering av estimator store:", e);
            error.value = e.message;
        } finally {
            isLoading.value = false;
            debugLog.value.push("Initialisering klar.");
        }
    };

    const resetInput = () => {
        userInput.value = {
            cu_dynamic_100hz: null,
            cu_static: null,
            type: null,
            cantilever_class: null,
            stylus_family: null,
            weight_g: null,
        };
    };

    const result = computed(() => {
        const { cu_dynamic_100hz, cu_static, type, cantilever_class, stylus_family } = userInput.value;
        const baseValue = cu_dynamic_100hz || (cu_static ? cu_static * 0.5 : null);
        const usingStatic = !cu_dynamic_100hz && cu_static;

        if (!baseValue || !type) {
            return {
                compliance_min: null, compliance_median: null, compliance_max: null, confidence: 0,
                description: 'Please provide a compliance value and a pickup type to begin.',
                sampleSize: 0, chartConfig: null
            };
        }

        if (usingStatic) {
            const staticResult = baseValue * 0.5; // Regel för statisk compliance
            return {
                compliance_min: staticResult, compliance_median: staticResult, compliance_max: staticResult,
                confidence: 50,
                description: 'Using static compliance fallback: Estimated 10Hz value is 50% of the static value. This is a general rule of thumb.',
                sampleSize: 0, chartConfig: null
            };
        }

        const potentialRules = estimationRules.value.segmented_rules.filter(rule => {
            return Object.entries(rule.conditions).every(([key, value]) => {
                const userValue = userInput.value[key];
                return userValue === value || !userValue;
            });
        });

        const matchedRule = potentialRules.sort((a, b) => b.priority - a.priority)[0] || estimationRules.value.global_fallback;
        
        const ruleDataSource = allPickups.value.filter(p => {
            if (!p.cu_dynamic_100hz || !p.cu_dynamic_10hz) return false;
            if (matchedRule.conditions === estimationRules.value.global_fallback.conditions) return true;
            return Object.entries(matchedRule.conditions).every(([key, value]) => p[key] === value);
        });

        const ratios = ruleDataSource.map(p => p.cu_dynamic_10hz / p.cu_dynamic_100hz);

        // NY BERÄKNING FÖR MIN/MEDIAN/MAX
        const medianRatio = getPercentile(ratios, 50) || matchedRule.median_ratio;
        const minRatio = getPercentile(ratios, 25) || medianRatio * 0.9;
        const maxRatio = getPercentile(ratios, 75) || medianRatio * 1.1;

        const compliance_median = baseValue * medianRatio;
        const compliance_min = baseValue * minRatio;
        const compliance_max = baseValue * maxRatio;

        const confidence = Math.round(matchedRule.priority * 10 + Math.min(60, matchedRule.sample_size * 2));
        const ruleDescription = `Using rule for: ${Object.values(matchedRule.conditions).join(', ') || 'Global Fallback'}.`;

        const chartConfig = {
            dataPoints: ruleDataSource.map(p => ({
                x: p.cu_dynamic_100hz, y: p.cu_dynamic_10hz, model: p.model
            })).slice(0, 100), // Begränsa för prestanda
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
            confidence, description: ruleDescription,
            sampleSize: matchedRule.sample_size, chartConfig
        };
    });

    const availableCantileverClasses = computed(() => {
        if (!allPickups.value) return [];
        return [...new Set(allPickups.value.map(p => p.cantilever_class).filter(Boolean))].sort();
    });

    const availableStylusFamilies = computed(() => {
        if (!allPickups.value) return [];
        return [...new Set(allPickups.value.map(p => p.stylus_family).filter(Boolean))].sort();
    });

    initialize();

    return {
        allPickups, estimationRules, isLoading, error, debugLog, userInput,
        resetInput, result, availableCantileverClasses, availableStylusFamilies
    };
});
