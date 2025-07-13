<!-- src/components/TonearmVisualizer.vue -->
<script setup>
import { useTonearmStore } from '@/store/tonearmStore.js'
import { computed } from 'vue'

const store = useTonearmStore()

// --- Ny, robust beräkningslogik för visualisering ---

// Definiera en fast bredd (i SVG-enheter) för tonarmen från pivot till pickup.
// Detta gör layouten förutsägbar.
const vizArmLength = 230;

// Beräkna den visuella positionen för den justerbara motvikten (m4)
// Den skalas relativt till armlängden för att se proportionerlig ut.
const m4_viz_pos_x = computed(() => {
  if (store.calculatedResults.isUnbalanced || store.params.L1 === 0) return 35;
  // Skala m4-positionen baserat på förhållandet till L1
  const ratio = store.calculatedResults.L4_adj_cw / store.params.L1;
  return Math.max(10, ratio * vizArmLength * 0.3); // Multiplicera med en faktor för visuell effekt
});

// Beräkna den visuella positionen för den fasta motvikten (m3)
const m3_viz_pos_x = computed(() => {
  if (store.params.L1 === 0) return 0;
  const ratio = store.params.L3_fixed_cw / store.params.L1;
  return ratio * vizArmLength * 0.3;
});


// Beräkna en skalad längd för kraftpilarna för att de ska se rimliga ut
const forceScale = 18;
const m1_arrow_height = computed(() => Math.min(40, (store.m1 * 9.81) / forceScale));
const m3_arrow_height = computed(() => store.m3_fixed_cw.value > 0 ? Math.min(40, (store.m3_fixed_cw.value * 9.81) / forceScale) : 0);
const m4_arrow_height = computed(() => Math.min(40, (store.params.m4_adj_cw * 9.81) / forceScale));

// Förenklad tilt för balans
const tiltAngle = computed(() => store.calculatedResults.isUnbalanced ? 0 : 1.5);

</script>

