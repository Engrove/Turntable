<!-- src/components/EstimatorInputPanel.vue -->
<script setup>
import { useEstimatorStore } from '@/store/estimatorStore.js';

const store = useEstimatorStore();
</script>

<template>
  <div class="input-panel panel">
    <h2>Cartridge Specifications</h2>

    <!-- NYTT (1h): Fieldset för obligatoriska fält -->
    <fieldset>
      <legend>Required Input</legend>
      <p class="fieldset-description">
        Select the pickup type and provide at least one compliance value to get an estimate.
      </p>

      <div class="input-group">
        <label for="type">Pickup Type <span class="required">*</span></label>
        <select id="type" v-model="store.userInput.type" class="value-select" required>
          <option :value="null" disabled>-- Select Type --</option>
          <option value="MM">MM (Moving Magnet)</option>
          <option value="MC">MC (Moving Coil)</option>
          <option value="MI">MI (Moving Iron)</option>
        </select>
      </div>

      <div class="input-group">
        <label for="cu_dynamic_100hz">Dynamic Compliance @ 100Hz</label>
        <input
          id="cu_dynamic_100hz"
          type="number"
          class="value-input"
          placeholder="e.g., 10"
          min="1"
          step="0.1"
          v-model.number="store.userInput.cu_dynamic_100hz"
        >
      </div>
      
      <p class="separator-text">OR</p>

      <div class="input-group">
        <label for="cu_static">Static Compliance</label>
        <input
          id="cu_static"
          type="number"
          class="value-input"
          placeholder="Used if 100Hz value is empty"
          min="1"
          step="0.1"
          v-model.number="store.userInput.cu_static"
        >
      </div>
    </fieldset>
    
    <!-- NYTT (1h): Fieldset för valfria fält -->
    <fieldset>
        <legend>Optional Refinements</legend>
        <p class="fieldset-description">
            Providing these values can increase the confidence and accuracy of the estimate.
        </p>
        
        <div class="input-group">
            <label for="cantilever_class">Cantilever Class</label>
            <select id="cantilever_class" v-model="store.userInput.cantilever_class" class="value-select">
            <option :value="null">-- Select for better accuracy --</option>
            <option v-for="cat in store.availableCantileverClasses" :key="cat" :value="cat">
                {{ cat }}
            </option>
            </select>
        </div>

        <div class="input-group">
            <label for="stylus_family">Stylus Family</label>
            <select id="stylus_family" v-model="store.userInput.stylus_family" class="value-select">
            <option :value="null">-- Select for better accuracy --</option>
            <option v-for="cat in store.availableStylusFamilies" :key="cat" :value="cat">
                {{ cat }}
            </option>
            </select>
        </div>
        
        <div class="input-group">
            <label for="weight_g">Cartridge Weight (g)</label>
            <input
            id="weight_g"
            type="number"
            class="value-input"
            placeholder="e.g., 6.5 (for reference)"
            min="1"
            max="35"
            step="0.1"
            v-model.number="store.userInput.weight_g"
            >
      </div>
    </fieldset>
  </div>
</template>

<style scoped>
.input-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
fieldset {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 1rem 1.5rem 0.5rem;
  margin: 0;
}
legend {
  font-weight: 600;
  color: var(--header-color);
  padding: 0 0.5rem;
  font-size: 1.1rem;
}
.fieldset-description {
  font-size: 0.875rem;
  color: var(--label-color);
  margin-top: -0.5rem;
  margin-bottom: 1.5rem;
}
.input-group {
    margin-bottom: 1.25rem;
}
.input-group label {
    display: block;
    font-weight: 500;
    color: var(--label-color);
    margin-bottom: 0.5rem;
}
.required {
  color: #dc3545;
  font-weight: bold;
}
.separator-text {
    text-align: center;
    font-weight: 600;
    color: var(--label-color);
    margin: -0.5rem 0;
}
.value-input, .value-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  background-color: #fff;
  border: 1px solid #ced4da;
  border-radius: 4px;
  box-sizing: border-box;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}
.value-input:focus, .value-select:focus {
  border-color: #80bdff;
  outline: 0;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
}
.value-select {
  cursor: pointer;
}
</style>
