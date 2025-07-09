<!-- src/components/InputPanel.vue -->
<script setup>
import { useTonearmStore } from '@/store/tonearmStore'
const store = useTonearmStore()
</script>

<template>
  <form @submit.prevent>
    <fieldset>
      <legend>Pickup & Headshell</legend>
      <!-- ... (alla dina control-groups) ... -->
       <div class="control-group">
        <label for="headshell-mass">Headshell Mass (g)</label>
        <div class="input-row">
          <input type="range" id="headshell-mass" v-model.number="store.headshellMass" min="0" max="20" step="0.1" />
          <input type="number" v-model.number="store.headshellMass" />
        </div>
      </div>
      <div class="control-group">
        <label for="cartridge-mass">Cartridge Mass (g)</label>
        <div class="input-row">
          <input type="range" id="cartridge-mass" v-model.number="store.cartridgeMass" min="0" max="20" step="0.1" />
          <input type="number" v-model.number="store.cartridgeMass" />
        </div>
      </div>
      <div class="control-group">
        <label for="screws-mass">Mounting Screws Mass (g)</label>
        <div class="input-row">
          <input type="range" id="screws-mass" v-model.number="store.mountingScrewsMass" min="0" max="5" step="0.1" />
          <input type="number" v-model.number="store.mountingScrewsMass" />
        </div>
      </div>
      <div class="control-group">
        <label for="cartridge-compliance">Cartridge Compliance (μm/mN)</label>
        <div class="input-row">
          <input type="range" id="cartridge-compliance" v-model.number="store.cartridgeCompliance" min="5" max="40" step="1" />
          <input type="number" v-model.number="store.cartridgeCompliance" />
        </div>
      </div>
    </fieldset>

    <fieldset>
      <legend>Tonearm Geometry & Mass</legend>
      <!-- ... (alla dina control-groups) ... -->
      <div class="control-group">
        <label for="armwand-mass">Armwand + Fixed CW Mass (g)</label>
        <div class="input-row">
          <input type="range" id="armwand-mass" v-model.number="store.armwandMass" min="20" max="100" step="1" />
          <input type="number" v-model.number="store.armwandMass" />
        </div>
      </div>
      <div class="control-group">
        <label for="rear-mass-percent">Armwand % of Rear Mass</label>
        <div class="input-row">
          <input type="range" id="rear-mass-percent" v-model.number="store.armwandRearMassPercent" min="10" max="50" step="1" />
          <input type="number" v-model.number="store.armwandRearMassPercent" />
        </div>
      </div>
      <div class="control-group">
        <label for="adj-cw-mass">Adjustable CW Mass (g)</label>
        <div class="input-row">
          <input type="range" id="adj-cw-mass" v-model.number="store.adjustableCWMass" min="50" max="200" step="1" />
          <input type="number" v-model.number="store.adjustableCWMass" />
        </div>
      </div>
      <div class="control-group">
        <label for="effective-length">Effective Length (mm)</label>
        <div class="input-row">
          <input type="range" id="effective-length" v-model.number="store.effectiveLength" min="200" max="300" step="1" />
          <input type="number" v-model.number="store.effectiveLength" />
        </div>
      </div>
      <div class="control-group">
        <label for="armwand-cog">Armwand CoG Distance (mm)</label>
        <div class="input-row">
          <input type="range" id="armwand-cog" v-model.number="store.armwandCoG" min="0" max="200" step="1" />
          <input type="number" v-model.number="store.armwandCoG" />
        </div>
      </div>
    </fieldset>
  </form>
</template>

<style scoped>
/* Din ursprungliga CSS för InputPanel */
form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

fieldset {
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 1rem 1rem 0.5rem 1rem;
  margin: 0;
}

legend {
  padding: 0 0.5rem;
  font-weight: 600;
  color: #495057;
}

.control-group {
  margin-bottom: 1rem;
}

.control-group label {
  display: block;
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 0.25rem;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 1rem;
}

input[type='range'] {
  flex-grow: 1;
}

input[type='number'] {
  width: 70px;
  padding: 0.375rem 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  text-align: right;
}
</style>
