<!-- src/views/TonearmCalculatorView.vue -->
<script setup>
import TonearmVisualization from '../components/TonearmVisualization.vue';
import InputPanel from '../components/InputPanel.vue';
import ResultsPanel from '../components/ResultsPanel.vue';
// I en riktig app skulle du importera och använda din Pinia store här
</script>

<template>
  <div>
    <header class="app-header">
      <h1>Tonearm Resonance Calculator</h1>
      <a href="https://github.com/Engrove/Turntable" target="_blank">Help & Methodology</a>
    </header>

    <section class="visualization-container">
      <TonearmVisualization />
    </section>

    <div class="panels-container">
      <InputPanel class="panel" />
      <ResultsPanel class="panel" />
    </div>
  </div>
</template>

<style scoped>
/* Inga specifika stilar behövs här, då allt styrs från main.css */
</style>
