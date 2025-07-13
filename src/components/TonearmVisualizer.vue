<!-- src/components/TonearmVisualizer.vue -->
<script setup>
import { useTonearmStore } from '@/store/tonearmStore.js'
import { computed } from 'vue'

const store = useTonearmStore()

const viewBox = computed(() => {
    const minX = -store.params.L1 - 40;
    const maxX = Math.max(100, store.calculatedResults.L4_adj_cw + 40);
    const width = maxX - minX;
    const height = 150;
    return `${minX} -${height / 2} ${width} ${height}`;
});

</script>

<template>
  <!-- NYTT: Panelen och rubriken är borttagna -->
  <div class="visualizer-container">
    <svg :viewBox="viewBox" preserveAspectRatio="xMidYMid meet" class="tonearm-svg">
      <g v-if="!store.calculatedResults.isUnbalanced">
        
        <!-- Pivot-punkt -->
        <path d="M 0,-25 L -10,-40 L 10,-40 Z" fill="#2c3e50" />
        <line x1="0" y1="-25" x2="0" y2="40" stroke="#2c3e50" stroke-width="1" />

        <!-- Armrör -->
        <line 
          :x1="-store.params.L1" 
          y1="0" 
          :x2="store.calculatedResults.L4_adj_cw" 
          y2="0" 
          stroke="#bdc3c7" 
          stroke-width="8" 
          stroke-linecap="round" 
        />
        
        <!-- Komponenter (Massor) -->
        <rect :x="-store.params.L1 - 10" y="-7" width="10" height="14" fill="#7f8c8d" />
        <rect :x="store.params.L3_fixed_cw - 5" y="-7" width="10" height="14" fill="#34495e" />
        <circle :cx="store.calculatedResults.L4_adj_cw" cy="0" r="15" fill="#2c3e50" />
        
        <!-- Labels för massorna -->
        <text :x="-store.params.L1" y="20" class="label-text">m1 ({{ store.m1.toFixed(1) }}g)</text>
        <text :x="store.params.L3_fixed_cw" y="20" class="label-text">m3</text>
        <text :x="store.calculatedResults.L4_adj_cw" y="25" class="label-text">m4</text>
        
        <!-- Dimensionslinjer -->
        <g class="dimension-line">
          <line :x1="-store.params.L1" y1="-30" x2="0" y2="-30" />
          <text :x="-store.params.L1 / 2" y="-35">L1 (Leff): {{ store.params.L1.toFixed(1) }} mm</text>
        </g>
        <g class="dimension-line">
          <line :x1="0" y1="-15" :x2="store.calculatedResults.L4_adj_cw" y2="-15" />
          <text :x="store.calculatedResults.L4_adj_cw / 2" y="-20">D: {{ store.calculatedResults.L4_adj_cw.toFixed(1) }} mm</text>
        </g>
      </g>
      
      <text v-else x="0" y="0" class="unbalanced-text">
        Arm Unbalanced
      </text>
    </svg>
  </div>
</template>

<style scoped>
.visualizer-container {
    width: 100%;
    /* NYTT: Höjd justerad för mindre utrymme */
    height: 150px; 
    overflow: hidden;
    background-color: #fff;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    margin-top: 1rem; /* Ger lite utrymme från resultaten ovanför */
}
.tonearm-svg {
    width: 100%;
    height: 100%;
}
.label-text {
    font-size: 10px;
    font-family: monospace;
    text-anchor: middle;
    fill: #34495e;
}
.dimension-line {
    stroke: #95a5a6;
    stroke-width: 1px;
}
.dimension-line text {
    font-size: 9px;
    font-family: sans-serif;
    text-anchor: middle;
    fill: #7f8c8d;
}
.unbalanced-text {
    font-size: 24px;
    font-weight: bold;
    fill: var(--danger-text);
    text-anchor: middle;
    dominant-baseline: middle;
}
</style>
