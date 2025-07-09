// src/store/tonearmStore.js
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useTonearmStore = defineStore('tonearm', () => {
  // State
  const headshellMass = ref(7.5)
  const cartridgeMass = ref(6.5)
  const mountingScrewsMass = ref(0.5)
  const armwandMass = ref(10)
  const armwandRearMassPercent = ref(30)
  const adjustableCWMass = ref(100)
  const effectiveLength = ref(230)
  const armwandCoG = ref(100)
  const cartridgeCompliance = ref(15)

  const isHelpModalVisible = ref(false)

  // Getters (Computed properties)
  const totalFrontMass = computed(() => headshellMass.value + cartridgeMass.value + mountingScrewsMass.value)
  const armwandFrontMass = computed(() => armwandMass.value * (1 - armwandRearMassPercent.value / 100))
  const armwandRearMass = computed(() => armwandMass.value * (armwandRearMassPercent.value / 100))
  const armwandEffectiveLength = computed(() => effectiveLength.value - armwandCoG.value)

  const totalInertia = computed(() => {
    const frontInertia = totalFrontMass.value * Math.pow(effectiveLength.value, 2)
    const armwandInertia = armwandMass.value * Math.pow(armwandEffectiveLength.value - effectiveLength.value, 2)
    return frontInertia + armwandInertia
  })

  const effectiveMass = computed(() => {
    if (effectiveLength.value === 0) return 0
    return totalInertia.value / Math.pow(effectiveLength.value, 2)
  })

  const adjCWDistance = computed(() => {
    if (adjustableCWMass.value === 0) return 0
    const numerator = totalFrontMass.value * effectiveLength.value + armwandFrontMass.value * armwandCoG.value
    const denominator = adjustableCWMass.value + armwandRearMass.value
    if (denominator === 0) return 0
    return numerator / denominator
  })

  const resonanceFrequency = computed(() => {
    const effMassKg = effectiveMass.value / 1000
    const complianceMetersPerNewton = cartridgeCompliance.value * 1e-6
    if (effMassKg <= 0 || complianceMetersPerNewton <= 0) return 0
    return 1 / (2 * Math.PI * Math.sqrt(effMassKg * complianceMetersPerNewton))
  })

  const resonanceStatus = computed(() => {
    const freq = resonanceFrequency.value
    if (freq >= 8 && freq <= 11) return 'excellent'
    if ((freq > 11 && freq <= 14) || (freq < 8 && freq >= 7)) return 'acceptable'
    return 'poor'
  })

  // Actions
  function showHelpModal() {
    isHelpModalVisible.value = true
  }
  function hideHelpModal() {
    isHelpModalVisible.value = false
  }

  return {
    headshellMass,
    cartridgeMass,
    mountingScrewsMass,
    armwandMass,
    armwandRearMassPercent,
    adjustableCWMass,
    effectiveLength,
    armwandCoG,
    cartridgeCompliance,
    isHelpModalVisible,
    totalFrontMass,
    effectiveMass,
    adjCWDistance,
    resonanceFrequency,
    resonanceStatus,
    showHelpModal,
    hideHelpModal
  }
})
