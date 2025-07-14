<!-- src/components/AlignmentProtractor.vue -->
<script setup>
import { computed } from 'vue';

const props = defineProps({
  pivotToSpindle: Number,
  effectiveLength: Number,
  overhang: Number,
  offsetAngle: Number,
  nulls: Object,
  alignmentType: String
});

// === GEOMETRI & KONSTANTER ===
const P2S = computed(() => props.pivotToSpindle || 0);
const EL = computed(() => props.effectiveLength || 0);

// === SVG-VIEWBOX & SKALNING ===
// Dynamisk viewBox för att säkerställa att allt passar
const viewBox = computed(() => {
  const padding = 50; // Marginal runt om
  const width = P2S.value + padding * 2;
  const height = EL.value + padding * 2;
  const minX = -EL.value - padding;
  const minY = -height / 2;
  
  // Justera om pivoten är långt bort
  const dynamicWidth = P2S.value + EL.value + padding * 2;
  
  return `${minX} ${minY} ${dynamicWidth} ${height}`;
});

// === KOORDINATBERÄKNINGAR ===
// Spindeln är vår origo (0, 0)
const spindle = { x: 0, y: 0 };
const pivot = computed(() => ({ x: P2S.value, y: 0 }));

// Beräkna positionen för varje nollpunkt relativt spindeln
const getNullPointCoords = (radius) => {
  if (!P2S.value || !EL.value || !radius) return { x: 0, y: 0, tangentAngle: 0 };

  const D = P2S.value;
  const Le = EL.value;
  const R = radius;

  // Beräkna vinkeln (gamma) vid pivoten med cosinussatsen
  const cosGamma = (D**2 + Le**2 - R**2) / (2 * D * Le);
  if (cosGamma < -1 || cosGamma > 1) return { x: 0, y: 0, tangentAngle: 0 }; // Omöjlig geometri
  const gamma = Math.acos(cosGamma);

  // Beräkna stylus-koordinater
  const x = pivot.value.x - Le * Math.cos(gamma);
  const y = -Le * Math.sin(gamma); // Negativ för att rita nedåt

  // Beräkna vinkeln för den radiella linjen från spindeln
  const radialAngleRad = Math.atan2(y, x);
  const tangentAngle = radialAngleRad * (180 / Math.PI) + 90;

  return { x, y, tangentAngle };
};

const innerNull = computed(() => getNullPointCoords(props.nulls.inner));
const outerNull = computed(() => getNullPointCoords(props.nulls.outer));

// Beräkna svepbågen för stylusen
const arcPath = computed(() => {
  if (!EL.value) return "";
  const r = EL.value;
  const startAngle = Math.PI - Math.acos( (pivot.value.x - 58) / r );
  const endAngle = Math.PI - Math.acos( (pivot.value.x - 147) / r);

  const startX = pivot.value.x + r * Math.cos(startAngle);
  const startY = pivot.value.y - r * Math.sin(startAngle);
  const endX = pivot.value.x + r * Math.cos(endAngle);
  const endY = pivot.value.y - r * Math.sin(endAngle);

  return `M ${startX} ${startY} A ${r} ${r} 0 0 0 ${endX} ${endY}`;
});

// Beräkna tonarmens visuella position (pekar mot yttre nollpunkten)
const armRotation = computed(() => {
    const dx = outerNull.value.x - pivot.value.x;
    const dy = outerNull.value.y - pivot.value.y;
    return Math.atan2(dy, dx) * (180 / Math.PI);
});

const headshellAngle = computed(() => -props.offsetAngle);

</script>

