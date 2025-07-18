// src/services/alignmentCalculations.js
/**

@file src/services/alignmentCalculations.js

@description Dedicated service module for all tonearm alignment geometry calculations.

This module contains pure functions for calculating optimal alignment based on

standard geometries (Baerwald, Löfgren B, Stevenson A) and for generating

tracking error data for visualization.

This file is created as per the "Battle Plan: Engrove Alignment Calculator 2.0".

It is intended to be the sole source of truth for alignment mathematics,

keeping the Pinia store clean and focused on state management.

VERSION 2.2: Corrected a syntax error in the solveFromNulls function.
*/

// ==========================================================================
// --- Constants ---
// ==========================================================================

/**

@description Defines the inner and outer groove radii for various international standards.

@type {Object.<string, {name: string, inner: number, outer: number}>}
*/
export const GROOVE_STANDARDS = {
IEC: { name: 'IEC (1987)', inner: 60.325, outer: 146.05 },
DIN: { name: 'DIN (1981)', inner: 57.5, outer: 146.0 },
JIS: { name: 'JIS (1973)', inner: 57.6, outer: 146.5 }
};

/**

@description Pre-calculated null points for each geometry based on the corresponding standard.

This is more efficient than calculating them dynamically on every user interaction.
*/
const NULL_POINTS = {
IEC: {
Baerwald: { inner: 66.00, outer: 120.89 },
LofgrenB: { inner: 70.30, outer: 116.60 },
StevensonA: { inner: 60.33, outer: 117.42 }
},
DIN: {
Baerwald: { inner: 63.24, outer: 119.83 },
LofgrenB: { inner: 67.37, outer: 115.30 },
StevensonA: { inner: 57.50, outer: 115.33 }
},
JIS: {
Baerwald: { inner: 63.34, outer: 120.25 },
LofgrenB: { inner: 67.48, outer: 115.72 },
StevensonA: { inner: 57.60, outer: 115.75 }
}
};

// ==========================================================================
// --- Core Alignment Solvers ---
// ==========================================================================

/**

Calculates alignment parameters from two given null points and a pivot-to-spindle distance.

This is the core engine for all analytical solvers.

@param {number} pivotToSpindle - The distance from tonearm pivot to platter spindle (d) in mm.

@param {number} n1 - Inner null point radius in mm.

@param {number} n2 - Outer null point radius in mm.

@returns {{overhang: number, offsetAngle: number, effectiveLength: number}}
*/
function solveFromNulls(pivotToSpindle, n1, n2) {
const d = pivotToSpindle;
const R_avg = (n1 + n2) / 2;
const R_prod = n1 * n2;
const term = d + (R_prod / d);
// --- KORRIGERING AV BUGG ---
// Ändrade 'term2' till 'term2' för att korrekt kvadrera termen.
const effectiveLength = Math.sqrt(term2 + R_avg**2);
// --- SLUT PÅ KORRIGERING ---
const overhang = effectiveLength - d;

const offsetAngleRad = Math.asin(R_avg / term);
const offsetAngle = offsetAngleRad * (180 / Math.PI);

return { overhang, offsetAngle, effectiveLength };
}

/**

Calculates the optimal alignment parameters based on the Löfgren A (Baerwald) geometry for a given standard.

@param {number} pivotToSpindle - The distance from tonearm pivot to platter spindle in mm.

@param {string} [standard='IEC'] - The groove standard to use ('IEC', 'DIN', 'JIS').

@returns {{overhang: number, offsetAngle: number, effectiveLength: number, nulls: {inner: number, outer: number}}}
*/
export function calculateBaerwald(pivotToSpindle, standard = 'IEC') {
const nulls = NULL_POINTS[standard].Baerwald;
const { overhang, offsetAngle, effectiveLength } = solveFromNulls(pivotToSpindle, nulls.inner, nulls.outer);
return { overhang, offsetAngle, effectiveLength, nulls };
}

