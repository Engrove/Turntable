// src/store/tonearmStore.js
import { defineStore } from 'pinia';
import { fetchJsonData } from '@/services/dataLoader.js';
import { computed, reactive, watch } from 'vue';

export const useTonearmStore = defineStore('tonearm', () => {
  // === STATE ===
  const params = reactive({
    m_headshell: 6.5, m_pickup: 6.5, m_screws: 0.5,
    m_rear_assembly: 75, m_tube_percentage: 20, m4_adj_cw: 100,
    L1: 229, L2: 30, L3_fixed_cw: 20,
    vtf: 1.75, compliance: 12,
    calculationMode: 'detailed',
    directEffectiveMass: 12,
  });

  const availableTonearms = ref([]);
  const availablePickups = ref([]);
  const selectedTonearmId = ref(null);
  const selectedPickupId = ref(null);
  const isLoading = ref(true);
  const error = ref(null);

  // === GETTERS (som computed properties) ===
  const m1 = computed(() => params.m_headshell + params.m_pickup + params.m_screws);
  const m2_tube = computed(() => params.m_rear_assembly * (params.m_tube_percentage / 100.0));
  const m3_fixed_cw = computed(() => params.m_rear_assembly - m2_tube.value);
  
  const currentTonearm = computed(() => availableTonearms.value.find(arm => arm.id === selectedTonearmId.value) || null);
  
  const calculatedResults = computed(() => {
    if (params.calculationMode === 'direct') {
        const M_eff = params.directEffectiveMass;
        const F = 1000 / (2 * Math.PI * Math.sqrt(Math.max(1, M_eff * params.compliance)));
        return { M_eff, F, isUnbalanced: false };
    }
    
    if (params.m4_adj_cw <= 0) {
        return { L4_adj_cw: -1, M_eff: NaN, F: NaN, isUnbalanced: true };
    }
    const numerator = (m1.value * params.L1) + (m2_tube.value * params.L2) - (m3_fixed_cw.value * params.L3_fixed_cw) - (params.vtf * params.L1);
    const L4_adj_cw = (numerator >= 0) ? numerator / params.m4_adj_cw : -1;
    
    if (L4_adj_cw < 0) {
        return { L4_adj_cw: -1, M_eff: NaN, F: NaN, isUnbalanced: true };
    }

    const I1 = m1.value * (params.L1 ** 2);
    const I2 = m2_tube.value * (params.L2 ** 2);
    const I3 = m3_fixed_cw.value * (params.L3_fixed_cw ** 2);
    const I4 = params.m4_adj_cw * (L4_adj_cw ** 2);
    const Itot = I1 + I2 + I3 + I4;
    const M_eff = Itot / (params.L1 ** 2);
    const F = 1000 / (2 * Math.PI * Math.sqrt(Math.max(1, M_eff * params.compliance)));
    
    return { L4_adj_cw, M_eff, F, isUnbalanced: false };
  });
  
  const diagnosis = computed(() => {
    if (calculatedResults.value.isUnbalanced) return { status: 'danger', title: 'Unbalanced System', recommendations: ['The tonearm cannot be balanced with the current parameters. Increase counterweight mass or reduce front mass.'] };
    const f = calculatedResults.value.F;
    if (f >= 8 && f <= 11) return { status: 'ideal', title: 'Ideal Match', recommendations: ['The tonearm and cartridge are an excellent match. The resonance is in the ideal range.'] };
    if (f > 11 && f <= 12) return { status: 'warning', title: 'Acceptable, but Not Ideal', recommendations: ['This combination is usable, but could be improved. Consider minor adjustments to headshell or counterweight mass.'] };
    if (f < 8 && f >= 7) return { status: 'warning', title: 'Acceptable, but risk of rumble', recommendations: ['The resonance is on the low side. This may cause issues with warped records. A lighter headshell or heavier cartridge could help.'] };
    return { status: 'danger', title: 'Poor Match', recommendations: ['This combination is not recommended. The resonance frequency is outside the acceptable range, which will likely lead to audible problems.'] };
  });

  // === ACTIONS ===
  async function initialize() {
    isLoading.value = true;
    error.value = null;
    try {
      const [tonearmData, pickupData] = await Promise.all([
        fetchJsonData('/data/tonearm_data.json'),
        fetchJsonData('/data/pickup_data.json')
      ]);
      availableTonearms.value = tonearmData;
      availablePickups.value = pickupData;
    } catch (err) {
      error.value = `Failed to load database: ${err.message}`;
    } finally {
      isLoading.value = false;
    }
  }

  function loadTonearmPreset(id) {
    selectedTonearmId.value = id;
    const arm = availableTonearms.value.find(a => a.id == id);
    if (arm) {
      params.L1 = arm.effective_length_mm;
      const calc = arm.example_params_for_calculator || {};
      params.m_rear_assembly = calc.m_rear_assembly || 75;
      params.m_tube_percentage = calc.m_tube_percentage || 20;
      params.L2 = calc.L2 || 30;
      params.L3_fixed_cw = calc.L3_fixed_cw || 20;
      params.m_headshell = arm.has_integrated_headshell ? 0 : (calc.m_headshell || 6.5);
    }
  }

  function loadCartridgePreset(id) {
    selectedPickupId.value = id;
    const pickup = availablePickups.value.find(p => p.id == id);
    if (pickup) {
      params.m_pickup = pickup.weight_g;
      params.vtf = (pickup.tracking_force_min_g + pickup.tracking_force_max_g) / 2 || 1.75;
      params.compliance = pickup.cu_dynamic_10hz;
    }
  }

  function setCalculationMode(mode) {
    params.calculationMode = mode;
  }
  
  function getReportData() {
    return {
      type: 'tonearm',
      params: { ...params },
      results: { ...calculatedResults.value },
      diagnosis: { ...diagnosis.value },
      // Skicka med nödvändiga beräknade värden för visualisering
      m1: m1.value,
      m2_tube: m2_tube.value,
      m3_fixed_cw: m3_fixed_cw.value,
      currentTonearm: currentTonearm.value ? { ...currentTonearm.value } : null
    };
  }
  
  return {
    params,
    availableTonearms, availablePickups, selectedTonearmId, selectedPickupId,
    isLoading, error,
    m1, m2_tube, m3_fixed_cw, currentTonearm,
    calculatedResults, diagnosis,
    initialize, loadTonearmPreset, loadCartridgePreset, setCalculationMode, getReportData
  };
});
