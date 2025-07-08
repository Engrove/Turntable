import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useTonearmStore = defineStore('tonearm', () => {
    // --- STATE ---
    const params = ref({
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

        const I1 = m1.value * (p.L1 ** 2);
        const I2 = m2_tube.value * (p.L2 ** 2);
        const I3 = m3_fixed_cw.value * (p.L3_fixed_cw ** 2);
        const I4 = p.m4_adj_cw * (L4_adj_cw ** 2);
        const Itot = I1 + I2 + I3 + I4;
        
        const M_eff = Itot / (p.L1 ** 2);
        const F = 1000 / (2 * Math.PI * Math.sqrt(Math.max(1, M_eff * p.compliance)));

        return { L4_adj_cw, M_eff, F, isUnbalanced: false };
    });
    
    const diagnosis = computed(() => {
        if (!calculatedResults.value || calculatedResults.value.isUnbalanced) {
            return {
                text: 'The arm cannot be balanced. Try a heavier adjustable counterweight or a lighter headshell.',
                className: 'danger'
            };
        }
        const freq = calculatedResults.value.F;
        if (freq >= 8.0 && freq <= 11.0) {
            return { text: 'CONGRATULATIONS! The system is very well matched.', className: 'ideal' };
        }
    
        let recommendations = [];
        if (freq < 8.0) { // Too low, need to increase frequency (decrease M_eff)
            recommendations = [
                '1. Reduce Headshell Mass: This has the highest impact.',
                '2. Increase Adjustable Counterweight Mass: This moves the CW closer to the pivot, reducing inertia.'
            ];
        } else { // Too high, need to decrease frequency (increase M_eff)
            recommendations = [
                '1. Increase Headshell Mass: Add a headshell weight or use a heavier shell.',
                '2. Decrease Adjustable Counterweight Mass: This moves the CW further away, increasing inertia.'
            ];
        }

        if (freq >= 7.0 && freq < 8.0 || freq > 11.0 && freq <= 12.0) {
            return { text: `ACCEPTABLE, but consider these adjustments: ${recommendations.join(' ')}`, className: 'warning' };
        }
        
        const status = freq < 7.0 ? 'TOO LOW' : 'TOO HIGH';
        return { text: `DANGER! Resonance is ${status}. Recommended actions: ${recommendations.join(' ')}`, className: 'danger' };
    });

    return { params, m1, calculatedResults, diagnosis };
});
