import { ref, computed } from 'vue'; // Korrigerat från 'pinia' till 'vue'
import { defineStore } from 'pinia';

export const useEstimatorStore = defineStore('estimator', () => {

    const userInput = ref({
        type: 'MM',
        cu_dynamic_100hz: null,
        cu_static: 10,
        cantilever_class: null,
        stylus_family: null,
    });

    const estimationRules = ref(null);
    const staticEstimationRules = ref(null);
    const availableCantileverClasses = ref([]);
    const availableStylusFamilies = ref([]);
    const allPickups = ref([]);
    const isLoading = ref(true);
    const error = ref(null);
    const debugLog = ref([]);

    const initialize = async () => {
        isLoading.value = true;
        error.value = null;
        debugLog.value = [];
        try {
            debugLog.value.push("Fetching estimation_rules.json...");
            const rulesResponse = await fetch('/data/estimation_rules.json');
            if (!rulesResponse.ok) throw new Error('Failed to fetch estimation rules.');
            estimationRules.value = await rulesResponse.json();
            debugLog.value.push("✓ Estimation rules fetched.");

            debugLog.value.push("Fetching static_estimation_rules.json...");
            const staticRulesResponse = await fetch('/data/static_estimation_rules.json');
            if (!staticRulesResponse.ok) throw new Error('Failed to fetch static estimation rules.');
            staticEstimationRules.value = await staticRulesResponse.json();
            debugLog.value.push("✓ Static estimation rules fetched.");

            debugLog.value.push("Fetching classifications.json...");
            const classificationsResponse = await fetch('/data/classifications.json');
            if (!classificationsResponse.ok) throw new Error('Failed to fetch classifications.');
            const classifications = await classificationsResponse.json();
            availableCantileverClasses.value = classifications.cantilever_class.categories.map(c => c.name);
            availableStylusFamilies.value = classifications.stylus_family.categories.map(c => c.name);
            debugLog.value.push("✓ Classifications fetched.");

            debugLog.value.push("Fetching pickup_data.json...");
            const pickupsResponse = await fetch('/data/pickup_data.json');
            if (!pickupsResponse.ok) throw new Error('Failed to fetch pickup data.');
            allPickups.value = await pickupsResponse.json();
            debugLog.value.push("✓ All pickups fetched.");

            debugLog.value.push("Initialization complete.");
        } catch (e) {
            console.error("Initialization error:", e);
            error.value = e.message;
            debugLog.value.push(`ERROR: ${e.message}`);
        } finally {
            isLoading.value = false;
        }
    };

    const result = ref({
        compliance_min: null,
        compliance_median: null,
        compliance_max: null,
        confidence: 0,
        sampleSize: 0,
        description: 'Please enter a value to begin.',
        chartConfig: null
    });

    const calculateEstimate = () => {
        const input = userInput.value;
        if (input.cu_dynamic_100hz) {
            estimateFrom100Hz();
        } else if (input.cu_static) {
            estimateFromStatic();
        } else {
            result.value = {
                compliance_min: null, compliance_median: null, compliance_max: null,
                confidence: 0, sampleSize: 0, description: 'Please enter a compliance value to begin.',
                chartConfig: null
            };
        }
    };

    const findBestRule = (ruleset, conditions) => {
        const matchingRules = ruleset.filter(rule => {
            return Object.keys(rule.conditions).every(key => {
                return conditions[key] && conditions[key] === rule.conditions[key];
            });
        });

        if (matchingRules.length > 0) {
            matchingRules.sort((a, b) => a.priority - b.priority);
            return matchingRules[0];
        }
        return null;
    };

    const estimateFrom100Hz = () => {
        if (!estimationRules.value) return;

        const conditions = {
            type: userInput.value.type,
            cantilever_class: userInput.value.cantilever_class,
            stylus_family: userInput.value.stylus_family,
        };

        const bestRule = findBestRule(estimationRules.value.segmented_rules, conditions) || estimationRules.value.global_fallback;
        
        const median = userInput.value.cu_dynamic_100hz * bestRule.median_ratio;
        const confidence = calculateConfidence(bestRule.priority, bestRule.sample_size, bestRule.r_squared);
        const description = `Using a median ratio of x${bestRule.median_ratio.toFixed(2)} based on the '${Object.values(bestRule.conditions).join(', ') || 'Global'}' rule.`;
        
        const rangeMultiplier = 1 / (1 + bestRule.r_squared + 0.1) * 0.5;
        const min = median * (1 - rangeMultiplier);
        const max = median * (1 + rangeMultiplier);
        
        const chartPoints = allPickups.value
          .filter(p => p.cu_dynamic_100hz && p.cu_dynamic_10hz)
          .map(p => ({ x: p.cu_dynamic_100hz, y: p.cu_dynamic_10hz, model: p.model }));

        result.value = {
            compliance_min: min,
            compliance_median: median,
            compliance_max: max,
            confidence: Math.round(confidence),
            sampleSize: bestRule.sample_size,
            description,
            chartConfig: {
                dataPoints: chartPoints,
                medianRatio: bestRule.median_ratio,
                labels: {
                    x: 'Compliance @ 100Hz',
                    y: 'Compliance @ 10Hz',
                    title: `10Hz vs. 100Hz Compliance (N=${allPickups.value.length})`,
                    lineLabel: `Median Ratio: x${bestRule.median_ratio.toFixed(2)}`
                }
            }
        };
    };

    const estimateFromStatic = () => {
        if (!staticEstimationRules.value) return;

        const conditions = {
            type: userInput.value.type,
            cantilever_class: userInput.value.cantilever_class,
            stylus_family: userInput.value.stylus_family,
        };

        const bestRule = findBestRule(staticEstimationRules.value.segmented_rules, conditions) || staticEstimationRules.value.global_fallback;
        
        const median = (userInput.value.cu_static * bestRule.k) + bestRule.m;
        const confidence = calculateConfidence(bestRule.priority, bestRule.sample_size, bestRule.r_squared);
        const description = `Using a regression model for '${Object.values(bestRule.conditions).join(', ') || 'Global'}'. Formula: (Static Compliance × ${bestRule.k.toFixed(3)}) + ${bestRule.m.toFixed(3)}.`;
        
        const rangeMultiplier = 1 / (1 + bestRule.r_squared + 0.1) * 0.5;
        const min = median * (1 - rangeMultiplier);
        const max = median * (1 + rangeMultiplier);

        const chartPoints = allPickups.value
          .filter(p => p.is_estimated_10hz === false && p.cu_static && p.cu_dynamic_10hz)
          .map(p => ({ x: p.cu_static, y: p.cu_dynamic_10hz, model: p.model }));
        
        result.value = {
            compliance_min: min,
            compliance_median: median,
            compliance_max: max,
            confidence: Math.round(confidence),
            sampleSize: bestRule.sample_size,
            description,
            chartConfig: {
                dataPoints: chartPoints,
                k: bestRule.k,
                m: bestRule.m,
                labels: {
                    x: 'Static Compliance',
                    y: 'Compliance @ 10Hz',
                    title: `10Hz vs. Static Compliance (N=${chartPoints.length})`,
                    lineLabel: `Trend Line (R²=${bestRule.r_squared.toFixed(2)})`
                }
            }
        };
    };

    const calculateConfidence = (priority, sampleSize, rSquared) => {
        const priorityScore = (4 - priority) * 10; // Prio 1=30, 2=20, 3=10
        const sampleScore = Math.min(20, (sampleSize / 15) * 20);
        const r2Score = rSquared * 25;
        const totalScore = Math.min(75, priorityScore + sampleScore + r2Score) / 75 * 100;
        return Math.max(10, totalScore); // Minimum confidence 10%
    };

    const resetInput = () => {
      userInput.value = {
        type: 'MM', cu_dynamic_100hz: null, cu_static: 10,
        cantilever_class: null, stylus_family: null,
      };
      calculateEstimate();
    };
    
    const getReportData = () => {
      return {
        type: 'estimator',
        userInput: userInput.value,
        result: result.value
      };
    };

    return { 
        userInput, estimationRules, staticEstimationRules, availableCantileverClasses, 
        availableStylusFamilies, allPickups, isLoading, error, debugLog, result, 
        initialize, calculateEstimate, resetInput,
        getReportData
    };
});
