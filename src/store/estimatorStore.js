// src/store/estimatorStore.js

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useEstimatorStore = defineStore('estimator', () => {
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

  const estimationRules = ref(null);
  const allPickups = ref([]);

  const availableCantileverClasses = computed(() => {
    if (!allPickups.value.length) return [];
    return [...new Set(allPickups.value.map(p => p.cantilever_class).filter(Boolean))].sort();
  });

  const availableStylusFamilies = computed(() => {
    if (!allPickups.value.length) return [];
    return [...new Set(allPickups.value.map(p => p.stylus_family).filter(Boolean))].sort();
  });

  const result = computed(() => {
    if (!userInput.value.type || (!userInput.value.cu_dynamic_100hz && !userInput.value.cu_static)) {
      return { compliance: null, confidence: 0, description: 'Please provide Pickup Type and at least one compliance value.', sampleSize: 0, chartConfig: null };
    }
    if (!estimationRules.value) {
      return { compliance: null, confidence: 0, description: 'Estimation rules not loaded.', sampleSize: 0, chartConfig: null };
    }

    const findRule = () => {
      const u = userInput.value;
      const rules = estimationRules.value.segmented_rules;
      
      let match = rules.find(r => r.conditions.type === u.type && r.conditions.cantilever_class === u.cantilever_class && r.conditions.stylus_family === u.stylus_family);
      if (match) return { ...match, priority: 1, description: `Based on a high-precision rule (3 variables matched: type, cantilever, stylus).` };

      match = rules.find(r => r.conditions.type === u.type && r.conditions.cantilever_class === u.cantilever_class);
      if (match) return { ...match, priority: 2, description: `Based on a strong rule (2 variables matched: type, cantilever).` };
      
      match = rules.find(r => r.conditions.type === u.type);
      if (match) return { ...match, priority: 3, description: `Based on a general rule (1 variable matched: type).` };
      
      return { ...estimationRules.value.global_fallback, description: 'Based on the global fallback rule (all available data).' };
    };

    const matchedRule = findRule();
    let baseCompliance = userInput.value.cu_dynamic_100hz;
    let conversionRatio = matchedRule.median_ratio;
    let source = 'dynamic';

    if (!baseCompliance) {
      baseCompliance = userInput.value.cu_static;
      conversionRatio = 0.5;
      source = 'static';
      // Överskriv regelbeskrivningen när vi använder statisk compliance
      matchedRule.description = 'Based on the standard static-to-dynamic conversion rule (ratio ≈ 0.5).';
    }

    if (!baseCompliance) {
      return { compliance: null, confidence: 0, description: 'Input value is missing.', sampleSize: 0, chartConfig: null };
    }

    const estimatedCompliance = baseCompliance * conversionRatio;
    
    const calculateConfidence = () => {
        let score = 0;
        if (source === 'static') return 50; 
        if (matchedRule.priority === 1) score += 60;
        else if (matchedRule.priority === 2) score += 45;
        else if (matchedRule.priority === 3) score += 30;
        else score += 10;

        if (matchedRule.sample_size >= 20) score += 30;
        else if (matchedRule.sample_size >= 10) score += 20;
        else if (matchedRule.sample_size >= 5) score += 10;
        return Math.min(100, score);
    };

    const confidence = calculateConfidence();

    // Dynamisk funktion för att skapa grafkonfiguration
    const getChartConfig = (rule, sourceType) => {
        if (sourceType === 'dynamic') {
            // Filtrera för att endast visa data relevant för den matchade regeln (efter typ)
            const dataPoints = allPickups.value
                .filter(p => p.cu_dynamic_100hz && p.cu_dynamic_10hz && p.type === rule.conditions?.type)
                .map(p => ({ x: p.cu_dynamic_100hz, y: p.cu_dynamic_10hz, model: p.model }));
            
            return {
                dataPoints,
                medianRatio: rule.median_ratio,
                labels: {
                    x: 'Dynamic Compliance @ 100Hz',
                    y: 'Dynamic Compliance @ 10Hz',
                    title: `Underlying Data for '${rule.conditions?.type || 'Global'}' 100Hz Conversion Rule`,
                    lineLabel: `Median Ratio: ${rule.median_ratio.toFixed(2)}`
                },
                scales: {
                    suggestedMax: { x: 25, y: 45 }
                }
            };
        } else if (sourceType === 'static') {
            // Visa ALLA pickuper med statisk och 10Hz-data som referens
            const dataPoints = allPickups.value
                .filter(p => p.cu_static && p.cu_dynamic_10hz)
                .map(p => ({ x: p.cu_static, y: p.cu_dynamic_10hz, model: p.model }));
            
            return {
                dataPoints,
                medianRatio: 0.5,
                labels: {
                    x: 'Static Compliance (cu)',
                    y: 'Dynamic Compliance @ 10Hz (cu)',
                    title: 'Reference Data for Static to Dynamic Conversion',
                    lineLabel: 'General Conversion Ratio: 0.50'
                },
                scales: {
                    suggestedMax: { x: 60, y: 45 }
                }
            };
        }
        return null;
    };
    
    const chartConfig = getChartConfig(matchedRule, source);

    return {
      compliance: estimatedCompliance,
      confidence: confidence,
      description: matchedRule.description,
      sampleSize: matchedRule.sample_size,
      chartConfig: chartConfig,
    };
  });

  const initialize = async () => {
    debugLog.value.push("Store initialization started.");
    try {
      isLoading.value = true;
      error.value = null;

      const [rulesResponse, pickupsResponse] = await Promise.all([
        fetch('/data/estimation_rules.json'),
        fetch('/data/pickup_data.json')
      ]);

      if (!rulesResponse.ok) throw new Error(`Failed to fetch estimation_rules.json: ${rulesResponse.statusText}`);
      estimationRules.value = await rulesResponse.json();
      debugLog.value.push("Estimation rules loaded.");

      if (!pickupsResponse.ok) throw new Error(`Failed to fetch pickup_data.json: ${pickupsResponse.statusText}`);
      allPickups.value = await pickupsResponse.json();
      debugLog.value.push("Pickup database loaded.");
      
      debugLog.value.push("Initialization successful.");
    } catch (e) {
      error.value = e.message;
      debugLog.value.push(`Error during initialization: ${e.message}`);
    } finally {
      isLoading.value = false;
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

  initialize();

  return {
    isLoading, error, debugLog, userInput, estimationRules, allPickups,
    availableCantileverClasses, availableStylusFamilies, result, resetInput,
  };
});
