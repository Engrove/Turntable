<!-- src/components/RangeFilter.vue -->
<template>
  <div class="range-filter">
    <label>{{ label }}</label>
    <div class="inputs">
      <input
        type="number"
        :placeholder="`Min ${unit}`"
        :value="modelValue.min"
        @input="updateValue('min', $event.target.value)"
        min="0"
      />
      <span>-</span>
      <input
        type="number"
        :placeholder="`Max ${unit}`"
        :value="modelValue.max"
        @input="updateValue('max', $event.target.value)"
        min="0"
      />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
    default: () => ({ min: null, max: null })
  },
  label: {
    type: String,
    required: true
  },
  unit: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:modelValue']);

function updateValue(key, value) {
  const newRange = { ...props.modelValue };
  const numericValue = value === '' ? null : parseFloat(value);
  newRange[key] = numericValue;
  emit('update:modelValue', newRange);
}
</script>

<style scoped>
.range-filter label {
  display: block;
  font-weight: 600;
  color: var(--label-color);
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.inputs {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.inputs input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  font-size: 1rem;
  background-color: #fff;
  border: 1px solid #ced4da;
  border-radius: 4px;
  box-sizing: border-box;
  -moz-appearance: textfield; /* Ta bort pilar i Firefox */
}
/* Ta bort pilar i Chrome, Safari, etc. */
.inputs input::-webkit-outer-spin-button,
.inputs input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.inputs span {
  color: var(--label-color);
  font-weight: bold;
}
</style>
