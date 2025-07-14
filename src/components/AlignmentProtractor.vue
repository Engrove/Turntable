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

const viewBoxWidth = 400;
const viewBoxHeight = 320;
const center_x = viewBoxWidth / 2;
const center_y = viewBoxHeight / 2 + 30;

// --- Skalning och grundläggande koordinater ---
const p2s = computed(() => props.pivotToSpindle || 0);
const el = computed(() => props.effectiveLength || 0);

// Skalfaktor för att passa geometrin i viewBox
const scaleFactor = computed(() => {
  const totalSpan = p2s.value + 75; // P2S + yttre radie
  return viewBoxWidth / totalSpan * 0.9;
});

// Skalade värden
const pivot_x = computed(() => p2s.value * scaleFactor.value);
const spindle_x = 0; // Spindeln är vår origo
const effectiveLength_scaled = computed(() => el.value * scaleFactor.value);

// --- Beräkning av svepbåge (Arc) ---
const arcPath = computed(() => {
  const r = effectiveLength_scaled.value;
  // Beräkna start- och slutvinklar för bågen över en typisk skivyta
  const startAngleRad = Math.asin(60 / el.value);
  const endAngleRad = Math.asin(146 / el.value);

  const start_y = r * Math.sin(startAngleRad);
  const start_x = pivot_x.value - r * Math.cos(startAngleRad);
  const end_y = r * Math.sin(endAngleRad);
  const end_x = pivot_x.value - r * Math.cos(endAngleRad);

  return `M ${start_x} ${start_y} A ${r} ${r} 0 0 0 ${end_x} ${end_y}`;
});

// --- Beräkning av Nollpunkternas positioner ---
const getNullPointCoords = (radius) => {
  const D = p2s.value;
  const Le = el.value;
  if (!D || D <= 0 || !Le || Le <=0 ) return { x: 0, y: 0, angle: 0 };
  
  const R = radius;
  // Lös för x-koordinaten där de två cirklarna (från pivot och spindel) skär varandra
  const x = (D*D - Le*Le + R*R) / (2 * D);
  // Använd Pythagoras för att hitta y
  const y = Math.sqrt(Math.max(0, R*R - x*x));

  // Beräkna tangentens vinkel för att rotera gridet
  const tangentAngle = Math.atan2(x, -y) * (180 / Math.PI);

  return { 
    x: x * scaleFactor.value, 
    y: y * scaleFactor.value,
    angle: tangentAngle
  };
};

const innerNullCoords = computed(() => getNullPointCoords(props.nulls.inner));
const outerNullCoords = computed(() => getNullPointCoords(props.nulls.outer));

</script>

<template>
  <div class="protractor-panel panel">
    <h3>Dynamic Protractor Visualization</h3>
    <div class="protractor-container">
      <svg :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`" preserveAspectRatio="xMidYMid meet">
        <!-- Flytta hela systemet till mitten av SVG:n -->
        <g :transform="`translate(${center_x - pivot_x/2}, ${center_y})`">
          
          <!-- Spindel -->
          <g class="spindle" :transform="`translate(${spindle_x}, 0)`">
            <circle cx="0" cy="0" r="2" fill="#2c3e50" />
            <text x="0" y="-8">Spindle</text>
          </g>
          
          <!-- Pivot -->
          <g class="pivot" :transform="`translate(${pivot_x}, 0)`">
            <circle cx="0" cy="0" r="2.5" fill="none" stroke="#2c3e50" stroke-width="1.5" />
            <path d="M -1.5 0 L 1.5 0 M 0 -1.5 L 0 1.5" stroke="#2c3e50" stroke-width="1" />
            <text x="0" y="-8">Pivot</text>
          </g>

          <!-- Svepbåge (Arc) -->
          <path :d="arcPath" class="arc-path" fill="none" stroke="#3498db" stroke-width="1.5" />
          
          <!-- Nollpunkter & Rutnät -->
          <g class="null-point" :transform="`translate(${innerNullCoords.x}, ${-innerNullCoords.y})`">
            <g :transform="`rotate(${innerNullCoords.angle})`">
              <path d="M -15 0 L 15 0 M -10 -5 L 10 -5 M -10 5 L 10 5 M 0 -8 L 0 8" stroke="#e74c3c" stroke-width="0.75" />
            </g>
             <circle cx="0" cy="0" r="1" fill="#e74c3c" />
          </g>
          <g class="null-point" :transform="`translate(${outerNullCoords.x}, ${-outerNullCoords.y})`">
            <g :transform="`rotate(${outerNullCoords.angle})`">
              <path d="M -15 0 L 15 0 M -10 -5 L 10 -5 M -10 5 L 10 5 M 0 -8 L 0 8" stroke="#e74c3c" stroke-width="0.75" />
            </g>
             <circle cx="0" cy="0" r="1" fill="#e74c3c" />
          </g>

          <!-- Etiketter för nollpunkter -->
          <text class="null-label" :x="innerNullCoords.x" :y="-innerNullCoords.y - 10">Inner Null</text>
          <text class="null-label" :x="outerNullCoords.x" :y="-outerNullCoords.y - 10">Outer Null</text>
        </g>
      </svg>
    </div>
     <div class="instructions">
        <h4>How to read this diagram:</h4>
        <ol>
            <li>The <strong>blue arc</strong> represents the path the stylus tip will travel across the record.</li>
            <li>The two <strong>red targets</strong> are the null points, where the cartridge is perfectly aligned and distortion is zero.</li>
            <li>To use a real-world protractor, you first adjust the cartridge position to make the stylus follow the blue arc (setting the overhang), then you angle the cartridge to align with the red grids (setting the offset angle).</li>
        </ol>
    </div>
  </div>
</template>

<style scoped>
.protractor-panel {
  grid-column: 1 / -1;
}
.protractor-panel h3 {
  margin-top: 0;
  color: var(--header-color);
  font-size: 1.25rem;
}
.protractor-container {
  width: 100%;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  padding: 1rem;
}
svg {
  width: 100%;
  height: auto;
}
.spindle text, .pivot text, .null-label {
    text-anchor: middle;
    font-size: 8px;
    font-family: sans-serif;
    fill: #7f8c8d;
}
.arc-path {
  stroke-dasharray: 2, 2;
}
.instructions {
  margin-top: 1rem;
  background-color: #f8f9fa;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.9rem;
}
.instructions h4 {
    margin: 0.5rem 0;
}
.instructions ol {
    padding-left: 1.25rem;
    margin: 0.5rem 0;
}
</style>
