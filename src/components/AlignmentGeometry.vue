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
  
  // Förbättrad validering för ogiltiga värden
  if (cosGamma < -1 || cosGamma > 1 || isNaN(cosGamma)) return null;
  
  const gammaRad = Math.acos(cosGamma);
  if (isNaN(gammaRad)) return null;

  return {
    x: pivot.value.x - Le * Math.cos(gammaRad),
    y: Le * Math.sin(gammaRad),
  };
};

const innerNullData = computed(() => calculateCoordsOnArc(props.nulls?.inner));
const outerNullData = computed(() => calculateCoordsOnArc(props.nulls?.outer));

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

// Förbättrad arcPath med NaN-kontroll
const arcPath = computed(() => {
  if (!props.effectiveLength || props.effectiveLength <= 0) return "";
  
  const outerArcPoint = calculateCoordsOnArc(146.05);
  const innerArcPoint = calculateCoordsOnArc(60.325);

  if (!outerArcPoint || !innerArcPoint) return "";
  
  // Kontrollera NaN-värden i koordinaterna
  if (isNaN(outerArcPoint.x) || isNaN(outerArcPoint.y) || 
      isNaN(innerArcPoint.x) || isNaN(innerArcPoint.y)) {
    return "";
  }

  const r = props.effectiveLength;
  return `M ${outerArcPoint.x} ${outerArcPoint.y} A ${r} ${r} 0 0 0 ${innerArcPoint.x} ${innerArcPoint.y}`;
});
</script>

<template>
<!-- Resten av template-koden förblir oförändrad -->
</template>

<style scoped>
/* Stilmallarna förblir oförändrade */
</style>

<!-- src/components/AlignmentGeometry.vue -->