/**

Calculates the optimal alignment parameters based on the Löfgren B geometry for a given standard.

@param {number} pivotToSpindle - The distance from tonearm pivot to platter spindle in mm.

@param {string} [standard='IEC'] - The groove standard to use ('IEC', 'DIN', 'JIS').

@returns {{overhang: number, offsetAngle: number, effectiveLength: number, nulls: {inner: number, outer: number}}}
*/
export function calculateLofgrenB(pivotToSpindle, standard = 'IEC') {
const nulls = NULL_POINTS[standard].LofgrenB;
const { overhang, offsetAngle, effectiveLength } = solveFromNulls(pivotToSpindle, nulls.inner, nulls.outer);
return { overhang, offsetAngle, effectiveLength, nulls };
}

/**

Calculates the optimal alignment parameters based on the Stevenson A geometry for a given standard.

@param {number} pivotToSpindle - The distance from tonearm pivot to platter spindle in mm.

@param {string} [standard='IEC'] - The groove standard to use ('IEC', 'DIN', 'JIS').

@returns {{overhang: number, offsetAngle: number, effectiveLength: number, nulls: {inner: number, outer: number}}}
*/
export function calculateStevensonA(pivotToSpindle, standard = 'IEC') {
const nulls = NULL_POINTS[standard].StevensonA;
const { overhang, offsetAngle, effectiveLength } = solveFromNulls(pivotToSpindle, nulls.inner, nulls.outer);
return { overhang, offsetAngle, effectiveLength, nulls };
}

// ==========================================================================
// --- Tracking Error Calculation ---
// ==========================================================================

/**

Calculates the tracking error in degrees at a specific radius for a given tonearm setup.

This uses the exact trigonometric formula.

@param {number} radius - The groove radius (r) in mm.

@param {number} pivotToSpindle - The pivot-to-spindle distance (d) in mm.

@param {number} overhang - The tonearm's overhang in mm.

@param {number} offsetAngle - The tonearm's offset angle in degrees.

@returns {number} The tracking error in degrees.
*/
function calculateTrackingErrorAtRadius(radius, pivotToSpindle, overhang, offsetAngle) {
const r = radius;
const d = pivotToSpindle;
const L = d + overhang; // Effective Length
const betaRad = offsetAngle * (Math.PI / 180);

// This is the correct formula for the tracking angle (phi) at the stylus tip.
const arcsinArg = (r / (2 * L)) + ((L2 - d2) / (2 * r * L));

// Prevent math domain errors from floating point inaccuracies
if (arcsinArg > 1 || arcsinArg < -1) {
return NaN;
}

const trackingAngleRad = Math.asin(arcsinArg);
const errorRad = trackingAngleRad - betaRad;

return errorRad * (180 / Math.PI);
}

/**

Generates an array of data points for plotting the tracking error curve.

@param {number} pivotToSpindle - The pivot-to-spindle distance (d) in mm.

@param {number} overhang - The calculated overhang in mm.

@param {number} offsetAngle - The calculated offset angle in degrees.

@param {string} [standard='IEC'] - The groove standard to use for curve boundaries.

@param {number} [steps=150] - The number of points to generate for the curve.

@returns {Array<{x: number, y: number}>} An array of points formatted for Chart.js.
*/
export function generateTrackingErrorCurve(pivotToSpindle, overhang, offsetAngle, standard = 'IEC', steps = 150) {
const curveData = [];
const { inner: innerGroove, outer: outerGroove } = GROOVE_STANDARDS[standard];
const stepSize = (outerGroove - innerGroove) / (steps - 1);

for (let i = 0; i < steps; i++) {
const radius = innerGroove + (i * stepSize);
const errorDegrees = calculateTrackingErrorAtRadius(radius, pivotToSpindle, overhang, offsetAngle);

curveData.push({
  x: radius,
  y: errorDegrees,
});


}

return curveData;
}
// src/services/alignmentCalculations.js
