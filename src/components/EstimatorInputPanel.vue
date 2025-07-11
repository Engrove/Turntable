<!-- src/components/EstimatorInputPanel.vue -->
<script setup>
import { useEstimatorStore } from '@/store/estimatorStore.js';

const store = useEstimatorStore();
</script>

<template>
  <div class="input-panel panel">
    <h2>Cartridge Specifications</h2>

    <fieldset>
      <legend>Primary & Refinement Data</legend>
      <p class="fieldset-description">
        Provide at least one compliance value and the pickup type. Fields marked with <span class="required">*</span> are required to generate a basic estimate.
      </p>

      <!-- 1. Primär indata (delvis obligatorisk) -->
      <div class="input-group">
        <label for="cu_dynamic_100hz">Dynamic Compliance @ 100Hz <span class="required">*</span></label>
        <input
          id="cu_dynamic_100hz"
          type="number"
          class="value-input"
          placeholder="Preferred value (e.g., 10)"
          min="1"
          step="0.1"
          v-model.number="store.userInput.cu_dynamic_100hz"
        >
      </div>

      <!-- 2. Primär kategori (obligatorisk) -->
      <div class="input-group">
        <label for="type">Pickup Type <span class="required">*</span></label>
        <select id="type" v-model="store.userInput.type" class="value-select" required>
          <option :value="null" disabled>-- Select Type --</option>
          <option value="MM">MM (Moving Magnet)</option>
          <option value="MC">MC (Moving Coil)</option>
          <option value="MI">MI (Moving Iron)</option>
        </select>
      </div>
      
      <!-- 3. Sekundär kategori (för förfining) -->
      <div class="input-group">
        <label for="cantilever_class">Cantilever Class</label>
        <select id="cantilever_class" v-model="store.userInput.cantilever_class" class="value-select">
          <option :value="null">-- Optional for better accuracy --</option>
          <option v-for="cat in store.availableCantileverClasses" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
      </div>

      <!-- 4. Sekundär indata (fallback, delvis obligatorisk) -->
      <div class="input-group">
        <label for="cu_static">Static Compliance (Fallback) <span class="required">*</span></label>
        <input
          id="cu_static"
          type="number"
          class="value-input"
          placeholder="Used if 100Hz is empty"
          min="1"
          step="0.1"
          v-model.number="store.userInput.cu_static"
        >
      </div>

      <!-- 5 & 6. Framtida data -->
      <div class="input-group">
        <label for="weight_g">Cartridge Weight (g)</label>
        <input
          id="weight_g"
          type="number"
          class="value-input"
          placeholder="Optional (e.g., 6.5)"
          min="1"
          max="35"
          step="0.1"
          v-model.number="store.userInput.weight_g"
        >
      </div>

      <div class="input-group">
        <label for="stylus_family">Stylus Family</label>
        <select id="stylus_family" v-model="store.userInput.stylus_family" class="value-select">
          <option :value="null">-- Optional --</option>
          <option v-for="cat in store.availableStylusFamilies" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
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

.fieldset-description {
  font-size: 0.875rem;
  color: var(--label-color);
  margin-top: -0.5rem;
  margin-bottom: 1.5rem;
  font-style: italic;
}

.input-group {
    margin-bottom: 1.25rem;
}

.input-group:last-child {
    margin-bottom: 0.25rem;
}

.input-group label {
    display: block;
    font-weight: 500;
    color: var(--label-color);
    margin-bottom: 0.5rem;
}

.required {
  color: #dc3545; /* Röd färg för att indikera obligatoriskt fält */
  font-weight: bold;
  margin-left: 2px;
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
