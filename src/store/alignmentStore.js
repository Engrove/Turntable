// src/store/alignmentStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAlignmentStore = defineStore('alignment', () => {
  // State
  const state = {
    isLoading: ref(true),
    error: ref(null),
    availableTonearms: ref([]),
    selectedTonearmId: ref(null),
    R1: 60.325,
    R2: 146.05
  };

  // Geometrier med verifierade nollpunkter
  const geometries = {
    LofgrenA: {
      name: 'Löfgren A / Baerwald',
      nulls: { inner: 66.0, outer: 120.9 }
    },
    LofgrenB: {
      name: 'Löfgren B',
      nulls: { inner: 70.3, outer: 116.6 }
    },
    StevensonA: {
      name: 'Stevenson A',
      nulls: { inner: 60.325, outer: 117.42 }
    }
  };

  const userInput = ref({
    pivotToSpindle: 230,
    alignmentType: 'LofgrenA'
  });

  // Förbättrad geometriberäkning med högre precision
  function calculateGeometry(D, { inner: n1, outer: n2 }) {
    // Strikt validering
    if (D <= state.R2) return { error: "Pivot distance must exceed outer groove radius (146.05 mm)" };
    if (n1 >= n2) return { error: "Inner null point must be less than outer" };
    if (n1 < state.R1 || n2 > state.R2) return { error: "Null points must be within groove radii" };

    // Högre precision beräkning
    const termA = D + (n1 * n2) / D;
    const termB = n1 + n2;
    const L = Math.sqrt((termA * termA + termB * termB) / 4);
    const H = L - D;
    const betaRad = Math.asin(termB / (2 * L));
    const betaDeg = betaRad * (180 / Math.PI);

    return {
      effectiveLength: parseFloat(L.toFixed(3)),
      overhang: parseFloat(H.toFixed(3)),
      offsetAngle: parseFloat(betaDeg.toFixed(3)),
      error: null
    };
  }

  // Beräkning av spårfel med optimerad precision
  function calculateTrackingErrors(L, betaDeg, D) {
    const betaRad = betaDeg * (Math.PI / 180);
    const errors = [];
    
    for (let r = Math.floor(state.R1); r <= Math.ceil(state.R2); r += 1) {
      const acosInput = (L*L + r*r - D*D) / (2*L*r);
      const phi = Math.acos(Math.max(-1, Math.min(1, acosInput)));
      const alpha = Math.asin(r / L);
      const errorRad = alpha - phi - betaRad;
      errors.push({
        radius: r,
        error: parseFloat((errorRad * (180 / Math.PI)).toFixed(3))
      });
    }
    
    return errors;
  }

  // Computed properties
  const results = computed(() => {
    const { pivotToSpindle, alignmentType } = userInput.value;
    const geometry = geometries[alignmentType];
    
    if (state.selectedTonearmId.value) {
      const arm = state.availableTonearms.value.find(t => t.id === state.selectedTonearmId.value);
      if (arm?.tracking_method === 'tangential') {
        return {
          geometry: 'Tangential',
          effectiveLength: arm.effective_length_mm,
          overhang: 0,
          offsetAngle: 0,
          errors: []
        };
      }
    }

    const calculation = calculateGeometry(pivotToSpindle, geometry.nulls);
    if (calculation.error) return { error: calculation.error };

    return {
      geometry: geometry.name,
      ...calculation,
      errors: calculateTrackingErrors(
        calculation.effectiveLength,
        calculation.offsetAngle,
        pivotToSpindle
      )
    };
  });

  return {
    isLoading: state.isLoading,
    error: state.error,
    userInput,
    geometries,
    results,
    async initialize() {
      try {
        state.isLoading.value = true;
        const response = await fetch('/data/tonearms.json');
        state.availableTonearms.value = await response.json();
      } catch (err) {
        state.error.value = err.message;
      } finally {
        state.isLoading.value = false;
      }
    }
  };
});
