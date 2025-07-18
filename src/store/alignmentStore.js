// src/store/alignmentStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import * as calculator from '@/services/alignmentCalculations.js';

export const useAlignmentStore = defineStore('alignment', () => {
  // --- STATE ---
  const isLoading = ref(true);
  const error = ref(null);

  const ALIGNMENT_GEOMETRIES = {
    Baerwald: {
      solver: calculator.calculateBaerwald,
      description: "Also known as Löfgren A. Aims for the lowest average distortion across the entire record by balancing the error peaks.",
      iecNulls: [66.0, 120.9]
    },
    LofgrenB: {
      solver: calculator.calculateLofgrenB,
      description: "Minimizes the absolute maximum distortion. The error peaks at the inner and outer grooves are lower than with Baerwald.",
      iecNulls: [70.3, 116.6]
    },
    StevensonA: {
      solver: calculator.calculateStevensonA,
      description: "Prioritizes minimizing distortion at the innermost groove, where it is most audible, at the cost of higher error elsewhere.",
      iecNulls: [60.325, 117.4]
    }
  };

  const userInput = ref({
    pivotToSpindle: 213.4, // Default to SME 3009 Series II
    alignmentType: 'LofgrenB',
  });

  const availableTonearms = ref([]);
  const selectedTonearmId = ref(null);

  const calculatedValues = ref({
    overhang: 0,
    offsetAngle: 0,
    effectiveLength: 0,
    nulls: { inner: 0, outer: 0 },
    geometryName: '',
    geometryDescription: '',
    trackingMethod: 'pivoting',
    error: null
  });

  const trackingErrorChartData = ref({ datasets: [] });

  // --- GETTERS ---
  const currentTonearm = computed(() => {
    if (!selectedTonearmId.value) return null;
    return availableTonearms.value.find(t => t.id === selectedTonearmId.value);
  });

  // --- ACTIONS ---
  async function initialize() {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await fetch('/data/tonearm_data.json');
      if (!response.ok) throw new Error('Network response was not ok.');
      availableTonearms.value = await response.json();
      calculateAlignment();
    } catch (e) {
      error.value = `Failed to load tonearm database: ${e.message}`;
      console.error(error.value);
    } finally {
      isLoading.value = false;
    }
  }

  function setAlignment(type) {
    if (ALIGNMENT_GEOMETRIES[type]) {
      userInput.value.alignmentType = type;
      calculateAlignment();
    }
  }

  function loadTonearmPreset(id) {
    selectedTonearmId.value = id ? parseInt(id, 10) : null;
    if (currentTonearm.value) {
      userInput.value.pivotToSpindle = currentTonearm.value.pivot_to_spindle_mm;
    }
    calculateAlignment();
  }

  function calculateAlignment() {
    const p2s = userInput.value.pivotToSpindle;

    // Handle non-pivoting arms from presets
    if (currentTonearm.value && currentTonearm.value.tracking_method !== 'pivoting') {
      calculatedValues.value = {
        overhang: 0,
        offsetAngle: 0,
        effectiveLength: currentTonearm.value.effective_length_mm,
        nulls: { inner: 0, outer: 0 },
        geometryName: currentTonearm.value.tracking_method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        geometryDescription: 'Tangential arms have theoretically zero tracking error across the entire record.',
        trackingMethod: currentTonearm.value.tracking_method,
        error: null
      };
      trackingErrorChartData.value = { datasets: [] }; // Clear chart for non-pivoting
      return;
    }

    // Handle invalid input for pivoting arms
    if (!p2s || p2s < 150) {
      calculatedValues.value.error = "Pivot-to-Spindle distance is too short for a valid calculation.";
      trackingErrorChartData.value = { datasets: [] };
      return;
    }

    calculatedValues.value.error = null;
    calculatedValues.value.trackingMethod = 'pivoting';

    // Calculate all geometries for the chart
    const chartDatasets = [];
    for (const [key, geo] of Object.entries(ALIGNMENT_GEOMETRIES)) {
      const result = geo.solver(p2s);
      const isActive = key === userInput.value.alignmentType;
      
      chartDatasets.push({
        label: key.replace('A', ''),
        data: calculator.generateTrackingErrorCurve(p2s, result.overhang, result.offsetAngle),
        borderColor: isActive ? '#c0392b' : '#bdc3c7',
        borderWidth: isActive ? 4 : 2,
        pointRadius: 0,
        tension: 0.1,
      });

      // Update the main display values if this is the selected geometry
      if (isActive) {
        calculatedValues.value.overhang = result.overhang;
        calculatedValues.value.offsetAngle = result.offsetAngle;
        calculatedValues.value.effectiveLength = Math.sqrt(p2s**2 + result.overhang**2);
        calculatedValues.value.nulls = { inner: result.nulls, outer: result.nulls };
        calculatedValues.value.geometryName = key.replace('A', '');
        calculatedValues.value.geometryDescription = geo.description;
      }
    }
    trackingErrorChartData.value = { datasets: chartDatasets };
  }

  return {
    isLoading,
    error,
    userInput,
    availableTonearms,
    selectedTonearmId,
    calculatedValues,
    trackingErrorChartData,
    ALIGNMENT_GEOMETRIES,
    currentTonearm,
    initialize,
    setAlignment,
    loadTonearmPreset,
    calculateAlignment
  };
});
