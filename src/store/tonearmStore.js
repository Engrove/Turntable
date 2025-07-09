import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTonearmStore = defineStore('tonearm', () => {
    // --- STATE ---
    const params = ref({
        m_headshell: 11.4, m_pickup: 6.3, m_screws: 1.3,
        m_rear_assembly: 63.0, m_tube_percentage: 35.0,
        m4_adj_cw: 100.0, L1: 237.0, L2: 15.0, L3_fixed_cw: 12.5,
        vtf: 1.75, compliance: 10.0,
    });

    // --- COMPUTED PROPERTIES ---
    const m1 = computed(() => params.value.m_headshell + params.value.m_pickup + params.value.m_screws);
    const m2_tube = computed(() => params.value.m_rear_assembly * (params.value.m_tube_percentage / 100.0));
    const m3_fixed_cw = computed(() => params.value.m_rear_assembly - m2_tube.value);

    const calculatedResults = computed(() => {
        const p = params.value;
        if (p.m4_adj_cw <= 0) return { isUnbalanced: true, M_eff: 0, F: 0, L4_adj_cw: 0 };
        const numerator = (m1.value * p.L1) + (m2_tube.value * p.L2) - (m3_fixed_cw.value * p.L3_fixed_cw) - (p.vtf * p.L1);
        const L4_adj_cw = (numerator >= 0) ? numerator / p.m4_adj_cw : -1;
        if (L4_adj_cw < 0) return { isUnbalanced: true, M_eff: 0, F: 0, L4_adj_cw: 0 };
        const I1 = m1.value * (p.L1 ** 2), I2 = m2_tube.value * (p.L2 ** 2), I3 = m3_fixed_cw.value * (p.L3_fixed_cw ** 2), I4 = p.m4_adj_cw * (L4_adj_cw ** 2);
        const Itot = I1 + I2 + I3 + I4;
        const M_eff = Itot / (p.L1 ** 2);
        const F = 1000 / (2 * Math.PI * Math.sqrt(Math.max(1, M_eff * p.compliance)));
        return { L4_adj_cw, M_eff, F, Itot, isUnbalanced: false };
    });
    
    const diagnosis = computed(() => {
        if (!calculatedResults.value || calculatedResults.value.isUnbalanced) {
            return {
                status: 'danger',
                title: 'Arm Unbalanced',
                recommendations: ['The arm cannot be balanced with the current parameters.', 'Try increasing the adjustable counterweight mass or reducing the headshell mass.']
            };
        }
        const freq = calculatedResults.value.F;
        if (freq >= 8.0 && freq <= 11.0) {
            return { status: 'ideal', title: 'Excellent Match!', recommendations: ['The system resonance is perfectly within the ideal range (8-11 Hz).'] };
        }
        if (freq >= 7.0 && freq < 8.0 || freq > 11.0 && freq <= 12.0) {
            return { status: 'warning', title: 'Acceptable Match', recommendations: ['The system is slightly outside the ideal range but may perform well.'] };
        }
        
        const isTooLow = freq < 7.0;
        const target_M_eff = (1000 / (2 * Math.PI * 10))**2 / params.value.compliance;
        const delta_M_eff = target_M_eff - calculatedResults.value.M_eff;

        let recommendations = [];
        if (isTooLow) {
             recommendations.push(
                `Effective mass is too high. It needs to be reduced by approx. ${Math.abs(delta_M_eff).toFixed(1)}g to reach 10 Hz.`,"Priority Actions:",
                "1. INCREASE Adjustable Counterweight Mass: This is the most effective, non-obvious solution. A heavier weight sits closer to the pivot, drastically reducing its inertia.",
                "2. REDUCE Headshell/Cartridge Mass: The most direct way to lower the frontal mass moment."
            );
        } else {
            recommendations.push(
                `Effective mass is too low. It needs to be increased by approx. ${delta_M_eff.toFixed(1)}g to reach 10 Hz.`, "Priority Actions:",
                "1. INCREASE Headshell Mass: Add a headshell weight or use a heavier headshell.",
                "2. DECREASE Adjustable Counterweight Mass: A lighter weight must sit further back, increasing its inertia."
            );
        }

        return {
            status: 'danger',
            title: `Resonance Frequency is TOO ${isTooLow ? 'LOW' : 'HIGH'} (${freq.toFixed(1)} Hz)`,
            recommendations: recommendations
        };
    });

    return { params, m1, calculatedResults, diagnosis };
});
