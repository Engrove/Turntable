<!-- src/components/TonearmVisualizer.vue -->
<script setup>
import { useTonearmStore } from '@/store/tonearmStore.js'
import { computed } from 'vue'

const store = useTonearmStore()

// --- Ny, robust beräkningslogik för visualisering ---
const vizWidth = 400; 
const scaleFactor = computed(() => store.params.L1 > 0 ? vizWidth / store.params.L1 : 1);

const pivot_x = computed(() => vizWidth); 
const headshell_x = computed(() => pivot_x.value - store.params.L1 * scaleFactor.value);
const m3_x = computed(() => pivot_x.value + store.params.L3_fixed_cw * scaleFactor.value);
const m4_x = computed(() => pivot_x.value + store.calculatedResults.L4_adj_cw * scaleFactor.value);

// NYTT: Kraftpilar representerar nu kraft (F = m*g) och inkluderar VTF
const forceScale = 25; // Justerad för bättre proportioner
// Total nedåtkraft vid pickupen är massan plus den applicerade spårningskraften
const m1_force = computed(() => (store.m1 + store.params.vtf) * 9.81);
const m3_force = computed(() => store.m3_fixed_cw.value * 9.81);
const m4_force = computed(() => store.params.m4_adj_cw * 9.81);

const m1_arrow_height = computed(() => m1_force.value / forceScale);
const m3_arrow_height = computed(() => store.m3_fixed_cw.value > 0 ? m3_force.value / forceScale : 0);
const m4_arrow_height = computed(() => m4_force.value / forceScale);


// NYTT: Vinkeln representerar nu balansen/obalansen mellan momenten.
const tiltAngle = computed(() => {
  if (store.calculatedResults.isUnbalanced) return -5; // Visa en tydlig obalans

  // Beräkna totalt moment på båda sidor
  const frontMoment = (store.m1 * store.params.L1) + (store.params.vtf * store.params.L1);
  const rearMoment = (store.m3_fixed_cw.value * store.params.L3_fixed_cw) + (store.params.m4_adj_cw * store.calculatedResults.L4_adj_cw);

  // Om de är i perfekt balans (vilket de ska vara), ge en liten positiv vinkel för att visa VTF
  if (Math.abs(frontMoment - rearMoment) < 1) {
    return 2.0; 
  }

  // Om det finns en liten obalans (t.ex. vid manuell justering), visualisera den
  const diff = frontMoment - rearMoment;
  // Kläm vinkeln mellan -10 och 10 grader för en rimlig visuell effekt
  return Math.max(-10, Math.min(10, diff / 100)); 
});
</script>

<template>
  <div class="visualizer-container">
    <svg viewBox="-50 -70 500 140" preserveAspectRatio="xMidYMid meet" class="tonearm-svg">
      
      <g :transform="`translate(${pivot_x}, 0)`">
        <path d="M 0,-15 L -8,-25 L 8,-25 Z" fill="#2c3e50" />
        <line x1="0" y1="-15" x2="0" y2="50" stroke="#cccccc" stroke-width="1" />
        <circle cx="0" cy="0" r="3" fill="#2c3e50" />
      </g>
      
      <g class="tonearm-sketch" :transform="`rotate(${tiltAngle}, ${pivot_x}, 0)`" >
        <line :x1="headshell_x" y1="0" :x2="pivot_x" y2="0" stroke="#34495e" stroke-width="4" />
        <path :d="`M ${headshell_x} 0 l -5 0 l 0 -10 l 20 0 l 5 10 l -25 0`" fill="none" stroke="#34495e" stroke-width="1.5" />
        <line :x1="pivot_x" y1="0" :x2="m4_x + 25" y2="0" stroke="#7f8c8d" stroke-width="3" />

        <g v-if="!store.calculatedResults.isUnbalanced">
            <g class="force-arrow m1-arrow" :transform="`translate(${headshell_x}, 0)`">
                <line x1="0" y1="15" :y2="15 + m1_arrow_height" />
                <polygon :points="`0,${17 + m1_arrow_height} -4,${13 + m1_arrow_height} 4,${13 + m1_arrow_height}`" />
                <text x="0" :y="32 + m1_arrow_height">{{ (store.m1 + store.params.vtf).toFixed(1) }}g</text>
            </g>

            <g v-if="m3_arrow_height > 0" class="force-arrow m3-arrow" :transform="`translate(${m3_x}, 0)`">
                <line x1="0" y1="-15" :y2="-15 - m3_arrow_height" />
                <polygon :points="`0,${-17 - m3_arrow_height} -4,${-13 - m3_arrow_height} 4,${-13 - m3_arrow_height}`" />
                <text x="0" :y="-32 - m3_arrow_height">{{ store.m3_fixed_cw.value.toFixed(1) }}g</text>
            </g>
            
            <g :transform="`translate(${m4_x}, 0)`">
                <rect x="-12" y="-12" width="24" height="24" rx="4" fill="#34495e" stroke="#fff" stroke-width="1" />
                <g class="force-arrow m4-arrow">
                    <line x1="0" y1="15" :y2="15 + m4_arrow_height" />
                    <polygon :points="`0,${17 + m4_arrow_height} -4,${13 + m4_arrow_height} 4,${13 + m4_arrow_length}`" />
                    <text x="0" :y="32 + m4_arrow_height">{{ store.params.m4_adj_cw.toFixed(0) }}g</text>
                </g>
            </g>
        </g>
      </g>
      
      <g class="dimension-lines" v-if="!store.calculatedResults.isUnbalanced">
          <line :x1="headshell_x" y1="-40" :x2="pivot_x" y2="-40" />
          <line :x1="headshell_x" y1="-45" :x2="headshell_x" y2="-35" />
          <line :x1="pivot_x" y1="-45" :x2="pivot_x" y2="-35" />
          <text :x="headshell_x + (pivot_x - headshell_x)/2" y="-48">L1 (Leff): {{ store.params.L1.toFixed(1) }} mm</text>

          <line :x1="pivot_x" y1="45" :x2="m4_x" y2="45" />
          <line :x1="pivot_x" y1="40" :x2="pivot_x" y2="50" />
          <line :x1="m4_x" y1="40" :x2="m4_x" y2="50" />
          <text :x="pivot_x + (m4_x - pivot_x)/2" y="60">D: {{ store.calculatedResults.L4_adj_cw.toFixed(1) }} mm</text>
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
    height: 180px;
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

