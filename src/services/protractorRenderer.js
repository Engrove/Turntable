// src/services/protractorRenderer.js
/**
@file src/services/protractorRenderer.js
@description En ren JavaScript-modul ("grafikmotor") för att generera SVG-kod för olika typer av protraktorer.
*/

const PAPER_FORMATS = {
A4: { width: 297, height: 210 },
Letter: { width: 279.4, height: 215.9 }
};

// --- SVG Byggstenar ---

function getSvgHeader(paper) {
return <svg xmlns="http://www.w3.org/2000/svg" width="${paper.width}mm" height="${paper.height}mm" viewBox="0 0 ${paper.width} ${paper.height}" style="font-family: sans-serif; font-size: 4px;">;
}

function generateSpindleHole(cx, cy) {
return <g class="spindle" transform="translate(${cx}, ${cy})"> <circle cx="0" cy="0" r="3.6" stroke="#000" stroke-width="0.1" fill="none" /> <path d="M -5 0 L 5 0 M 0 -5 L 0 5" stroke="#000" stroke-width="0.1" /> <text x="0" y="8" text-anchor="middle" fill="#555">Spindle Hole</text> </g>;
}

function generateScaleRuler(paper) {
const x = 20;
const y = paper.height - 20;
return <g class="ruler" transform="translate(${x}, ${y})"> <path d="M 0 0 L 100 0 M 0 -2.5 L 0 2.5 M 100 -2.5 L 100 2.5" stroke="#555" stroke-width="0.2" /> <text x="50" y="-5" text-anchor="middle" fill="#555">100mm Scale Reference</text> </g>;
}

function generateNullPointGrid(cx, cy, label, radius) {
return <g class="null-point" transform="translate(${cx}, ${cy})"> <path class="grid-lines" d="M 0 -20 L 0 20 M -20 0 L 20 0 M -15 -10 L 15 -10 M -15 10 L 15 10 M -10 -15 L 10 -15 M 10 -15 L 10 15 M -10 -15 L -10 15" /> <circle cx="0" cy="0" r="0.2" fill="#e74c3c" /> <text x="0" y="-25" text-anchor="middle" fill="#000">${label}: ${radius.toFixed(2)}mm</text> </g>;
}

function generateArcPath(spindle, pivotToSpindle, effectiveLength) {
const r = effectiveLength;
const pivot_x = spindle.x + pivotToSpindle;
const startAngleRad = Math.asin(147 / r);
const endAngleRad = Math.asin(59 / r);


const startX = pivot_x - r * Math.cos(startAngleRad);
const startY = spindle.y + r * Math.sin(startAngleRad);
const endX = pivot_x - r * Math.cos(endAngleRad);
const endY = spindle.y + r * Math.sin(endAngleRad);

return `<path class="arc-path" d="M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}" />`;


}

// --- Protraktor-modeller ---

function renderBaerwaldArc(params) {
const { paperFormat, pivotToSpindle, effectiveLength, nulls, alignmentType } = params;
const paper = PAPER_FORMATS[paperFormat];
const spindle = { x: 50, y: paper.height / 2 };


let svg = getSvgHeader(paper);
svg += `<style>.arc-path { fill: none; stroke: #000; stroke-width: 0.2px; stroke-dasharray: 2 2; } .grid-lines { fill: none; stroke: #aaa; stroke-width: 0.1px; }</style>`;
svg += generateSpindleHole(spindle.x, spindle.y);
svg += generateScaleRuler(paper);

// Linje från spindel mot pivot
svg += `<line x1="${spindle.x}" y1="${spindle.y}" x2="${spindle.x + pivotToSpindle}" y2="${spindle.y}" stroke="#000" stroke-width="0.1" stroke-dasharray="2 2" />`;

// Svepbåge
svg += generateArcPath(spindle, pivotToSpindle, effectiveLength);

// Nollpunkter (placerade längs Y-axeln för enkelhet, bågen är det viktiga)
const nullYOffset = 40;
svg += generateNullPointGrid(spindle.x + nulls.inner, spindle.y + nullYOffset, 'Inner Null', nulls.inner);
svg += generateNullPointGrid(spindle.x + nulls.outer, spindle.y + nullYOffset, 'Outer Null', nulls.outer);

svg += '</svg>';
return svg;
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
IGNORE_WHEN_COPYING_END

}

// --- Huvudfunktion (Dispatcher) ---

/**

Genererar SVG-koden för en specifik protraktormodell.

@param {string} model - Namnet på protraktormodellen (t.ex. 'Baerwald Arc').

@param {object} params - Ett objekt med alla nödvändiga beräknade värden och inställningar.

@returns {string} Den fullständiga SVG-koden som en textsträng.
*/
export function renderProtractor(model, params) {
switch (model) {
case 'Baerwald Arc':
case 'LofgrenB Arc':
case 'Stevenson Arc':
return renderBaerwaldArc(params); // För fas 1 använder alla samma arc-logik
// Framtida modeller kan läggas till här:
// case 'Universal Two-Point':
// return renderUniversalTwoPoint(params);
default:
return '<svg><text>Error: Protraktor-modell ej vald eller okänd.</text></svg>';
}
}
// src/services/protractorRenderer.js
