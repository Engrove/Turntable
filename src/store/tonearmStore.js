// src/store/tonearmStore.js
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

// Denna store är HJÄRNAN. All logik och alla beräkningar ska bo här.
// Jag har återskapat strukturen från din ursprungliga kod.
// Du måste kopiera in dina exakta, komplexa beräkningsformler i de relevanta 'computed'-blocken.

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

  // State för UI
  const isHelpModalVisible = ref(false);

  // === GETTERS (Beräknade Värden) ===

  // Exempel: total frontmass
  const totalFrontMass = computed(() => {
    return headshellMass.value + cartridgeMass.value + mountingScrewsMass.value;
  });

  // *** VIKTIGT: ÅTERINFÖR DINA BERÄKNINGAR HÄR ***
  const effectiveMass = computed(() => {
    // ERSÄTT DENNA RAD MED DIN EXAKTA FORMEL FÖR EFFEKTIV MASSA
    return 21.9; // Platshållare
  });
  
  const resonanceFrequency = computed(() => {
    // ERSÄTT DENNA RAD MED DIN EXAKTA FORMEL FÖR RESONANSFREKVENS
     if (effectiveMass.value <= 0 || cartridgeCompliance.value <= 0) return 0;
     return 1000 / (2 * Math.PI * Math.sqrt(effectiveMass.value * cartridgeCompliance.value));
  });

  // Lägg till dina andra getters (t.ex. för Adj. CW Distance) här.

  // Getter för att styra färgen på resultatboxen
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
});```

---

### Steg 2: Skapa `HelpModal.vue` (`/src/components/HelpModal.vue`)

En ny komponent för att hantera din hjälp-dialog.

```vue
<!-- src/components/HelpModal.vue -->
<script setup>
import { useTonearmStore } from '@/store/tonearmStore';
const store = useTonearmStore();
</script>

<template>
  <div class="modal-overlay" @click.self="store.hideHelpModal()">
    <div class="modal-content">
      <button class="close-button" @click="store.hideHelpModal()">×</button>
      <h2>Help & Methodology</h2>
      <p>Här placerar du innehållet från din ursprungliga modal.</p>
      <p>Detta kan inkludera förklaringar av de olika parametrarna, de formler som används, och länkar till externa resurser.</p>
      <ul>
        <li><b>Effective Mass:</b> Förklaring...</li>
        <li><b>Resonance Frequency:</b> Förklaring...</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  position: relative;
}
.close-button {
  position: absolute;
  top: 10px;
  right: 15px;
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: #aaa;
}
.close-button:hover {
  color: #333;
}
</style>
