<script setup>
import InputPanel from './components/InputPanel.vue'
import ResultsPanel from './components/ResultsPanel.vue'
import TonearmVisualizer from './components/TonearmVisualizer.vue'
import SensitivityCharts from './components/SensitivityCharts.vue' // <-- Importera den nya graf-komponenten
</script>

<template>
  <header>
    <h1>Engrove Tonearm Resonance Calculator</h1>
    <p>An interactive tool to explore tonearm and cartridge matching. All calculations update in real-time.</p>
  </header>

  <main>
    <div class="main-content">
      <div class="calculator-grid">
        <InputPanel />
        <ResultsPanel />
      </div>
      
      <TonearmVisualizer />
      
      <!-- Lägg till den nya graf-komponenten här -->
      <SensitivityCharts />
    </div>
  </main>
</template>

<style scoped>
.main-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
</style>
