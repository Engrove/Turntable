// src/store/alignmentStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAlignmentStore = defineStore('alignment', () => {
  // --- State ---
  const isLoading = ref(true);
  const error = ref(null);
  const availableTonearms = ref([]);
  const selectedTonearmId = ref(null);
  const userInput = ref({
    pivotToSpindle: 230,
    alignmentType: 'LofgrenA'
  });

  // --- Konstanter ---
  const R1 = 60.325;
  const R2 = 146.05;

  // --- Statisk Data ---
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

  // --- Interna Funktioner ---
  function calculateGeometry(D, { inner: n1, outer: n2 }) {
    if (D <= R2) return { error: `Pivot distance must exceed outer groove radius (${R2} mm)` };
    if (n1 >= n2) return { error: "Inner null point must be less than outer" };
    if (n1 < R1 || n2 > R2) return { error: "Null points must be within groove radii" };

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

  function calculateTrackingErrors(L, betaDeg, D) {
    const betaRad = betaDeg * (Math.PI / 180);
    const errors = [];

    for (let r = Math.floor(R1); r <= Math.ceil(R2); r += 1) {
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

  // --- Computed Properties ---
  const results = computed(() => {
    const { pivotToSpindle, alignmentType } = userInput.value;
    const geometry = geometries[alignmentType];

    if (selectedTonearmId.value) {
      const arm = availableTonearms.value.find(t => t.id === selectedTonearmId.value);
      if (arm?.tracking_method === 'tangential') {
        return {
          geometry: 'Tangential',
          effectiveLength: arm.effective_length_mm,
          overhang: 0,
          offsetAngle: 0,
          errors: [],
          error: null
        };
      }
    }

    const calculation = calculateGeometry(pivotToSpindle, geometry.nulls);

    if (calculation.error) {
      return {
        error: calculation.error,
        geometry: geometry.name,
        effectiveLength: 0,
        overhang: 0,
        offsetAngle: 0,
        errors: []
      };
    }

    return {
      geometry: geometry.name,
      ...calculation,
      errors: calculateTrackingErrors(
        calculation.effectiveLength,
        calculation.offsetAngle,
        pivotToSpindle
      ),
      error: null
    };
  });

  // --- Actions ---
  async function initialize() {
    try {
      isLoading.value = true;
      error.value = null;
      const response = await fetch('/data/tonearm_data.json');
      if (!response.ok) {
        throw new Error(`Failed to fetch tonearm data: ${response.statusText}`);
      }
      availableTonearms.value = await response.json();
    } catch (err) {
      error.value = err.message;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    isLoading,
    error,
    availableTonearms,
    selectedTonearmId,
    userInput,
    geometries,
    results,
    initialize
  };
});
