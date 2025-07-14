// src/store/alignmentStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const R1_IEC = 60.325; // Inner groove radius
const R2_IEC = 146.05;  // Outer groove radius

const ALIGNMENT_GEOMETRIES = {
  Baerwald: {
    name: "Löfgren A / Baerwald",
    description: "Calculated to minimize RMS distortion across the entire playing surface. A popular all-around choice.",
    nulls: { inner: 66.0, outer: 120.9 }
  },
  LofgrenB: {
    name: "Löfgren B",
    description: "Calculated to minimize the absolute peak distortion, but with higher average distortion than Baerwald.",
    nulls: { inner: 70.3, outer: 116.6 }
  },
  StevensonA: {
    name: "Stevenson A",
    description: "Optimized for the lowest distortion at the inner groove, where distortion is typically most audible.",
    nulls: { inner: 60.325, outer: 117.42 }
  }
};

export const useAlignmentStore = defineStore('alignment', () => {
  const isLoading = ref(false);
  const error = ref(null);
  
  const userInput = ref({
    pivotToSpindle: 222.0,
    alignmentType: 'Baerwald',
  });

  const availableTonearms = ref([]);
  const selectedTonearmId = ref(null);

  const calculatedValues = computed(() => {
    try {
      const D = userInput.value.pivotToSpindle;
      if (!D || D <= 0) return { error: "Pivot-to-Spindle distance must be positive." };

      const geometry = ALIGNMENT_GEOMETRIES[userInput.value.alignmentType];
      if (!geometry) return { error: "Invalid alignment type selected." };
      
      const r1 = geometry.nulls.inner;
      const r2 = geometry.nulls.outer;

      // KORREKT BERÄKNING för att härleda överhäng och vinkel från nollpunkter och P2S
      const overhang = ((r1 * r2) / (r1 + r2)) * (((r1 + r2)**2) / (4 * D**2)) + ((r1 * r2) / (4 * D**2)) * (r1 + r2) / 2;
      const effectiveLength = Math.sqrt(D**2 + r1*r2 + overhang**2);
      const offsetAngleRad = Math.asin((r1*r2)/(D*effectiveLength) + overhang/effectiveLength);

      if (isNaN(offsetAngleRad)) {
        throw new Error("Cannot compute alignment for these values. Pivot-to-Spindle may be too short.");
      }
      
      const offsetAngleDeg = offsetAngleRad * (180 / Math.PI);

      return {
        overhang: overhang,
        offsetAngle: offsetAngleDeg,
        effectiveLength: effectiveLength,
        nulls: { inner: r1, outer: r2 },
        geometryName: geometry.name,
        geometryDescription: geometry.description,
        error: null,
      };
    } catch (e) {
      console.error("Calculation error in alignmentStore:", e);
      return { error: e.message || "A calculation error occurred." };
    }
  });

  const trackingErrorData = computed(() => {
    const calc = calculatedValues.value;
    if (calc.error) return { labels: [], datasets: [] };
    
    const D = userInput.value.pivotToSpindle;
    const Le = calc.effectiveLength;
    const beta = calc.offsetAngle * (Math.PI / 180);

    const points = [];
    for (let R = R1_IEC; R <= R2_IEC; R += 1) {
        const term = (Le**2 + R**2 - D**2) / (2 * Le * R);
        if (Math.abs(term) > 1) continue;

        const phi = Math.acos(term);
        const trackingError = (phi - beta) * (180 / Math.PI);
        points.push({ x: R, y: trackingError });
    }

    return {
      datasets: [{
        label: `Tracking Error (°), ${userInput.value.alignmentType.replace('A', '')}`,
        data: points,
        borderColor: '#3498db',
        borderWidth: 2.5,
        pointRadius: 0,
        tension: 0.1,
      }]
    };
  });

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
    isLoading, error, userInput, availableTonearms, selectedTonearmId,
    ALIGNMENT_GEOMETRIES, calculatedValues, trackingErrorData,
    initialize, setAlignment, loadTonearmPreset, resetInputs,
  };
});
