<!-- src/views/TonearmCalculatorView.vue -->
<script setup>
import { useTonearmStore } from '@/store/tonearmStore';
import InputPanel from '@/components/InputPanel.vue';
import ResultsPanel from '@/components/ResultsPanel.vue';
import CounterweightChart from '@/components/CounterweightChart.vue';
import SensitivityCharts from '@/components/SensitivityCharts.vue';

const store = useTonearmStore();
</script>

<template>
  <div>
    <header class="app-header">
      <h1>Tonearm Resonance Calculator</h1>
      <a @click.prevent="store.showHelpModal()">Help & Methodology</a>
    </header>

    <!-- En container för ALLA dina grafer högst upp -->
    <section class="visualization-container">
      <CounterweightChart />
      <SensitivityCharts />
    </section>

    <!-- En grid-container för input och resultat sida-vid-sida -->
    <div class="panels-container">
      <InputPanel class="panel" />
      <ResultsPanel class="panel" />
    </div>
  </div>
</template>
