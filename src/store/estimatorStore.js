// src/store/estimatorStore.js

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useEstimatorStore = defineStore('estimator', () => {
  // --- STATE ---
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
  const isLoading = ref(true);
  const error = ref(null);

  // --- ACTIONS ---

  async function initializeStore() {
    isLoading.value = true;
    error.value = null;
    try {
      const [rulesResponse, pickupsResponse] = await Promise.all([
        fetch('/estimation_rules.json'),
        fetch('/data/pickup_data.json')
      ]);

      if (!rulesResponse.ok) throw new Error(`Failed to load estimation_rules.json: ${rulesResponse.statusText}`);
      if (!pickupsResponse.ok) throw new Error(`Failed to load pickup_data.json: ${pickupsResponse.statusText}`);
      
      estimationRules.value = await rulesResponse.json();
      allPickups.value = await pickupsResponse.json();
      
      performSanityCheck();

    } catch (e) {
      console.error("Error initializing estimator store:", e);
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  }

  function performSanityCheck() {
    if (!estimationRules.value || allPickups.value.length === 0) return;
    const rulesDataCount = estimationRules.value.source_data_count;
    const liveDataCount = allPickups.value.length;
    const difference = Math.abs(rulesDataCount - liveDataCount);
    if (difference > 10 || (difference / liveDataCount) > 0.05) {
      console.warn(
        `[DATA MISMATCH] The estimation rules may be outdated. ` +
        `Rules were generated with ${rulesDataCount} pickups, but the live database has ${liveDataCount}. ` +
        `Consider running 'scripts/generate_rules.py' to update the rules.`
      );
    } else {
      console.log("[DATA SYNC OK] Estimation rules appear to be up-to-date.");
    }
  }

  function resetInput() {
    userInput.value = {
      cu_dynamic_100hz: null,
      cu_static: null,
      type: null,
      cantilever_class: null,
      stylus_family: null,
      weight_g: null,
    };
  }

  // --- COMPUTED PROPERTIES ---

  const availableCantileverClasses = computed(() => ["Standard", "Aluminum", "Exotic/High-Performance"]);
  const availableStylusFamilies = computed(() => ["Conical", "Elliptical", "Nude Elliptical", "Line-Contact", "Advanced Line-Contact"]);

  const result = computed(() => {
    const defaultResult = {
      compliance: null,
      confidence: 0,
      sampleSize: 0,
      description: "Enter data to begin.",
      // **Nytt objekt för graf-data**
      chartData: {
        dataPoints: [],
        medianRatio: 1
      }
    };

    if (isLoading.value || error.value || !estimationRules.value) {
      return { ...defaultResult, description: error.value || "Loading rules..." };
    }

    const { cu_dynamic_100hz, cu_static, type } = userInput.value;

    if (!type || (!cu_dynamic_100hz && !cu_static)) {
      return defaultResult;
    }

    const baseValue = cu_dynamic_100hz || cu_static;
    const usedMethod = cu_dynamic_100hz ? 'dynamic_100hz' : 'static';

    let matchedRule = null;
    
    if (estimationRules.value.segmented_rules && userInput.value.type && userInput.value.cantilever_class) {
      matchedRule = estimationRules.value.segmented_rules.find(rule => 
        rule.conditions.type === userInput.value.type &&
        rule.conditions.cantilever_class === userInput.value.cantilever_class
      );
    }
    
    const appliedRule = matchedRule || estimationRules.value.global_fallback;
    const ruleType = matchedRule ? `specific rule for ${matchedRule.conditions.type} / ${matchedRule.conditions.cantilever_class}` : 'a general fallback rule';

    const estimatedCompliance = baseValue * appliedRule.median_ratio;

    let confidenceValue = matchedRule ? Math.round(60 + Math.min(40, appliedRule.sample_size * 4)) : 50;
    if (usedMethod === 'static') {
      confidenceValue = Math.round(confidenceValue * 0.8);
    }

    let description = `Estimate based on ${ruleType}`;
    description += (usedMethod === 'static') ? ` using your Static Compliance value. This method is less precise.` : ` using your Dynamic @ 100Hz value.`;

    // **Ny logik för att förbereda graf-data**
    let chartDataPoints = [];
    if (matchedRule) {
      chartDataPoints = allPickups.value
        .filter(p => 
          p.type === matchedRule.conditions.type &&
          p.cantilever_class === matchedRule.conditions.cantilever_class &&
          p.cu_dynamic_100hz && p.cu_dynamic_10hz // Se till att båda värdena finns för att kunna plottas
        )
        .map(p => ({
          x: p.cu_dynamic_100hz,
          y: p.cu_dynamic_10hz,
          model: p.model // Skicka med modellnamn för tooltips
        }));
    }

    return {
      compliance: estimatedCompliance,
      confidence: confidenceValue,
      sampleSize: appliedRule.sample_size,
      description: description,
      // **Fyll i det nya objektet**
      chartData: {
        dataPoints: chartDataPoints,
        medianRatio: appliedRule.median_ratio,
      }
    };
  });

  initializeStore();

  return {
    userInput,
    isLoading,
    error,
    result,
    availableCantileverClasses,
    availableStylusFamilies,
    resetInput
  };
});
