// src/store/alignmentStore.js

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { solver, calculateTrackingErrorData } from '@/services/alignmentCalculations.js';

export const useAlignmentStore = defineStore('alignment', () => {
  // === STATE ===
  const userInput = ref({
    pivotToSpindle: 222,
    alignmentType: 'Baerwald',
    standard: 'IEC',
    paperFormat: 'A4',
  });

  const calculatedValues = ref({
    overhang: 0,
    offsetAngle: 0,
    effectiveLength: 0,
    nulls: { inner: 0, outer: 0 },
    error: null,
    geometryName: '',
    geometryDescription: '',
    trackingMethod: 'pivoting'
  });
  
  const availableTonearms = ref([]);
  const selectedTonearmId = ref(null);
  const currentTonearmPreset = ref(null); // NYTT: Lagrar hela preset-objektet
  const isLoading = ref(false);
  const error = ref(null);

  // === CONSTANTS ===
  const ALIGNMENT_GEOMETRIES = {
    'Baerwald': { 
      name: 'Baerwald (Löfgren A)', 
      description: 'Also known as Löfgren A. Aims for the lowest average distortion across the entire record by balancing the error peaks.' 
    },
    'LofgrenB': { 
      name: 'Löfgren B', 
      description: 'Minimizes distortion across the entire playing surface, but allows higher maximum distortion at the start and end of the record.' 
    },
    'Stevenson': { 
      name: 'Stevenson', 
      description: 'Prioritizes minimizing distortion at the innermost groove, where it is most audible, at the cost of higher error elsewhere.' 
    }
  };
  const GROOVE_STANDARDS = {
    'IEC': { name: 'IEC (1958)', inner: 60.325, outer: 146.05 },
    'DIN': { name: 'DIN (1962)', inner: 57.5, outer: 146.05 },
    'JIS': { name: 'JIS (1981)', inner: 58.5, outer: 147.6 }
  };

  // === ACTIONS ===

  async function initialize() {
    isLoading.value = true;
    error.value = null;
    try {
      const tonearmResponse = await fetch('/data/tonearm_data.json');
      if (!tonearmResponse.ok) throw new Error('Failed to load tonearm database.');
      const allTonearms = await tonearmResponse.json();
      
      // UPPDATERAT: Filtrera bort inaktiva tonarmar
      availableTonearms.value = allTonearms.filter(t => t.rectype === 'A');
      
      calculateAlignment();
    } catch (e) {
      error.value = e.message;
    } finally {
      isLoading.value = false;
    }
  }

  function loadTonearmPreset(id) {
    selectedTonearmId.value = id ? Number(id) : null;
    if (selectedTonearmId.value) {
      const tonearm = availableTonearms.value.find(t => t.id === selectedTonearmId.value);
      if (tonearm) {
        currentTonearmPreset.value = tonearm; // Lagra hela objektet
        userInput.value.pivotToSpindle = tonearm.pivot_to_spindle_mm;
        
        // Auto-välj geometri baserat på preset
        const presetGeometry = tonearm.alignment_geometry?.toLowerCase() || '';
        if (presetGeometry.includes('stevenson')) {
          userInput.value.alignmentType = 'Stevenson';
        } else if (presetGeometry.includes('löfgren b') || presetGeometry.includes('lofgren b')) {
          userInput.value.alignmentType = 'LofgrenB';
        } else if (presetGeometry.includes('baerwald') || presetGeometry.includes('löfgren a')) {
          userInput.value.alignmentType = 'Baerwald';
        }
        // Annars behåll nuvarande val

      }
    } else {
      currentTonearmPreset.value = null; // Rensa när ingen är vald
    }
    calculateAlignment();
  }

  function setAlignment(type) {
    userInput.value.alignmentType = type;
    calculateAlignment();
  }

  function setStandard(standard) {
    userInput.value.standard = standard;
    calculateAlignment();
  }
  
  function setPaperFormat(format) {
    userInput.value.paperFormat = format;
  }

  function calculateAlignment() {
    const standard = GROOVE_STANDARDS[userInput.value.standard];
    
    // Hantera tangentiella armar som laddats från preset
    if (currentTonearmPreset.value && currentTonearmPreset.value.tracking_method !== 'pivoting') {
      calculatedValues.value = {
        overhang: 0,
        offsetAngle: 0,
        effectiveLength: currentTonearmPreset.value.effective_length_mm,
        nulls: { inner: standard.inner, outer: standard.outer },
        error: null,
        geometryName: 'Tangential',
        geometryDescription: 'This tonearm tracks in a straight line, resulting in zero tracking error.',
        trackingMethod: 'tangential'
      };
      return;
    }

    // Beräkning för pivoterande armar
    const result = solver(
      userInput.value.pivotToSpindle,
      userInput.value.alignmentType,
      standard.inner,
      standard.outer
    );

    if (result.error) {
      calculatedValues.value = { ...calculatedValues.value, error: result.error, trackingMethod: 'pivoting' };
    } else {
      const geometryInfo = ALIGNMENT_GEOMETRIES[userInput.value.alignmentType] || {};
      calculatedValues.value = {
        ...result,
        error: null,
        geometryName: geometryInfo.name,
        geometryDescription: geometryInfo.description,
        trackingMethod: 'pivoting'
      };
    }
  }
  
  // === GETTERS / COMPUTED ===

  const trackingErrorChartData = computed(() => {
    if (calculatedValues.value.error) {
      return { datasets: [] };
    }

    const datasets = [];
    const activeType = userInput.value.alignmentType;
    const standard = GROOVE_STANDARDS[userInput.value.standard];

    for (const type in ALIGNMENT_GEOMETRIES) {
      const isHidden = type !== activeType;
      const color = isHidden ? '#dddddd' : (type === 'Baerwald' ? '#e74c3c' : (type === 'LofgrenB' ? '#27ae60' : '#3498db'));
      const borderWidth = isHidden ? 1.5 : 3;
      const borderDash = isHidden ? [5, 5] : [];

      const result = solver(userInput.value.pivotToSpindle, type, standard.inner, standard.outer);
      if (!result.error) {
          datasets.push({
              label: type,
              data: calculateTrackingErrorData(result.effectiveLength, result.offsetAngle),
              borderColor: color,
              borderWidth: borderWidth,
              borderDash,
              pointRadius: 0,
              tension: 0.1,
          });
      }
    }
    return { datasets };
  });


  return {
    userInput,
    calculatedValues,
    availableTonearms,
    selectedTonearmId,
    currentTonearmPreset,
    isLoading,
    error,
    ALIGNMENT_GEOMETRIES,
    GROOVE_STANDARDS,
    initialize,
    loadTonearmPreset,
    setAlignment,
    setStandard,
    setPaperFormat,
    calculateAlignment,
    trackingErrorChartData
  };
});
// src/store/alignmentStore.js
