// src/store/estimatorStore.js

import { ref, computed, watch } from 'vue';
import { defineStore } from 'pinia';

export const useEstimatorStore = defineStore('estimator', () => {
  // --- STATE ---

  // Användarens input från formuläret
  const userInput = ref({
    cu_dynamic_100hz: null,
    cu_static: null,
    type: null,
    cantilever_class: null,
    stylus_family: null,
    weight_g: null, // Nytt fält enligt masterplanen
  });

  // Data som laddas från externa filer
  const estimationRules = ref(null);
  const allPickups = ref([]); // För säkerhetskoll och framtida visualiseringar
  const isLoading = ref(true);
  const error = ref(null);

  // --- ACTIONS ---

  /**
   * Hämtar och initialiserar all nödvändig data för storen.
   * Denna funktion anropas automatiskt när storen skapas.
   */
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
      
      // Säkerhetskontroll enligt masterplanen
      performSanityCheck();

    } catch (e) {
      console.error("Error initializing estimator store:", e);
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Jämför antalet pickuper i databasen med antalet som användes för att generera reglerna.
   * Loggar en varning om de skiljer sig markant.
   */
  function performSanityCheck() {
    if (!estimationRules.value || allPickups.value.length === 0) return;

    const rulesDataCount = estimationRules.value.source_data_count;
    const liveDataCount = allPickups.value.length;
    const difference = Math.abs(rulesDataCount - liveDataCount);

    // Tröskelvärde, t.ex. 10 pickuper eller 5% skillnad
    if (difference > 10 || (difference / liveDataCount) > 0.05) {
      console.warn(
        `[DATA MISMATCH] The estimation rules may be outdated. \n` +
        `Rules were generated with ${rulesDataCount} pickups, but the live database has ${liveDataCount}. \n` +
        `Consider running 'scripts/generate_rules.py' to update the rules.`
      );
    } else {
      console.log("[DATA SYNC OK] Estimation rules appear to be up-to-date.");
    }
  }

  /**
   * Återställer användarens input till dess ursprungliga värden.
   */
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

  // Dynamiskt beräknar tillgängliga klasser från classifications.json (simulerat här för enkelhet)
  // I en större app skulle detta kunna hämtas från en separat fil.
  const availableCantileverClasses = computed(() => {
    return ["Standard", "Aluminum", "Exotic/High-Performance"];
  });

  const availableStylusFamilies = computed(() => {
    return ["Conical", "Elliptical", "Nude Elliptical", "Line-Contact", "Advanced Line-Contact"];
  });

  /**
   * Huvudberäkningen som reaktivt producerar det slutgiltiga resultatet
   * baserat på userInput och de laddade reglerna.
   */
  const result = computed(() => {
    const defaultResult = { compliance: null, confidence: 0, sampleSize: 0, description: "Enter data to begin." };

    if (isLoading.value || error.value || !estimationRules.value) {
      return { ...defaultResult, description: error.value || "Loading rules..." };
    }

    const { cu_dynamic_100hz, cu_static, type } = userInput.value;

    // Grundläggande validering: typ och minst ett compliance-värde krävs.
    if (!type || (!cu_dynamic_100hz && !cu_static)) {
      return defaultResult;
    }

    const baseValue = cu_dynamic_100hz || cu_static;
    const usedMethod = cu_dynamic_100hz ? 'dynamic_100hz' : 'static';

    let matchedRule = null;
    let ruleType = 'fallback'; // Anta fallback som standard

    // 1. Försök hitta en specifik regel
    if (estimationRules.value.segmented_rules) {
      matchedRule = estimationRules.value.segmented_rules.find(rule => 
        rule.conditions.type === userInput.value.type &&
        rule.conditions.cantilever_class === userInput.value.cantilever_class
      );
    }
    
    // 2. Om en specifik regel hittas, använd den. Annars, använd global fallback.
    let appliedRule;
    if (matchedRule) {
      appliedRule = matchedRule;
      ruleType = `specific rule for ${matchedRule.conditions.type} / ${matchedRule.conditions.cantilever_class}`;
    } else {
      appliedRule = estimationRules.value.global_fallback;
      ruleType = 'a general fallback rule';
    }
    
    // Beräkna compliance
    const estimatedCompliance = baseValue * appliedRule.median_ratio;

    // Beräkna konfidens
    let confidenceValue = 0;
    if (matchedRule) {
      // Högre konfidens för specifik regel, skalar med sample size.
      // Bas 60%, +4% per sample, maxar vid 100%.
      confidenceValue = Math.round(60 + Math.min(40, appliedRule.sample_size * 4));
    } else {
      // Lägre, fast konfidens för fallback-regel.
      confidenceValue = 50;
    }

    // Straffa konfidensen om vi använder den mindre pålitliga statiska compliance-metoden.
    if (usedMethod === 'static') {
      confidenceValue = Math.round(confidenceValue * 0.8); // 20% straff
    }

    // Skapa en tydlig beskrivning
    let description = `Estimate based on ${ruleType}`;
    if(usedMethod === 'static') {
      description += ` using your Static Compliance value. This method is less precise.`
    } else {
      description += ` using your Dynamic @ 100Hz value.`
    }

    return {
      compliance: estimatedCompliance,
      confidence: confidenceValue,
      sampleSize: appliedRule.sample_size,
      description: description,
    };
  });

  // Anropa initialiseringen när storen skapas
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
