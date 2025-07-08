<script setup>
import InputPanel from '@/components/InputPanel.vue'
import ResultsPanel from '@/components/ResultsPanel.vue'
import TonearmVisualizer from '@/components/TonearmVisualizer.vue'
import SensitivityCharts from '@/components/SensitivityCharts.vue'
</script>

<template>
  <div class="tool-view">
    <div class="main-content">
      <div class="calculator-grid">
        <InputPanel />
        <ResultsPanel />
      </div>
      <TonearmVisualizer />
      <SensitivityCharts />
    </div>
  </div>
</template>

<style scoped>
.main-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.calculator-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
}
</style>
