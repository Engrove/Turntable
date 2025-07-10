import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import pickupData from '@/data/pickup_data.json';
import classifications from '@/data/classifications.json';

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

  const filteredData = computed(() => {
    let data = pickupData.filter(p => p.cu_dynamic_10hz);

    if (userInput.value.type) {
      data = data.filter(p => p.type === userInput.value.type);
    }
    if (userInput.value.cantilever_class) {
      data = data.filter(p => p.cantilever_class === userInput.value.cantilever_class);
    }
    if (userInput.value.stylus_family) {
      data = data.filter(p => p.stylus_family === userInput.value.stylus_family);
    }
    return data;
  });

  const estimatedCompliance = computed(() => {
    const data = filteredData.value;
    if (data.length === 0 || !userInput.value.type) return null;

    let totalRatio = 0;
    let count = 0;
    let referenceValue = null;

    // --- KORRIGERAD LOGIK NEDAN ---
    // Prioritera ALLTID 100Hz-värdet om det finns, eftersom det är mer exakt.
    if (userInput.value.cu_dynamic_100hz) {
      referenceValue = userInput.value.cu_dynamic_100hz;
      data.forEach(p => {
        // Använd bara datapunkter som har både 100Hz och 10Hz värden för att beräkna ett förhållande.
        if (p.cu_dynamic_100hz && p.cu_dynamic_10hz) {
          totalRatio += p.cu_dynamic_10hz / p.cu_dynamic_100hz;
          count++;
        }
      });
    } 
    // Använd ENDAST det statiska värdet om 100Hz-värdet saknas.
    else if (userInput.value.cu_static) {
      referenceValue = userInput.value.cu_static;
      data.forEach(p => {
        // Använd bara datapunkter som har både statisk och 10Hz värden.
        if (p.cu_static && p.cu_dynamic_10hz) {
          totalRatio += p.cu_dynamic_10hz / p.cu_static;
          count++;
        }
      });
    }
    // --- SLUT PÅ KORRIGERAD LOGIK ---

    if (count === 0 || referenceValue === null) return null;

    const averageRatio = totalRatio / count;
    return referenceValue * averageRatio;
  });

  const confidence = computed(() => {
    const maxScore = 100;
    let score = 0;
    const sampleSize = filteredData.value.length;

    if (!userInput.value.type || (!userInput.value.cu_static && !userInput.value.cu_dynamic_100hz)) {
      return {
        confidence: 0,
        sampleSize: 0,
        description: "Please provide more data, including 'Pickup Type' and at least one compliance value, to get an estimate."
      };
    }

    if (userInput.value.type) score += 30;
    if (userInput.value.cu_static) score += 20;
    if (userInput.value.cu_dynamic_100hz) score += 40;
    if (userInput.value.cantilever_class) score += 15;
    if (userInput.value.stylus_family) score += 15;

    // Justera poängen baserat på hur många liknande pickuper som hittades.
    if (sampleSize > 10) {
      score *= 1.0;
    } else if (sampleSize > 5) {
      score *= 0.9;
    } else if (sampleSize > 0) {
      score *= 0.75;
    } else {
      score = 0;
    }

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
    filteredData,
    estimatedCompliance,
    confidence,
    resetInput
  };
});
