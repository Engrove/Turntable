<!-- src/components/TonearmGeometry.vue -->
<script setup>
import { computed } from 'vue'

const props = defineProps({
  tonearm: {
    type: Object,
    required: true,
    default: () => null
  }
});

// Beräkningar baseras nu på props
const vizWidth = 600;

// Skalningsfaktor baserad på total spännvidd (stylus till bakkant)
const totalSpan = computed(() => props.tonearm ? (props.tonearm.pivot_to_spindle_mm + props.tonearm.overhang_mm + 50) : 300); // 50mm för motvikt etc.
const scaleFactor = computed(() => vizWidth / totalSpan.value);

const pivot_x = computed(() => props.tonearm ? props.tonearm.pivot_to_spindle_mm * scaleFactor.value : 0);
const spindle_x = 0;
const stylus_x = computed(() => props.tonearm ? -props.tonearm.overhang_mm * scaleFactor.value : 0);

</script>

<template>
  <div v-if="tonearm" class="viz-panel">
    <h4 class="viz-title">3. Tonearm Geometry & Alignment</h4>
    <p class="viz-description">This diagram illustrates the key alignment measurements for the selected tonearm: <b>{{ tonearm.manufacturer }} {{ tonearm.model }}</b>.</p>
    <div class="geometry-container">
      <svg :viewBox="`-${vizWidth * 0.25} -100 ${vizWidth * 1.3} 200`" preserveAspectRatio="xMidYMid meet">

        <!-- Spindel (Tallrikens mitt) -->
        <g class="spindle" :transform="`translate(${spindle_x}, 0)`">
          <circle cx="0" cy="0" r="5" fill="none" stroke="#2c3e50" stroke-width="2"/>
          <circle cx="0" cy="0" r="1.5" fill="#2c3e50"/>
          <text y="-15">Spindle</text>
        </g>
        
        <!-- Pivot -->
        <g class="pivot" :transform="`translate(${pivot_x}, 0)`">
           <circle cx="0" cy="0" r="5" fill="none" stroke="#2c3e50" stroke-width="2"/>
           <path d="M -3 0 l 6 0 M 0 -3 l 0 6" stroke="#2c3e50" stroke-width="1.5"/>
           <text y="-15">Pivot</text>
        </g>

        <!-- Måttlinjer -->
        <g class="dimension-line">
            <line :x1="spindle_x" y1="50" :x2="pivot_x" y2="50" />
            <line :x1="spindle_x" y1="45" :x2="spindle_x" y2="55" />
            <line :x1="pivot_x" y1="45" :x2="pivot_x" y2="55" />
            <text :x="(pivot_x + spindle_x) / 2" y="42">Pivot to Spindle: {{ tonearm.pivot_to_spindle_mm.toFixed(1) }} mm</text>
        </g>
        <g class="dimension-line overhang">
            <line :x1="spindle_x" y1="-50" :x2="stylus_x" y2="-50" />
            <line :x1="spindle_x" y1="-55" :x2="spindle_x" y2="-45" />
            <line :x1="stylus_x" y1="-55" :x2="stylus_x" y2="-45" />
            <text :x="(stylus_x + spindle_x) / 2" y="-58">Overhang: {{ tonearm.overhang_mm.toFixed(1) }} mm</text>
        </g>
         <g class="dimension-line effective-length">
            <line :x1="stylus_x" y1="70" :x2="pivot_x" y2="70" />
            <line :x1="stylus_x" y1="65" :x2="stylus_x" y2="75" />
            <line :x1="pivot_x" y1="65" :x2="pivot_x" y2="75" />
            <text :x="(pivot_x + stylus_x) / 2" y="85">Effective Length: {{ tonearm.effective_length_mm.toFixed(1) }} mm</text>
        </g>

        <!-- HELT DYNAMISK TONEARM -->
        <g class="tonearm-sketch" :transform="`translate(${pivot_x}, 0)`">
            <!-- Armrör -->
            <line :x1="stylus_x - pivot_x" y1="0" x2="0" y2="0" stroke="#34495e" stroke-width="4"/>
            <!-- Motviktsstubbe -->
            <line x1="0" y1="0" x2="40" y2="0" stroke="#7f8c8d" stroke-width="3"/>
            <!-- Headshell -->
            <g :transform="`translate(${stylus_x - pivot_x}, 0)`">
                 <path d="M 0 0 l -5 0 l 0 -10 l 20 0 l 5 10 l -25 0" fill="#f8f9fa" stroke="#34495e" stroke-width="1.5" />
            </g>
            <!-- Motvikt -->
            <g transform="translate(40, 0)">
                <rect x="-12" y="-12" width="24" height="24" rx="4" fill="#34495e" />
            </g>
        </g>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.viz-panel {
  background-color: #f8f9fa;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 1rem 1.5rem;
}
.viz-title {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--header-color);
  margin: 0 0 0.5rem 0;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 0.5rem;
}
.viz-description {
  font-size: 0.85rem;
  color: var(--label-color);
  margin: 0 0 1rem 0;
  line-height: 1.5;
}
.viz-description b {
  color: var(--text-color);
}
.geometry-container {
  width: 100%;
  height: 200px;
}
.tonearm-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
}
.spindle text, .pivot text {
    text-anchor: middle;
    font-size: 12px;
    font-family: sans-serif;
    fill: #7f8c8d;
}
.dimension-line {
    stroke: #7f8c8d;
    stroke-width: 1px;
}
.dimension-line.overhang { stroke: #c0392b; }
.dimension-line.effective-length { stroke: #27ae60; }
.dimension-line text {
    font-size: 12px;
    font-family: sans-serif;
    fill: #34495e;
    text-anchor: middle;
    font-weight: 500;
}
.dimension-line.overhang text { fill: #c0392b; }
.dimension-line.effective-length text { fill: #27ae60; }
.tonearm-sketch {
    opacity: 0.9;
}
</style>
