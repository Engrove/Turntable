// src/store/tonearmStore.js
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useTonearmStore = defineStore('tonearm', () => {
  // === STATE (Användarens Inputs) ===
  const headshellMass = ref(11.4);
  const cartridgeMass = ref(6.3);
  const mountingScrewsMass = ref(1.3);
  const armwandMass = ref(63);
  const armwandRearMassPercent = ref(35);
  const adjustableCWMass = ref(100);
  const effectiveLength = ref(237);
  const armwandCoG = ref(15);
  const cartridgeCompliance = ref(10);
  const isHelpModalVisible = ref(false);

  // === GETTERS (Beräknade Värden) ===
  // *** DU MÅSTE ERSÄTTA PLATSHÅLLARNA MED DINA RIKTIGA FORMEL-IMPLEMENTATIONER ***
  const totalFrontMass = computed(() => {
    return headshellMass.value + cartridgeMass.value + mountingScrewsMass.value;
  });

  const effectiveMass = computed(() => {
    // ERSÄTT DENNA RAD MED DIN EXAKTA FORMEL
    return 21.9; // Tillfällig platshållare
  });
  
  const resonanceFrequency = computed(() => {
     if (effectiveMass.value <= 0 || cartridgeCompliance.value <= 0) return 0;
     // ERSÄTT MED DIN EXAKTA FORMEL
     return 1000 / (2 * Math.PI * Math.sqrt(effectiveMass.value * cartridgeCompliance.value));
  });

  const resonanceStatus = computed(() => {
    const freq = resonanceFrequency.value;
    if (freq >= 8 && freq <= 11) return 'excellent';
    if (freq > 11 && freq <= 14 || freq < 8 && freq >= 7) return 'acceptable';
    return 'poor';
  });
  
  // === ACTIONS (Metoder) ===
  function showHelpModal() {
    isHelpModalVisible.value = true;
  }
  function hideHelpModal() {
    isHelpModalVisible.value = false;
  }

  return {
    // State
    headshellMass, cartridgeMass, mountingScrewsMass, armwandMass,
    armwandRearMassPercent, adjustableCWMass, effectiveLength,
    armwandCoG, cartridgeCompliance, isHelpModalVisible,
    
    // Getters
    totalFrontMass, effectiveMass, resonanceFrequency, resonanceStatus,

    // Actions
    showHelpModal, hideHelpModal
  };
});
