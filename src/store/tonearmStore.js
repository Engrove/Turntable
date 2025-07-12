// src/store/tonearmStore.js
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import allTonearms from '/data/tonearm_data.json';
import allPickups from '/data/pickup_data.json';

export const useTonearmStore = defineStore('tonearm', () => {
    // --- STATE ---
    const params = ref({
        m_headshell: 6.5,
        m_pickup: 6.5,
        m_screws: 0.5,
        m_rear_assembly: 75.0,
        m_tube_percentage: 20.0,
        m4_adj_cw: 100,
        L1: 229,
        L2: 30.0,
        L3_fixed_cw: 22.0,
        vtf: 1.75,
        compliance: 12,
        // NYTT: State för direct mode
        calculationMode: 'detailed',
        directEffectiveMass: 10,
    });

    const availableTonearms = ref(allTonearms);
    const availablePickups = ref(allPickups);
    const selectedTonearmId = ref(null);
    const selectedPickupId = ref(null);

    // --- ACTIONS ---
    function loadTonearmPreset(id) {
        selectedTonearmId.value = id;
        if (!id) return;
        const preset = availableTonearms.value.find(t => t.id == id);
        if (preset && preset.example_params_for_calculator) {
            Object.assign(params.value, preset.example_params_for_calculator);
            params.value.L1 = preset.effective_length_mm;
        }
    }

    function loadCartridgePreset(id) {
        selectedPickupId.value = id;
        if (!id) return;
        const preset = availablePickups.value.find(p => p.id == id);
        if (preset) {
            params.value.m_pickup = preset.weight_g;
            params.value.compliance = preset.cu_dynamic_10hz;
            params.value.vtf = (preset.tracking_force_min_g + preset.tracking_force_max_g) / 2;
        }
    }
    
    // NYTT: Action för att byta läge
    function setCalculationMode(mode) {
        params.value.calculationMode = mode;
    }

    // --- GETTERS ---
    const m1 = computed(() => params.value.m_headshell + params.value.m_pickup + params.value.m_screws);
    
    // NYTT: Uppdaterad beräkningslogik
    const calculatedResults = computed(() => {
        if (params.value.calculationMode === 'direct') {
            const M_eff = params.value.directEffectiveMass;
            const F = 1000 / (2 * Math.PI * Math.sqrt(Math.max(1, M_eff * params.value.compliance)));
            return {
                M_eff,
                F,
                isUnbalanced: false,
                L4_adj_cw: NaN, // Not applicable in direct mode
                calculationMode: 'direct'
            };
        }

        // Detailed mode calculation
        const m2_tube = params.value.m_rear_assembly * (params.value.m_tube_percentage / 100.0);
        const m3_fixed_cw = params.value.m_rear_assembly - m2_tube;
        const numerator = (m1.value * params.value.L1) + (m2_tube * params.value.L2) - (m3_fixed_cw * params.value.L3_fixed_cw) - (params.value.vtf * params.value.L1);
        
        const isUnbalanced = numerator < 0 || params.value.m4_adj_cw <= 0;
        const L4_adj_cw = isUnbalanced ? 0 : numerator / params.value.m4_adj_cw;

        if (isUnbalanced) {
            return { M_eff: 0, F: 0, L4_adj_cw, isUnbalanced, calculationMode: 'detailed' };
        }

        const I1 = m1.value * (params.value.L1 ** 2);
        const I2 = m2_tube * (params.value.L2 ** 2);
        const I3 = m3_fixed_cw * (params.value.L3_fixed_cw ** 2);
        const I4 = params.value.m4_adj_cw * (L4_adj_cw ** 2);
        const Itot = I1 + I2 + I3 + I4;
        const M_eff = Itot / (params.value.L1 ** 2);
        const F = 1000 / (2 * Math.PI * Math.sqrt(Math.max(1, M_eff * params.value.compliance)));

        return { M_eff, F, L4_adj_cw, isUnbalanced, calculationMode: 'detailed' };
    });

    const diagnosis = computed(() => {
        const F = calculatedResults.value.F;
        if (calculatedResults.value.isUnbalanced && params.value.calculationMode === 'detailed') {
            return { status: 'danger', title: 'Unbalanced System', recommendations: ['Arm cannot be balanced with current settings.', 'Increase counterweight mass or reduce front mass.'] };
        }
        if (F >= 8 && F <= 11) {
            return { status: 'ideal', title: 'Ideal Match', recommendations: ['Excellent compatibility, minimal risk of resonance issues.'] };
        }
        if ((F > 7 && F < 8) || (F > 11 && F < 12)) {
            return { status: 'warning', title: 'Acceptable Match', recommendations: ['Generally fine, but monitor for sensitivity to footfalls or motor rumble.'] };
        }
        if (F <= 7) {
            return { status: 'danger', title: 'Low Resonance (High Risk)', recommendations: ['High risk of amplifying rumble and skipping from footfalls.', 'Use a lighter cartridge/headshell or a lower compliance cartridge.'] };
        }
        if (F >= 12) {
            return { status: 'danger', title: 'High Resonance (High Risk)', recommendations: ['Resonance may interfere with audible bass frequencies.', 'Use a heavier cartridge/headshell or a higher compliance cartridge.'] };
        }
        return { status: 'none', title: 'Enter Parameters', recommendations: ['Adjust sliders to see results.'] };
    });

    const currentTonearm = computed(() => {
        if (!selectedTonearmId.value) return null;
        const arm = availableTonearms.value.find(t => t.id == selectedTonearmId.value);
        return arm ? { ...arm, has_integrated_headshell: arm.headshell_connector === 'integrated' } : null;
    });

    return {
        params,
        availableTonearms,
        availablePickups,
        selectedTonearmId,
        selectedPickupId,
        loadTonearmPreset,
        loadCartridgePreset,
        setCalculationMode,
        m1,
        calculatedResults,
        diagnosis,
        currentTonearm
    };
});
