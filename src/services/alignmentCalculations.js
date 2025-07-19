// src/services/alignmentCalculations.js

/**
 * This service contains all the core mathematical functions for calculating
 * tonearm alignment geometries (Baerwald, Löfgren B, Stevenson) and tracking error.
 * It uses a robust direct calculation for the geometry and the exact
 * trigonometric formula for tracking error, ensuring high precision.
 */

// --- CONSTANTS ---
// IEC 60098 standard groove radii (mm)
const R1 = 60.325; // Inner groove radius
const R2 = 146.05; // Outer groove radius

// --- CORE GEOMETRY SOLVERS ---

/**
 * Calculates Baerwald (Löfgren A) geometry for a given pivot-to-spindle distance.
 * @param {number} p2s - Pivot-to-spindle distance in mm.
 * @returns {object} { overhang, offsetAngle, effectiveLength, nulls: { inner, outer } }
 */
export function calculateBaerwald(p2s) {
    const n1 = 66.0;
    const n2 = 120.89;
    const geometry = solveFromNulls(p2s, n1, n2);
    return { ...geometry, nulls: { inner: n1, outer: n2 } };
}

/**
 * Calculates Löfgren B geometry for a given pivot-to-spindle distance.
 * @param {number} p2s - Pivot-to-spindle distance in mm.
 * @returns {object} { overhang, offsetAngle, effectiveLength, nulls: { inner, outer } }
 */
export function calculateLofgrenB(p2s) {
    const n1 = 70.29;
    const n2 = 116.60;
    const geometry = solveFromNulls(p2s, n1, n2);
    return { ...geometry, nulls: { inner: n1, outer: n2 } };
}

/**
 * Calculates Stevenson A geometry for a given pivot-to-spindle distance.
 * @param {number} p2s - Pivot-to-spindle distance in mm.
 * @returns {object} { overhang, offsetAngle, effectiveLength, nulls: { inner, outer } }
 */
export function calculateStevensonA(p2s) {
    const n1 = 60.325; // Stevenson's inner null is fixed at the inner groove radius
    const n2 = 117.42; // Pre-calculated optimal outer null for Stevenson A with IEC radii
    const geometry = solveFromNulls(p2s, n1, n2);
    return { ...geometry, nulls: { inner: n1, outer: n2 } };
}

// --- HELPER FUNCTIONS ---

/**
 * Solves for overhang, offset angle, AND effective length from two null points and a pivot-to-spindle distance.
 * @param {number} p2s - Pivot-to-spindle distance (d).
 * @param {number} n1 - Inner null point radius.
 * @param {number} n2 - Outer null point radius.
 * @returns {object} { overhang, offsetAngle, effectiveLength }
 */
function solveFromNulls(p2s, n1, n2) {
    const avgNull = (n1 + n2) / 2;
    const effectiveLength = Math.sqrt(p2s**2 + n1*n2 + avgNull**2 + (n1*n2)**2 / (4*p2s**2) - (avgNull*n1*n2)/p2s);

    const overhang = (n1 * n2) / effectiveLength;
    const offsetRad = Math.asin((n1 + n2) / (2 * effectiveLength));

    return {
        overhang: overhang,
        offsetAngle: offsetRad * (180 / Math.PI),
        effectiveLength: effectiveLength // KORRIGERING: Returnera det exakta värdet
    };
}

/**
 * Beräknar spårningsfelet i grader för en given spårradie.
 * @param {number} r - Spårets radie i mm.
 * @param {number} L - Tonarmens effektiva längd i mm.
 * @param {number} d - Pivot-till-spindel-distans i mm.
 * @param {number} beta_rad - Offsetvinkeln i RADIANER.
 * @returns {number} Spårningsfelet i GRADER.
 */
function calculateTrackingError(r, L, d, beta_rad) {
  // Beräkna den geometriska vinkeln med cosinussatsen.
  // Argumentet till asin måste vara mellan -1 och 1. Kläm värdet för numerisk stabilitet.
  const asin_arg = Math.max(-1, Math.min(1, (r*r + L*L - d*d) / (2 * r * L)));
  const geometricAngleRad = Math.asin(asin_arg);

  // Spårningsfelet är skillnaden mellan den geometriska vinkeln och offsetvinkeln.
  const trackingErrorRad = geometricAngleRad - beta_rad;

  // Konvertera slutresultatet från radianer till grader för plottning.
  return trackingErrorRad * (180 / Math.PI);
}

/**
 * Genererar en array med datapunkter för spårningsfelsdiagrammet.
 * @param {number} L - Effektiv längd i mm.
 * @param {number} d - Pivot-till-spindel-distans i mm.
 * @param {number} beta_deg - Offsetvinkel i GRADER.
 * @returns {Array<Object>} En array av {x, y}-punkter för diagrammet.
 */
function generateTrackingErrorData(L, d, beta_deg) {
  // KRITISKT STEG: Konvertera offsetvinkeln från grader till radianer för beräkning.
  const beta_rad = beta_deg * (Math.PI / 180);
  
  const dataPoints =;
  // Iterera över den standardiserade spelytan enligt IEC.
  for (let r = 60.325; r <= 146.05; r += 0.5) {
    const trackingErrorDeg = calculateTrackingError(r, L, d, beta_rad);
    dataPoints.push({ x: r, y: trackingErrorDeg });
  }
  return dataPoints;
}

/**
 * Generates an array of {x, y} points for plotting the tracking error curve.
 * KORRIGERING: Tar nu emot effectiveLength direkt för perfekt konsistens.
 * @param {number} p2s - Pivot-to-spindle distance (mm).
 * @param {number} effectiveLength - The calculated effective length (mm).
 * @param {number} offsetAngle - Tonearm offset angle (degrees).
 * @returns {Array<object>} Array of points for Chart.js.
 */
export function generateTrackingErrorCurve(p2s, effectiveLength, offsetAngle) {
    const dataPoints = [];
    const step = 0.5; // mm per step

    for (let r = R1; r <= R2; r += step) {

        // Konvertera vinkeln från grader till radianer
        const offsetAngleRad = offsetAngle * (Math.PI / 180);

        // Anropa med korrekta variabler i rätt ordning
        const error = calculateTrackingError(r, effectiveLength, p2s, offsetAngleRad);
        //const error = calculateTrackingError(r, p2s, effectiveLength, offsetAngle);
        
        if (!isNaN(error)) {
            dataPoints.push({ x: r, y: error });
        }
    }
    return dataPoints;
}
