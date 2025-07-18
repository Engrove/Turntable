/**
* @file src/components/AlignmentProtractor.vue
* @description Genererar en dynamisk, utskriftsvänlig SVG-baserad protraktor.
* Denna komponent ritar upp spindelhål, nollpunkter och justeringsrutnät
* i en exakt 1:1-skala (mm) för antingen A4- eller Letter-pappersformat.
*/
import { computed } from 'vue';
import { useAlignmentStore } from '@/store/alignmentStore.js';

// Hämtar storen för att komma åt användarens val av pappersformat
const store = useAlignmentStore();

// Definierar de props som komponenten behöver från sin förälder
const props = defineProps({
  pivotToSpindle: Number,
  effectiveLength: Number,
  nulls: Object,
  alignmentType: String
});

// === PAPPERSFORMAT OCH DIMENSIONER ===
const PAPER_FORMATS = {
  A4: { width: 297, height: 210 },
  Letter: { width: 279.4, height: 215.9 }
};

const paper = computed(() => PAPER_FORMATS[store.userInput.paperFormat] || PAPER_FORMATS.A4);

// === SVG-VIEWBOX & SKALNING ===
// ViewBox anpassas nu dynamiskt till det valda pappersformatet
const viewBox = computed(() => `0 0 ${paper.value.width} ${paper.value.height}`);

// === KOORDINATBERÄKNINGAR ===
// Spindeln placeras i mitten av det valda pappersformatet
const spindle = computed(() => ({ x: paper.value.width / 2, y: paper.value.height / 2 }));

/**
* @description Beräknar den exakta skärmpositionen och tangentvinkeln för en nollpunkt
* @param {number} radius - Nollpunktens radie från spindeln i mm
* @returns {{x: number, y: number, tangentAngle: number}} Koordinater och vinkel
*/
const getNullPointRenderData = (radius) => {
  if (!radius) return { x: 0, y: 0, tangentAngle: 0 };
  const x = spindle.value.x + radius;
  const y = spindle.value.y;
  const tangentAngle = 90;
  return { x, y, tangentAngle };
};

const innerNull = computed(() => getNullPointRenderData(props.nulls.inner));
const outerNull = computed(() => getNullPointRenderData(props.nulls.outer));

// Beräknar svepbågen för stylusen för visuell kontext
const arcPath = computed(() => {
  if (!props.effectiveLength || !props.pivotToSpindle) return "";
  const r = props.effectiveLength;
  const pivot_x_relative = props.pivotToSpindle;

  const pivot_x_absolute = spindle.value.x - pivot_x_relative;
  const pivot_y_absolute = spindle.value.y;

  const startRadius = 60;
  const endRadius = 147;

  // Beräkna start- och slutvinklar för bågen
  const startAngle = Math.acos((pivot_x_relative**2 + r**2 - startRadius**2) / (2 * pivot_x_relative * r));
  const endAngle = Math.acos((pivot_x_relative**2 + r**2 - endRadius**2) / (2 * pivot_x_relative * r));

  const startX = pivot_x_absolute + r * Math.cos(startAngle);
  const startY = pivot_y_absolute - r * Math.sin(startAngle);
  const endX = pivot_x_absolute + r * Math.cos(endAngle);
  const endY = pivot_y_absolute - r * Math.sin(endAngle);

  return `M ${startX} ${startY} A ${r} ${r} 0 0 0 ${endX} ${endY}`;
});

const template = `
<div class="protractor-panel panel" id="protractor-section-for-print">
  <div class="protractor-header">
    <h3>Printable Protractor ({{ alignmentType.replace('A','') }})</h3>
    <div class="print-info">
      <p><strong>Printing Instructions:</strong> Use your browser's print function (Ctrl/Cmd + P). Ensure the printer is set to <strong>100% scale ("Actual Size")</strong> with no "fit to page" scaling. Set page orientation to **Landscape**. Verify the printed 100mm scale with a ruler before use.</p>
    </div>
  </div>

  <div class="protractor-container">
    <svg :viewBox="viewBox" :width="\`${paper.width}mm\`" :height="\`${paper.height}mm\`" preserveAspectRatio="xMidYMid meet">
      <!-- Dimensioneringslinjal för verifiering av utskriftsskala -->
      <g class="ruler" transform="translate(20, 20)">
        <path d="M 0 0 L 100 0 M 0 -5 L 0 5 M 100 -5 L 100 5" stroke="#aaa" stroke-width="0.2" />
        <text x="50" y="-8">100mm Scale Reference</text>
      </g>
      
      <!-- Spindelhål -->
      <g class="spindle" :transform="\`translate(\${spindle.x}, \${spindle.y})\`">
        <circle cx="0" cy="0" r="3.6" stroke="#2c3e50" stroke-width="0.2" fill="none" />
        <path d="M -5 0 L 5 0 M 0 -5 L 0 5" stroke="#2c3e50" stroke-width="0.2" />
        <text x="0" y="8" class="print-only-text">Spindle Hole</text>
      </g>

      <!-- Svepbåge -->
      <path :d="arcPath" class="arc-path" />

      <!-- Nollpunkter & Rutnät -->
      <g class="null-point inner" :transform="\`translate(\${innerNull.x}, \${innerNull.y})\`">
        <g :transform="\`rotate(\${innerNull.tangentAngle})\`">
          <path class="grid-lines" d="M 0 -20 L 0 20 M -20 0 L 20 0 M -15 -10 L 15 -10 M -15 10 L 15 10 M -10 -15 L 10 -15 M 10 -15 L 10 15 M -10 -15 L -10 15" />
        </g>
        <circle cx="0" cy="0" r="0.2" fill="red" />
        <text x="0" y="-25" class="print-only-text">Inner Null: {{ nulls.inner.toFixed(2) }}mm</text>
      </g>
      <g class="null-point outer" :transform="\`translate(\${outerNull.x}, \${outerNull.y})\`">
        <g :transform="\`rotate(\${outerNull.tangentAngle})\`">
          <path class="grid-lines" d="M 0 -20 L 0 20 M -20 0 L 20 0 M -15 -10 L 15 -10 M -15 10 L 15 10 M -10 -15 L 10 -15 M 10 -15 L 10 15 M -10 -15 L -10 15" />
        </g>
        <circle cx="0" cy="0" r="0.2" fill="red" />
        <text x="0" y="-25" class="print-only-text">Outer Null: {{ nulls.outer.toFixed(2) }}mm</text>
      </g>
    </svg>
  </div>
</div>
`;

const style = `
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
  overflow: auto;
}
svg {
  font-family: sans-serif;
  font-size: 4px;
}
.ruler text, .print-only-text {
  text-anchor: middle;
  fill: #555;
}
.arc-path {
  fill: none;
  stroke: #3498db;
  stroke-width: 0.2px;
  stroke-dasharray: 2 2;
}
.grid-lines {
  fill: none;
  stroke: #aaa;
  stroke-width: 0.2px;
}

@media print {
  .protractor-header {
    display: none;
  }
  .protractor-container {
    border: none;
    padding: 0;
    margin: 0;
    width: auto;
    height: auto;
  }
  .arc-path {
    stroke-width: 0.1px;
  }
  :deep(.panel) {
    border: none !important;
    box-shadow: none !important;
    padding: 0 !important;
  }
}
`;

export default {
  props,
  setup() {
    return {
      store,
      paper,
      viewBox,
      spindle,
      innerNull,
      outerNull,
      arcPath
    };
  },
  template,
  style
};