<template>
  <div class="protractor-panel panel" id="protractor-section-for-print">
    <div class="protractor-header">
      <h3>Printable Protractor ({{ alignmentType.replace('A','') }})</h3>
      <div class="print-info">
          <p><strong>Printing Instructions:</strong> Ensure your printer is set to <strong>100% scale (or "Actual Size")</strong> with no "fit to page" scaling. Verify the printed dimensions with a ruler before use.</p>
      </div>
    </div>
    
    <div class="protractor-container">
      <svg :viewBox="viewBox" preserveAspectRatio="xMidYMid meet">
        <!-- Dimensioneringslinjal för verifiering -->
        <g class="ruler">
          <path d="M 0 -130 L 100 -130 M 0 -135 L 0 -125 M 100 -135 L 100 -125" stroke="#aaa" stroke-width="1"/>
          <text x="50" y="-140">100mm Scale Reference</text>
        </g>
        
        <!-- Spindel & Pivot -->
        <g class="spindle" :transform="`translate(${spindle.x}, ${spindle.y})`">
          <circle cx="0" cy="0" r="3.5" stroke="#2c3e50" stroke-width="0.5" fill="none" />
          <path d="M -2 0 L 2 0 M 0 -2 L 0 2" stroke="#2c3e50" stroke-width="0.5" />
          <text x="0" y="15">Spindle</text>
        </g>
        <g class="pivot" :transform="`translate(${pivot.x}, ${pivot.y})`">
          <circle cx="0" cy="0" r="1" fill="#2c3e50"/>
          <text x="0" y="15">Pivot Point</text>
        </g>

        <!-- Svepbåge -->
        <path :d="arcPath" class="arc-path" />

        <!-- Nollpunkter & Rutnät -->
        <g class="null-point inner" :transform="`translate(${innerNull.x}, ${innerNull.y})`">
          <g :transform="`rotate(${innerNull.tangentAngle})`">
            <path class="grid-lines" d="M 0 -20 L 0 20 M -20 0 L 20 0 M -15 -10 L 15 -10 M -15 10 L 15 10 M -10 -15 L 10 -15 M 10 -15 L 10 15 M -10 -15 L -10 15" />
          </g>
          <circle cx="0" cy="0" r="0.5" fill="red" />
          <text x="0" y="-25">Inner Null: {{ nulls.inner.toFixed(1) }}mm</text>
        </g>
        <g class="null-point outer" :transform="`translate(${outerNull.x}, ${outerNull.y})`">
           <g :transform="`rotate(${outerNull.tangentAngle})`">
            <path class="grid-lines" d="M 0 -20 L 0 20 M -20 0 L 20 0 M -15 -10 L 15 -10 M -15 10 L 15 10 M -10 -15 L 10 -15 M 10 -15 L 10 15 M -10 -15 L -10 15" />
          </g>
          <circle cx="0" cy="0" r="0.5" fill="red" />
          <text x="0" y="-25">Outer Null: {{ nulls.outer.toFixed(1) }}mm</text>
        </g>

        <!-- Visuell representation av tonarm (ej för utskrift) -->
        <g class="tonearm-sketch" :transform="`translate(${pivot.x}, ${pivot.y}) rotate(${armRotation})`">
            <line x1="0" y1="0" :x2="EL" y2="0" class="armtube" />
            <g :transform="`translate(${EL}, 0) rotate(${headshellAngle})`">
                <path class="headshell" d="M -2 -8 L 15 -8 L 18 0 L 15 8 L -2 8 Z" />
                <circle cx="0" cy="0" r="1.5" class="stylus" />
            </g>
        </g>

      </svg>
    </div>
  </div>
</template>

<style scoped>
.protractor-panel {
  grid-column: 1 / -1;
  margin-top: 1rem;
}
.protractor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}
.protractor-header h3 {
  margin: 0;
  color: var(--header-color);
  font-size: 1.25rem;
  flex-shrink: 0;
}
.print-info {
  font-size: 0.8rem;
  color: var(--label-color);
  background-color: #e9ecef;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  border-left: 3px solid var(--accent-color);
}
.print-info p {
    margin: 0;
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
  font-family: sans-serif;
  font-size: 10px;
}
.spindle text, .pivot text, .null-point text, .ruler text {
  text-anchor: middle;
  fill: #555;
}
.arc-path {
  fill: none;
  stroke: #3498db;
  stroke-width: 1px;
  stroke-dasharray: 4 4;
}
.grid-lines {
  fill: none;
  stroke: #aaa;
  stroke-width: 0.5px;
}
.tonearm-sketch {
    opacity: 0.2; /* Gör den svag så den inte stör protractorn */
}
.armtube {
  stroke: #34495e;
  stroke-width: 6px;
  stroke-linecap: round;
}
.headshell {
  fill: #7f8c8d;
}
.stylus {
  fill: #c0392b;
}

@media print {
  .protractor-panel {
    border: none;
    box-shadow: none;
    padding: 0;
    margin: 0;
  }
  .protractor-header {
    display: none;
  }
  .protractor-container {
    border: none;
    padding: 0;
  }
  svg {
    width: 100%;
    height: 100%;
  }
  .tonearm-sketch {
    display: none; /* Göm den visuella armen vid utskrift */
  }
}
</style>
