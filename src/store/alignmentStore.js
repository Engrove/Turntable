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
  
  // NYTT: Dedikerad state för protraktor-rendering
  const protractorRenderData = ref({
    paper: { width: 297, height: 210 }, // mm
    spindle: { x: 148.5, y: 105 }, // mm
    pivot: { x: 370.5, y: 105 }, // mm
    innerNull: { x: 0, y: 0, tangentAngle: 90 }, // mm, degrees
    outerNull: { x: 0, y: 0, tangentAngle: 90 }, // mm, degrees
    arcPath: "", // SVG path string
  });

  const availableTonearms = ref([]);
  const selectedTonearmId = ref(null);
  const currentTonearmPreset = ref(null);
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
  const PAPER_FORMATS = {
    A4: { width: 297, height: 210 },
    Letter: { width: 279.4, height: 215.9 }
  };

  // === ACTIONS ===

  function updateProtractorRenderData() {
    if (calculatedValues.value.error || calculatedValues.value.trackingMethod !== 'pivoting') {
      return;
    }
    const paper = PAPER_FORMATS[userInput.value.paperFormat] || PAPER_FORMATS.A4;
    const spindle = { x: paper.width / 2, y: paper.height / 2 };
    const pivot = { x: spindle.x + userInput.value.pivotToSpindle, y: spindle.y };
    
    // Nollpunkter (placeras på en rak linje från spindeln för en standard-protraktor)
    const innerNull = {
      x: spindle.x - calculatedValues.value.nulls.inner,
      y: spindle.y,
      tangentAngle: 90
    };
    const outerNull = {
      x: spindle.x - calculatedValues.value.nulls.outer,
      y: spindle.y,
      tangentAngle: 90
    };

    // Beräkna svepbåge (SVG path)
    const Le = calculatedValues.value.effectiveLength;
    const D = userInput.value.pivotToSpindle;
    const standard = GROOVE_STANDARDS[userInput.value.standard];

    // Funktion för att hitta y-koordinaten för en given radie (x) från spindeln
    const calcY = (R) => {
        // Law of cosines: R^2 = D^2 + Le^2 - 2*D*Le*cos(gamma)
        // Vi söker vinkeln från pivot till stylus, inte gamma.
        // I en triangel med hörn i pivot, spindel, stylus:
        // cos(alpha) = (D^2 + R^2 - Le^2) / (2 * D * R)
        // Denna metod är instabil. Bättre att använda pivoten som cirkelcentrum.
        if (Le > D + R || R > D + Le) return null; // Fysiskt omöjligt
        const angle = Math.acos((D**2 + Le**2 - R**2) / (2 * D * Le));
        if (isNaN(angle)) return null;
        return Le * Math.sin(angle);
    };

    const startY_offset = calcY(standard.outer);
    const endY_offset = calcY(standard.inner);

    if (startY_offset !== null && endY_offset !== null) {
      const startX = pivot.x - Math.sqrt(Le**2 - startY_offset**2);
      const endX = pivot.x - Math.sqrt(Le**2 - endY_offset**2);
      
      protractorRenderData.value.arcPath = `M ${startX} ${spindle.y - startY_offset} A ${Le} ${Le} 0 0 0 ${endX} ${spindle.y - endY_offset}`;
    } else {
       protractorRenderData.value.arcPath = "";
    }
    
    protractorRenderData.value = {
      ...protractorRenderData.value,
      paper,
      spindle,
      pivot,
      innerNull,
      outerNull,
    };
  }

  async function initialize() {
    isLoading.value = true;
    error.value = null;
    try {
      const tonearmResponse = await fetch('/data/tonearm_data.json');
      if (!tonearmResponse.ok) throw new Error('Failed to load tonearm database.');
      const allTonearms = await tonearmResponse.json();
      
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
        currentTonearmPreset.value = tonearm;
        userInput.value.pivotToSpindle = tonearm.pivot_to_spindle_mm;
        
        const presetGeometry = tonearm.alignment_geometry?.toLowerCase() || '';
        if (presetGeometry.includes('stevenson')) {
          userInput.value.alignmentType = 'Stevenson';
        } else if (presetGeometry.includes('löfgren b') || presetGeometry.includes('lofgren b')) {
          userInput.value.alignmentType = 'LofgrenB';
        } else if (presetGeometry.includes('baerwald') || presetGeometry.includes('löfgren a')) {
          userInput.value.alignmentType = 'Baerwald';
        }
      }
    } else {
      currentTonearmPreset.value = null;
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
    updateProtractorRenderData(); // Uppdatera protraktor-data när papper ändras
  }

  function calculateAlignment() {
    const standard = GROOVE_STANDARDS[userInput.value.standard];
    
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
      updateProtractorRenderData(); // Anropa även här för att rensa
      return;
    }

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
    updateProtractorRenderData(); // Uppdatera alltid protraktor-data efter beräkning
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
    protractorRenderData, // Exponera den nya datan
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
