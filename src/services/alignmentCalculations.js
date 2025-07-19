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
            a = R1 * R2;
            b = 0; // Stevenson siktar på nollfel vid R1.
            break;
        case 'LofgrenB':
            a = (4 * R1 * R2) / ((R1 + R2) ** 2);
            b = 1;
            break;
        case 'Baerwald': // Löfgren A
        default:
            a = 1;
            b = 1;
            break;
    }

    const P = (R1 + R2) / 2;
    const Q = (R2 - R1) / 2;

    const A = (a * b * P**4) + ((2*a*b - a + 1) * P**2 * Q**2) + ((b - a + 1) * Q**4);
    const B = -2 * ( (a * b * P**4) + (a*b*P**2*Q**2) + (a*P**2*Q**2) );
    const C = a**2 * P**4 * Q**2;
    
    // Använd pq-formeln (x = -p/2 ± sqrt((p/2)^2 - q)) för att lösa andragradsekvationen för d^2
    const p = B / A;
    const q = C / A;
    const discriminant = (p/2)**2 - q;
    
    if (discriminant < 0) {
        return { error: `Cannot calculate alignment for a pivot-to-spindle distance of ${D}mm. This distance is likely too short for the chosen record standard.` };
    }
    
    const d_squared = -p/2 + Math.sqrt(discriminant);
    const d = Math.sqrt(d_squared); // 'd' är Jovanovics term för 'overhang'
    
    const overhang = d;
    const effectiveLength = Math.sqrt(D**2 + d**2 + 2*d*( (a*P*Q**2) / ((a*b*P**2) + (b-a+1)*Q**2) ));
    const offsetAngleRad = Math.asin( (effectiveLength**2 - D**2 - d**2) / (2 * D * d) );

    // Beräkna nollpunkter
    const term1 = (overhang * (2 * D + overhang)) / (2 * effectiveLength);
    const term2 = Math.sin(offsetAngleRad);
    
    const C1 = (term1 / term2) - D;
    const C2 = D * (term1 / term2);
    
    const null_discriminant = C1**2 - 4*C2;
    if (null_discriminant < 0) {
        return { error: 'Cannot calculate null points with the derived geometry.' };
    }

    const innerNull = (-C1 - Math.sqrt(null_discriminant)) / 2;
    const outerNull = (-C1 + Math.sqrt(null_discriminant)) / 2;
    
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
 * @param {number} Le - Effektiv längd.
 * @param {number} offsetDeg - Offsetvinkel i grader.
 * @returns {Array<object>} En array av punkter {x: radie, y: spårningsfel}.
 */
export function calculateTrackingErrorData(Le, offsetDeg) {
    const data = [];
    const offsetRad = degToRad(offsetDeg);

    for (let R = 60; R <= 147; R += 0.5) {
        const term = (R / (2 * Le)) + ((Le * (1 - Math.cos(offsetRad))) / (2 * R));
        // Säkerhetskontroll för att undvika Math.asin på värden utanför [-1, 1]
        if (term <= 1 && term >= -1) {
            const errorRad = Math.asin(term) - offsetRad;
            data.push({ x: R, y: radToDeg(errorRad) });
        }
    }
    return data;
}
// src/services/alignmentCalculations.js
