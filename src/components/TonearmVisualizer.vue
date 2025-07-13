<!-- src/components/TonearmVisualizer.vue -->
<script setup>
import { useTonearmStore } from '@/store/tonearmStore.js'
import { computed } from 'vue'

const store = useTonearmStore()

// --- Beräkningar för visualisering ---
const pivot_x = 0; // Pivot är nu vid x=0 för enklare beräkningar

// Beräkna X-positioner relativt pivot
const headshell_x = computed(() => -store.params.L1);
const m3_x = computed(() => store.params.L3_fixed_cw);
const m4_x = computed(() => store.calculatedResults.L4_adj_cw);

// Skala för kraftpilar
const forceScale = 20; 
const m1_total_force = computed(() => (store.m1 + store.params.vtf) * 9.81);
const m3_force = computed(() => store.m3_fixed_cw.value * 9.81);
const m4_force = computed(() => store.params.m4_adj_cw * 9.81);

const m1_arrow_height = computed(() => m1_total_force.value / forceScale);
const m3_arrow_height = computed(() => store.m3_fixed_cw.value > 0 ? m3_force.value / forceScale : 0);
const m4_arrow_height = computed(() => m4_force.value / forceScale);

// Vinkeln representerar balansen/obalansen
const tiltAngle = computed(() => {
  if (store.calculatedResults.isUnbalanced) return -5; // Tydlig obalans
  // Annars, en liten positiv vinkel för att representera VTF
  return 2.0; 
});

</script>

<template>
  <div class="visualizer-container">
    <!-- Fast ViewBox för att kontrollera storleken -->
    <svg viewBox="-300 -70 350 140" preserveAspectRatio="xMidYMid meet" class="tonearm-svg">
      
      <!-- Pivot-punkt (statisk) -->
      <g :transform="`translate(${pivot_x}, 0)`">
        <path d="M 0,-15 L -8,-25 L 8,-25 Z" fill="#2c3e50" />
        <line x1="0" y1="-15" x2="0" y2="50" stroke="#cccccc" stroke-width="1" />
        <circle cx="0" cy="0" r="3" fill="#2c3e50" />
      </g>
      
      <!-- Tonarmen roterar runt pivot -->
      <g class="tonearm-sketch" :transform="`rotate(${tiltAngle}, ${pivot_x}, 0)`" >
        <!-- Återställd SVG Path från din originalfil, centrerad runt pivot (0,0) -->
        <path d="M-229.5,8.5 L-229.5,1.5 L-204.5,1.5 L-204.5,-4.5 L-214.5,-14.5 L-229.5,-14.5 L-229.5,-21.5 L-239.5,-21.5 L-239.5,8.5 L-229.5,8.5 M-204.5,1.5 L-2.5,1.5 M-2.5,-1.5 L34.5,-1.5 M-2.5,1.5 L-2.5,-15.5 M11.5,-15.5 L11.5,-25.5 L-15.5,-25.5 L-15.5,-15.5 L-2.5,-15.5 M34.5,-1.5 C34.5,-10.9,27.4,-18.5,18.5,-18.5 L-1.5,-18.5 C-10.4,-18.5,-17.5,-10.9,-17.5,-1.5 L-17.5,15.5 C-17.5,24.9,-10.4,32.5,-1.5,32.5 L18.5,32.5 C27.4,32.5,34.5,24.9,34.5,15.5 L34.5,-1.5 M18.5,-18.5 C22.8,-18.5,26.5,-14.9,26.5,-10.5 L26.5,7.5 C26.5,11.9,22.8,15.5,18.5,15.5 L-1.5,15.5 C-5.8,15.5,-9.5,11.9,-9.5,7.5 L-9.5,-10.5 C-9.5,-14.9,-5.8,-18.5,-1.5,-18.5 L18.5,-18.5"
          fill="none" stroke="#2c3e50" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>

        <!-- Dynamiska Kraftpilar (roterar med armen) -->
        <g v-if="!store.calculatedResults.isUnbalanced">
            <g class="force-arrow m1-arrow" :transform="`translate(${headshell_x}, 0)`">
                <line x1="0" y1="18" :y2="18 + m1_arrow_height" />
                <polygon :points="`0,${20 + m1_arrow_height} -4,${16 + m1_arrow_height} 4,${16 + m1_arrow_height}`" />
                <text x="0" :y="35 + m1_arrow_height">{{ (store.m1 + store.params.vtf).toFixed(1) }}g</text>
            </g>

            <g v-if="m3_arrow_height > 0" class="force-arrow m3-arrow" :transform="`translate(${m3_x}, 0)`">
                <line x1="0" y1="-22" :y2="-22 - m3_arrow_height" />
                <polygon :points="`0,${-24 - m3_arrow_height} -4,${-20 - m3_arrow_height} 4,${-20 - m3_arrow_height}`" />
                <text x="0" :y="-37 - m3_arrow_height">{{ store.m3_fixed_cw.value.toFixed(1) }}g</text>
            </g>
            
            <g class="force-arrow m4-arrow" :transform="`translate(${m4_x}, 0)`">
                <line x1="0" y1="18" :y2="18 + m4_arrow_height" />
                <polygon :points="`0,${20 + m4_arrow_height} -4,${16 + m4_arrow_height} 4,${16 + m4_arrow_height}`" />
                <text x="0" :y="35 + m4_arrow_height">{{ store.params.m4_adj_cw.toFixed(0) }}g</text>
            </g>
        </g>
      </g>
      
      <!-- Dimensionslinjer (statiska, roterar inte) -->
      <g class="dimension-lines" v-if="!store.calculatedResults.isUnbalanced">
          <line :x1="headshell_x" y1="-40" :x2="pivot_x" y2="-40" />
          <line :x1="headshell_x" y1="-45" :x2="headshell_x" y2="-35" />
          <line :x1="pivot_x" y1="-45" :x2="pivot_x" y2="-35" />
          <text :x="headshell_x / 2" y="-48">L1: {{ store.params.L1.toFixed(1) }} mm</text>

          <line :x1="pivot_x" y1="40" :x2="m4_x" y2="40" />
          <line :x1="pivot_x" y1="35" :x2="pivot_x" y2="45" />
          <line :x1="m4_x" y1="35" :x2="m4_x" y2="45" />
          <text :x="m4_x / 2" y="55">D: {{ store.calculatedResults.L4_adj_cw.toFixed(1) }} mm</text>
      </g>

      <text v-if="store.calculatedResults.isUnbalanced" x="0" y="0" class="unbalanced-text">
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
    font-weight: 600;
    text-anchor: middle;
}
.m1-arrow { stroke: #3498db; fill: #3498db; }
.m1-arrow text { fill: #2c3e50; }
.m3-arrow { stroke: #e67e22; fill: #e67e22; }
.m3-arrow text { fill: #2c3e50; }
.m4-arrow { stroke: #9b59b6; fill: #9b59b6; }
.m4-arrow text { fill: #2c3e50; }
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
