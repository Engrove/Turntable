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
const padding = 50; // Ökad padding för att ge plats åt allt
const width = p2s + overhang + padding * 3;
const height = width * 0.8;
return `${-overhang - padding * 1.5} ${-height / 2.2} ${width} ${height}`;
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
y: Le * Math.sin(gammaRad),
};
};

const innerNullData = computed(() => calculateCoordsOnArc(props.nulls.inner));
const outerNullData = computed(() => calculateCoordsOnArc(props.nulls.outer));

const headshellTransform = computed(() => {
if (!outerNullData.value) return '';
const { x, y } = outerNullData.value;
const radiusAngleRad = Math.atan2(y, x);
const tangentAngleRad = radiusAngleRad + (Math.PI / 2);
const tangentAngleDeg = radToDeg(tangentAngleRad);
return `translate(${x}, ${y}) rotate(${tangentAngleDeg})`;
});

const tonearmRotationDeg = computed(() => {
if (!outerNullData.value) return 0;
const dx = outerNullData.value.x - pivot.value.x;
const dy = outerNullData.value.y - pivot.value.y;
return radToDeg(Math.atan2(dy, dx));
});
</script>

<template>
<div class="panel">
<h3>Geometry Visualization</h3>
<div class="geometry-container">
<svg :viewBox="viewBox" preserveAspectRatio="xMidYMid meet">
<defs>
<marker id="arrowhead-dim-final" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
<polygon points="0 0, 10 3.5, 0 7" fill="#7f8c8d" />
</marker>
</defs>

<!-- Bakgrundselement -->

<circle :cx="spindle.x" :cy="spindle.y" r="146.05" class="record-edge" />
<circle :cx="spindle.x" :cy="spindle.y" r="60.325" class="record-edge inner" />
<path :d="`M ${pivot.x} ${-effectiveLength} A ${effectiveLength} ${effectiveLength} 0 0 0 ${pivot.x} ${effectiveLength}`" class="arc-path" />

<!-- Nollpunkter -->

<g v-if="outerNullData" class="null-point-group">
<circle class="null-point-dot outer" :cx="outerNullData.x" :cy="outerNullData.y" r="2" />
<text :x="outerNullData.x" :y="outerNullData.y + 25" class="null-label">Outer Null</text>
</g>
<g v-if="innerNullData" class="null-point-group">
<circle class="null-point-dot inner" :cx="innerNullData.x" :cy="innerNullData.y" r="2" />
<text :x="innerNullData.x" :y="innerNullData.y + 25" class="null-label">Inner Null</text>
</g>

<!-- Måttlinjer och geometriska samband -->

<g class="dimension-lines">
<line :x1="pivot.x" :y1="pivot.y" :x2="spindle.x" :y2="spindle.y" class="dim-line p2s" />
<line v-if="outerNullData" :x1="pivot.x" :y1="pivot.y" :x2="outerNullData.x" :y2="outerNullData.y" class="dim-line effective-length" />
<line :x1="spindle.x" :y1="spindle.y" :x2="-overhang" :y2="0" class="dim-line overhang" />

<g :transform="`translate(0, ${effectiveLength * 0.65})`">
    <line :x1="spindle.x" y1="0" :x2="pivot.x" y2="0" marker-start="url(#arrowhead-dim-final)" marker-end="url(#arrowhead-dim-final)" class="dim-arrow p2s" />
    <text :x="pivot.x / 2" y="-8">Pivot-to-Spindle: {{ pivotToSpindle.toFixed(1) }}mm</text>
</g>
<g :transform="`translate(0, ${effectiveLength * 0.75})`">
    <line :x1="-overhang" y1="0" :x2="spindle.x" y2="0" marker-start="url(#arrowhead-dim-final)" marker-end="url(#arrowhead-dim-final)" class="dim-arrow overhang" />
    <text :x="-overhang / 2" y="-8">Overhang: {{ overhang.toFixed(1) }}mm</text>
</g>

</g>

<!-- Tonarm & Headshell -->

<g v-if="outerNullData" class="tonearm-assembly">
<g :transform="`translate(${pivot.x}, ${pivot.y}) rotate(${tonearmRotationDeg})`">
<line :x1="0" y1="0" :x2="effectiveLength" y2="0" class="tonearm-tube" />
<line x1="0" y1="0" x2="-50" y2="0" class="tonearm-stub" />
<circle cx="-50" cy="0" r="12" class="counterweight" />
</g>
<g class="headshell" :transform="headshellTransform">
<path d="M 0 0 L 18 0 L 22 -4 L 22 -16 L 18 -20 L 0 -20 Z" transform="translate(-12, 10)" />
<line x1="0" y1="0" x2="30" y2="0" class="tangent-line" />
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
.tonearm-stub { stroke: #7f8c8d; stroke-width: 3px; }
.counterweight { fill: #34495e; }
.headshell { fill: #555; stroke: #2c3e50; stroke-width: 1.5px; }
.spindle-point, .pivot-point { fill: #fff; stroke: #2c3e50; stroke-width: 2px; }
.spindle text, .pivot text, .null-label { text-anchor: middle; font-size: 14px; fill: #555; font-weight: 600; }
.null-point-dot { stroke-width: 2px; fill: #fff; }
.null-point-dot.inner { stroke: #9b59b6; }
.null-point-dot.outer { stroke: #16a085; }
.tangent-line { stroke: #e74c3c; stroke-width: 1.5px; }
.dim-line { stroke-width: 1px; stroke-dasharray: 2 2; }
.dim-line.p2s { stroke: #2980b9; }
.dim-line.effective-length { stroke: #27ae60; }
.dim-line.overhang { stroke: #c0392b; }
.dim-arrow { stroke-width: 1.5px; }
.dim-arrow.p2s { stroke: #2980b9; }
.dim-arrow.overhang { stroke: #c0392b; }
.dimension-lines text { font-size: 12px; text-anchor: middle; fill: #34495e; font-weight: 600; }
</style>

<!-- src/components/AlignmentGeometry.vue -->
