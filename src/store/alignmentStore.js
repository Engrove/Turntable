// src/store/alignmentStore.js

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// Definierar standardgeometrier med deras fasta nollpunkter (r1, r2) i mm
const ALIGNMENT_GEOMETRIES = {
  Baerwald: {
    name: "Löfgren A / Baerwald",
    description: "Balances distortion between inner and outer grooves, resulting in the lowest average RMS distortion. A very popular all-round choice.",
    nulls: { inner: 66.0, outer: 120.9 }
  },
  LofgrenB: {
    name: "Löfgren B",
    description: "Minimizes distortion across the entire playing surface, but allows higher peak distortion at the beginning and end of the record compared to Baerwald.",
    nulls: { inner: 70.3, outer: 116.6 }
  },
  StevensonA: {
    name: "Stevenson A",
    description: "Optimized to minimize distortion at the critical inner grooves, at the expense of higher distortion elsewhere. Excellent for classical music.",
    nulls: { inner: 60.325, outer: 117.42 }
  }
};

export const useAlignmentStore = defineStore('alignment', () => {
  // --- STATE ---
  const isLoading = ref(true);
  const error = ref(null);
  const availableTonearms = ref([]);
  const selectedTonearmId = ref(null);
  const userInput = ref({
    pivotToSpindle: 222.0,
    alignmentType: 'Baerwald',
  });

  // --- ACTIONS ---
  const initialize = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch('/data/tonearm_data.json');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      availableTonearms.value = data;
    } catch (e) {
      error.value = "Could not fetch or parse tonearm data. " + e.message;
      console.error(e);
    } finally {
      isLoading.value = false;
    }
  };

  const setAlignment = (type) => {
    userInput.value.alignmentType = type;
  };
  
  const loadTonearmPreset = (id) => {
    selectedTonearmId.value = id;
    if (!id) {
      return;
    }
    const tonearm = availableTonearms.value.find(t => t.id == id);
    if (tonearm && tonearm.pivot_to_spindle_mm) {
      userInput.value.pivotToSpindle = tonearm.pivot_to_spindle_mm;
    }
  };

  // --- GETTERS (COMPUTED) ---

  const calculatedValues = computed(() => {
    const D = userInput.value.pivotToSpindle;
    const geometry = ALIGNMENT_GEOMETRIES[userInput.value.alignmentType];
    const r1 = geometry.nulls.inner;
    const r2 = geometry.nulls.outer;

    // --- KORREKTA BERÄKNINGAR (Graeme Dennes' formler för precision) ---
    const Rp = r1 * r2;
    const Rg = (r1 + r2) / 2;

    const term1 = D - (((r1 - Rg) ** 2) + (Rp ** 2 / D ** 2)) / (2 * D);
    const term2 = Rg / term1;
    
    if (isNaN(term1) || isNaN(term2)) {
      return {
        error: "Invalid input. Pivot-to-spindle distance might be too small for this geometry.",
        overhang: 0, offsetAngle: 0, effectiveLength: 0, nulls: { inner: 0, outer: 0 }
      };
    }

    const offsetAngleRad = Math.atan(term2);
    const effectiveLength = term1 / Math.cos(offsetAngleRad);
    const overhang = effectiveLength - D;
    const offsetAngleDeg = offsetAngleRad * (180 / Math.PI);
    
    // Ytterligare felkontroll
    if (isNaN(effectiveLength) || D <= 0) {
      return {
        error: "Calculation resulted in invalid numbers. Check input values.",
        overhang: 0, offsetAngle: 0, effectiveLength: 0, nulls: { inner: 0, outer: 0 }
      };
    }
    
    return {
      overhang: overhang,
      offsetAngle: offsetAngleDeg,
      effectiveLength: effectiveLength,
      nulls: { inner: r1, outer: r2 },
      geometryName: geometry.name,
      geometryDescription: geometry.description,
      error: null
    };
  });
  
  const trackingErrorData = computed(() => {
    if (calculatedValues.value.error) {
      return { datasets: [] };
    }
    
    const { effectiveLength, offsetAngle } = calculatedValues.value;
    const D = userInput.value.pivotToSpindle;
    const Le = effectiveLength;
    const offsetRad = offsetAngle * (Math.PI / 180);

    const points = [];
    // Beräkna punkter från 60 mm till 147 mm
    for (let radius = 60; radius <= 147; radius += 0.5) {
      // --- KORREKT FORMEL FÖR TRACKING ERROR ---
      // Beräkna först tracking angle (alfa) vid given radie
      const cosAlpha = (D**2 + radius**2 - Le**2) / (2 * D * radius);

      // Argumentet för asin måste vara mellan -1 och 1
      if (cosAlpha >= -1 && cosAlpha <= 1) {
          const alphaRad = Math.acos(cosAlpha);
          // Beräkna sedan vinkelfelet (beta - alfa)
          const trackingErrorRad = Math.asin(radius / Le * Math.sin(offsetRad)) - alphaRad;
          points.push({ x: radius, y: trackingErrorRad * (180 / Math.PI) });
      }
    }
    
    return {
      datasets: [
        {
          label: `Tracking Error (°), ${userInput.value.alignmentType.replace('A','')}`,
          data: points,
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.2)',
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.1,
          fill: true
        },
      ],
    };
  });


  return {
    isLoading,
    error,
    availableTonearms,
    selectedTonearmId,
    userInput,
    ALIGNMENT_GEOMETRIES, // Exponera för input panelen
    calculatedValues,
    trackingErrorData,
    initialize,
    setAlignment,
    loadTonearmPreset
  };
});
