<!-- src/components/AlignmentGeometry.vue -->

<script setup>
/**
* @file src/components/AlignmentGeometry.vue
* @description En avancerad, geometriskt korrekt SVG-visualisering av en pivoterande tonarmsjustering.
*/
import { computed } from 'vue';

const props = defineProps({
pivotToSpindle: Number,
effectiveLength: Number,
overhang: Number,
offsetAngle: Number,
nulls: Object,
});

// === SVG-VIEWBOX & SKALNING ===
const viewBox = computed(() => {
const p2s = props.pivotToSpindle || 222;
const overhang = props.overhang || 15;
const padding = 50;
const width = p2s + overhang + padding * 2.5;
const height = width * 0.8;
return `${-overhang - padding * 1.5} ${-height / 2} ${width} ${height}`;
});

// === KOORDINATBERÄKNINGAR ===
const radToDeg = (rad) => rad * (180 / Math.PI);

const spindle = { x: 0, y: 0 };
const pivot = computed(() => ({ x: props.pivotToSpindle || 0, y: 0 }));

const calculateCoordsOnArc = (radius) => {
if (!props.pivotToSpindle || !props.effectiveLength || !radius) return null;
const D = props.pivotToSpindle;
const Le = props.effectiveLength;
const R = radius;

const cosGamma = (D**2 + Le**2 - R**2) / (2 * D * Le);
if (cosGamma < -1 || cosGamma > 1) return null;
const gammaRad = Math.acos(cosGamma);

return {
x: pivot.value.x - Le * Math.cos(gammaRad),
y: -Le * Math.sin(gammaRad),
armAngleDeg: radToDeg(gammaRad),
};
};

const innerNullData = computed(() => calculateCoordsOnArc(props.nulls.inner));
const outerNullData = computed(() => calculateCoordsOnArc(props.nulls.outer));

const headshellTransform = computed(() => {
if (!outerNullData.value) return '';
const { x, y, armAngleDeg } = outerNullData.value;
// KORREKT KINEMATISK MODELL: Rotationen av pickup-huset.
// Armens vinkel (medurs från pivot) är -armAngleDeg.
// Offset-vinkeln adderas till detta.
const totalRotation = -armAngleDeg + props.offsetAngle;
return `translate(${x}, ${y}) rotate(${totalRotation})`;
});
</script>

<template>
<div class="panel">
<h3>Geometry Visualization</h3>
<div class="geometry-container">
<svg :viewBox="viewBox" preserveAspectRatio="xMidYMid meet">
<!-- Bakgrundselement -->
<circle :cx="spindle.x" :cy="spindle.y" r="146.05" class="record-edge" />
<circle :cx="spindle.x" :cy="spindle.y" r="60.325" class="record-edge inner" />
<path :d="`M ${pivot.x} ${-effectiveLength} A ${effectiveLength} ${effectiveLength} 0 0 0 ${pivot.x} ${effectiveLength}`" class="arc-path" />

<!-- Nollpunkter (endast punkter och text) -->

<g v-if="outerNullData" class="null-point-group">
<circle class="null-point-dot outer" :cx="outerNullData.x" :cy="outerNullData.y" r="2" />
<text :x="outerNullData.x - 10" :y="outerNullData.y - 10" class="null-label">Outer Null</text>
</g>
<g v-if="innerNullData" class="null-point-group">
<circle class="null-point-dot inner" :cx="innerNullData.x" :cy="innerNullData.y" r="2" />
<text :x="innerNullData.x + 10" :y="innerNullData.y - 10" class="null-label">Inner Null</text>
</g>

<!-- Måttlinjer och geometriska samband -->

<g class="dimension-lines">
<line :x1="pivot.x" :y1="pivot.y" :x2="spindle.x" :y2="spindle.y" class="dim-line p2s" />
<line v-if="outerNullData" :x1="pivot.x" :y1="pivot.y" :x2="outerNullData.x" :y2="outerNullData.y" class="dim-line effective-length" />
<line :x1="spindle.x" :y1="spindle.y" :x2="-overhang" :y2="0" class="dim-line overhang" />
</g>

<!-- Tonarm (visas vid yttre nollpunkt) -->

<g v-if="outerNullData" class="tonearm-assembly">
<line :x1="pivot.x" :y1="pivot.y" :x2="outerNullData.x" :y2="outerNullData.y" class="tonearm-tube" />
<g class="headshell" :transform="headshellTransform">
<path d="M 0 0 L 15 0 L 18 -5 L 18 -15 L 15 -20 L 0 -20 Z" transform="translate(-10, 10)" />
<line x1="0" y1="0" x2="25" y2="0" class="tangent-line" />
</g>
</g>

<!-- Spindel och Pivot (ritas överst) -->

<g class="spindle" transform="translate(0, 0)">
<circle cx="0" cy="0" r="3.6" class="spindle-point" />
<text y="-10">Spindle</text>
</g>
<g class="pivot" :transform="`translate(${pivot.x}, 0)`">
<circle cx="0" cy="0" r="4" class="pivot-point" />
<text y="-10">Pivot</text>
</g>
</svg>
</div>
</div>
</template>

<style scoped>
.panel { margin-top: 0; }
.geometry-container { width: 100%; height: auto; min-height: 450px; background-color: #f8f9fa; border: 1px solid var(--border-color); border-radius: 6px; padding: 1rem; }
svg { width: 100%; height: 100%; font-family: sans-serif; }
.record-edge { fill: #ffffff; stroke: #e0e0e0; stroke-width: 0.75px; }
.record-edge.inner { stroke-dasharray: 2 3; }
.arc-path { fill: none; stroke: #3498db; stroke-width: 1px; stroke-dasharray: 5 5; }
.tonearm-tube { stroke: #34495e; stroke-width: 5px; stroke-linecap: round; }
.headshell { fill: #555; stroke: #2c3e50; stroke-width: 1.5px; }
.spindle-point, .pivot-point { fill: #fff; stroke: #2c3e50; stroke-width: 2px; }
.spindle text, .pivot text, .null-label { text-anchor: middle; font-size: 14px; fill: #555; font-weight: 600; }
.null-point-dot { stroke-width: 2px; fill: #fff; }
.null-point-dot.inner { stroke: #9b59b6; }
.null-point-dot.outer { stroke: #16a085; }
.tangent-line { stroke: #e74c3c; stroke-width: 1.5px; }
.dimension-lines .dim-line { stroke-width: 1px; stroke-dasharray: 2 2; }
.dim-line.p2s { stroke: #2980b9; }
.dim-line.effective-length { stroke: #27ae60; }
.dim-line.overhang { stroke: #c0392b; }
</style>

<!-- src/components/AlignmentGeometry.vue -->
