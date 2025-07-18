// src/services/alignmentCalculations.js
/**
@file src/services/alignmentCalculations.js
@description Denna fil är hjärnan bakom justeringskalkylatorn. Den innehåller all
kärnlogik och de matematiska formler som krävs för att beräkna optimala
justeringsgeometrier (överhäng, offsetvinkel, nollpunkter) och för att
generera data för visualisering av spårningsfel över en skivas yta.
All logik här är ren JavaScript utan beroenden till externa bibliotek.
*/

/**
Beräknar de optimala värdena för överhäng och offsetvinkel baserat på en given
pivot-till-spindel-distans och vald justeringsgeometri (t.ex. Baerwald).
Formlerna är baserade på standardteori från Löfgren och Baerwald.
@param {number} pivotToSpindle - Avståndet från tonarmens pivotpunkt till skivtallrikens spindel i mm.
@param {object} geometry - Ett objekt som definierar den valda geometrin (namn, beskrivning).
@param {object} standard - Ett objekt som definierar inre och yttre spelradier (inner, outer) i mm.
@returns {object|null} Ett objekt med beräknade värden (overhang, offsetAngle, effectiveLength, nulls) eller null vid fel.
*/
function calculateOptimalAlignment(pivotToSpindle, geometry, standard) {
if (!pivotToSpindle || !geometry || !standard || pivotToSpindle <= 0) {
return { error: "Invalid input for alignment calculation." };
}

const D = pivotToSpindle;
const R1 = standard.inner;
const R2 = standard.outer;

let overhang, offsetAngleRad, nulls;

if (geometry.name === 'Baerwald' || geometry.name === 'LofgrenA') {
const R1_sq = R1 * R1;
const R2_sq = R2 * R2;
nulls = { inner: (Math.sqrt(2) * R1 * R2) / Math.sqrt(R1_sq + R2_sq), outer: Math.sqrt((R1_sq + R2_sq) / 2) };
overhang = (nulls.inner * nulls.outer) / D;
offsetAngleRad = Math.asin((nulls.inner + nulls.outer) / (2 * D));
} else if (geometry.name === 'LofgrenB') {
nulls = { inner: Math.sqrt(R1 * R2), outer: (R1 + R2) / 2 };
overhang = (nulls.inner * nulls.outer) / D;
offsetAngleRad = Math.asin((nulls.inner + nulls.outer) / (2 * D));
} else if (geometry.name === 'Stevenson') {
const term1 = (R1 + R2) / (2 * D);
const term2 = (R1 * R2) / (D * D);
offsetAngleRad = Math.asin(term1 * (1 - term2 / (1 + term1 * term1)));
overhang = D * (term2 / (2 * (1 - term1 * term1)));


const sinOffset = Math.sin(offsetAngleRad);
const termA = 2 * D * sinOffset;
const termB = D * D - 2 * D * overhang - overhang * overhang;
const innerNull = (termA - Math.sqrt(termA * termA - 4 * termB)) / 2;
const outerNull = (termA + Math.sqrt(termA * termA - 4 * termB)) / 2;
nulls = { inner: innerNull, outer: outerNull };


} else {
return { error: `Unknown geometry: ${geometry.name}` };
}

const offsetAngle = offsetAngleRad * (180 / Math.PI);
const effectiveLength = Math.sqrt(D * D + overhang * overhang + 2 * D * overhang);

return {
overhang,
offsetAngle,
effectiveLength,
nulls,
error: null
};
}

/**

Beräknar det specifika spårningsfelet (i grader) vid en given radie på skivan.

@param {number} overhang - Tonarmens överhäng i mm.

@param {number} offsetAngle - Tonarmens offsetvinkel i grader.

@param {number} pivotToSpindle - Avståndet från pivot till spindel i mm.

@param {number} radius - Den specifika radien på skivan där felet ska beräknas.

@returns {number} Spårningsfelet i grader.
*/
function calculateTrackingErrorAtRadius(overhang, offsetAngle, pivotToSpindle, radius) {
const D = pivotToSpindle;
const Le = Math.sqrt(D * D + overhang * overhang + 2 * D * overhang);
const offsetRad = offsetAngle * (Math.PI / 180);

// === KORRIGERINGEN IMPLEMENTERAD HÄR ===
// Beräknar cosinus för vinkeln vid SPINDELN, enligt din korrekta anvisning.
const cosArg = (D * D + radius * radius - Le * Le) / (2 * D * radius);

// Säkerställer att argumentet är inom det giltiga intervallet för acos.
if (cosArg > 1 || cosArg < -1) {
return NaN; // Geometriskt omöjligt
}

// Beräkna vinkeln vid spindeln.
const angleAtSpindleRad = Math.acos(cosArg);

// Den sanna spårvinkeln är 90 grader minus vinkeln vid spindeln.
const trackingAngleRad = (Math.PI / 2) - angleAtSpindleRad;

// Spårfelet är skillnaden mellan offsetvinkeln och den sanna spårvinkeln.
const errorRad = offsetRad - trackingAngleRad;

return errorRad * (180 / Math.PI);
}

/**

Genererar den kompletta datastrukturen för spårningsfelsdiagrammet.

@param {number} pivotToSpindle - Avståndet från pivot till spindel i mm.

@param {object} geometries - Ett objekt som innehåller alla justeringsgeometrier.

@param {object} standard - Det valda standardobjektet för spelradier.

@returns {object} Ett objekt redo att användas av Chart.js, innehållande datasets.
*/
function generateTrackingErrorData(pivotToSpindle, geometries, standard) {
const datasets = [];

for (const key in geometries) {
const geometry = geometries[key];
const optimal = calculateOptimalAlignment(pivotToSpindle, geometry, standard);


if (optimal && !optimal.error) {
  const curveData = [];
  
  for (let r = standard.inner; r <= standard.outer; r += 0.5) {
    const error = calculateTrackingErrorAtRadius(
      optimal.overhang,
      optimal.offsetAngle,
      pivotToSpindle,
      r
    );
    if (!isNaN(error)) {
      curveData.push({ x: r, y: error });
    }
  }

  datasets.push({
    label: geometry.name.replace('A', ''),
    data: curveData,
    borderColor: geometry.color,
    borderWidth: 2,
    pointRadius: 0,
    fill: false,
    tension: 0.1,
  });
}


}

return { datasets };
}

export {
calculateOptimalAlignment,
generateTrackingErrorData,
calculateTrackingErrorAtRadius
};
// src/services/alignmentCalculations.js
