import { defineStore } from 'pinia'
import { reactive, computed } from 'vue'

export const useTonearmStore = defineStore('tonearm', () => {
  // --- STATE ---
  // Använder reactive() för ett state-objekt. Då slipper vi .value överallt.
  const params = reactive({
    m_headshell: 11.4,
    m_pickup: 6.3,
    m_screws: 1.3,
    m_rear_assembly: 63.0,
    m4_adj_cw: 100.0,
    L1: 237.0,
    vtf: 1.75,
    compliance: 10.0,
    m_tube_percentage: 35.0,
    L2: 15.0,
    L3_fixed_cw: 12.5,
  });

  // --- COMPUTED PROPERTIES (Beräknade värden) ---

  const m1 = computed(() => params.m_headshell + params.m_pickup + params.m_screws);
  const m2_tube = computed(() => params.m_rear_assembly * (params.m_tube_percentage / 100.0));
  const m3_fixed_cw = computed(() => params.m_rear_assembly - m2_tube.value);

  const calculatedResults = computed(() => {
    // Nu behöver vi inte "p = params.value", vi kan använda "params" direkt.
    if (params.m4_adj_cw <= 0) return { isUnbalanced: true, M_eff: 0, F: 0, L4_adj_cw: -1 };

    const numerator = (m1.value * params.L1) + (m2_tube.value * params.L2) - (m3_fixed_cw.value * params.L3_fixed_cw) - (params.vtf * params.L1);
    const L4_adj_cw = (numerator >= 0) ? numerator / params.m4_adj_cw : -1;

    if (L4_adj_cw < 0) return { isUnbalanced: true, M_eff: 0, F: 0, L4_adj_cw: -1 };

    const Itot = (m1.value * params.L1**2) + (m2_tube.value * params.L2**2) + (m3_fixed_cw.value * params.L3_fixed_cw**2) + (params.m4_adj_cw * L4_adj_cw**2);
    const M_eff = Itot / (params.L1 ** 2);
    const F = 1000 / (2 * Math.PI * Math.sqrt(Math.max(1, M_eff * params.compliance)));

    return { L4_adj_cw, M_eff, F, isUnbalanced: false };
  });
  
  // Behåller din utmärkta diagnos-logik!
  const diagnosis = computed(() => {
    if (!calculatedResults.value || calculatedResults.value.isUnbalanced) {
        return {
            text: 'The arm cannot be balanced. Try a heavier adjustable counterweight or a lighter headshell.',
            className: 'danger'
        };
    }
    const freq = calculatedResults.value.F;
    if (freq >= 8.0 && freq <= 11.0) {
        return { text: `CONGRATULATIONS! Resonance is ideal at ${freq.toFixed(1)} Hz.`, className: 'ideal' };
    }
    if (freq >= 7.0 && freq < 8.0 || freq > 11.0 && freq <= 12.0) {
        return { text: `ACCEPTABLE. Resonance at ${freq.toFixed(1)} Hz is slightly outside the ideal range.`, className: 'warning' };
    }
    const status = freq < 7.0 ? 'TOO LOW' : 'TOO HIGH';
    return { text: `DANGER! Resonance frequency of ${freq.toFixed(1)} Hz is ${status}. Re-evaluation is advised.`, className: 'danger' };
  });

  return { params, m1, calculatedResults, diagnosis };
});```

Med denna uppdaterade store kommer din applikation att fungera som förväntat och graferna kommer att ritas korrekt från start.
