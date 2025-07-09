<!-- src/views/TonearmCalculatorView.vue -->
<script setup>
import TonearmVisualization from '../components/TonearmVisualization.vue';
import InputPanel from '../components/InputPanel.vue';
import ResultsPanel from '../components/ResultsPanel.vue';
import { useTonearmStore } from '@/store/tonearmStore';
const store = useTonearmStore();
</script>

<template>
  <div>
    <header class="app-header">
      <h1>Tonearm Resonance Calculator</h1>
      <!-- Denna länk är nu en knapp som anropar en action i storen -->
      <a href="#" @click.prevent="store.showHelpModal()">Help & Methodology</a>
    </header>

    <!-- Denna sektion är nu en container för dina RIKTIGA grafer -->
    <section class="visualization-container">
      <TonearmVisualization />
    </section>

    <div class="panels-container">
      <InputPanel class="panel" />
      <ResultsPanel class="panel" />
    </div>
  </div>
</template>
