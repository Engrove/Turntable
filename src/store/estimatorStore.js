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
  const isLoading = ref(true);
  const error = ref(null);
  const debugLog = ref([]);

  // --- ACTIONS ---

  async function initializeStore() {
    debugLog.value.push('1. Initializing store...');
    isLoading.value = true;
    error.value = null;
    try {
      debugLog.value.push('2. Fetching estimation_rules.json from /data/estimation_rules.json...');
      const rulesResponse = await fetch('/data/estimation_rules.json');
      debugLog.value.push(`3. Rules fetch status: ${rulesResponse.status} ${rulesResponse.statusText}`);
      if (!rulesResponse.ok) throw new Error(`Failed to load estimation_rules.json`);
      
      const rulesData = await rulesResponse.json();
      // Pre-sortera reglerna en gång vid laddning
      rulesData.segmented_rules.sort((a, b) => a.priority - b.priority);
      estimationRules.value = rulesData;
      debugLog.value.push(`5. Rules parsed and sorted. Found ${estimationRules.value.segmented_rules.length} rules.`);

      debugLog.value.push('6. Fetching pickup_data.json...');
      const pickupsResponse = await fetch('/data/pickup_data.json');
      debugLog.value.push(`7. Pickups fetch status: ${pickupsResponse.status} ${pickupsResponse.statusText}`);
      if (!pickupsResponse.ok) throw new Error(`Failed to load pickup_data.json`);

      allPickups.value = await pickupsResponse.json();
      debugLog.value.push(`9. Pickups parsed. Loaded ${allPickups.value.length} items.`);
      
    } catch (e) {
      debugLog.value.push(`---!! ERROR CAUGHT !!---`);
      debugLog.value.push(e.message);
      error.value = e.message;
    } finally {
      isLoading.value = false;
      debugLog.value.push('11. Initialization process finished.');
    }
  }

  function resetInput() {
    userInput.value = {
      cu_dynamic_100hz: null, cu_static: null, type: null,
      cantilever_class: null, stylus_family: null, weight_g: null,
    };
  }

  // --- COMPUTED PROPERTIES ---
  const availableCantileverClasses = computed(() => ["Standard", "Aluminum", "Exotic/High-Performance"]);
  const availableStylusFamilies = computed(() => ["Conical", "Elliptical", "Nude Elliptical", "Line-Contact", "Advanced Line-Contact"]);

  const result = computed(() => {
    const defaultResult = {
      compliance: null, confidence: 0, sampleSize: 0,
      description: "Enter data to begin.",
      chartData: { dataPoints: [], medianRatio: 1 }
    };
    if (isLoading.value || error.value || !estimationRules.value) return defaultResult;
    
    const { cu_dynamic_100hz, cu_static, type } = userInput.value;
    if (!type || (!cu_dynamic_100hz && !cu_static)) return defaultResult;
    
    // --- NY HIERARKISK SÖKLOGIK ---
    let matchedRule = null;
    for (const rule of estimationRules.value.segmented_rules) {
      const conditions = rule.conditions;
      let isMatch = true;
      // Loopa igenom alla villkor i regeln
      for (const key in conditions) {
        if (userInput.value[key] !== conditions[key]) {
          isMatch = false;
          break; // Om ett villkor inte matchar, gå till nästa regel
        }
      }
      if (isMatch) {
        matchedRule = rule;
        break; // Hitta första (mest specifika) matchningen och sluta leta
      }
    }
    // --- SLUT PÅ HIERARKISK SÖKLOGIK ---

    const appliedRule = matchedRule || estimationRules.value.global_fallback;
    
    const baseValue = cu_dynamic_100hz || cu_static;
    const estimatedCompliance = baseValue * appliedRule.median_ratio;

    // Bygg en dynamisk beskrivning baserad på vilken regel som träffades
    let description;
    if (matchedRule) {
      const numConditions = Object.keys(matchedRule.conditions).length;
      const conditionsText = Object.entries(matchedRule.conditions).map(([key, value]) => `${key.replace('_', ' ')}: ${value}`).join(', ');
      description = `Based on a high-precision rule (${numConditions} variables matched: ${conditionsText}).`;
    } else {
      description = `No specific rule matched. Using a general fallback rule based on the entire dataset.`;
    }
    
    // Konfidensberäkning
    let confidenceValue = 0;
    if (matchedRule) {
        const priorityPenalty = (matchedRule.priority - 1) * 15; // Straff för mindre specifika regler
        const baseConfidence = 95 - priorityPenalty;
        confidenceValue = Math.round(baseConfidence * (1 - 1 / (1 + appliedRule.sample_size))); // Skalar med sample size
    } else {
        confidenceValue = 40; // Lägre fast konfidens för global fallback
    }
    if (userInput.value.cu_static && !userInput.value.cu_dynamic_100hz) {
        confidenceValue = Math.round(confidenceValue * 0.8); // 20% straff för statisk compliance
    }

    // Grafdata
    let chartDataPoints = [];
    if (matchedRule) {
      chartDataPoints = allPickups.value
        .filter(p => {
            let matchesAll = true;
            for(const key in matchedRule.conditions) {
                if(p[key] !== matchedRule.conditions[key]) {
                    matchesAll = false;
                    break;
                }
            }
            return matchesAll && p.cu_dynamic_100hz && p.cu_dynamic_10hz;
        })
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
    allPickups, estimationRules, debugLog,
    availableCantileverClasses, availableStylusFamilies,
    resetInput
  };
});
