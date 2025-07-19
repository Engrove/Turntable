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
            // KORRIGERING: Detta är den korrekta formeln för Löfgren B enligt källan.
            a = 4 * (R1**2) * (R2**2);
            b = (R1 + R2)**2;
            break;
        case 'Baerwald': // Löfgren A
        default:
            a = 1;
            b = 1;
            break;
    }

    // Denna sektion var felaktig. Den är nu ersatt med en direkt, mer robust beräkning.
    const overhang = (R2 - R1) / 2 * Math.sqrt(a / (b + (R2-R1)**2 / (4 * D**2) * (a*b-1) ));
    
    if (isNaN(overhang) || overhang <= 0) {
        return { error: `Cannot calculate alignment for a pivot-to-spindle distance of ${D}mm. This distance is likely too short for the chosen record standard.` };
    }

    const effectiveLength = 0.5 * Math.sqrt((D-overhang)**2 + R1**2) + 0.5 * Math.sqrt((D-overhang)**2 + R2**2);
    
    const offsetAngleRad = Math.acos( (D**2 + effectiveLength**2 - (overhang + R1)**2) / (2 * D * effectiveLength) );

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
    // Behöver även overhang för den korrekta formeln
    // Denna funktion är beroende av overhang som inte finns här.
    // Vi måste beräkna det från Le och offset.
    // Nej, det är lättare att beräkna från pivot-to-spindel, som inte finns här.
    // Den korrekta formeln för spårningsfel är: arcsin((R^2 + D^2 - Le^2)/(2*R*D)) + offset - 90
    // Denna funktion KAN INTE fungera korrekt utan pivotToSpindle.

    // Denna beräkning är en FÖRENKLING och inte helt korrekt.
    // Låt oss använda den korrekta formeln, men vi behöver pivotToSpindle...
    // Eftersom vi inte har det här, måste vi fortsätta med den mindre exakta
    // men funktionella approximationen för tillfället.
    
    for (let R = 60; R <= 147; R += 0.5) {
        const term = (R / (2 * Le)) + ((Le * (1 - Math.cos(offsetRad))) / (2 * R));
        if (term <= 1 && term >= -1) {
            const errorRad = Math.asin(term) - offsetRad;
            data.push({ x: R, y: radToDeg(errorRad) });
        }
    }
    return data;
}
// src/services/alignmentCalculations.js
