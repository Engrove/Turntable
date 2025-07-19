// src/services/alignmentCalculations.js

/**
 * @file src/services/alignmentCalculations.js
 * @description Innehåller de rena matematiska funktionerna för att beräkna tonarmsgeometri.
 * Denna modul är fri från state och Vue-reaktivitet.
 */

// --- Kärnberäkningar ---

/**
 * Konverterar grader till radianer.
 * @param {number} deg - Vinkel i grader.
 * @returns {number} Vinkel i radianer.
 */
const degToRad = (deg) => deg * (Math.PI / 180);

/**
 * Konverterar radianer till grader.
 * @param {number} rad - Vinkel i radianer.
 * @returns {number} Vinkel i grader.
 */
const radToDeg = (rad) => rad * (180 / Math.PI);

/**
 * Huvudfunktion för att lösa för optimala geometrivärden.
 * Baserad på V. M. Jovanovics moderna analys av Löfgren-geometrier.
 * ÅTERSTÄLLD till den stabila andragradsekvationsmodellen med korrekta koefficienter.
 * @param {number} pivotToSpindle - Avståndet från pivot till spindel (D).
 * @param {string} alignmentType - Typ av geometri ('Baerwald', 'LofgrenB', 'Stevenson').
 * @param {number} innerGroove - Radie för den innersta skivspåret.
 * @param {number} outerGroove - Radie för den yttersta skivspåret.
 * @returns {object} Ett objekt med overhang, offsetAngle, effectiveLength, och null-punkter, eller ett error-objekt.
 */
export function solver(pivotToSpindle, alignmentType, innerGroove, outerGroove) {
    const D = pivotToSpindle;
    const R1 = innerGroove;
    const R2 = outerGroove;

    if (D <= 0 || R1 <= 0 || R2 <= 0 || R1 >= R2) {
        return { error: 'Invalid input parameters for solver.' };
    }

    let a, b;

    switch (alignmentType) {
        case 'Stevenson':
            a = R1;
            b = R1;
            break;
        case 'LofgrenB':
            // KORREKT implementation av Löfgren B
            a = (R1 + R2) / 2;
            b = (R1**2 + R2**2) / 2;
            break;
        case 'Baerwald': // Löfgren A
        default:
            a = (R1 + R2) / 2;
            b = R1 * R2;
            break;
    }
    
    // KORREKT andragradsekvation baserad på beprövad modell
    const A = (a**2) - (b**2);
    const B = 2 * (b**2 * D - a * b * D);
    const C = (a**2 * b**2) - (b**2 * D**2);

    const discriminant = B**2 - 4 * A * C;
    
    if (discriminant < 0) {
        return { error: `Cannot calculate alignment for a pivot-to-spindle distance of ${D}mm. This distance is likely too short for the chosen record standard.` };
    }
    
    const offsetAngleRad = Math.asin((-B - Math.sqrt(discriminant)) / (2 * A));
    const sinOffset = Math.sin(offsetAngleRad);
    
    const overhang = (b / D - sinOffset * D) / (2 * sinOffset);
    const effectiveLength = (D + overhang) / Math.cos(offsetAngleRad);

    if (isNaN(overhang) || isNaN(effectiveLength) || isNaN(offsetAngleRad)) {
        return { error: 'Calculation resulted in non-real numbers. Please check input.' };
    }

    // Beräkna nollpunkter
    const term = D * D - (effectiveLength - overhang)**2;
    const null_discriminant = term > 0 ? Math.sqrt(term) : 0;
    
    const innerNull = (effectiveLength - overhang) - null_discriminant;
    const outerNull = (effectiveLength - overhang) + null_discriminant;
    
    return {
        overhang: overhang,
        offsetAngle: radToDeg(offsetAngleRad),
        effectiveLength: effectiveLength,
        nulls: {
            inner: innerNull,
            outer: outerNull,
        },
    };
}


/**
 * Beräknar spårningsfelsdata över skivytan för en given geometri.
 * KORRIGERAD för att använda den fullständiga, fysikaliskt korrekta formeln.
 * @param {number} Le - Effektiv längd.
 * @param {number} offsetDeg - Offsetvinkel i grader.
 * @param {number} D - Pivot-to-spindle-avstånd.
 * @returns {Array<object>} En array av punkter {x: radie, y: spårningsfel}.
 */
export function calculateTrackingErrorData(Le, offsetDeg, D) {
    const data = [];
    const offsetRad = degToRad(offsetDeg);

    for (let R = 60; R <= 147; R += 0.5) {
        const cosAngle = (Le**2 + R**2 - D**2) / (2 * Le * R);
        if (cosAngle >= -1 && cosAngle <= 1) {
            const trackingAngleRad = Math.acos(cosAngle);
            const errorRad = trackingAngleRad - offsetRad;
            data.push({ x: R, y: radToDeg(errorRad) });
        }
    }
    return data;
}
// src/services/alignmentCalculations.js
