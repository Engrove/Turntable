import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
// KORRIGERADE SÖKVÄGAR NEDAN
import pickupData from '../../data/pickup_data.json';
import classifications from '../../data/classifications.json';

export const useEstimatorStore = defineStore('estimator', () => {
  // --- STATE ---
  const userInput = ref({
    cu_dynamic_100hz: null,
    cu_static: null,
    type: null,
    cantilever_class: null,
    stylus_family: null,
  });

  // --- GETTERS ---
  const availableCantileverClasses = computed(() => classifications.cantilever_class.categories.map(c => c.name));
  const availableStylusFamilies = computed(() => classifications.stylus_family.categories.map(c => c.name));

  const getFilteredLearningSet = () => {
    const mode = userInput.value.cu_dynamic_100hz ? 'dynamic100' : (userInput.value.cu_static ? 'static' : null);
    if (!mode || !userInput.value.type) return { list: [], mode: null };

    let learningSet;
    if (mode === 'dynamic100') {
      learningSet = pickupData.filter(p => p.cu_dynamic_100hz && p.cu_dynamic_10hz);
    } else { // mode === 'static'
      learningSet = pickupData.filter(p => p.cu_static && p.cu_dynamic_10hz);
    }

    if (userInput.value.type) {
      learningSet = learningSet.filter(p => p.type === userInput.value.type);
    }
    if (userInput.value.cantilever_class) {
      learningSet = learningSet.filter(p => p.cantilever_class === userInput.value.cantilever_class);
    }
    if (userInput.value.stylus_family) {
      learningSet = learningSet.filter(p => p.stylus_family === userInput.value.stylus_family);
    }

    return { list: learningSet, mode };
  };

  const estimatedCompliance = computed(() => {
    const { list: filteredLearningSet, mode } = getFilteredLearningSet();
    
    if (filteredLearningSet.length === 0 || !mode) return null;

    const referenceValue = mode === 'dynamic100' ? userInput.value.cu_dynamic_100hz : userInput.value.cu_static;
    if (!referenceValue) return null;

    let totalRatio = 0;
    filteredLearningSet.forEach(p => {
      if (mode === 'dynamic100') {
        totalRatio += p.cu_dynamic_10hz / p.cu_dynamic_100hz;
      } else {
        totalRatio += p.cu_dynamic_10hz / p.cu_static;
      }
    });

    const averageRatio = totalRatio / filteredLearningSet.length;
    return referenceValue * averageRatio;
  });

  const confidence = computed(() => {
    const { list: filteredLearningSet } = getFilteredLearningSet();
    const sampleSize = filteredLearningSet.length;

    if (!userInput.value.type || (!userInput.value.cu_static && !userInput.value.cu_dynamic_100hz) || sampleSize === 0) {
      return {
        confidence: 0,
        sampleSize: 0,
        description: "Please provide more data, including 'Pickup Type' and at least one compliance value, to get an estimate."
      };
    }

    let score = 0;
    if (userInput.value.type) score += 30;
    if (userInput.value.cu_dynamic_100hz) score += 40;
    else if (userInput.value.cu_static) score += 20;
    
    if (userInput.value.cantilever_class) score += 15;
    if (userInput.value.stylus_family) score += 15;

    if (sampleSize > 10) score *= 1.0;
    else if (sampleSize > 5) score *= 0.9;
    else if (sampleSize > 0) score *= 0.75;
    
    return {
      confidence: Math.min(100, Math.round(score)),
      sampleSize: sampleSize,
      description: `Estimate based on a comparison with ${sampleSize} similar cartridge(s) in our database.`
    };
  });

  // --- ACTIONS ---
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
    availableCantileverClasses,
    availableStylusFamilies,
    estimatedCompliance,
    confidence,
    resetInput
  };
});
