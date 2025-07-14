// src/store/alignmentStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// Definierar standardiserade radier för inner- och ytterspår enligt IEC 60098:1987
const R1_IEC = 60.325; // Inner groove radius
const R2_IEC = 146.05;  // Outer groove radius

// Definierar nollpunkter för de vanligaste geometrierna
const ALIGNMENT_GEOMETRIES = {
  Baerwald: {
    name: "Löfgren A / Baerwald (IEC RIAA)",
    description: "Calculated to minimize RMS distortion across the entire playing surface. A popular all-around choice.",
    nulls: {
      inner: 66.0,
      outer: 120.9
    }
  },
  LofgrenB: {
    name: "Löfgren B (IEC RIAA)",
    description: "Calculated to minimize the absolute peak distortion, but with higher average distortion than Baerwald.",
    nulls: {
      inner: 70.3,
      outer: 116.6
    }
  },
  StevensonA: {
    name: "Stevenson A (IEC RIAA)",
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
  
  // Användarens primära inputs
  const userInput = ref({
    pivotToSpindle: 222.0, // Ett vanligt startvärde (t.ex. Rega)
    alignmentType: 'Baerwald',
  });

  // Data från JSON-filer
  const availableTonearms = ref([]);
  const selectedTonearmId = ref(null);

  // --- GETTERS ---

  // Beräknar de optimala värdena baserat på P2S och vald geometri
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

      // Robusta beräkningar för överhäng och offsetvinkel baserat på nollpunkter och P2S
      const A = (r2 - r1) / 2.0;
      const B = (r2 + r1) / 2.0;
      
      if (D <= A) {
        return { error: "Pivot-to-Spindle distance is too short for these null points." };
      }

      const C = B**2 / (D**2 - A**2);
      const offsetAngleRad = Math.asin(Math.sqrt(C));
      const offsetAngleDeg = offsetAngleRad * (180 / Math.PI);
      
      const effectiveLength = Math.sqrt(D**2 - A**2) / Math.cos(offsetAngleRad);
      const overhang = effectiveLength - D;

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

  // --- ACTIONS ---
  async function initialize() {
    if (availableTonearms.value.length > 0) return; // Körs bara en gång
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
    ALIGNMENT_GEOMETRIES, // Exponerar geometrierna för UI
    calculatedValues,
    initialize,
    setAlignment,
    loadTonearmPreset,
    resetInputs,
  };
});
