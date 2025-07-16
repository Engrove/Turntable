// src/store/tonearmStore.js
import { defineStore } from 'pinia';
// BORTTAGET: Beroendet av pickupStore tas bort. Denna store hanterar bara tonarmar.

export const useTonearmStore = defineStore('tonearm', {
  state: () => ({
    // befintliga states
    availableTonearms: [],
    availablePickups: [], // Detta kan tas bort, men vi låter det vara för att undvika fler fel om något refererar till det.
    isLoading: true,
    error: null,
    
    // Användarparametrar
    params: {
        calculationMode: 'detailed',
        m_headshell: 6.5, m_pickup: 6.5, m_screws: 0.5,
        m_rear_assembly: 75.0, m_tube_percentage: 20, m4_adj_cw: 100.0,
        L1: 229.0, L2: 30.0, L3_fixed_cw: 25.0,
        vtf: 1.75, compliance: 12.0,
        directEffectiveMass: 10.0,
    },
    selectedTonearmId: null,
    selectedPickupId: null,
  }),

  getters: {
    m1: (state) => state.params.m_headshell + state.params.m_pickup + state.params.m_screws,
    m2_tube: (state) => state.params.m_rear_assembly * (state.params.m_tube_percentage / 100.0),
    m3_fixed_cw: (state) => state.params.m_rear_assembly * (1 - state.params.m_tube_percentage / 100.0),
    currentTonearm: (state) => state.availableTonearms.find(t => t.id == state.selectedTonearmId) || null,
    currentPickup: (state) => state.availablePickups.find(p => p.id == state.selectedPickupId) || null,

    calculatedResults(state) {
        if (state.params.calculationMode === 'direct') {
             const M_eff = state.params.directEffectiveMass;
             if (M_eff > 0 && state.params.compliance > 0) {
                 const F = 1000 / (2 * Math.PI * Math.sqrt(M_eff * state.params.compliance));
                 return { M_eff, F, isUnbalanced: false };
             }
             return { M_eff: 0, F: 0, isUnbalanced: true };
        }

        const m1 = this.m1;
        const L4_numerator = (m1 * state.params.L1) + (this.m2_tube * state.params.L2) - (this.m3_fixed_cw * state.params.L3_fixed_cw) - (state.params.vtf * state.params.L1);
        
        if (state.params.m4_adj_cw <= 0 || L4_numerator < 0) {
            return { M_eff: 0, F: 0, L4_adj_cw: 0, isUnbalanced: true };
        }
        
        const L4_adj_cw = L4_numerator / state.params.m4_adj_cw;
        const I_tot = (m1 * state.params.L1**2) + (this.m2_tube * state.params.L2**2) + (this.m3_fixed_cw * state.params.L3_fixed_cw**2) + (state.params.m4_adj_cw * L4_adj_cw**2);
        const M_eff = I_tot / (state.params.L1**2);
        
        if (M_eff <= 0 || state.params.compliance <= 0) {
            return { M_eff: M_eff, F: 0, L4_adj_cw: L4_adj_cw, isUnbalanced: true };
        }
        
        const F = 1000 / (2 * Math.PI * Math.sqrt(M_eff * state.params.compliance));
        return { M_eff, F, L4_adj_cw, isUnbalanced: false };
    },
    diagnosis(state) {
        const freq = this.calculatedResults.F;
        if (this.calculatedResults.isUnbalanced) {
            return { status: 'danger', title: 'Unbalanced System', recommendations: ['The tonearm cannot be balanced with the current parameters. Adjust counterweight mass or position.'] };
        }
        if (freq >= 8 && freq <= 11) return { status: 'ideal', title: 'Ideal Match', recommendations: ['Excellent compatibility. The system resonance is in the ideal range.'] };
        if (freq > 11 && freq <= 14) return { status: 'warning', title: 'Leans Towards Brightness', recommendations: ['Acceptable, but resonance may slightly emphasize low bass frequencies. Consider a slightly heavier headshell or a higher compliance cartridge.'] };
        if (freq < 8 && freq >= 7) return { status: 'warning', title: 'Slightly Sub-Optimal', recommendations: ['Acceptable, but may be sensitive to warped records. Consider a lighter headshell or a lower compliance cartridge.'] };
        if (freq > 14) return { status: 'danger', title: 'Poor Match (Too High)', recommendations: ['Resonance is in the audible bass range, likely causing a "boomy" sound. A higher compliance cartridge or heavier tonearm/headshell is strongly recommended.'] };
        if (freq < 7) return { status: 'danger', title: 'Poor Match (Too Low)', recommendations: ['Resonance is in the warp/rumble frequency range, which can cause tracking issues. A lower compliance cartridge or lighter tonearm/headshell is strongly recommended.'] };
        return { status: 'none', title: '', recommendations: [] };
    }
  },

  actions: {
    async initialize() {
        if (this.availableTonearms.length > 0) {
            this.isLoading = false;
            return;
        }
        this.isLoading = true;
        this.error = null;
        try {
            // Laddar bara tonarmsdata
            const tonearmResponse = await fetch('/data/tonearm_data.json');
            if (!tonearmResponse.ok) throw new Error('Failed to fetch tonearm data');
            this.availableTonearms = await tonearmResponse.json();
        } catch (e) {
            this.error = `Database initialization failed: ${e.message}`;
            console.error(e);
        } finally {
            this.isLoading = false;
        }
    },
    
    setCalculationMode(mode) { this.params.calculationMode = mode; },

    loadTonearmPreset(id) {
        this.selectedTonearmId = id;
        if (id === null) return;
        const tonearm = this.currentTonearm;
        if (tonearm) {
            if (tonearm.effective_length_mm) this.params.L1 = tonearm.effective_length_mm;
            if (tonearm.example_params_for_calculator) {
                const params = tonearm.example_params_for_calculator;
                this.params.m_rear_assembly = params.m_rear_assembly || this.params.m_rear_assembly;
                this.params.m_tube_percentage = params.m_tube_percentage || this.params.m_tube_percentage;
                this.params.L2 = params.L2 || this.params.L2;
                this.params.L3_fixed_cw = params.L3_fixed_cw || this.params.L3_fixed_cw;
                this.params.m_headshell = params.m_headshell || 0;
            }
        }
    },

    loadCartridgePreset(id) {
        this.selectedPickupId = id;
        if (id === null) return;
        const pickup = this.availablePickups.find(p => p.id == id);
        if (pickup) {
            this.params.m_pickup = pickup.weight_g || this.params.m_pickup;
            this.params.compliance = pickup.cu_dynamic_10hz || this.params.compliance;
            if (pickup.tracking_force_min_g && pickup.tracking_force_max_g) {
                this.params.vtf = (pickup.tracking_force_min_g + pickup.tracking_force_max_g) / 2;
            }
        }
    },

    getReportData() {
        return {
            type: 'tonearm',
            params: this.params,
            results: this.calculatedResults,
            diagnosis: this.diagnosis,
            m1: this.m1,
            m2_tube: this.m2_tube,
            m3_fixed_cw: this.m3_fixed_cw,
        };
    },
  },
});
