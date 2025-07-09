import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// --- RÄTTNING BÖRJAR HÄR ---

// Importera data med fs.readFileSync för maximal kompatibilitet i Node.js-miljöer
function readJsonFileSync(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pickupData = readJsonFileSync(path.resolve(__dirname, '../data/pickup_data.json'));
const classifications = readJsonFileSync(path.resolve(__dirname, '../data/classifications.json'));

// --- RÄTTNING SLUTAR HÄR ---


/**
 * Beräknar medianen för en array av nummer.
 * @param {number[]} arr - En array av nummer.
 * @returns {number} Medianvärdet.
 */
function calculateMedian(arr) {
    if (!arr || arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Den centrala "Frankenstein"-prediktionsfunktionen.
 * Den estimerar 10Hz-följsamhet baserat på en hierarkisk matchning.
 * @param {object} targetPickup - Ett objekt som representerar pickupen vi vill estimera för.
 * @param {object[]} trainingData - En array av kända pickuper att träna på.
 * @returns {number} Det estimerade 10Hz-värdet, eller NaN om det inte går att estimera.
 */
function estimateCompliance(targetPickup, trainingData) {
    const has100Hz = targetPickup.cu_dynamic_100hz > 0;
    const hasStatic = targetPickup.cu_static > 0;

    // Prioriteringsordning för vilka egenskaper vi matchar på. Från mest specifik till minst.
    const propertyMatchOrder = [
        ['type', 'cantilever_class', 'stylus_family'],
        ['type', 'cantilever_class'],
        ['type']
    ];
    
    for (const propertiesToMatch of propertyMatchOrder) {
        let matchingGroup = trainingData;
        for (const prop of propertiesToMatch) {
            if (targetPickup[prop]) {
                matchingGroup = matchingGroup.filter(p => p[prop] === targetPickup[prop]);
            }
        }

        // Kräver minst 2 datapunkter för ett meningsfullt medianvärde.
        if (matchingGroup.length >= 2) {
            if (has100Hz) {
                const ratios = matchingGroup
                    .filter(p => p.cu_dynamic_100hz > 0)
                    .map(p => p.cu_dynamic_10hz / p.cu_dynamic_100hz);
                if (ratios.length > 0) {
                    const medianRatio = calculateMedian(ratios);
                    return targetPickup.cu_dynamic_100hz * medianRatio;
                }
            } else if (hasStatic) {
                const ratios = matchingGroup
                    .filter(p => p.cu_static > 0)
                    .map(p => p.cu_dynamic_10hz / p.cu_static);
                if (ratios.length > 0) {
                    const medianRatio = calculateMedian(ratios);
                    return targetPickup.cu_static * medianRatio;
                }
            }
        }
    }
    
    // Om ingen matchande grupp hittades i loopen, returnera NaN
    return NaN;
}


/**
 * Kör "Leave-One-Out" korsvalidering för att beräkna felmarginaler.
 * @returns {object} Ett objekt med konfidensnivåer för varje scenario.
 */
function runCrossValidation() {
    const allKnownPickups = pickupData.filter(p => !p.is_estimated_10hz && p.cu_dynamic_10hz > 0);
    const scenarioResults = {};

    // Definiera våra scenarion
    const scenarios = {
        'A1': { base: '100hz', props: ['type', 'cantilever_class', 'stylus_family'] },
        'A2': { base: '100hz', props: ['type', 'cantilever_class'] },
        'A3': { base: '100hz', props: ['type'] },
        'B1': { base: 'static', props: ['type', 'cantilever_class', 'stylus_family'] },
        'B2': { base: 'static', props: ['type', 'cantilever_class'] },
        'B3': { base: 'static', props: ['type'] },
    };

    for (const testPickup of allKnownPickups) {
        const trainingSet = allKnownPickups.filter(p => p.id !== testPickup.id);
        const trueValue = testPickup.cu_dynamic_10hz;

        for (const [key, scenario] of Object.entries(scenarios)) {
            let inputForEstimator = {};
            let canRunScenario = false;

            if (scenario.base === '100hz' && testPickup.cu_dynamic_100hz > 0) {
                inputForEstimator.cu_dynamic_100hz = testPickup.cu_dynamic_100hz;
                canRunScenario = true;
            } else if (scenario.base === 'static' && testPickup.cu_static > 0) {
                inputForEstimator.cu_static = testPickup.cu_static;
                canRunScenario = true;
            }

            if (canRunScenario) {
                scenario.props.forEach(prop => {
                    inputForEstimator[prop] = testPickup[prop];
                });

                const prediction = estimateCompliance(inputForEstimator, trainingSet);

                if (!isNaN(prediction) && trueValue > 0) {
                    const errorPercent = Math.abs((prediction - trueValue) / trueValue) * 100;
                    if (!scenarioResults[key]) scenarioResults[key] = [];
                    scenarioResults[key].push(errorPercent);
                }
            }
        }
    }

    // Beräkna slutgiltig konfidensnivå från de aggregerade felen
    const finalConfidenceLevels = {};
    for (const [key, errors] of Object.entries(scenarioResults)) {
        const meanError = errors.reduce((a, b) => a + b, 0) / errors.length;
        finalConfidenceLevels[key] = {
            confidence: Math.max(0, Math.round(100 - meanError)),
            sampleSize: errors.length,
            description: `Based on ${scenarios[key].base} compliance and matching ${scenarios[key].props.join(', ')}.`
        };
    }

    return finalConfidenceLevels;
}

// ---- Huvudexekvering ----
console.log('Generating confidence levels from pickup_data.json...');

const confidenceData = runCrossValidation();

const outputPath = path.resolve(__dirname, '../data/confidence_levels.json');
fs.writeFileSync(outputPath, JSON.stringify(confidenceData, null, 2));

console.log(`✅ Successfully generated confidence_levels.json with ${Object.keys(confidenceData).length} scenarios.`);
