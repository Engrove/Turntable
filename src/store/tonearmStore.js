// src/store/tonearmStore.js

import { ref, computed } from 'vue';
import { defineStore } from 'pinia';

export const useTonearmStore = defineStore('tonearm', () => {
  // --- STATE ---
  const params = ref({
    m_headshell: 9.5, m_pickup: 6.5, m_screws: 0.5,
    m_rear_assembly: 85.0, m_tube_percentage: 25.0,
    m4_adj_cw: 120.0, L1: 229.0, L2: 30.0,
    L3_fixed_cw: 20.0, vtf: 1.75, compliance: 12.0,
  });

  const availableTonearms = ref([]);
  const availablePickups = ref([]);
  const selectedTonearmId = ref(null);
  const selectedPickupId = ref(null); // Ny state för vald pickup
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
    if (!tonearmId || tonearmId === "null") {
      selectedTonearmId.value = null;
      return;
    }
    const preset = availableTonearms.value.find(t => t.id == tonearmId);
    if (!preset) return;

    selectedTonearmId.value = tonearmId;
    const newParams = { ...preset.example_params_for_calculator };
    if (preset.has_integrated_headshell) {
      newParams.m_headshell = 0;
    } else {
      newParams.m_headshell = preset.headshell_mass_g || 10; 
    }
    params.value.L1 = preset.effective_length_mm;
    Object.assign(params.value, newParams);
  }

  // NY FUNKTION FÖR ATT LADDA EN PICKUP
  function loadCartridgePreset(pickupId) {
    if (!pickupId || pickupId === "null") {
      selectedPickupId.value = null;
      return;
    }
    const preset = availablePickups.value.find(p => p.id == pickupId);
    if (!preset) return;

    selectedPickupId.value = pickupId;
    
    // Uppdatera pickup-specifika parametrar
    params.value.m_pickup = preset.weight_g || 6.5;

    // Prioriterad logik för compliance
    if (preset.cu_dynamic_10hz) {
      params.value.compliance = preset.cu_dynamic_10hz;
    } else if (preset.cu_dynamic_100hz) {
      // Enkel fallback-logik liknande estimatorn (kan göras mer avancerad sen)
      params.value.compliance = preset.cu_dynamic_100hz * 1.75;
    } else if (preset.cu_static) {
      params.value.compliance = preset.cu_static * 0.6;
    } else {
      params.value.compliance = 12; // Generisk fallback
    }

    // Sätt VTF till medelvärdet av rekommenderat nåltryck
    if (preset.tracking_force_min_g && preset.tracking_force_max_g) {
      params.value.vtf = (preset.tracking_force_min_g + preset.tracking_force_max_g) / 2;
    } else {
      params.value.vtf = 1.75;
    }
  }

  initialize();

  // --- COMPUTED ---
  const m1 = computed(() => params.value.m_headshell + params.value.m_pickup + params.value.m_screws);
  const m2_tube = computed(() => params.value.m_rear_assembly * (params.value.m_tube_percentage / 100.0));
  const m3_fixed_cw = computed(() => params.value.m_rear_assembly - m2_tube.value);

  const calculatedResults = computed(() => {
    // ... (denna logik är oförändrad) ...
    if (params.value.m4_adj_cw <= 0) return { isUnbalanced: true };
    const numerator = (m1.value * params.value.L1) + (m2_tube.value * params.value.L2) - (m3_fixed_cw.value * params.value.L3_fixed_cw) - (params.value.vtf * params.value.L1);
    if (numerator < 0) return { isUnbalanced: true };
    const L4_adj_cw = numerator / params.value.m4_adj_cw;
    const Itot = (m1.value * params.value.L1**2) + (m2_tube.value * params.value.L2**2) + (m3_fixed_cw.value * params.value.L3_fixed_cw**2) + (params.value.m4_adj_cw * L4_adj_cw**2);
    const M_eff = Itot / (params.value.L1**2);
    const F = 1000 / (2 * Math.PI * Math.sqrt(Math.max(0.1, M_eff * params.value.compliance)));
    return { L4_adj_cw, M_eff, F, isUnbalanced: false };
  });

  const diagnosis = computed(() => {
    // ... (denna logik är oförändrad) ...
    if (calculatedResults.value.isUnbalanced) return { status: 'danger', title: 'Arm Unbalanced', recommendations: ['Increase adjustable counterweight mass (m4) or decrease front mass (m1).'] };
    const F = calculatedResults.value.F;
    if (F >= 8 && F <= 11) return { status: 'ideal', title: 'Ideal Match', recommendations: ['Resonance is in the ideal zone. Excellent compatibility.'] };
    if (F > 11 && F <= 12) return { status: 'warning', title: 'Acceptable Match', recommendations: ['Slightly high resonance. Consider a heavier headshell/cartridge or higher compliance.'] };
    if (F < 8 && F >= 7) return { status: 'warning', title: 'Acceptable Match', recommendations: ['Slightly low resonance. Consider a lighter headshell/cartridge or lower compliance.'] };
    return { status: 'danger', title: 'Poor Match', recommendations: ['Resonance is outside the acceptable range. System is prone to skipping or poor bass response.'] };
  });

  const currentTonearm = computed(() => availableTonearms.value.find(t => t.id == selectedTonearmId.value));
  const currentPickup = computed(() => availablePickups.value.find(p => p.id == selectedPickupId.value));

  return {
    params, m1, calculatedResults, diagnosis,
    availableTonearms, availablePickups,
    selectedTonearmId, selectedPickupId, // Exportera nya states
    isLoading, error,
    currentTonearm, currentPickup, // Exportera nuvarande val
    loadTonearmPreset, loadCartridgePreset, // Exportera nya action
  };
});
