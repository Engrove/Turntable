// src/store/alignmentStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Definierar standardiserade radier för inner- och ytterspår enligt IEC 60098:1987
const R1_IEC = 60.325; // Inner groove radius
const R2_IEC = 146.05;  // Outer groove radius

// Definierar nollpunkter för de vanligaste geometrierna
const ALIGNMENT_GEOMETRIES = {
  Baerwald: {
    name: "Löfgren A / Baerwald",
    description: "Calculated to minimize RMS distortion across the entire playing surface. A popular all-around choice.",
    nulls: {
      inner: 66.0,
      outer: 120.9
    }
  },
  LofgrenB: {
    name: "Löfgren B",
    description: "Calculated to minimize the absolute peak distortion, but with higher average distortion than Baerwald.",
    nulls: {
      inner: 70.3,
      outer: 116.6
    }
  },
  StevensonA: {
    name: "Stevenson A",
    description: "Optimized for the lowest distortion at the inner groove, where distortion is typically most audible.",
    nulls: {
      inner: 60.325,
      outer: 117.42
    }
  }
};

export const useAlignmentStore = defineStore('alignment', () => {
  // --- STATE ---
  const isLoading = ref(false);
  const error = ref(null);
  
  const userInput = ref({
    pivotToSpindle: 222.0,
    alignmentType: 'Baerwald',
  });

  const availableTonearms = ref([]);
  const selectedTonearmId = ref(null);

  // --- GETTERS ---

  const calculatedValues = computed(() => {
    try {
      const D = userInput.value.pivotToSpindle;
      if (!D || D <= 0) {
        return { error: "Pivot-to-Spindle distance must be positive." };
      }

      const geometry = ALIGNMENT_GEOMETRIES[userInput.value.alignmentType];
      if (!geometry) {
        return { error: "Invalid alignment type selected." };
      }
      
      const r1 = geometry.nulls.inner;
      const r2 = geometry.nulls.outer;

      // Beräkningar för överhäng och offsetvinkel baserat på P2S
      const overhang = (r1 * r2) / D;
      const termForAngle = (r1 + r2) / (overhang + 2*D);
      const offsetAngleRad = Math.asin(termForAngle);
      const offsetAngleDeg = offsetAngleRad * (180 / Math.PI);
      
      const effectiveLength = D + overhang;

      return {
        overhang: overhang,
        offsetAngle: offsetAngleDeg,
        effectiveLength: effectiveLength,
        nulls: {
          inner: r1,
          outer: r2,
        },
        geometryName: geometry.name,
        geometryDescription: geometry.description,
        error: null,
      };
    } catch (e) {
      console.error("Calculation error in alignmentStore:", e);
      return { error: "A calculation error occurred." };
    }
  });

  // NY GETTER: Beräknar data för spårningsfels-grafen
  const trackingErrorData = computed(() => {
    const calc = calculatedValues.value;
    if (calc.error) return { labels: [], datasets: [] };
    
    const D = userInput.value.pivotToSpindle;
    const Le = calc.effectiveLength;
    const beta = calc.offsetAngle * (Math.PI / 180); // Offset Angle in radians

    const points = [];
    for (let R = R1_IEC; R <= R2_IEC; R += 1) { // Beräkna för varje mm av spelytan
        const termForAlpha = R / (2 * Le) + (Le / (2 * R));
        if (Math.abs(termForAlpha) > 1) continue; // Undvik ogiltiga Math.acos-värden

        const alpha = Math.acos(termForAlpha);
        const trackingError = (beta - alpha) * (180 / Math.PI); // i grader
        points.push({ x: R, y: trackingError });
    }

    return {
      datasets: [
        {
          label: `Tracking Error (°), ${userInput.value.alignmentType.replace('A', '')}`,
          data: points,
          borderColor: '#3498db',
          borderWidth: 2.5,
          pointRadius: 0,
          tension: 0.1,
        }
      ]
    };
  });

  // --- ACTIONS ---
  async function initialize() {
    if (availableTonearms.value.length > 0) return;
    isLoading.value = true;
    error.value = null;
    try {
      const tonearmResponse = await fetch('/data/tonearm_data.json');
      if (!tonearmResponse.ok) throw new Error(`Failed to fetch tonearm data: ${tonearmResponse.statusText}`);
      availableTonearms.value = await tonearmResponse.json();
    } catch (e) {
      error.value = e.message;
      console.error(e);
    } finally {
      isLoading.value = false;
    }
  }

  function setAlignment(type) {
    if (ALIGNMENT_GEOMETRIES[type]) {
      userInput.value.alignmentType = type;
    }
  }

  function loadTonearmPreset(id) {
    const idNum = parseInt(id, 10);
    const tonearm = availableTonearms.value.find(t => t.id === idNum);
    if (tonearm && tonearm.pivot_to_spindle_mm) {
      userInput.value.pivotToSpindle = tonearm.pivot_to_spindle_mm;
      selectedTonearmId.value = idNum;
    } else {
      selectedTonearmId.value = null;
    }
  }

  function resetInputs() {
    userInput.value.pivotToSpindle = 222.0;
    userInput.value.alignmentType = 'Baerwald';
    selectedTonearmId.value = null;
  }

  return {
    isLoading,
    error,
    userInput,
    availableTonearms,
    selectedTonearmId,
    ALIGNMENT_GEOMETRIES,
    calculatedValues,
    trackingErrorData, // Exponerar den nya datan
    initialize,
    setAlignment,
    loadTonearmPreset,
    resetInputs,
  };
});
