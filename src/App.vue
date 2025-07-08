<script setup>
import InputPanel from './components/InputPanel.vue'
import ResultsPanel from './components/ResultsPanel.vue'
import TonearmVisualizer from './components/TonearmVisualizer.vue' // <-- Importera den nya komponenten
</script>

<template>
  <header>
    <h1>Engrove Tonearm Resonance Calculator</h1>
    <p>An interactive tool to explore tonearm and cartridge matching. All calculations update in real-time.</p>
  </header>

  <main>
    <!-- Lägg till en yttre container för bättre layout -->
    <div class="main-content">
      <div class="calculator-grid">
        <InputPanel />
        <ResultsPanel />
      </div>
      
      <!-- Lägg till den nya visualiseringskomponenten här -->
      <TonearmVisualizer class="visualizer-section" />
    </div>
  </main>
</template>

<style scoped>
/* Lägg till lite styling för att separera sektionerna */
.main-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}
</style>
