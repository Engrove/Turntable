// src/store/alignmentStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAlignmentStore = defineStore('alignment', () => {
  // --- Constants ---
  const R1 = 60.325; // Inner groove radius (mm) - IEC standard
  const R2 = 146.05; // Outer groove radius (mm) - IEC standard

  // --- State ---
  const isLoading = ref(true);
  const error = ref(null);
  const availableTonearms = ref([]);
  const selectedTonearmId = ref(null);
  
  const userInput = ref({
    pivotToSpindle: 230, // Default value
    alignmentType: 'LofgrenA'
  });

  // --- Geometry Definitions ---
  const geometries = {
    LofgrenA: {
      name: 'Löfgren A / Baerwald',
      description: 'Minimizes maximum distortion (minimax optimization)',
      method: 'minimax'
    },
    LofgrenB: {
      name: 'Löfgren B',
      description: 'Fixed offset angle with optimized overhang',
      method: 'fixedOffset'
    },
    LofgrenC: {
      name: 'Löfgren C',
      description: 'Least Mean Squares (LMS) optimization',
      method: 'lms'
    },
    StevensonA: {
      name: 'Stevenson A',
      description: 'Prioritizes inner groove distortion',
      method: 'stevenson'
    }
  };

  // --- Core Calculation Functions ---
  function calculateLofgrenA(D) {
    console.log('[LofgrenA] Calculating with pivot distance:', D);
    
    const term1 = R1*R1 + 6*R1*R2 + R2*R2;
    const L = Math.sqrt(D*D + (8*R1*R1*R2*R2)/term1);
    const H = L - D;
    const betaRad = Math.asin((4*R1*R2*(R1 + R2))/(L*term1));
    const betaDeg = betaRad * 180/Math.PI;

    // Null points (Baerwald formula)
    const innerNull = (2*R1*R2*(1-1/Math.sqrt(2)))/(R2 + (1+1/Math.sqrt(2))*R1);
    const outerNull = (2*R1*R2*(1+1/Math.sqrt(2)))/(R2 + (1-1/Math.sqrt(2))*R1);

    console.log('[LofgrenA] Results:', { L, H, betaDeg, innerNull, outerNull });
    
    return {
      effectiveLength: parseFloat(L.toFixed(3)),
      overhang: parseFloat(H.toFixed(3)),
      offsetAngle: parseFloat(betaDeg.toFixed(3)),
      nullPoints: { inner: parseFloat(innerNull.toFixed(2)), outer: parseFloat(outerNull.toFixed(2)) }
    };
  }

  function calculateLofgrenC(D) {
    console.log('[LofgrenC] Calculating with pivot distance:', D);
    
    // Exact LMS solution per Jovanović 2022
    const term1 = R2 - R1;
    const term2 = Math.log(R2/R1);
    const term3 = R1*R2;
    const term4 = R1*R1 + R1*R2 + R2*R2;
    
    const numerator = (D*D + term3) * Math.pow(term1, 3);
    const sqrtTerm = Math.pow(term1, 6) * Math.pow(D*D + term3, 2) - 
                    4*D*D*R1*R1*R2*R2 * Math.pow(2*term4*term2 - 3*(R2*R2 - R1*R1), 2);
    
    const p = (numerator - Math.sqrt(sqrtTerm)) / 
              (4*term3*(2*term4*term2 - 3*(R2*R2 - R1*R1)));
    
    const a2 = (3*term3*(p*(R1 + R2) - term3))/term4;
    const betaRad = Math.asin(p/D);
    const betaDeg = betaRad * 180/Math.PI;
    const L = D;
    const H = L - Math.sqrt(L*L - a2);

    // Null points
    const null1 = p + Math.sqrt(p*p - a2);
    const null2 = p - Math.sqrt(p*p - a2);

    console.log('[LofgrenC] Intermediate terms:', { term1, term2, term3, term4 });
    console.log('[LofgrenC] Results:', { L, H, betaDeg, null1, null2 });
    
    return {
      effectiveLength: parseFloat(L.toFixed(3)),
      overhang: parseFloat(H.toFixed(3)),
      offsetAngle: parseFloat(betaDeg.toFixed(3)),
      nullPoints: { 
        inner: parseFloat(Math.min(null1, null2).toFixed(2)),
        outer: parseFloat(Math.max(null1, null2).toFixed(2)) 
      }
    };
  }

  function calculateTrackingErrors(L, betaDeg, D) {
    console.log('[TrackingErrors] Calculating for L:', L, 'beta:', betaDeg, 'D:', D);
    
    const betaRad = betaDeg * (Math.PI/180);
    const errors = [];

    for (let r = Math.floor(R1); r <= Math.ceil(R2); r += 1) {
      const acosInput = (r*r + L*L - D*D)/(2*r*L);
      
      // Clamp to valid range for acos
      const clampedInput = Math.max(-1, Math.min(1, acosInput));
      const phi = Math.acos(clampedInput);
      
      const alpha = Math.asin(r/L);
      const errorRad = alpha - phi - betaRad;
      const errorDeg = errorRad * (180/Math.PI);

      errors.push({
        radius: r,
        error: parseFloat(errorDeg.toFixed(3))
      });
    }

    console.log('[TrackingErrors] Generated', errors.length, 'data points');
    return errors;
  }

  // --- Main Computed Property ---
  const results = computed(() => {
    const { pivotToSpindle: D, alignmentType } = userInput.value;
    const geometry = geometries[alignmentType];
    
    console.group('Alignment Calculation');
    console.log('Input:', { D, alignmentType });

    // Validate input
    if (!D || D <= 0) {
      console.error('Invalid pivot distance:', D);
      return {
        error: 'Pivot-to-spindle distance must be positive',
        geometry: geometry.name,
        effectiveLength: 0,
        overhang: 0,
        offsetAngle: 0,
        errors: []
      };
    }

    if (D <= R2) {
      console.error('Pivot distance too small:', D, '<=', R2);
      return {
        error: `Pivot distance must exceed outer groove radius (${R2} mm)`,
        geometry: geometry.name,
        effectiveLength: 0,
        overhang: 0,
        offsetAngle: 0,
        errors: []
      };
    }

    // Handle tangential arms
    if (selectedTonearmId.value) {
      const arm = availableTonearms.value.find(t => t.id === selectedTonearmId.value);
      if (arm?.tracking_method === 'tangential') {
        console.log('Tangential arm detected, returning zero error');
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

    // Calculate based on alignment type
    let calculation;
    try {
      switch(geometry.method) {
        case 'minimax':
          calculation = calculateLofgrenA(D);
          break;
        case 'lms':
          calculation = calculateLofgrenC(D);
          break;
        default:
          throw new Error(`Unsupported alignment method: ${geometry.method}`);
      }

      const errors = calculateTrackingErrors(
        calculation.effectiveLength,
        calculation.offsetAngle,
        D
      );

      console.log('Calculation successful:', calculation);
      console.groupEnd();
      
      return {
        geometry: geometry.name,
        ...calculation,
        errors,
        error: null
      };
    } catch (err) {
      console.error('Calculation failed:', err);
      console.groupEnd();
      return {
        error: err.message,
        geometry: geometry.name,
        effectiveLength: 0,
        overhang: 0,
        offsetAngle: 0,
        errors: []
      };
    }
  });

  // --- Actions ---
  async function initialize() {
    try {
      isLoading.value = true;
      error.value = null;
      
      // In a real app, you would fetch this from your API
      const response = await fetch('/data/tonearm_data.json');
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      
      availableTonearms.value = await response.json();
      console.log('Loaded tonearms:', availableTonearms.value.length);
    } catch (err) {
      error.value = err.message;
      console.error('Initialization failed:', err);
    } finally {
      isLoading.value = false;
    }
  }

  function loadTonearmPreset(id) {
    selectedTonearmId.value = id;
    if (id && availableTonearms.value.length) {
      const arm = availableTonearms.value.find(x => x.id === id);
      if (arm) {
        userInput.value.pivotToSpindle = arm.pivot_to_spindle_mm || userInput.value.pivotToSpindle;
      }
    }
  }

  function setAlignmentType(type) {
    if (geometries[type]) {
      userInput.value.alignmentType = type;
    } else {
      console.warn('Attempted to set invalid alignment type:', type);
    }
  }

  return {
    // State
    isLoading,
    error,
    availableTonearms,
    selectedTonearmId,
    userInput,
    geometries,
    
    // Computed
    results,
    
    // Actions
    initialize,
    loadTonearmPreset,
    setAlignmentType
  };
});
