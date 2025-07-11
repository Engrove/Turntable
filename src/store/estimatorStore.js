// src/store/estimatorStore.js

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useEstimatorStore = defineStore('estimator', () => {
  // --- STATE ---
  const userInput = ref({
    cu_dynamic_100hz: null, cu_static: null, type: null,
    cantilever_class: null, stylus_family: null, weight_g: null,
  });

  const estimationRules = ref(null);
  const allPickups = ref([]);
  const databaseLastModified = ref(null); // <-- NY VARIABEL FÖR DATUM
  const isLoading = ref(true);
  const error = ref(null);
  const debugLog = ref([]);

  // --- ACTIONS ---

  async function initializeStore() {
    // ... (samma start på funktionen)
    debugLog.value.push('1. Initializing store...');
    isLoading.value = true;
    error.value = null;
    try {
      debugLog.value.push('2. Fetching estimation_rules.json...');
      const rulesResponse = await fetch('/data/estimation_rules.json');
      debugLog.value.push(`3. Rules fetch status: ${rulesResponse.status} ${rulesResponse.statusText}`);
      if (!rulesResponse.ok) throw new Error(`Failed to load estimation_rules.json`);
      
      debugLog.value.push('4. Parsing rules JSON...');
      estimationRules.value = await rulesResponse.json();
      debugLog.value.push(`5. Rules parsed. Type: ${typeof estimationRules.value}.`);

      debugLog.value.push('6. Fetching pickup_data.json...');
      const pickupsResponse = await fetch('/data/pickup_data.json');
      debugLog.value.push(`7. Pickups fetch status: ${pickupsResponse.status} ${pickupsResponse.statusText}`);
      if (!pickupsResponse.ok) throw new Error(`Failed to load pickup_data.json`);

      // --- NY LOGIK FÖR DATUM ---
      const lastModifiedHeader = pickupsResponse.headers.get('Last-Modified');
      if (lastModifiedHeader) {
        databaseLastModified.value = lastModifiedHeader;
        debugLog.value.push(`7b. Found Last-Modified header: ${lastModifiedHeader}`);
      }
      // --- SLUT PÅ NY LOGIK ---

      debugLog.value.push('8. Parsing pickups JSON...');
      allPickups.value = await pickupsResponse.json();
      debugLog.value.push(`9. Pickups parsed. Loaded ${allPickups.value.length} items.`);
      
      debugLog.value.push('10. Performing sanity check...');
      performSanityCheck();

    } catch (e) {
      debugLog.value.push(`---!! ERROR CAUGHT !!---`);
      debugLog.value.push(e.message);
      console.error("Error initializing estimator store:", e);
      error.value = e.message;
    } finally {
      isLoading.value = false;
      debugLog.value.push('11. Initialization process finished.');
    }
  }

  // ... (resten av storen är oförändrad)
  function performSanityCheck() {
    if (!estimationRules.value || allPickups.value.length === 0) {
      debugLog.value.push('Sanity check skipped: data missing.');
      return;
    };
    const rulesDataCount = estimationRules.value.source_data_count;
    const liveDataCount = allPickups.value.length;
    debugLog.value.push(`Sanity Check: Rules count=${rulesDataCount}, Live count=${liveDataCount}`);
    if (Math.abs(rulesDataCount - liveDataCount) > 10) {
      console.warn(`[DATA MISMATCH] Rules count: ${rulesDataCount}, Live count: ${liveDataCount}`);
    }
  }

  function resetInput() {
    userInput.value = {
      cu_dynamic_100hz: null, cu_static: null, type: null,
      cantilever_class: null, stylus_family: null, weight_g: null,
    };
  }

  const availableCantileverClasses = computed(() => ["Standard", "Aluminum", "Exotic/High-Performance"]);
  const availableStylusFamilies = computed(() => ["Conical", "Elliptical", "Nude Elliptical", "Line-Contact", "Advanced Line-Contact"]);

  const result = computed(() => {
    const defaultResult = {
      compliance: null, confidence: 0, sampleSize: 0,
      description: "Enter data to begin.",
      chartData: { dataPoints: [], medianRatio: 1 }
    };
    if (isLoading.value || error.value || !estimationRules.value || !allPickups.value.length) return defaultResult;
    const { cu_dynamic_100hz, cu_static, type } = userInput.value;
    if (!type || (!cu_dynamic_100hz && !cu_static)) return defaultResult;
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
    if (!appliedRule) return defaultResult;
    const ruleType = matchedRule ? `specific rule for ${matchedRule.conditions.type} / ${matchedRule.conditions.cantilever_class}` : 'a general fallback rule';
    const estimatedCompliance = baseValue * appliedRule.median_ratio;
    let confidenceValue = matchedRule ? Math.round(60 + Math.min(40, appliedRule.sample_size * 4)) : 50;
    if (usedMethod === 'static') confidenceValue = Math.round(confidenceValue * 0.8);
    let description = `Estimate based on ${ruleType}`;
    description += (usedMethod === 'static') ? ` using your Static Compliance value. This method is less precise.` : ` using your Dynamic @ 100Hz value.`;
    let chartDataPoints = [];
    if (matchedRule) {
      chartDataPoints = allPickups.value
        .filter(p => 
          p.type === matchedRule.conditions.type &&
          p.cantilever_class === matchedRule.conditions.cantilever_class &&
          p.cu_dynamic_100hz && p.cu_dynamic_10hz
        )
        .map(p => ({ x: p.cu_dynamic_100hz, y: p.cu_dynamic_10hz, model: p.model }));
    }
    return {
      compliance: estimatedCompliance, confidence: confidenceValue, sampleSize: appliedRule.sample_size,
      description: description,
      chartData: { dataPoints: chartDataPoints, medianRatio: appliedRule.median_ratio }
    };
  });

  initializeStore();

  return {
    userInput, isLoading, error, result,
    allPickups, estimationRules, debugLog, databaseLastModified, // Exportera nya datum-variabeln
    availableCantileverClasses, availableStylusFamilies,
    resetInput
  };
});
