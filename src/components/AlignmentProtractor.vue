<!-- src/components/AlignmentProtractor.vue -->
<script setup>
import { computed } from 'vue';

const props = defineProps({
  pivotToSpindle: Number,
  effectiveLength: Number,
  overhang: Number,
  offsetAngle: Number,
  nulls: Object,
  alignmentType: String,
});

const viewBoxWidth = 500;
const viewBoxHeight = 350;
const center_x = viewBoxWidth / 2 - 50;
const center_y = viewBoxHeight / 2 + 50;

const p2s = computed(() => props.pivotToSpindle || 0);
const el = computed(() => props.effectiveLength || 0);

const scaleFactor = computed(() => {
  const totalSpan = p2s.value + 80;
  return viewBoxWidth / totalSpan * 0.9;
});

const pivot_x = computed(() => p2s.value * scaleFactor.value);
const spindle_x = 0;
const effectiveLength_scaled = computed(() => el.value * scaleFactor.value);

const arcPath = computed(() => {
  const r = effectiveLength_scaled.value;
  const startAngleRad = Math.asin(58 / el.value);
  const endAngleRad = Math.asin(148 / el.value);
  const start_y = r * Math.sin(startAngleRad);
  const start_x = pivot_x.value - r * Math.cos(startAngleRad);
  const end_y = r * Math.sin(endAngleRad);
  const end_x = pivot_x.value - r * Math.cos(endAngleRad);
  return `M ${start_x} ${start_y} A ${r} ${r} 0 0 0 ${end_x} ${end_y}`;
});

const getNullPointCoords = (radius) => {
  if (!p2s.value || !el.value) return { x: 0, y: 0, angle: 0 };
  const D = p2s.value;
  const Le = el.value;
  const R = radius;
  const x = (D*D - Le*Le + R*R) / (2 * D);
  const y = Math.sqrt(Math.max(0, R*R - x*x));
  const tangentAngle = Math.atan2(x, -y) * (180 / Math.PI);
  return { 
    x: x * scaleFactor.value, 
    y: y * scaleFactor.value,
    angle: tangentAngle
  };
};

const innerNullCoords = computed(() => getNullPointCoords(props.nulls.inner));
const outerNullCoords = computed(() => getNullPointCoords(props.nulls.outer));

const stylusPosition = computed(() => outerNullCoords.value);

</script>

<template>
  <div class="protractor-panel panel">
    <h3>Dynamic Protractor Visualization</h3>
    <div class="protractor-container">
      <svg :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`" preserveAspectRatio="xMidYMid meet">
        <g :transform="`translate(${center_x}, ${center_y})`">
          
          <!-- Linjer för mått -->
          <g class="dimension-lines">
            <line :x1="spindle_x" y1="50" :x2="pivot_x" y2="50" class="dim-line p2s" />
            <text :x="pivot_x / 2" y="45" class="dim-text p2s-text">P2S: {{ pivotToSpindle.toFixed(1) }}mm</text>

            <line :x1="spindle_x" y1="70" :x2="stylusPosition.x" y2="70" class="dim-line overhang" />
            <text :x="stylusPosition.x / 2" y="65" class="dim-text overhang-text">Overhang: {{ overhang.toFixed(1) }}mm</text>
            
            <line :x1="stylusPosition.x" y1="90" :x2="pivot_x" y2="90" class="dim-line el" />
            <text :x="(pivot_x + stylusPosition.x)/2" y="85" class="dim-text el-text">Eff. Length: {{ effectiveLength.toFixed(1) }}mm</text>
          </g>

          <!-- Spindel -->
          <g class="spindle" :transform="`translate(${spindle_x}, 0)`">
            <circle cx="0" cy="0" r="2.5" fill="#2c3e50" />
            <text x="0" y="-10">Spindle</text>
          </g>
          
          <!-- Pivot -->
          <g class="pivot" :transform="`translate(${pivot_x}, 0)`">
            <circle cx="0" cy="0" r="3" fill="none" stroke="#2c3e50" stroke-width="2" />
            <path d="M -2 0 L 2 0 M 0 -2 L 0 2" stroke="#2c3e50" stroke-width="1.5" />
            <text x="0" y="-10">Pivot</text>
          </g>

          <!-- Tonarmssketch -->
          <g class="tonearm-sketch" :transform="`translate(${pivot_x}, 0)`">
            <line :x1="stylusPosition.x - pivot_x" :y1="-stylusPosition.y" x2="0" y2="0" stroke="#7f8c8d" stroke-width="3" />
            <g :transform="`translate(${stylusPosition.x - pivot_x}, ${-stylusPosition.y}) rotate(${offsetAngle})`">
              <path d="M -15 -8 L 15 -8 L 15 8 L -15 8 Z" fill="#f8f9fa" stroke="#34495e" stroke-width="1.5" />
              <circle cx="0" cy="0" r="1.5" fill="none" stroke="#e74c3c" stroke-width="1" />
            </g>
          </g>
          
          <path :d="arcPath" class="arc-path" fill="none" />
          
          <!-- Nollpunkter & Rutnät -->
          <g class="null-point" :transform="`translate(${innerNullCoords.x}, ${-innerNullCoords.y})`">
            <g :transform="`rotate(${innerNullCoords.angle})`">
              <path class="grid-lines" d="M -20 0 L 20 0 M -15 -6 L 15 -6 M -15 6 L 15 6 M 0 -10 L 0 10" />
            </g>
            <circle cx="0" cy="0" r="1.5" fill="#e74c3c" />
          </g>
          <g class="null-point" :transform="`translate(${outerNullCoords.x}, ${-outerNullCoords.y})`">
            <g :transform="`rotate(${outerNullCoords.angle})`">
              <path class="grid-lines" d="M -20 0 L 20 0 M -15 -6 L 15 -6 M -15 6 L 15 6 M 0 -10 L 0 10" />
            </g>
            <circle cx="0" cy="0" r="1.5" fill="#e74c3c" />
          </g>

          <text class="null-label" :x="innerNullCoords.x" :y="-innerNullCoords.y - 12">Inner: {{ nulls.inner.toFixed(1) }}mm</text>
          <text class="null-label" :x="outerNullCoords.x" :y="-outerNullCoords.y - 12">Outer: {{ nulls.outer.toFixed(1) }}mm</text>
        </g>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.protractor-panel { grid-column: 1 / -1; }
.protractor-panel h3 { margin-top: 0; color: var(--header-color); font-size: 1.25rem; }
.protractor-container { width: 100%; background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 1rem; }
svg { width: 100%; height: auto; }
.spindle text, .pivot text, .null-label, .dim-text { text-anchor: middle; font-size: 8px; font-family: sans-serif; fill: #555; }
.arc-path { stroke: #3498db; stroke-width: 1.5; stroke-dasharray: 3, 3; }
.grid-lines { stroke: #e74c3c; stroke-width: 0.75; }
.dimension-lines .dim-line { stroke-width: 1px; marker-start: url(#dim-marker); marker-end: url(#dim-marker); }
.dim-line.p2s { stroke: #9b59b6; }
.dim-line.overhang { stroke: #e67e22; }
.dim-line.el { stroke: #27ae60; }
.dim-text { font-weight: bold; }
.dim-text.p2s-text { fill: #9b59b6; }
.dim-text.overhang-text { fill: #e67e22; }
.dim-text.el-text { fill: #27ae60; }
</style>
