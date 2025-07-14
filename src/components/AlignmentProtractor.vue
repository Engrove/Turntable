<!-- src/components/AlignmentProtractor.vue -->
<script setup>
import { computed } from 'vue';

const props = defineProps({
  pivotToSpindle: Number,
  effectiveLength: Number,
  overhang: Number,
  offsetAngle: Number,
  nulls: Object
});

const viewBoxWidth = 500;
const viewBoxHeight = 350;
const center_x = viewBoxWidth / 2 - 20;
const center_y = viewBoxHeight / 2 + 100;

const p2s = computed(() => props.pivotToSpindle || 0);
const el = computed(() => props.effectiveLength || 0);
const overhang = computed(() => props.overhang || 0);

const scaleFactor = computed(() => {
  const totalSpan = p2s.value + overhang.value + 50; // P2S + overhang + marginal
  return viewBoxWidth / totalSpan * 0.9;
});

// --- Koordinater med korrekt skala och orientering ---
const spindle_x = 0;
const pivot_x = computed(() => p2s.value * scaleFactor.value);
const effectiveLength_scaled = computed(() => el.value * scaleFactor.value);

const arcPath = computed(() => {
  const r = effectiveLength_scaled.value;
  if (!el.value) return "";
  const startAngleRad = Math.asin(58 / el.value);
  const endAngleRad = Math.asin(148 / el.value);
  const start_y = r * Math.sin(startAngleRad);
  const start_x = pivot_x.value - r * Math.cos(startAngleRad);
  const end_y = r * Math.sin(endAngleRad);
  const end_x = pivot_x.value - r * Math.cos(endAngleRad);
  return `M ${start_x} ${-start_y} A ${r} ${r} 0 0 1 ${end_x} ${-end_y}`;
});

const getNullPointCoords = (radius) => {
  const D = p2s.value;
  const Le = el.value;
  if (!D || !Le || radius === null) return { x: 0, y: 0, angle: 0 };
  
  const R = radius;
  const x = (D * D - Le * Le + R * R) / (2 * D);
  const y = Math.sqrt(Math.max(0, R * R - x * x));

  const cartridgeAngle = Math.acos((D*D + Le*Le - R*R)/(2*D*Le)) * (180/Math.PI);
  const stylusAngle = Math.acos((D*D + R*R - Le*Le)/(2*D*R)) * (180/Math.PI);
  const rotationAngle = 180 - stylusAngle - cartridgeAngle;

  return { 
    x: x * scaleFactor.value, 
    y: -y * scaleFactor.value,
    angle: rotationAngle
  };
};

const innerNullCoords = computed(() => getNullPointCoords(props.nulls.inner));
const outerNullCoords = computed(() => getNullPointCoords(props.nulls.outer));

const headshellAngle = computed(() => {
  return -props.offsetAngle;
});

</script>

<template>
  <div class="protractor-panel panel">
    <h3>Dynamic Protractor Visualization</h3>
    <div class="protractor-container">
      <svg :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`" preserveAspectRatio="xMidYMid meet">
        <g :transform="`translate(${center_x}, ${center_y})`">
          
          <!-- Spindel -->
          <g class="spindle" :transform="`translate(${spindle_x}, 0)`">
            <circle cx="0" cy="0" r="3" fill="#34495e" />
            <text x="0" y="-12">Spindle</text>
          </g>
          
          <!-- Pivot -->
          <g class="pivot" :transform="`translate(${pivot_x}, 0)`">
            <circle cx="0" cy="0" r="5" fill="none" stroke="#34495e" stroke-width="2" />
            <path d="M -3 0 L 3 0 M 0 -3 L 0 3" stroke="#34495e" stroke-width="1.5" />
            <text x="0" y="-12">Pivot</text>
          </g>
          
          <!-- Svepbåge -->
          <path :d="arcPath" class="arc-path" fill="none" />
          
          <!-- Nollpunkter & Rutnät -->
          <g class="null-point" :transform="`translate(${innerNullCoords.x}, ${innerNullCoords.y})`">
            <g :transform="`rotate(${innerNullCoords.angle})`">
              <path class="grid-lines" d="M -25 0 L 25 0 M -20 -5 L 20 -5 M -20 5 L 20 5 M -15 -10 L 15 -10 M -15 10 L 15 10 M 0 -15 L 0 15" />
            </g>
            <circle cx="0" cy="0" r="1" fill="#e74c3c" />
          </g>
          <g class="null-point" :transform="`translate(${outerNullCoords.x}, ${outerNullCoords.y})`">
            <g :transform="`rotate(${outerNullCoords.angle})`">
              <path class="grid-lines" d="M -25 0 L 25 0 M -20 -5 L 20 -5 M -20 5 L 20 5 M -15 -10 L 15 -10 M -15 10 L 15 10 M 0 -15 L 0 15" />
            </g>
            <circle cx="0" cy="0" r="1" fill="#e74c3c" />
          </g>

          <!-- Tonarm & Headshell -->
          <g class="tonearm-sketch" :transform="`translate(${pivot_x}, 0)`">
            <line :x1="outerNullCoords.x - pivot_x" :y1="outerNullCoords.y" x2="0" y2="0" stroke="#7f8c8d" stroke-width="5" />
            <g :transform="`translate(${outerNullCoords.x - pivot_x}, ${outerNullCoords.y}) rotate(${headshellAngle})`">
              <path d="M -15 -10 L 20 -10 L 20 10 L -15 10 Z" fill="#f8f9fa" stroke="#34495e" stroke-width="1.5" />
              <circle cx="0" cy="0" r="1" fill="#3498db" />
            </g>
          </g>

        </g>
      </svg>
    </div>
  </div>
</template>

<style scoped>
.protractor-panel { grid-column: 1 / -1; margin-top: 1rem; }
.protractor-panel h3 { margin-top: 0; color: var(--header-color); font-size: 1.25rem; }
.protractor-container { width: 100%; background: #fff; border: 1px solid #ddd; border-radius: 6px; padding: 0.5rem; }
svg { width: 100%; height: auto; }
.spindle text, .pivot text, .null-label { text-anchor: middle; font-size: 8px; font-family: sans-serif; fill: #555; }
.arc-path { stroke: #3498db; stroke-width: 2px; }
.grid-lines { stroke: #e74c3c; stroke-width: 0.75; }
.tonearm-sketch { opacity: 0.8; }
</style>
