<script setup>
import InputPanel from './components/InputPanel.vue'
import ResultsPanel from './components/ResultsPanel.vue'
import Visualizations from './components/Visualizations.vue'
</script>

<template>
  <header>
    <h1>Engrove Tonearm Resonance Calculator</h1>
    <p>An interactive tool to explore tonearm and cartridge matching. All calculations update in real-time.</p>
  </header>

  <main>
    <div class="calculator-grid">
      <InputPanel />
      <ResultsPanel />
    </div>
    <Visualizations />
  </main>
</template>

<style scoped>
main > .calculator-grid {
  margin-bottom: 2rem;
}
</style>
