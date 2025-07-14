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

    if (D <= r2) {
      return {
        error: "Pivot-to-Spindle distance must be greater than the outer null radius.",
        overhang: 0, offsetAngle: 0, effectiveLength: 0, nulls: { inner: r1, outer: r2 },
        geometryName: geometry.name, geometryDescription: geometry.description
      };
    }

    // ==========================================================
    // === KORREKT FORMELBLOCK (BASERAT PÅ LÖFGREN/BAERWALD) ===
    // ==========================================================
    const avg_r = (r1 + r2) / 2;
    const prod_r = r1 * r2;
    
    // Beräkna effektiv längd först, då den behövs för de andra
    const effectiveLength = Math.sqrt(avg_r * (r1 + r2) + prod_r * (prod_r / (D * D)) + D * D - 2 * avg_r * Math.sqrt(prod_r * (prod_r / (D * D)) + D * D - prod_r));

    // Beräkna offsetvinkel (beta)
    const offsetAngleRad = Math.asin((prod_r + avg_r * Math.sqrt(prod_r * (prod_r / (D * D)) + D * D - prod_r)) / (D * effectiveLength));
    
    // Beräkna överhäng
    const overhang = effectiveLength - D;
    
    // Konvertera vinkel till grader
    const offsetAngleDeg = offsetAngleRad * (180 / Math.PI);

    if (isNaN(effectiveLength) || isNaN(overhang) || isNaN(offsetAngleDeg)) {
      return {
        error: "Invalid geometry. Pivot-to-spindle distance is likely incompatible with the chosen alignment null points.",
        overhang: 0, offsetAngle: 0, effectiveLength: 0, nulls: { inner: r1, outer: r2 },
        geometryName: geometry.name, geometryDescription: geometry.description
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
    const Le = effectiveLength;
    const betaRad = offsetAngle * (Math.PI / 180);

    const points = [];
    for (let R = 60; R <= 147; R += 0.5) {
      // ==========================================================
      // === KORREKT FORMELBLOCK FÖR SPÅRVINKELFEL ===
      // ==========================================================
      // Beräkna spårvinkelfel (Tracking Error) i grader.
      // Formel: TE = arcsin(R / Le) - arccos((D^2 + R^2 - Le^2) / (2 * D * R))
      // Denna formel är numeriskt instabil. En stabilare form är:
      const trackingErrorRad = Math.atan( (R * Le * Math.cos(betaRad)) / (Math.sqrt(Le*Le - R*R * Math.pow(Math.sin(betaRad),2)) * Math.sqrt(Le*Le - R*R) ) - (R*R * Math.sin(betaRad) * Math.cos(betaRad)) / (Math.sqrt(Le*Le - R*R) * Math.sqrt(Le*Le - R*R)) ) - betaRad;
      const term1 = R*Math.sin(betaRad) - calculatedValues.value.overhang;
      const term2 = Math.sqrt(Math.pow(Le,2) - Math.pow(R*Math.sin(betaRad),2));
      const trackingErrorAlpha = Math.atan( term1 / term2 );
      
      points.push({ x: R, y: trackingErrorAlpha * (180 / Math.PI) });
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
          fill: 'origin'
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
    ALIGNMENT_GEOMETRIES,
    calculatedValues,
    trackingErrorData,
    initialize,
    setAlignment,
    loadTonearmPreset
  };
});
