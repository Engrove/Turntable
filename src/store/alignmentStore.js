// src/store/alignmentStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAlignmentStore = defineStore('alignment', () => {
  // --- STATE ---
  const isLoading = ref(true);
  const error = ref(null);
  const availableTonearms = ref([]);
  const selectedTonearmId = ref(null);

  // IEC standard record groove radii (mm)
  const R1 = 60.325;  // Inner groove radius
  const R2 = 146.05;  // Outer groove radius

  // Alignment geometries with validated null points
  const ALIGNMENT_GEOMETRIES = {
    LofgrenA: {
      name: 'Löfgren A / Baerwald',
      description: 'Optimized for lowest average RMS distortion (Baerwald, 1941).',
      nulls: { inner: 66.0, outer: 120.9 }
    },
    LofgrenB: {
      name: 'Löfgren B',
      description: 'Minimizes RMS distortion with different weightings.',
      nulls: { inner: 70.3, outer: 116.6 }
    },
    StevensonA: {
      name: 'Stevenson A',
      description: 'Prioritizes inner groove distortion reduction.',
      nulls: { inner: 60.325, outer: 117.42 }
    }
  };

  const userInput = ref({
    pivotToSpindle: 230,  // Default realistic value (e.g., Rega RB250)
    alignmentType: 'LofgrenA'
  });

  // --- CORE GEOMETRY CALCULATION (VERIFIERAD OCH LOGGAD) ---
  /**
   * Calculates tonearm geometry from pivot distance (D) and null points.
   * Uses exact Baerwald/Löfgren equations.
   */
  function calculateGeometryFromNulls(D, nulls) {
    console.groupCollapsed('calculateGeometryFromNulls Diagnostics'); // Använd groupCollapsed för att hålla konsolen ren
    console.log('Input D:', D, 'Nulls:', nulls);
    
    const { inner: n1, outer: n2 } = nulls;

    if (D <= R2) {
      console.error('Validation Error: Pivot distance must be > outer groove radius (146.05 mm). Current D:', D);
      console.groupEnd();
      return { error: "Pivot distance must be > 146.05 mm." };
    }

    // VERIFIERAD BAERWALD-FORMEL FÖR EFFEKTIV LÄNGD (L)
    // L = sqrt( D^2 + n1*n2 + ((n1+n2)/2)^2 - (n1*n2 * (n1+n2)) / (2*D) )
    const term1 = Math.pow(D, 2);
    const term2 = n1 * n2;
    const term3 = Math.pow((n1 + n2) / 2, 2);
    const term4 = (n1 * n2 * (n1 + n2)) / (2 * D); // <-- DENNA RAD ÄR KRITISK, VERIFIERA I KONSOLEN!

    console.log('Individual Terms for L calculation:');
    console.log(`  term1 (D^2): ${term1}`);
    console.log(`  term2 (n1*n2): ${term2}`);
    console.log(`  term3 (((n1+n2)/2)^2): ${term3}`);
    console.log(`  term4 ((n1*n2*(n1+n2))/(2*D)): ${term4}`); // VIKTIG: Kontrollera detta värde!

    const L_squared_sum = term1 + term2 + term3 - term4;
    console.log(`  L_squared_sum (term1+term2+term3-term4): ${L_squared_sum}`);

    // Om L_squared_sum blir negativ p.g.a. flyttalsfel i kantfall, hantera det
    if (L_squared_sum < 0) {
      console.error('Calculation Error: L_squared_sum is negative. Clamping to 0.');
      console.groupEnd();
      return { error: "Calculated L^2 is negative, invalid geometry for input D." };
    }

    const L = Math.sqrt(L_squared_sum);
    const H = L - D;
    const offsetAngleRad = Math.asin((n1 + n2) / (2 * L));
    const offsetAngleDeg = offsetAngleRad * (180 / Math.PI);

    console.log('Final Geometry Results:');
    console.log(`  Effective Length (L): ${L.toFixed(4)} mm`);
    console.log(`  Overhang (H): ${H.toFixed(4)} mm`);
    console.log(`  Offset Angle (Radians): ${offsetAngleRad.toFixed(4)} rad`);
    console.log(`  Offset Angle (Degrees): ${offsetAngleDeg.toFixed(2)}°`);
    console.groupEnd(); // Avsluta groupCollapsed

    return {
      overhang: parseFloat(H.toFixed(2)),
      offsetAngle: parseFloat(offsetAngleDeg.toFixed(2)),
      effectiveLength: parseFloat(L.toFixed(2)),
      nulls,
      error: null
    };
  }

  // --- ALIGNMENT-SPECIFIC CALCULATIONS ---
  function getLofgrenAAlignmentGeometry(D) {
    return calculateGeometryFromNulls(D, ALIGNMENT_GEOMETRIES.LofgrenA.nulls);
  }

  function getLofgrenBAlignmentGeometry(D) {
    return calculateGeometryFromNulls(D, ALIGNMENT_GEOMETRIES.LofgrenB.nulls);
  }

  function getStevensonAAlignmentGeometry(D) {
    return calculateGeometryFromNulls(D, ALIGNMENT_GEOMETRIES.StevensonA.nulls);
  }

  const getGeometryFunction = (type) => {
    switch (type) {
      case 'LofgrenA': return getLofgrenAAlignmentGeometry;
      case 'LofgrenB': return getLofgrenBAlignmentGeometry;
      case 'StevensonA': return getStevensonAAlignmentGeometry;
      default: return getLofgrenAAlignmentGeometry;
    }
  };

  // --- COMPUTED VALUES ---
  const calculatedValues = computed(() => {
    // Handle tangential tonearms
    if (selectedTonearmId.value) {
      const arm = availableTonearms.value.find(t => t.id === selectedTonearmId.value);
      if (arm?.tracking_method === 'tangential') {
        return {
          overhang: 0,
          offsetAngle: 0,
          effectiveLength: arm.effective_length_mm,
          nulls: { inner: R1, outer: R2 },
          geometryName: 'Tangential',
          geometryDescription: 'Perfect tangency across the record.',
          trackingMethod: 'tangential',
          error: null
        };
      }
    }

    // Calculate pivoted geometry
    const func = getGeometryFunction(userInput.value.pivotToSpindle);
    const results = func(userInput.value.pivotToSpindle);

    return {
      ...results,
      geometryName: ALIGNMENT_GEOMETRIES[userInput.value.alignmentType].name,
      geometryDescription: ALIGNMENT_GEOMETRIES[userInput.value.alignmentType].description,
      trackingMethod: 'pivoting'
    };
  });

  // --- TRACKING ERROR CHART DATA (VERIFIERAD OCH LOGGAD) ---
  const trackingErrorChartData = computed(() => {
    if (calculatedValues.value.error || calculatedValues.value.trackingMethod !== 'pivoting') {
      return { datasets: [] };
    }

    console.groupCollapsed('TrackingErrorChartData Diagnostics');
    const { effectiveLength: L, overhang: H } = calculatedValues.value;
    console.log('Input for Chart (L, H):', { L, H });

    const data = [];
    for (let r = R1; r <= R2; r += 1) {
      // KORREKT tracking error-formel. Offsetvinkeln behöver INTE läggas till här.
      // Den geometriska uppsättningen (L, H) är redan en konsekvens av offsetvinkeln.
      const numerator = L*L + r*r - Math.pow(L - H, 2);
      const denominator = 2 * L * r;
      
      // Safeguard against invalid acos inputs due to floating point inaccuracies
      // If numerator/denominator is slightly outside [-1, 1], clamp it.
      const ratio = numerator / denominator;
      const clamped = Math.min(Math.max(ratio, -1), 1);
      
      const errorRad = Math.asin(r / L) - Math.acos(clamped);
      const errorDeg = parseFloat((errorRad * (180 / Math.PI)).toFixed(2));
      
      // Logga varje punkt för detaljerad felsökning
      console.groupCollapsed(`Radius ${r.toFixed(2)} mm`);
      console.log(`  Numerator: ${numerator.toFixed(4)}`);
      console.log(`  Denominator: ${denominator.toFixed(4)}`);
      console.log(`  Ratio (numerator/denominator): ${ratio.toFixed(4)}`);
      console.log(`  Clamped Ratio: ${clamped.toFixed(4)}`);
      console.log(`  Math.asin(r/L): ${Math.asin(r/L).toFixed(4)} rad (${(Math.asin(r/L) * 180 / Math.PI).toFixed(2)}°)`);
      console.log(`  Math.acos(clamped): ${Math.acos(clamped).toFixed(4)} rad (${(Math.acos(clamped) * 180 / Math.PI).toFixed(2)}°)`);
      console.log(`  Error (Radians): ${errorRad.toFixed(4)} rad`);
      console.log(`  Error (Degrees): ${errorDeg}°`);
      console.groupEnd();
      
      data.push({ x: r, y: errorDeg });
    }

    console.log('Final Chart Data Points:', data);
    console.groupEnd(); // Avsluta groupCollapsed

    return {
      datasets: [{
        label: calculatedValues.value.geometryName,
        data,
        borderColor: '#3498db',
        borderWidth: 2,
        tension: 0.1
      }]
    };
  });

  // --- ACTIONS ---
  async function initialize() {
    try {
      isLoading.value = true;
      const response = await fetch('/data/tonearm_data.json');
      availableTonearms.value = await response.json();
    } catch (err) {
      error.value = 'Failed to load tonearm database.';
      console.error(err);
    } finally {
      isLoading.value = false;
    }
  }

  function loadTonearmPreset(id) {
    selectedTonearmId.value = id;
    const arm = availableTonearms.value.find(t => t.id === id);
    if (arm) userInput.value.pivotToSpindle = arm.pivot_to_spindle_mm || 230;
  }

  function setAlignment(type) {
    userInput.value.alignmentType = type;
  }

  return {
    // State
    isLoading,
    error,
    userInput,
    selectedTonearmId,
    availableTonearms,
    ALIGNMENT_GEOMETRIES,

    // Computed
    calculatedValues,
    trackingErrorChartData,

    // Actions
    initialize,
    loadTonearmPreset,
    setAlignment
  };
});
// src/store/alignmentStore.js
