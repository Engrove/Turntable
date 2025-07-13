<!-- src/components/TonearmVisualizer.vue -->
<script setup>
import { useTonearmStore } from '@/store/tonearmStore.js'
import { computed } from 'vue'

const store = useTonearmStore()

const vizWidth = 400; 
const scaleFactor = computed(() => vizWidth / store.params.L1);

const pivot_x = computed(() => vizWidth); 
const headshell_x = computed(() => pivot_x.value - store.params.L1 * scaleFactor.value);
const m3_x = computed(() => pivot_x.value + store.params.L3_fixed_cw * scaleFactor.value);
const m4_x = computed(() => pivot_x.value + store.calculatedResults.L4_adj_cw * scaleFactor.value);

const forceScale = 20; 
const m1_arrow_height = computed(() => (store.m1 * 9.81) / forceScale);
const m3_arrow_height = computed(() => store.m3_fixed_cw.value > 0 ? (store.m3_fixed_cw.value * 9.81) / forceScale : 0);
const m4_arrow_height = computed(() => (store.params.m4_adj_cw * 9.81) / forceScale);

const tiltAngle = computed(() => store.calculatedResults.isUnbalanced ? 0 : 1.5);

</script>

<template>
  <!-- Ramen är borta, komponenten placeras fritt -->
  <div class="visualizer-container">
    <svg viewBox="-50 -70 500 140" preserveAspectRatio="xMidYMid meet" class="tonearm-svg">
      
      <!-- Pivot-punkt (statisk) -->
      <g :transform="`translate(${pivot_x}, 0)`">
        <path d="M 0,-15 L -8,-25 L 8,-25 Z" fill="#2c3e50" />
        <line x1="0" y1="-15" x2="0" y2="50" stroke="#cccccc" stroke-width="1" />
        <circle cx="0" cy="0" r="3" fill="#2c3e50" />
      </g>
      
      <!-- Tonarmen roterar runt pivot -->
      <g class="tonearm-sketch" :transform="`rotate(${tiltAngle}, ${pivot_x}, 0)`" >
        <!-- Armrör -->
        <line :x1="headshell_x" y1="0" :x2="pivot_x" y2="0" stroke="#34495e" stroke-width="4" />
        <!-- Headshell-del -->
        <path :d="`M ${headshell_x} 0 l -5 0 l 0 -10 l 20 0 l 5 10 l -25 0`" fill="none" stroke="#34495e" stroke-width="1.5" />
        <!-- Motvikts-stubbe -->
        <line :x1="pivot_x" y1="0" :x2="m4_x + 25" y2="0" stroke="#7f8c8d" stroke-width="3" />

        <!-- Dynamiska Kraftpilar (roterar med armen) -->
        <g v-if="!store.calculatedResults.isUnbalanced">
            <!-- m1 Kraftpil & Text -->
            <g class="force-arrow m1-arrow" :transform="`translate(${headshell_x}, 0)`">
                <line x1="0" y1="15" :y2="15 + m1_arrow_height" />
                <polygon :points="`0,${17 + m1_arrow_height} -4,${13 + m1_arrow_height} 4,${13 + m1_arrow_height}`" />
                <text x="0" :y="32 + m1_arrow_height">{{ store.m1.toFixed(1) }}g</text>
            </g>

            <!-- m3 Kraftpil & Text (ovanför) -->
            <g v-if="m3_arrow_height > 0" class="force-arrow m3-arrow" :transform="`translate(${m3_x}, 0)`">
                <line x1="0" y1="-15" :y2="-15 - m3_arrow_height" />
                <polygon :points="`0,${-17 - m3_arrow_height} -4,${-13 - m3_arrow_height} 4,${-13 - m3_arrow_height}`" />
                <text x="0" :y="-32 - m3_arrow_height">{{ store.m3_fixed_cw.value.toFixed(1) }}g</text>
            </g>
            
            <!-- m4 Motvikt & Kraftpil -->
            <g :transform="`translate(${m4_x}, 0)`">
                <rect x="-12" y="-12" width="24" height="24" rx="4" fill="#34495e" stroke="#fff" stroke-width="1" />
                <g class="force-arrow m4-arrow">
                    <line x1="0" y1="15" :y2="15 + m4_arrow_height" />
                    <polygon :points="`0,${17 + m4_arrow_height} -4,${13 + m4_arrow_height} 4,${13 + m4_arrow_height}`" />
                    <text x="0" :y="32 + m4_arrow_height">{{ store.params.m4_adj_cw.toFixed(0) }}g</text>
                </g>
            </g>
        </g>
      </g>
      
      <!-- Dimensionslinjer (statiska, roterar inte) -->
      <g class="dimension-lines" v-if="!store.calculatedResults.isUnbalanced">
          <!-- L1 (Effective Length) -->
          <line :x1="headshell_x" y1="-40" :x2="pivot_x" y2="-40" />
          <line :x1="headshell_x" y1="-45" :x2="headshell_x" y2="-35" />
          <line :x1="pivot_x" y1="-45" :x2="pivot_x" y2="-35" />
          <text :x="headshell_x + (pivot_x - headshell_x)/2" y="-48">L1 (Leff): {{ store.params.L1.toFixed(1) }} mm</text>

          <!-- D (Adj. CW Distance) -->
          <line :x1="pivot_x" y1="40" :x2="m4_x" y2="40" />
          <line :x1="pivot_x" y1="35" :x2="pivot_x" y2="45" />
          <line :x1="m4_x" y1="35" :x2="m4_x" y2="45" />
          <text :x="pivot_x + (m4_x - pivot_x)/2" y="55">D: {{ store.calculatedResults.L4_adj_cw.toFixed(1) }} mm</text>
      </g>

      <text v-if="store.calculatedResults.isUnbalanced" x="225" y="0" class="unbalanced-text">
        Arm Unbalanced
      </text>
    </svg>
  </div>
</template>

<style scoped>
.visualizer-container {
    width: 100%;
    height: 180px; /* Ökad höjd för att rymma mått */
    margin-top: 1.5rem;
    padding: 1rem 0;
}
.tonearm-svg {
    width: 100%;
    height: 100%;
    overflow: visible;
}
.tonearm-sketch {
    transition: transform 0.3s ease-out;
}
.force-arrow line, .dimension-lines line {
    stroke-width: 1.5;
    stroke-linecap: round;
}
.force-arrow polygon {
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
}
.force-arrow text {
    font-size: 11px;
    font-family: sans-serif;
    font-weight: 500;
    text-anchor: middle;
}
.m1-arrow { stroke: #3498db; fill: #3498db; }
.m1-arrow text { fill: #3498db; }
.m3-arrow { stroke: #e67e22; fill: #e67e22; }
.m3-arrow text { fill: #e67e22; }
.m4-arrow { stroke: #9b59b6; fill: #9b59b6; }
.m4-arrow text { fill: #9b59b6; }
.dimension-lines {
    stroke: #7f8c8d;
}
.dimension-lines text {
    font-size: 10px;
    font-family: sans-serif;
    fill: #7f8c8d;
    text-anchor: middle;
}
.unbalanced-text {
    font-size: 22px;
    font-weight: bold;
    fill: var(--danger-text);
    text-anchor: middle;
    dominant-baseline: middle;
}
</style>
