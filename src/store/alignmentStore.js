// src/store/alignmentStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAlignmentStore = defineStore('alignment', () => {
  // [Initial state and constants unchanged...]

  function calculateGeometryFromNulls(D, nulls) {
    console.group('calculateGeometryFromNulls');
    console.log('Input:', { D, nulls });
    
    const { inner: n1, outer: n2 } = nulls;
    if (D <= R2) {
      console.error('Invalid pivot distance:', D);
      return { error: "Pivot distance must be > 146.05 mm." };
    }

    // Log each term separately
    const term1 = D*D;
    const term2 = n1*n2;
    const term3 = Math.pow((n1 + n2)/2, 2);
    const term4 = (n1 * n2 * (n1 + n2)) / (2 * D);
    console.log('Terms:', { term1, term2, term3, term4 });

    const L = Math.sqrt(term1 + term2 + term3 - term4);
    const H = L - D;
    const offsetAngleRad = Math.asin((n1 + n2) / (2 * L));
    const offsetAngleDeg = offsetAngleRad * (180 / Math.PI);

    console.log('Results:', { L, H, offsetAngleRad, offsetAngleDeg });
    console.groupEnd();

    return {
      overhang: H,
      offsetAngle: offsetAngleDeg,
      effectiveLength: L,
      nulls,
      error: null
    };
  }

  const trackingErrorChartData = computed(() => {
    if (calculatedValues.value.error || calculatedValues.value.trackingMethod !== 'pivoting') {
      return { datasets: [] };
    }

    console.group('trackingErrorChartData Computation');
    const { effectiveLength: L, overhang: H } = calculatedValues.value;
    console.log('Input params:', { L, H, R1, R2 });

    const data = [];
    for (let r = R1; r <= R2; r += 1) {
      const numerator = L*L + r*r - Math.pow(L - H, 2);
      const denominator = 2 * L * r;
      const ratio = numerator / denominator;
      const clamped = Math.min(Math.max(ratio, -1), 1);
      
      console.group(`Radius ${r}mm`);
      console.log({ numerator, denominator, ratio, clamped });

      const asinVal = Math.asin(r / L);
      const acosVal = Math.acos(clamped);
      const errorRad = asinVal - acosVal;
      const errorDeg = errorRad * (180 / Math.PI);

      console.log({ 
        asin: { val: asinVal, deg: asinVal * (180/Math.PI) },
        acos: { val: acosVal, deg: acosVal * (180/Math.PI) },
        errorRad,
        errorDeg
      });
      console.groupEnd();

      data.push({ x: r, y: errorDeg });
    }

    console.log('Final data points:', data);
    console.groupEnd();

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

  // [Rest of the code unchanged...]
});
