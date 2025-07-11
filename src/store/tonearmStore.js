// src/store/tonearmStore.js

import { ref, computed, watch } from 'vue';
import { defineStore } from 'pinia';

export const useTonearmStore = defineStore('tonearm', () => {
  // --- STATE ---
  const params = ref({
    m_headshell: 9.5,
    m_pickup: 6.5,
    m_screws: 0.5,
    m_rear_assembly: 85.0,
    m_tube_percentage: 25.0,
    m4_adj_cw: 120.0,
    L1: 229.0,
    L2: 30.0,
    L3_fixed_cw: 20.0,
    vtf: 1.75,
    compliance: 12.0,
  });

  const availableTonearms = ref([]);
  const availablePickups = ref([]); // Ladda in pickuper för framtida bruk
  const selectedTonearmId = ref(null);
  const isLoading = ref(true);
  const error = ref(null);

  // --- ACTIONS ---
  async function initialize() {
    isLoading.value = true;
    error.value = null;
    try {
      const [tonearmsRes, pickupsRes] = await Promise.all([
        fetch('/data/tonearm_data.json'),
        fetch('/data/pickup_data.json')
      ]);
      if (!tonearmsRes.ok) throw new Error('Could not load tonearm data.');
      if (!pickupsRes.ok) throw new Error('Could not load pickup data.');
      
      availableTonearms.value = await tonearmsRes.json();
      availablePickups.value = await pickupsRes.json();
    } catch (e) {
      error.value = e.message;
      console.error("Failed to initialize tonearm store:", e);
    } finally {
      isLoading.value = false;
    }
  }

  function loadTonearmPreset(tonearmId) {
    if (!tonearmId) {
      selectedTonearmId.value = null;
      return;
    }

    const preset = availableTonearms.value.find(t => t.id === tonearmId);
    if (!preset) return;

    selectedTonearmId.value = tonearmId;

    // Ladda de generella parametrarna från preset
    const newParams = { ...preset.example_params_for_calculator };

    // Hantera headshell specifikt
    if (preset.has_integrated_headshell) {
      newParams.m_headshell = 0; // Inbyggd headshell har ingen *extra* massa
    } else {
      // Använd standardvikten från databasen, eller en rimlig fallback
      newParams.m_headshell = preset.headshell_mass_g || 10; 
    }
    
    // Behåll befintliga pickup-relaterade värden
    newParams.m_pickup = params.value.m_pickup;
    newParams.compliance = params.value.compliance;
    newParams.vtf = params.value.vtf;
    newParams.m_screws = params.value.m_screws;

    // Behåll justerbar motvikt om den inte finns i preset
    newParams.m4_adj_cw = newParams.m4_adj_cw || params.value.m4_adj_cw;

    // Uppdatera alla relevanta params
    Object.assign(params.value, newParams);
  }

  // Kör initialiseringen
  initialize();

  // --- COMPUTED ---
  const m1 = computed(() => params.value.m_headshell + params.value.m_pickup + params.value.m_screws);
  const m2_tube = computed(() => params.value.m_rear_assembly * (params.value.m_tube_percentage / 100.0));
  const m3_fixed_cw = computed(() => params.value.m_rear_assembly - m2_tube.value);

  const calculatedResults = computed(() => {
    if (params.value.m4_adj_cw <= 0) {
        return { isUnbalanced: true };
    }
    const numerator = (m1.value * params.value.L1) + (m2_tube.value * params.value.L2) - (m3_fixed_cw.value * params.value.L3_fixed_cw) - (params.value.vtf * params.value.L1);
    if (numerator < 0) {
        return { isUnbalanced: true };
    }
    const L4_adj_cw = numerator / params.value.m4_adj_cw;
    const Itot = (m1.value * params.value.L1**2) + (m2_tube.value * params.value.L2**2) + (m3_fixed_cw.value * params.value.L3_fixed_cw**2) + (params.value.m4_adj_cw * L4_adj_cw**2);
    const M_eff = Itot / (params.value.L1**2);
    const F = 1000 / (2 * Math.PI * Math.sqrt(Math.max(0.1, M_eff * params.value.compliance)));
    return { L4_adj_cw, M_eff, F, isUnbalanced: false };
  });

  const diagnosis = computed(() => {
    if (calculatedResults.value.isUnbalanced) {
        return { status: 'danger', title: 'Arm Unbalanced', recommendations: ['Increase adjustable counterweight mass (m4) or decrease front mass (m1).'] };
    }
    const F = calculatedResults.value.F;
    if (F >= 8 && F <= 11) {
        return { status: 'ideal', title: 'Ideal Match', recommendations: ['Resonance is in the ideal zone. Excellent compatibility.'] };
    }
    if (F > 11 && F <= 12) {
        return { status: 'warning', title: 'Acceptable Match', recommendations: ['Slightly high resonance. Consider a heavier headshell/cartridge or higher compliance.'] };
    }
    if (F < 8 && F >= 7) {
        return { status: 'warning', title: 'Acceptable Match', recommendations: ['Slightly low resonance. Consider a lighter headshell/cartridge or lower compliance.'] };
    }
    return { status: 'danger', title: 'Poor Match', recommendations: ['Resonance is outside the acceptable range. System is prone to skipping or poor bass response.'] };
  });

  const currentTonearm = computed(() => {
    if (!selectedTonearmId.value) return null;
    return availableTonearms.value.find(t => t.id === selectedTonearmId.value);
  });

  return {
    params,
    m1,
    calculatedResults,
    diagnosis,
    availableTonearms,
    availablePickups,
    selectedTonearmId,
    isLoading,
    error,
    currentTonearm,
    loadTonearmPreset,
  };
});
