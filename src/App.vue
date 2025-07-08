<script setup>
import InputPanel from './components/InputPanel.vue'
import ResultsPanel from './components/ResultsPanel.vue'
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
  </main>
</template>