<template>
  <div class="visualizer-container">
    <svg viewBox="-270 -50 350 100" preserveAspectRatio="xMidYMid meet" class="tonearm-svg">
      
      <!-- Pivot-punkt (statisk) -->
      <g transform="translate(0, 0)">
        <path d="M 0,-15 L -8,-25 L 8,-25 Z" fill="#2c3e50" />
        <line x1="0" y1="-15" x2="0" y2="40" stroke="#cccccc" stroke-width="1" />
      </g>
      
      <!-- Tonarmen roterar runt pivot (0,0) -->
      <g class="tonearm-sketch" :transform="`rotate(${tiltAngle})`" >
        <!-- Använd den SVG path du skickade som grund, justerad till vårt koordinatsystem -->
        <path d="M-229.5,8.5 L-229.5,1.5 L-204.5,1.5 L-204.5,-4.5 L-214.5,-14.5 L-229.5,-14.5 L-229.5,-21.5 L-239.5,-21.5 L-239.5,8.5 L-229.5,8.5 M-204.5,1.5 L-2.5,1.5 M-2.5,-1.5 L34.5,-1.5 M-2.5,1.5 L-2.5,-15.5 M11.5,-15.5 L11.5,-25.5 L-15.5,-25.5 L-15.5,-15.5 L-2.5,-15.5 M34.5,-1.5 C34.5,-10.9,27.4,-18.5,18.5,-18.5 L-1.5,-18.5 C-10.4,-18.5,-17.5,-10.9,-17.5,-1.5 L-17.5,15.5 C-17.5,24.9,-10.4,32.5,-1.5,32.5 L18.5,32.5 C27.4,32.5,34.5,24.9,34.5,15.5 L34.5,-1.5 M18.5,-18.5 C22.8,-18.5,26.5,-14.9,26.5,-10.5 L26.5,7.5 C26.5,11.9,22.8,15.5,18.5,15.5 L-1.5,15.5 C-5.8,15.5,-9.5,11.9,-9.5,7.5 L-9.5,-10.5 C-9.5,-14.9,-5.8,-18.5,-1.5,-18.5 L18.5,-18.5"
          fill="none" stroke="#34495e" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"
          :transform="`scale(${vizArmLength / 230})`"
        />
      </g>
      
      <!-- Dynamiska Kraftpilar (roterar med armen) -->
      <g v-if="!store.calculatedResults.isUnbalanced" :transform="`rotate(${tiltAngle})`">
        <!-- m1 Kraftpil vid pickupen -->
        <g class="force-arrow m1-arrow" :transform="`translate(${-vizArmLength}, 0)`">
          <line x1="0" y1="10" :y2="10 + m1_arrow_height" />
          <polygon :points="`0,${12 + m1_arrow_height} -4,${8 + m1_arrow_height} 4,${8 + m1_arrow_height}`" />
        </g>

        <!-- m3 Kraftpil (fast motvikt) - pekar uppåt för tydlighet -->
        <g v-if="m3_arrow_height > 0" class="force-arrow m3-arrow" :transform="`translate(${m3_viz_pos_x}, 0)`">
           <line x1="0" y1="-10" :y2="-10 - m3_arrow_height" />
           <polygon :points="`0,${-12 - m3_arrow_height} -4,${-8 - m3_arrow_height} 4,${-8 - m3_arrow_height}`" />
        </g>
        
        <!-- m4 Kraftpil (justerbar motvikt) -->
        <g class="force-arrow m4-arrow" :transform="`translate(${m4_viz_pos_x}, 0)`">
            <line x1="0" y1="10" :y2="10 + m4_arrow_height" />
            <polygon :points="`0,${12 + m4_arrow_height} -4,${8 + m4_arrow_height} 4,${8 + m4_arrow_length}`" />
        </g>
      </g>

      <text v-if="store.calculatedResults.isUnbalanced" x="0" y="0" class="unbalanced-text">
        Arm Unbalanced
      </text>
    </svg>

    <!-- HTML-baserade labels för perfekt läsbarhet -->
    <div class="labels-overlay" v-if="!store.calculatedResults.isUnbalanced">
        <span class="label-text m1-label" :style="{ left: `calc(${(headshell_x + 270) / 500 * 100}%)` }">m1</span>
        <span v-if="m3_arrow_height > 0" class="label-text m3-label" :style="{ left: `calc(${(m3_x + 270) / 500 * 100}%)` }">m3</span>
        <span class="label-text m4-label" :style="{ left: `calc(${(m4_x + 270) / 500 * 100}%)` }">m4</span>
    </div>

  </div>
</template>

<style scoped>
.visualizer-container {
    position: relative; /* Nödvändigt för att positionera text-labels */
    width: 100%;
    height: 120px;
    overflow: hidden;
    background-color: #f8f9fa;
    border-radius: 4px;
    border: 1px solid var(--border-color);
    margin-top: 1rem;
}
.tonearm-svg {
    width: 100%;
    height: 100%;
    overflow: visible;
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
.m1-arrow { stroke: #3498db; fill: #3498db; }
.m3-arrow { stroke: #e67e22; fill: #e67e22; }
.m4-arrow { stroke: #9b59b6; fill: #9b59b6; }
.unbalanced-text {
    font-size: 22px;
    font-weight: bold;
    fill: var(--danger-text);
    text-anchor: middle;
    dominant-baseline: middle;
}

/* Nytt för text-labels */
.labels-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none; /* Låt klick gå igenom */
}
.label-text {
    position: absolute;
    font-size: 11px;
    font-family: sans-serif;
    font-weight: 500;
    color: #34495e;
    transform: translateX(-50%); /* Centrera texten */
}
.m1-label { bottom: 5px; }
.m3-label { top: 5px; }
.m4-label { bottom: 5px; }
</style>
