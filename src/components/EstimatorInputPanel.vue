<script setup>
import { useEstimatorStore } from '@/store/estimatorStore.js';

const store = useEstimatorStore();
</script>

<template>
  <div class="input-panel panel">
    <h2>Cartridge Specifications</h2>

    <fieldset>
      <legend>Compliance Data</legend>
      <p class="fieldset-description">
        Provide at least one compliance value. Dynamic @ 100Hz is preferred for higher accuracy.
      </p>
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
      <div class="input-group">
        <label for="cu_static">Static Compliance</label>
        <input
          id="cu_static"
          type="number"
          class="value-input"
          placeholder="e.g., 25"
          min="1"
          step="0.1"
          v-model.number="store.userInput.cu_static"
        >
      </div>
    </fieldset>

    <fieldset>
      <legend>Physical Properties</legend>
       <p class="fieldset-description">
        Provide as many known properties as possible to improve the estimate's confidence.
      </p>
      <div class="input-group">
        <label for="type">Pickup Type (Required)</label>
        <select id="type" v-model="store.userInput.type" class="value-select">
          <option :value="null" disabled>-- Select Type --</option>
          <option value="MM">MM (Moving Magnet)</option>
          <option value="MC">MC (Moving Coil)</option>
          <option value="MI">MI (Moving Iron)</option>
        </select>
      </div>
      <div class="input-group">
        <label for="cantilever_class">Cantilever Class</label>
        <select id="cantilever_class" v-model="store.userInput.cantilever_class" class="value-select">
          <option :value="null">-- Optional --</option>
          <option v-for="cat in store.availableCantileverClasses" :key="cat" :value="cat">
            {{ cat }}
          </option>
        </select>
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
  margin-bottom: 1rem;
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

.value-input, .value-select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  background-color: #fff;
  border: 1px solid #ced4da;
  border-radius: 4px;
  box-sizing: border-box; /* Viktigt för att padding inte ska addera till bredden */
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
