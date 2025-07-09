<!-- src/components/TonearmVisualization.vue -->
<script setup>
// Importera dina RIKTIGA, fungerande graf-komponenter
import CounterweightChart from './CounterweightChart.vue';
import SensitivityCharts from './SensitivityCharts.vue';
</script>

<template>
  <div class="visualization-wrapper">
    <!-- Återinför dina graf-komponenter här -->
    <!-- De kommer själva att ansluta till Pinia storen för att hämta data -->
    <CounterweightChart />
    
    <!-- Du kan behöva lägga till en container eller styling för att separera dem -->
    <div class="sensitivity-charts-container">
       <SensitivityCharts />
    </div>
  </div>
</template>

<style scoped>
.visualization-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem; /* Lägg till lite utrymme mellan dina grafer */
}
/* Du kan behöva mer styling här beroende på hur dina grafer är uppbyggda */
</style>
