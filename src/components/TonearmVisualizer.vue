<!-- src/components/TonearmVisualizer.vue -->
<script setup>
import { useTonearmStore } from '@/store/tonearmStore.js'
import { computed } from 'vue'

const store = useTonearmStore()

// --- Ny, robust beräkningslogik för visualisering ---

// Definiera en fast bredd för vår visualisering
const vizWidth = 400; 

// Konvertera den verkliga längden på tonarmen (L1) till vår viz-skala
const scaleFactor = computed(() => vizWidth / store.params.L1);

// Beräkna X-positioner i vår nya, skalade koordinatsystem
const pivot_x = computed(() => vizWidth); // Pivot är längst till höger
const headshell_x = computed(() => pivot_x.value - store.params.L1 * scaleFactor.value); // Alltid 0
const m3_x = computed(() => pivot_x.value + store.params.L3_fixed_cw * scaleFactor.value);
const m4_x = computed(() => pivot_x.value + store.calculatedResults.L4_adj_cw * scaleFactor.value);

// Skala för kraftpilar, justerad för bättre proportioner
const forceScale = 20; 
const m1_arrow_length = computed(() => (store.m1 * 9.81) / forceScale);
const m3_arrow_length = computed(() => store.m3_fixed_cw.value > 0 ? (store.m3_fixed_cw.value * 9.81) / forceScale : 0);
const m4_arrow_length = computed(() => (store.params.m4_adj_cw * 9.81) / forceScale);

// Förenklad tilt för balans
const tiltAngle = computed(() => store.calculatedResults.isUnbalanced ? 0 : 2);

</script>

<template>
  <div class="visualizer-container">
    <svg viewBox="0 0 500 120" preserveAspectRatio="xMidYMid meet" class="tonearm-svg">
      
      <!-- Pivot-punkt (statisk) -->
      <g :transform="`translate(${pivot_x}, 60)`">
        <path d="M 0,-15 L -8,-25 L 8,-25 Z" fill="#2c3e50" />
        <line x1="0" y1="-15" x2="0" y2="30" stroke="#cccccc" stroke-width="1" />
      </g>
      
      <!-- Bas-skech av tonarmen, nu dynamiskt skalad -->
      <g class="tonearm-sketch" :transform="`translate(${pivot_x}, 60) rotate(${tiltAngle})`" >
        <!-- Armrör -->
        <line :x1="-store.params.L1 * scaleFactor" y1="0" x2="0" y2="0" stroke="#34495e" stroke-width="3" />
        <!-- Headshell-del -->
        <path :d="`M ${headshell_x - pivot_x} 0 l -15 -10 v 20 l 15 -10`" fill="none" stroke="#34495e" stroke-width="1.5" />
        <!-- Motvikts-stubbe -->
        <line x1="0" y1="0" :x2="m4_x - pivot_x + 15" y2="0" stroke="#7f8c8d" stroke-width="2" />
      </g>

      <!-- Dynamiska Kraftpilar och Labels -->
      <g v-if="!store.calculatedResults.isUnbalanced" :transform="`translate(0, 60) rotate(${tiltAngle} ${pivot_x} 0)`">
        <!-- Kraftpil för m1 (Front Mass) -->
        <g class="force-arrow m1-arrow" :transform="`translate(${headshell_x}, 0)`">
          <line x1="0" y1="10" :y2="10 + m1_arrow_length" />
          <polygon :points="`0,${12 + m1_arrow_length} -4,${8 + m1_arrow_length} 4,${8 + m1_arrow_length}`" />
          <text x="0" :y="20 + m1_arrow_length">m1</text>
        </g>

        <!-- Kraftpil för m3 (Fixed CW) - flyttad ovanför för att undvika kollision -->
        <g v-if="m3_arrow_length > 0" class="force-arrow m3-arrow" :transform="`translate(${m3_x}, 0)`">
          <line x1="0" y1="-10" :y2="-10 - m3_arrow_length" />
          <polygon :points="`0,${-12 - m3_arrow_length} -4,${-8 - m3_arrow_length} 4,${-8 - m3_arrow_length}`" />
          <text x="0" :y="-20 - m3_arrow_length">m3</text>
        </g>
        
        <!-- Motvikt och Kraftpil för m4 -->
        <g :transform="`translate(${m4_x}, 0)`">
            <circle cx="0" cy="0" r="10" fill="#2c3e50" stroke="#fff" stroke-width="1" />
            <g class="force-arrow m4-arrow">
              <line x1="0" y1="10" :y2="10 + m4_arrow_length" />
              <polygon :points="`0,${12 + m4_arrow_length} -4,${8 + m4_arrow_length} 4,${8 + m4_arrow_length}`" />
              <text x="0" :y="20 + m4_arrow_length">m4</text>
            </g>
        </g>
      </g>

      <text v-if="store.calculatedResults.isUnbalanced" x="250" y="60" class="unbalanced-text">
        Arm Unbalanced
      </text>
    </svg>
  </div>
</template>

<style scoped>
.visualizer-container {
    width: 100%;
    height: 120px; /* Justerad höjd */
    overflow: hidden;
    background-color: #f8f9fa; /* Ljus bakgrund för att se allt */
    border-radius: 4px;
    border: 1px solid var(--border-color);
    margin-top: 1rem;
}
.tonearm-svg {
    width: 100%;
    height: 100%;
}
.tonearm-sketch {
    transition: transform 0.3s ease-out;
}
.force-arrow line {
    stroke-width: 2;
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
    fill: #34495e;
}
.m1-arrow {
    stroke: #3498db;
    fill: #3498db;
}
.m3-arrow { /* Flyttad uppåt och ny färg */
    stroke: #e67e22;
    fill: #e67e22;
}
.m4-arrow {
    stroke: #9b59b6;
    fill: #9b59b6;
}
.unbalanced-text {
    font-size: 18px;
    font-weight: bold;
    fill: var(--danger-text);
    text-anchor: middle;
    dominant-baseline: middle;
}
</style>
