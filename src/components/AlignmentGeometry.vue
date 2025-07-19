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
const width = p2s + overhang + padding * 2;
const height = width * 0.75;
return `${-overhang - padding} ${-height / 2} ${width} ${height}`;
});

// === KOORDINATBERÄKNINGAR ===
const spindle = { x: 0, y: 0 };
const pivot = computed(() => ({ x: props.pivotToSpindle || 0, y: 0 }));

const calculateCoordsOnArc = (radius) => {
if (!props.pivotToSpindle || !props.effectiveLength || !radius) return null;
const D = props.pivotToSpindle;
const Le = props.effectiveLength;
const R = radius;

// Cosinussatsen för att hitta vinkeln (gamma) vid pivoten
const cosGamma = (D**2 + Le**2 - R**2) / (2 * D * Le);
if (cosGamma < -1 || cosGamma > 1) return null;
const gamma = Math.acos(cosGamma);

// Returnera stylusens position
return {
x: pivot.value.x - Le * Math.cos(gamma),
y: -Le * Math.sin(gamma), // Negativ för att rita nedåt
armAngle: -radToDeg(gamma),
};
};

const innerNullData = computed(() => calculateCoordsOnArc(props.nulls.inner));
const outerNullData = computed(() => calculateCoordsOnArc(props.nulls.outer));

const radToDeg = (rad) => rad * (180 / Math.PI);
const degToRad = (deg) => deg * (Math.PI / 180);

const headshellTransform = computed(() => {
if (!outerNullData.value) return '';
const { x, y, armAngle } = outerNullData.value;
const totalRotation = armAngle + props.offsetAngle;
return `translate(${x}, ${y}) rotate(${totalRotation})`;
});
</script>

<template>
<div class="panel">
<h3>Geometry Visualization</h3>
<div class="geometry-container">
<svg :viewBox="viewBox" preserveAspectRatio="xMidYMid meet">
<defs>
<marker id="arrowhead-dim" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
<polygon points="0 0, 10 3.5, 0 7" fill="#7f8c8d" />
</marker>
</defs>

<!-- Referensgeometri -->

<circle :cx="spindle.x" :cy="spindle.y" r="146.05" class="record-edge" />
<circle :cx="spindle.x" :cy="spindle.y" r="60.325" class="record-edge inner" />
<path :d="`M ${pivot.x} ${effectiveLength} A ${effectiveLength} ${effectiveLength} 0 1 1 ${pivot.x} ${-effectiveLength}`" class="arc-path" />

<!-- Nollpunkter och Tangentlinjer -->

<g v-if="outerNullData" class="null-point-group">
<line :x1="spindle.x" :y1="spindle.y" :x2="outerNullData.x" :y2="outerNullData.y" class="radius-line" />
<circle class="null-point-dot outer" :cx="outerNullData.x" :cy="outerNullData.y" r="2" />
<text :x="outerNullData.x - 10" :y="outerNullData.y - 10" class="null-label">Outer Null</text>
</g>
<g v-if="innerNullData" class="null-point-group">
<line :x1="spindle.x" :y1="spindle.y" :x2="innerNullData.x" :y2="innerNullData.y" class="radius-line" />
<circle class="null-point-dot inner" :cx="innerNullData.x" :cy="innerNullData.y" r="2" />
<text :x="innerNullData.x + 10" :y="innerNullData.y - 10" class="null-label">Inner Null</text>
</g>

<!-- Tonarm (visas vid yttre nollpunkt) -->

<g v-if="outerNullData" class="tonearm-assembly">
<line :x1="pivot.x" :y1="pivot.y" :x2="outerNullData.x" :y2="outerNullData.y" class="tonearm-line" />
<g class="headshell" :transform="headshellTransform">
<path d="M 0 0 L 15 0 L 18 5 L 18 15 L 15 20 L 0 20 Z" transform="translate(-10, -10)" />
</g>
<!-- Tangentlinje vid nollpunkt -->
<line :x1="outerNullData.x - 20" :y1="outerNullData.y" :x2="outerNullData.x + 20" :y2="outerNullData.y" class="tangent-line" />
</g>

<!-- Spindel och Pivot -->

<g class="spindle" transform="translate(0, 0)">
<circle cx="0" cy="0" r="3.6" class="spindle-point" />
<text y="15">Spindle</text>
</g>
<g class="pivot" :transform="`translate(${pivot.x}, 0)`">
<circle cx="0" cy="0" r="4" class="pivot-point" />
<text y="15">Pivot</text>
</g>

<!-- Måttlinjer -->

<g class="dimension-line p2s" :transform="`translate(0, ${effectiveLength * 0.5})`">
<line :x1="spindle.x" :y1="0" :x2="pivot.x" :y2="0" marker-start="url(#arrowhead-dim)" marker-end="url(#arrowhead-dim)" />
<text :x="pivot.x / 2" y="-8">Pivot-to-Spindle: {{ pivotToSpindle.toFixed(1) }}mm</text>
</g>
<g class="dimension-line overhang" :transform="`translate(0, -${effectiveLength * 0.5})`">
<line :x1="spindle.x" y1="0" :x2="-overhang" y2="0" marker-start="url(#arrowhead-dim)" marker-end="url(#arrowhead-dim)" />
<text :x="-overhang / 2" y="18">Overhang: {{ overhang.toFixed(1) }}mm</text>
</g>
</svg>
</div>
</div>
</template>

<style scoped>
.panel { margin-top: 0; }
.geometry-container { width: 100%; height: auto; min-height: 400px; background-color: #f8f9fa; border: 1px solid var(--border-color); border-radius: 6px; padding: 1rem; }
svg { width: 100%; height: 100%; font-family: sans-serif; }
.record-edge { fill: #ffffff; stroke: #e0e0e0; stroke-width: 0.5px; }
.record-edge.inner { stroke-dasharray: 2 2; }
.arc-path { fill: none; stroke: #3498db; stroke-width: 1px; stroke-dasharray: 4 4; }
.tonearm-line { stroke: #555; stroke-width: 4px; stroke-linecap: round; }
.headshell { fill: #34495e; stroke: #2c3e50; stroke-width: 1px; }
.spindle-point { fill: #fff; stroke: #2c3e50; stroke-width: 1.5px; }
.pivot-point { fill: #fff; stroke: #2c3e50; stroke-width: 1.5px; }
.spindle text, .pivot text, .null-label { text-anchor: middle; font-size: 12px; fill: #7f8c8d; font-weight: 500; }
.null-label { font-weight: bold; }
.null-point-dot { stroke-width: 1.5px; fill: #fff; }
.null-point-dot.inner { stroke: #9b59b6; }
.null-point-dot.outer { stroke: #16a085; }
.radius-line, .tangent-line { stroke: #e74c3c; stroke-width: 0.5px; stroke-dasharray: 2 2; }
.dimension-line line { stroke: #7f8c8d; stroke-width: 1px; }
.dimension-line text { font-size: 11px; text-anchor: middle; fill: #34495e; font-weight: 600; }
.p2s text { fill: #2980b9; }
.overhang text { fill: #c0392b; }
</style>

<!-- src/components/AlignmentGeometry.vue -->
