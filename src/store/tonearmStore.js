import { ref, computed, watch } from 'vue'; // Korrigerat från 'pinia' till 'vue'
import { defineStore } from 'pinia';
import { useRouter } from 'vue-router';

export const useTonearmStore = defineStore('tonearm', () => {
    
    // STATE
    const params = ref({
        m_headshell: 6.5, m_pickup: 6.5, m_screws: 0.5,
        m_rear_assembly: 75, m_tube_percentage: 20, m4_adj_cw: 100,
        L1: 229, L2: 30, L3_fixed_cw: 20,
        vtf: 1.75, compliance: 12,
        calculationMode: 'detailed',
        directEffectiveMass: 12.0
    });

    const availableTonearms = ref([]);
    const availablePickups = ref([]);
    const selectedTonearmId = ref(null);
    const selectedPickupId = ref(null);
    const isLoading = ref(true);
    const error = ref(null);

    // GETTERS (computed properties)
    const m1 = computed(() => params.value.m_headshell + params.value.m_pickup + params.value.m_screws);
    const m2_tube = computed(() => params.value.m_rear_assembly * (params.value.m_tube_percentage / 100.0));
    const m3_fixed_cw = computed(() => params.value.m_rear_assembly - m2_tube.value);
    const currentTonearm = computed(() => availableTonearms.value.find(t => t.id === selectedTonearmId.value) || null);

    const calculatedResults = computed(() => {
        if (params.value.calculationMode === 'direct') {
            const M_eff = params.value.directEffectiveMass;
            const F = 1000 / (2 * Math.PI * Math.sqrt(Math.max(1, M_eff * params.value.compliance)));
            return { M_eff, F, L4_adj_cw: 0, isUnbalanced: false };
        }

        const numerator = (m1.value * params.value.L1) + (m2_tube.value * params.value.L2) - (m3_fixed_cw.value * params.value.L3_fixed_cw) - (params.value.vtf * params.value.L1);
        if (params.value.m4_adj_cw <= 0 || numerator < 0) {
            return { M_eff: NaN, F: NaN, L4_adj_cw: NaN, isUnbalanced: true };
        }
        
        const L4_adj_cw = numerator / params.value.m4_adj_cw;
        const I1 = m1.value * (params.value.L1 ** 2);
        const I2 = m2_tube.value * (params.value.L2 ** 2);
        const I3 = m3_fixed_cw.value * (params.value.L3_fixed_cw ** 2);
        const I4 = params.value.m4_adj_cw * (L4_adj_cw ** 2);
        const Itot = I1 + I2 + I3 + I4;
        const M_eff = Itot / (params.value.L1 ** 2);
        const F = 1000 / (2 * Math.PI * Math.sqrt(Math.max(1, M_eff * params.value.compliance)));

        return { M_eff, F, L4_adj_cw, isUnbalanced: false };
    });

    const diagnosis = computed(() => {
        const f = calculatedResults.value.F;
        if (isNaN(f)) return { status: 'none', title: '', recommendations: [] };

        if (f >= 8 && f <= 11) {
            return { status: 'ideal', title: 'Ideal Match', recommendations: ['Excellent compatibility. No changes needed.'] };
        } else if ((f >= 7 && f < 8) || (f > 11 && f <= 12)) {
            return { status: 'warning', title: 'Acceptable, but Not Ideal', recommendations: ['This combination is usable, but could be improved. Consider minor adjustments to headshell or counterweight mass.'] };
        } else if (f < 7) {
            return { status: 'danger', title: 'Potential Mismatch (Too Low)', recommendations: ['Resonance is too low. Risk of skipping and poor warp handling. Use a lighter headshell/cartridge or a heavier tonearm.'] };
        } else { // f > 12
            return { status: 'danger', title: 'Potential Mismatch (Too High)', recommendations: ['Resonance is too high. Risk of thin bass and audible coloration. Use a heavier headshell/cartridge or a lighter tonearm.'] };
        }
    });

    // ACTIONS
    const initialize = async () => {
        try {
            const [tonearmResponse, pickupResponse] = await Promise.all([
                fetch('/data/tonearm_data.json'),
                fetch('/data/pickup_data.json')
            ]);
            if (!tonearmResponse.ok || !pickupResponse.ok) throw new Error('Network response was not ok.');
            availableTonearms.value = await tonearmResponse.json();
            availablePickups.value = await pickupResponse.json();
            isLoading.value = false;
        } catch (e) {
            error.value = e.message;
            isLoading.value = false;
        }
    };

    const loadTonearmPreset = (id) => {
        selectedTonearmId.value = parseInt(id, 10);
        const arm = availableTonearms.value.find(t => t.id === selectedTonearmId.value);
        if (arm) {
            const p = arm.example_params_for_calculator;
            params.value.m_rear_assembly = p.m_rear_assembly;
            params.value.m_tube_percentage = p.m_tube_percentage;
            params.value.L1 = arm.effective_length_mm;
            params.value.L2 = p.L2;
            params.value.L3_fixed_cw = p.L3_fixed_cw;
            if (arm.headshell_connector === 'integrated') {
                params.value.m_headshell = 0;
            }
        }
    };
    
    const loadCartridgePreset = (id) => {
        selectedPickupId.value = parseInt(id, 10);
        const pickup = availablePickups.value.find(p => p.id === selectedPickupId.value);
        if (pickup) {
            params.value.m_pickup = pickup.weight_g;
            params.value.compliance = pickup.cu_dynamic_10hz;
            if (pickup.tracking_force_min_g && pickup.tracking_force_max_g) {
                params.value.vtf = (pickup.tracking_force_min_g + pickup.tracking_force_max_g) / 2;
            }
        }
    };

    const setCalculationMode = (mode) => {
        params.value.calculationMode = mode;
    };

    const getReportData = () => {
      return {
        type: 'tonearm',
        params: params.value,
        results: calculatedResults.value,
        diagnosis: diagnosis.value
      };
    };

    return { 
        params, m1, m2_tube, m3_fixed_cw, calculatedResults, diagnosis, isLoading, error,
        availableTonearms, availablePickups, selectedTonearmId, selectedPickupId, currentTonearm,
        initialize, loadTonearmPreset, loadCartridgePreset, setCalculationMode,
        getReportData
    };
});
