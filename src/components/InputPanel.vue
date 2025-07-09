<!-- src/components/InputPanel.vue -->
<script setup>
import { ref } from 'vue';

// Detta simulerar reaktiv data från din Pinia store
const headshellMass = ref(11.4);
const cartridgeMass = ref(6.3);
const mountingScrewsMass = ref(1.3);
const armwandMass = ref(63);
const armwandRearMassPercent = ref(35);
const adjustableCWMass = ref(100);
const effectiveLength = ref(237);
const armwandCoG = ref(15);
const cartridgeCompliance = ref(10);
</script>

<template>
  <form @submit.prevent>
    <fieldset>
      <legend>Pickup & Headshell</legend>

      <div class="control-group">
        <label for="headshell-mass">Headshell Mass (g)</label>
        <div class="input-row">
          <input type="range" id="headshell-mass" v-model.number="headshellMass" min="0" max="20" step="0.1" />
          <input type="number" v-model.number="headshellMass" />
        </div>
      </div>

      <div class="control-group">
        <label for="cartridge-mass">Cartridge Mass (g)</label>
        <div class="input-row">
          <input type="range" id="cartridge-mass" v-model.number="cartridgeMass" min="0" max="20" step="0.1" />
          <input type="number" v-model.number="cartridgeMass" />
        </div>
      </div>
      
      <div class="control-group">
        <label for="screws-mass">Mounting Screws Mass (g)</label>
        <div class="input-row">
          <input type="range" id="screws-mass" v-model.number="mountingScrewsMass" min="0" max="5" step="0.1" />
          <input type="number" v-model.number="mountingScrewsMass" />
        </div>
      </div>

      <div class="control-group">
        <label for="cartridge-compliance">Cartridge Compliance (μm/mN)</label>
        <div class="input-row">
          <input type="range" id="cartridge-compliance" v-model.number="cartridgeCompliance" min="5" max="40" step="1" />
          <input type="number" v-model.number="cartridgeCompliance" />
        </div>
      </div>
    </fieldset>

    <fieldset>
      <legend>Tonearm Geometry & Mass</legend>

      <div class="control-group">
        <label for="armwand-mass">Armwand + Fixed CW Mass (g)</label>
        <div class="input-row">
          <input type="range" id="armwand-mass" v-model.number="armwandMass" min="20" max="100" step="1" />
          <input type="number" v-model.number="armwandMass" />
        </div>
      </div>
      
      <div class="control-group">
        <label for="rear-mass-percent">Armwand % of Rear Mass</label>
        <div class="input-row">
          <input type="range" id="rear-mass-percent" v-model.number="armwandRearMassPercent" min="10" max="50" step="1" />
          <input type="number" v-model.number="armwandRearMassPercent" />
        </div>
      </div>

      <div class="control-group">
        <label for="adj-cw-mass">Adjustable CW Mass (g)</label>
        <div class="input-row">
          <input type="range" id="adj-cw-mass" v-model.number="adjustableCWMass" min="50" max="200" step="1" />
          <input type="number" v-model.number="adjustableCWMass" />
        </div>
      </div>

      <div class="control-group">
        <label for="effective-length">Effective Length (mm)</label>
        <div class="input-row">
          <input type="range" id="effective-length" v-model.number="effectiveLength" min="200" max="300" step="1" />
          <input type="number" v-model.number="effectiveLength" />
        </div>
      </div>
       
      <div class="control-group">
        <label for="armwand-cog">Armwand CoG Distance (mm)</label>
        <div class="input-row">
          <input type="range" id="armwand-cog" v-model.number="armwandCoG" min="0" max="50" step="1" />
          <input type="number" v-model.number="armwandCoG" />
        </div>
      </div>

    </fieldset>
  </form>
</template>
