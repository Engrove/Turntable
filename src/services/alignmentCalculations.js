// src/services/alignmentCalculations.js
/**

@file src/services/alignmentCalculations.js

@description This file contains the core mathematical logic for the tonearm alignment calculator.

It handles the calculation of optimal geometries (overhang, offset angle, null points)

and generates data for tracking error visualization.
*/

/**

Calculates the optimal overhang and offset angle for a given pivot-to-spindle distance

and a specified alignment geometry (e.g., Baerwald, Lofgren, Stevenson).

@param {number} pivotToSpindle - The distance from the tonearm pivot to the platter spindle in mm.

@param {object} geometry - An object defining the chosen alignment geometry.

@param {object} standard - An object defining the inner and outer groove radii.

@returns {object|null} An object containing the calculated overhang, offsetAngle, effectiveLength, and null points, or an error object.
*/
function calculateOptimalAlignment(pivotToSpindle, geometry, standard) {
if (!pivotToSpindle || !geometry || !standard || pivotToSpindle <= 0) {
return { error: "Invalid input for alignment calculation." };
}

const D = pivotToSpindle;
const R1 = standard.inner;
const R2 = standard.outer;

let overhang, offsetAngleRad, n_inner, n_outer;

if (geometry.name === 'Baerwald' || geometry.name === 'LofgrenA') {
const R1_sq = R1 * R1;
const R2_sq = R2 * R2;
n_inner = (Math.sqrt(2) * R1 * R2) / Math.sqrt(R1_sq + R2_sq);
n_outer = Math.sqrt((R1_sq + R2_sq) / 2);
overhang = (n_inner * n_outer) / D;
offsetAngleRad = Math.asin((n_inner + n_outer) / (2 * D));
} else if (geometry.name === 'LofgrenB') {
n_inner = Math.sqrt(R1 * R2);
n_outer = (R1 + R2) / 2;
overhang = (n_inner * n_outer) / D;
offsetAngleRad = Math.asin((n_inner + n_outer) / (2 * D));
} else if (geometry.name === 'Stevenson') {
const term1 = (R1 + R2) / (2 * D);
const term2 = (R1 * R2) / (D * D);
offsetAngleRad = Math.asin(term1 * (1 - term2 / (1 + term1 * term1)));
overhang = D * (term2 / (2 * (1 - term1 * term1)));
const sinOffset = Math.sin(offsetAngleRad);
const termA = 2 * D * sinOffset;
const termB = D * D - 2 * D * overhang - overhang * overhang;
n_inner = (termA - Math.sqrt(termA * termA - 4 * termB)) / 2;
n_outer = (termA + Math.sqrt(termA * termA - 4 * termB)) / 2;
} else {
return { error: Unknown geometry: ${geometry.name} };
}

const offsetAngle = offsetAngleRad * (180 / Math.PI);
const effectiveLength = Math.sqrt((D + overhang) ** 2);

return {
overhang,
offsetAngle,
effectiveLength,
nulls: { inner: n_inner, outer: n_outer },
error: null
};
}

/**

Calculates the tracking error in degrees at a specific radius on the record.

@param {number} overhang - The tonearm's overhang in mm.

@param {number} offsetAngle - The tonearm's offset angle in degrees.

@param {number} pivotToSpindle - The pivot-to-spindle distance in mm.

@param {number} radius - The specific groove radius to calculate the error for.

@returns {number} The tracking error in degrees.
*/
function calculateTrackingErrorAtRadius(overhang, offsetAngle, pivotToSpindle, radius) {
const D = pivotToSpindle;
const Le = Math.sqrt((D + overhang) ** 2);
const offsetRad = offsetAngle * (Math.PI / 180);
const asin_arg = (radius * radius + D * D - Le * Le) / (2 * radius * D);
if (asin_arg > 1 || asin_arg < -1) return NaN;
const trackingAngleRad = Math.asin(asin_arg);
const errorRad = offsetRad - trackingAngleRad;
return errorRad * (180 / Math.PI);
}

/**

Generates the data structure for the tracking error chart.

It iterates through all available geometries, calculates their optimal alignment,

and then creates a (currently empty) data series for each.

@param {number} pivotToSpindle - The pivot-to-spindle distance in mm.

@param {object} geometries - An object containing all alignment geometries.

@param {object} standard - The selected groove standard object.

@returns {object} A Chart.js compatible data object with datasets.
*/
function generateTrackingErrorData(pivotToSpindle, geometries, standard) {
const datasets = [];

for (const key in geometries) {
const geometry = geometries[key];
const optimal = calculateOptimalAlignment(pivotToSpindle, geometry, standard);


if (optimal && !optimal.error) {
  const curveData = []; // This is the original problem - this array is never filled.
  
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
