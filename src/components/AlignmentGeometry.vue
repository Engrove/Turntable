<!-- src/components/AlignmentGeometry.vue -->
<script setup>
import { computed } from 'vue';

const props = defineProps({
  pivotToSpindle: Number,
  effectiveLength: Number,
  overhang: Number,
  offsetAngle: Number,
  nulls: Object,
});

// === GEOMETRI & KONSTANTER ===
const P2S = computed(() => props.pivotToSpindle || 0);
const EL = computed(() => props.effectiveLength || 0);
const OVERHANG = computed(() => props.overhang || 0);
const OFFSET_ANGLE_RAD = computed(() => (props.offsetAngle || 0) * (Math.PI / 180));

// === SVG-VIEWBOX & SKALNING ===
const viewBox = computed(() => {
  const width = P2S.value + OVERHANG.value + 50; // 50 för motvikt
  const height = width * 0.75; // Behåll proportioner
  const padding = 20;
  return `${-OVERHANG.value - padding} ${-height / 2} ${width + padding * 2} ${height}`;
});

// === KOORDINATBERÄKNINGAR ===
const spindle = { x: 0, y: 0 };
const pivot = computed(() => ({ x: P2S.value, y: 0 }));

const stylusArcRadius = computed(() => EL.value);
const stylusArcCenter = computed(() => pivot.value);

const stylusPosition = computed(() => {
    // Beräkna stylus-position baserat på P2S och EL.
    const D = P2S.value;
    const Le = EL.value;
    // Använd cosinussatsen för att hitta vinkeln vid pivoten när stylusen korsar x-axeln
    const angleAtPivot = Math.acos((D**2 + Le**2 - OVERHANG.value**2) / (2 * D * Le));
    
    // Detta är en approximation. Vi placerar den på x-axeln för visualiseringens skull.
    return { x: -OVERHANG.value, y: 0};
});

const calculateNullPointCoords = (radius) => {
  if (!P2S.value || !EL.value || !radius) return null;
  const D = P2S.value;
  const Le = EL.value;
  const R = radius;

  const cosGamma = (D**2 + Le**2 - R**2) / (2 * D * Le);
  if (cosGamma < -1 || cosGamma > 1) return null;
  const gamma = Math.acos(cosGamma);

  return {
    x: pivot.value.x - Le * Math.cos(gamma),
    y: -Le * Math.sin(gamma),
  };
};

const innerNullCoord = computed(() => calculateNullPointCoords(props.nulls.inner));
const outerNullCoord = computed(() => calculateNullPointCoords(props.nulls.outer));

</script>

<template>
  <div class="panel">
    <h3>Geometry Visualization</h3>
    <div class="geometry-container">
      <svg :viewBox="viewBox" preserveAspectRatio="xMidYMid meet">
        <!-- Definitioner för pilar etc. -->
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" />
          </marker>
        </defs>

        <!-- Stora referensgeometrier -->
        <circle :cx="stylusArcCenter.x" :cy="stylusArcCenter.y" :r="stylusArcRadius" class="arc-path" />
        <circle :cx="spindle.x" :cy="spindle.y" r="146.05" class="record-edge" />
        <circle :cx="spindle.x" :cy="spindle.y" r="60.325" class="record-edge" />

        <!-- Måttlinjer och etiketter -->
        <g class="dimension-line p2s">
          <line :x1="spindle.x" :y1="spindle.y" :x2="pivot.x" :y2="pivot.y" />
          <text :x="P2S / 2" y="-10">Pivot-to-Spindle: {{ P2S.toFixed(1) }}mm</text>
        </g>
        
        <g class="dimension-line overhang">
          <line :x1="spindle.x" y1="0" :x2="-OVERHANG" y2="0" marker-end="url(#arrowhead)"/>
          <text :x="-OVERHANG / 2" y="15">Overhang: {{ OVERHANG.toFixed(1) }}mm</text>
        </g>

        <!-- Tonarm -->
        <g :transform="`translate(${pivot.x}, ${pivot.y})`">
          <line :x1="0" :y1="0" :x2="stylusPosition.x - pivot.x" :y2="stylusPosition.y" class="effective-length-line" />
          <text :x="(stylusPosition.x - pivot.x) / 2" :y="-10" transform="rotate(-5)">Effective Length: {{ EL.toFixed(1) }}mm</text>
        </g>
        
        <!-- Nollpunkter -->
        <g v-if="innerNullCoord" class="null-point inner" :transform="`translate(${innerNullCoord.x}, ${innerNullCoord.y})`">
          <circle cx="0" cy="0" r="3" />
          <text x="10" y="0">Inner Null</text>
        </g>
        <g v-if="outerNullCoord" class="null-point outer" :transform="`translate(${outerNullCoord.x}, ${outerNullCoord.y})`">
          <circle cx="0" cy="0" r="3" />
          <text x="10" y="0">Outer Null</text>
        </g>

        <!-- Pivot och Spindel punkter -->
        <circle class="spindle-point" :cx="spindle.x" :cy="spindle.y" r="3" />
        <circle class="pivot-point" :cx="pivot.x" :cy="pivot.y" r="3" />
      </svg>
    </div>
  </div>
</template>

<style scoped>
.panel {
  margin-top: 2rem;
}
.geometry-container {
  width: 100%;
  height: auto;
  min-height: 400px;
  background-color: #fff;
  border-radius: 6px;
  padding: 1rem;
}
svg {
  width: 100%;
  height: 100%;
}
.arc-path {
  fill: none;
  stroke: #3498db;
  stroke-width: 1px;
  stroke-dasharray: 5 5;
}
.record-edge {
  fill: none;
  stroke: #bdc3c7;
  stroke-width: 0.5px;
}
.dimension-line line {
  stroke-width: 1.5px;
}
.dimension-line text {
  font-size: 10px;
  font-family: sans-serif;
  text-anchor: middle;
}
.p2s line { stroke: #e67e22; }
.p2s text { fill: #e67e22; }
.overhang line { stroke: #c0392b; }
.overhang text { fill: #c0392b; }
.effective-length-line {
  stroke: #27ae60;
  stroke-width: 2px;
}
g > text[transform] {
  fill: #27ae60;
}
.spindle-point { fill: #2c3e50; }
.pivot-point { fill: #2c3e50; }
.null-point circle {
  stroke-width: 1.5px;
  fill: white;
}
.null-point.inner circle { stroke: #9b59b6; }
.null-point.outer circle { stroke: #16a085; }
.null-point text {
  font-size: 10px;
  font-family: sans-serif;
}
</style>
<!-- src/components/AlignmentGeometry.vue -->
