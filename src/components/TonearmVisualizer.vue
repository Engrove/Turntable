<!-- src/components/TonearmVisualizer.vue -->
<script setup>
import { useTonearmStore } from '@/store/tonearmStore.js'
import { computed } from 'vue'

const store = useTonearmStore()

// --- Beräkningar för visualisering ---

// Skala för kraftpilar. En större siffra ger kortare pilar.
const forceScale = 15; 

// Beräkna längden på kraftpilarna
const m1_arrow_length = computed(() => (store.m1 * 9.81) / forceScale);
const m3_arrow_length = computed(() => store.m3_fixed_cw.value > 0 ? (store.m3_fixed_cw.value * 9.81) / forceScale : 0);
const m4_arrow_length = computed(() => (store.params.m4_adj_cw * 9.81) / forceScale);

// Beräkna moment för att visualisera balansen
const frontMoment = computed(() => store.m1 * store.params.L1);
const rearMoment = computed(() => (store.m3_fixed_cw.value * store.params.L3_fixed_cw) + (store.params.m4_adj_cw * store.calculatedResults.L4_adj_cw));
const vtfMoment = computed(() => store.params.vtf * store.params.L1);

// Bestäm den dominerande sidan för att justera "vågskålen"
const tiltAngle = computed(() => {
    if (store.calculatedResults.isUnbalanced) return 0;
    // Enkel representation: En liten tilt för att visa VTF-momentet
    // Vi kan göra detta mer komplext, men detta ger en subtil visuell ledtråd.
    const balanceRatio = (frontMoment.value - vtfMoment.value) / rearMoment.value;
    // Returnera en liten vinkel för att visa att den är balanserad med VTF
    return 2; 
});

// En dynamisk viewBox för att säkerställa att allt får plats
const viewBox = computed(() => {
    const armLength = 230; // Baslängd för sketchen
    const cwPos = 35; // Basposition för motvikt i sketchen
    const extraSpace = 50;
    const minX = -armLength - extraSpace;
    const maxX = cwPos + extraSpace;
    const width = maxX - minX;
    const height = 150; 
    return `${minX} -${height / 2} ${width} ${height}`;
});

</script>

<template>
  <div class="visualizer-container">
    <svg :viewBox="viewBox" preserveAspectRatio="xMidYMid meet" class="tonearm-svg">
      
      <!-- Pivot-punkt -->
      <line x1="0" y1="-50" x2="0" y2="50" stroke="#cccccc" stroke-width="1" stroke-dasharray="2 2" />
      
      <!-- Bas-skech av tonarmen, fungerar som bakgrund -->
      <g class="tonearm-sketch" :transform="`rotate(${tiltAngle})`">
        <path d="M-229.5,8.5 L-229.5,1.5 L-204.5,1.5 L-204.5,-4.5 L-214.5,-14.5 L-229.5,-14.5 L-229.5,-21.5 L-239.5,-21.5 L-239.5,8.5 L-229.5,8.5 M-204.5,1.5 L-2.5,1.5 M-2.5,-1.5 L34.5,-1.5 M-2.5,1.5 L-2.5,-15.5 M11.5,-15.5 L11.5,-25.5 L-15.5,-25.5 L-15.5,-15.5 L-2.5,-15.5 M34.5,-1.5 C34.5,-10.9,27.4,-18.5,18.5,-18.5 L-1.5,-18.5 C-10.4,-18.5,-17.5,-10.9,-17.5,-1.5 L-17.5,15.5 C-17.5,24.9,-10.4,32.5,-1.5,32.5 L18.5,32.5 C27.4,32.5,34.5,24.9,34.5,15.5 L34.5,-1.5 M18.5,-18.5 C22.8,-18.5,26.5,-14.9,26.5,-10.5 L26.5,7.5 C26.5,11.9,22.8,15.5,18.5,15.5 L-1.5,15.5 C-5.8,15.5,-9.5,11.9,-9.5,7.5 L-9.5,-10.5 C-9.5,-14.9,-5.8,-18.5,-1.5,-18.5 L18.5,-18.5"
          fill="none" stroke="#2c3e50" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"/>
      </g>
      
      <!-- Dynamiska Kraftpilar och Labels -->
      <g v-if="!store.calculatedResults.isUnbalanced">
        <!-- Kraftpil för m1 (Front Mass) -->
        <g class="force-arrow m1-arrow" :transform="`translate(${-store.params.L1}, 0) rotate(${tiltAngle})`">
          <line x1="0" y1="5" :y2="5 + m1_arrow_length" />
          <polygon :points="`0,${10 + m1_arrow_length} -4,${5 + m1_arrow_length} 4,${5 + m1_arrow_length}`" />
          <text x="0" :y="15 + m1_arrow_length">m1</text>
        </g>

        <!-- Kraftpil för m3 (Fixed CW) - visas bara om m3 > 0 -->
        <g v-if="m3_arrow_length > 0" class="force-arrow m3-arrow" :transform="`translate(${store.params.L3_fixed_cw}, 0) rotate(${tiltAngle})`">
          <line x1="0" y1="5" :y2="5 + m3_arrow_length" />
          <polygon :points="`0,${10 + m3_arrow_length} -4,${5 + m3_arrow_length} 4,${5 + m3_arrow_length}`" />
          <text x="0" :y="15 + m3_arrow_length">m3</text>
        </g>

        <!-- Kraftpil för m4 (Adjustable CW) -->
        <g class="force-arrow m4-arrow" :transform="`translate(${store.calculatedResults.L4_adj_cw}, 0) rotate(${tiltAngle})`">
           <line x1="0" y1="5" :y2="5 + m4_arrow_length" />
           <polygon :points="`0,${10 + m4_arrow_length} -4,${5 + m4_arrow_length} 4,${5 + m4_arrow_length}`" />
           <text x="0" :y="15 + m4_arrow_length">m4</text>
        </g>
      </g>

      <!-- Balansvisualisering -->
      <g class="balance-visual" :transform="`translate(0, 40)`">
          <path d="M -10,0 L 10,0 M 0,0 L 0,-5 L -5, -10 L 5, -10 Z" stroke="#34495e" stroke-width="1.5" fill="none" />
          <path class="balance-beam" d="M -120,0 L 120,0" stroke="#95a5a6" stroke-width="2" stroke-linecap="round" :transform="`rotate(${tiltAngle})`" />
          <text x="-115" y="-5" class="balance-label">Front Moment</text>
          <text x="115" y="-5" class="balance-label" text-anchor="end">Rear Moment</text>
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
    height: 200px;
    overflow: visible; /* Tillåt pilar att ritas utanför */
    background-color: transparent;
    border-radius: 0;
    border: none;
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
    stroke-width: 1.5;
    stroke-linecap: round;
}
.force-arrow polygon {
    stroke-width: 1.5;
    stroke-linecap: round;
    stroke-linejoin: round;
}
.force-arrow text {
    font-size: 10px;
    font-family: monospace;
    text-anchor: middle;
    fill: #34495e;
}
.m1-arrow {
    stroke: #3498db;
    fill: #3498db;
}
.m3-arrow {
    stroke: #e67e22;
    fill: #e67e22;
}
.m4-arrow {
    stroke: #9b59b6;
    fill: #9b59b6;
}
.balance-visual .balance-beam {
    transition: transform 0.3s ease-out;
}
.balance-label {
    font-size: 9px;
    fill: var(--label-color);
}
.unbalanced-text {
    font-size: 24px;
    font-weight: bold;
    fill: var(--danger-text);
    text-anchor: middle;
    dominant-baseline: middle;
}
</style>
