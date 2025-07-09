// src/store/tonearmStore.js
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export const useTonearmStore = defineStore('tonearm', () => {
  // === STATE ===
  // Alla värden som användaren kan ändra på
  const headshellMass = ref(11.4);
  const cartridgeMass = ref(6.3);
  const mountingScrewsMass = ref(1.3);
  const armwandMass = ref(63);
  const armwandRearMassPercent = ref(35);
  const adjustableCWMass = ref(100);
  const effectiveLength = ref(237);
  const armwandCoG = ref(15);
  const cartridgeCompliance = ref(10);

  // === GETTERS (Computed Properties) ===
  // Beräknade värden som automatiskt uppdateras
  const totalFrontMass = computed(() => {
    return headshellMass.value + cartridgeMass.value + mountingScrewsMass.value;
  });

  // Lägg till dina riktiga beräkningar här. Detta är exempel.
  const effectiveMass = computed(() => {
    // DIN KOMPLEXA BERÄKNING FÖR EFFEKTIV MASSA HÄR
    // Exempel: (totalFrontMass.value * 0.8) + (armwandMass.value * 0.2);
    // Ersätt med din faktiska formel från originalkoden!
    return totalFrontMass.value * Math.pow(effectiveLength.value, 2) / Math.pow(effectiveLength.value, 2); // MYCKET förenklad platshållare
  });

  const resonanceFrequency = computed(() => {
    if (effectiveMass.value <= 0 || cartridgeCompliance.value <= 0) {
      return 0;
    }
    // Den klassiska formeln
    return 1000 / (2 * Math.PI * Math.sqrt(effectiveMass.value * cartridgeCompliance.value));
  });

  // Getter för att styra färgen på resultatboxen
  const resonanceStatus = computed(() => {
    const freq = resonanceFrequency.value;
    if (freq >= 8 && freq <= 11) {
      return 'excellent';
    } else if (freq > 11 && freq <= 14) {
      return 'acceptable';
    } else {
      return 'poor';
    }
  });

  return {
    // State
    headshellMass,
    cartridgeMass,
    mountingScrewsMass,
    armwandMass,
    armwandRearMassPercent,
    adjustableCWMass,
    effectiveLength,
    armwandCoG,
    cartridgeCompliance,
    // Getters
    totalFrontMass,
    effectiveMass,
    resonanceFrequency,
    resonanceStatus
  };
});
