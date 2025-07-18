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
// Kontrollerar att indata är giltiga för att undvika beräkningsfel.
if (!pivotToSpindle || !geometry || !standard || pivotToSpindle <= 0) {
return { error: "Invalid input for alignment calculation." };
}

const D = pivotToSpindle;
const R1 = standard.inner; // Inre spelradie
const R2 = standard.outer; // Yttre spelradie

let overhang, offsetAngleRad, nulls;

// Väljer beräkningslogik baserat på vald geometri.
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
// För Stevenson beräknas överhäng och vinkel direkt från spelradierna.
const term1 = (R1 + R2) / (2 * D);
const term2 = (R1 * R2) / (D * D);
// KORRIGERING: Lade till saknad multiplikationsoperator.
offsetAngleRad = Math.asin(term1 * (1 - term2 / (1 + term1 * term1)));
// KORRIGERING: Lade till saknad multiplikationsoperator.
overhang = D * (term2 / (2 * (1 - term1 * term1)));


// Beräkna nollpunkterna för Stevenson efter att överhäng och vinkel är kända.
const sinOffset = Math.sin(offsetAngleRad);
const termA = 2 * D * sinOffset;
const termB = D*D - 2*D*overhang - overhang*overhang;
const innerNull = (termA - Math.sqrt(termA*termA - 4*termB))/2;
const outerNull = (termA + Math.sqrt(termA*termA - 4*termB))/2;
nulls = { inner: innerNull, outer: outerNull };


} else {
return { error: Unknown geometry: ${geometry.name} };
}

// Konvertera offsetvinkel från radianer till grader.
const offsetAngle = offsetAngleRad * (180 / Math.PI);
// Beräkna effektiv längd.
const effectiveLength = Math.sqrt((D + overhang)**2);

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
const Le = Math.sqrt((D + overhang) ** 2);
const offsetRad = offsetAngle * (Math.PI / 180);

// Använder en säkrare metod för att undvika Math.asin-fel vid gränsvärden
const asin_arg = (radius * radius + D * D - Le * Le) / (2 * radius * D);
if (asin_arg > 1 || asin_arg < -1) {
return NaN; // Geometriskt omöjligt, returnera NaN
}
const trackingAngleRad = Math.asin(asin_arg);
const errorRad = offsetRad - trackingAngleRad;

return errorRad * (180 / Math.PI);
}

/**
Genererar den kompletta datastrukturen för spårningsfelsdiagrammet.
Den itererar igenom alla tillgängliga geometrier, beräknar deras optimala
justering och skapar sedan en dataserie (kurva) för var och en.
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
  
  // Itererar från inre till yttre radie för att bygga upp kurvan.
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

// Exporterar funktionerna så att de kan användas av andra delar av applikationen,
// framförallt av alignmentStore.
export {
calculateOptimalAlignment,
generateTrackingErrorData,
calculateTrackingErrorAtRadius
};
// src/services/alignmentCalculations.js
