<!-- src/components/InputPanel.vue -->
<script setup>
import { useTonearmStore } from '../store/tonearmStore';
const store = useTonearmStore(); // Anslut till storen!
</script>

<template>
  <form @submit.prevent>
    <fieldset>
      <legend>Pickup & Headshell</legend>

      <div class="control-group">
        <label for="headshell-mass">Headshell Mass (g)</label>
        <div class="input-row">
          <!-- BIND MOT STOREN, INTE EN LOKAL VARIABEL -->
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

      <div class="control-group">
        <label for="armwand-mass">Armwand + Fixed CW Mass (g)</label>
        <div class="input-row">
          <input type="range" id="armwand-mass" v-model.number="store.armwandMass" min="20" max="100" step="1" />
          <input type="number" v-model.number="store.armwandMass" />
        </div>
      </div>
      
       <!-- Upprepa för ALLA kontroller, bind dem till storen! -->
       <!-- Exempel: v-model.number="store.armwandRearMassPercent" -->

    </fieldset>
  </form>
</template>
