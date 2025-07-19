<!-- src/components/AlignmentGeometry.vue -->

<script setup>
/**
* @file src/components/AlignmentGeometry.vue
* @description En SVG-baserad komponent som visualiserar den grundläggande geometrin
* för en pivoterande tonarm. Den visar relationerna mellan pivot, spindel,
* överhäng och effektiv längd på ett pedagogiskt sätt.
*/
import { computed } from 'vue';

// Definierar de props som komponenten behöver för att rita upp geometrin.
// Dessa värden kommer från `alignmentStore` via `AlignmentCalculatorView`.
const props = defineProps({
pivotToSpindle: Number,
effectiveLength: Number,
overhang: Number,
offsetAngle: Number,
nulls: Object,
});

// === SVG-VIEWBOX & SKALNING ===
// Beräknar en dynamisk viewBox för att säkerställa att hela tonarmen och dess
// måttlinjer alltid får plats, oavsett längd.
const viewBox = computed(() => {
const p2s = props.pivotToSpindle || 222;
const overhang = props.overhang || 15;
const padding = 40; // Marginal runt om
const totalWidth = p2s + overhang + 50; // 50 för motvikt
const height = totalWidth * 0.6; // Behåll proportioner

return `${-overhang - padding} ${-height / 2} ${totalWidth + padding * 2} ${height}`;
});

// === KOORDINATBERÄKNINGAR ===
// Alla koordinater är relativa till spindeln som är placerad vid (0, 0).
const spindle = { x: 0, y: 0 };
const pivot = computed(() => ({ x: props.pivotToSpindle || 0, y: 0 }));
const stylus = computed(() => ({ x: -props.overhang || 0, y: 0 }));

// Beräknar koordinaterna för nollpunkterna för att kunna rita ut dem.
const calculateNullPointCoords = (radius) => {
if (!props.pivotToSpindle || !props.effectiveLength || !radius) return null;
const D = props.pivotToSpindle;
const Le = props.effectiveLength;
const R = radius;

// Använder cosinussatsen för att hitta vinkeln vid pivoten.
const cosGamma = (D**2 + Le**2 - R**2) / (2 * D * Le);
if (cosGamma < -1 || cosGamma > 1) return null; // Omöjlig geometri
const gamma = Math.acos(cosGamma);

// Returnerar stylusens position vid nollpunkten.
return {
x: pivot.value.x - Le * Math.cos(gamma),
y: -Le * Math.sin(gamma), // Negativ för att rita nedåt.
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
<polygon points="0 0, 10 3.5, 0 7" fill="#7f8c8d" />
</marker>
</defs>

<!-- Stora referensgeometrier (skivkanter och svepbåge) -->

<path :d="`M ${pivot.x} ${effectiveLength} A ${effectiveLength} ${effectiveLength} 0 1 1 ${pivot.x} ${-effectiveLength}`" class="arc-path" />
<circle :cx="spindle.x" :cy="spindle.y" r="146.05" class="record-edge" />
<circle :cx="spindle.x" :cy="spindle.y" r="60.325" class="record-edge" />

<!-- Tonarmens delar -->

<line :x1="pivot.x" :y1="pivot.y" :x2="stylus.x" :y2="stylus.y" class="tonearm-line" />
<circle class="spindle-point" :cx="spindle.x" :cy="spindle.y" r="3.5" />
<circle class="pivot-point" :cx="pivot.x" :cy="pivot.y" r="3.5" />
<circle class="stylus-point" :cx="stylus.x" :cy="stylus.y" r="2" />

<!-- Nollpunkter -->

<g v-if="innerNullCoord" class="null-point inner">
<circle :cx="innerNullCoord.x" :cy="innerNullCoord.y" r="3" />
<text :x="innerNullCoord.x + 8" :y="innerNullCoord.y + 4">Inner Null</text>
</g>
<g v-if="outerNullCoord" class="null-point outer">
<circle :cx="outerNullCoord.x" :cy="outerNullCoord.y" r="3" />
<text :x="outerNullCoord.x + 8" :y="outerNullCoord.y + 4">Outer Null</text>
</g>

<!-- Måttlinjer och etiketter -->

<g class="dimension-line p2s">
<line :x1="spindle.x" y1="30" :x2="pivot.x" y2="30" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)" />
<text :x="pivotToSpindle / 2" y="22">Pivot-to-Spindle: {{ pivotToSpindle.toFixed(1) }}mm</text>
</g>
<g class="dimension-line overhang">
<line :x1="spindle.x" y1="-30" :x2="stylus.x" y2="-30" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)" />
<text :x="overhang / -2" y="-38">Overhang: {{ overhang.toFixed(1) }}mm</text>
</g>
<g class="dimension-line effective-length">
<line :x1="pivot.x" y1="55" :x2="stylus.x" y2="55" marker-start="url(#arrowhead)" marker-end="url(#arrowhead)" />
<text :x="(pivot.x + stylus.x) / 2" y="68">Effective Length: {{ effectiveLength.toFixed(1) }}mm</text>
</g>
</svg>
</div>
</div>
</template>

<style scoped>
.panel {
margin-top: 0;
}
.geometry-container {
width: 100%;
height: auto;
min-height: 300px;
background-color: #f8f9fa;
border: 1px solid var(--border-color);
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
stroke-width: 0.5px;
stroke-dasharray: 3 3;
}
.record-edge {
fill: none;
stroke: #bdc3c7;
stroke-width: 0.5px;
}
.tonearm-line {
stroke: #34495e;
stroke-width: 2px;
}
.spindle-point { fill: #fff; stroke: #2c3e50; stroke-width: 1.5px; }
.pivot-point { fill: #fff; stroke: #2c3e50; stroke-width: 1.5px; }
.stylus-point { fill: #c0392b; }
.dimension-line line {
stroke: #7f8c8d;
stroke-width: 1px;
}
.dimension-line text {
font-size: 10px;
font-family: sans-serif;
text-anchor: middle;
fill: #34495e;
font-weight: 500;
}
.p2s text { fill: #2980b9; }
.overhang text { fill: #c0392b; }
.effective-length text { fill: #27ae60; }
.null-point circle {
stroke-width: 1.5px;
fill: rgba(255, 255, 255, 0.8);
}
.null-point.inner circle { stroke: #9b59b6; }
.null-point.outer circle { stroke: #16a085; }
.null-point text {
font-size: 10px;
font-family: sans-serif;
font-weight: 500;
}
.null-point.inner text { fill: #9b59b6; }
.null-point.outer text { fill: #16a085; }
</style>

<!-- src/components/AlignmentGeometry.vue -->
