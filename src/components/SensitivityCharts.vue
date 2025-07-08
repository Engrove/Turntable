<script setup>
import { onMounted, ref, watch } from 'vue'
import { useTonearmStore } from '@/store/tonearmStore.js'
import { Chart } from 'chart.js/auto';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(annotationPlugin);

const store = useTonearmStore();

const headshellChartCanvas = ref(null);
const cwChartCanvas = ref(null);
const complianceChartCanvas = ref(null);
const armwandChartCanvas = ref(null);
const cwDistanceChartCanvas = ref(null);

let charts = {};

// Hjälpfunktioner för att generera data (dessa är korrekta)
const generateResonanceCurveData = (paramToVary, range) => {
const dataPoints = [];
const originalParams = JSON.parse(JSON.stringify(store.params));
for (const val of range) {
let simParams = { ...originalParams };
simParams[paramToVary] = val;

const m1 = simParams.m_headshell + simParams.m_pickup + simParams.m_screws;
const m2_tube = simParams.m_rear_assembly * (simParams.m_tube_percentage / 100.0);
const m3_fixed_cw = simParams.m_rear_assembly - m2_tube;
const numerator = (m1 * simParams.L1) + (m2_tube * simParams.L2) - (m3_fixed_cw * simParams.L3_fixed_cw) - (simParams.vtf * simParams.L1);

if (simParams.m4_adj_cw > 0) {
const L4_adj_cw = (numerator >= 0) ? numerator / simParams.m4_adj_cw : -1;
if (L4_adj_cw >= 0) {
dataPoints.push({ x: val, y: L4_adj_cw });
}
}
}
return dataPoints;
};

// Generisk funktion för att skapa en tom graf-struktur
const createChart = (canvasRef, config) => {
if (!canvasRef.value) return null;
const ctx = canvasRef.value.getContext('2d');
return new Chart(ctx, config);
};

// Funktion för att uppdatera alla grafer
const updateCharts = () => {
if (Object.keys(charts).length === 0 || !store.calculatedResults || store.calculatedResults.isUnbalanced) return;

const currentFreq = store.calculatedResults.F;
const currentCwDistance = store.calculatedResults.L4_adj_cw;

const chartUpdates = [
{ chart: charts.headshell, point: { x: store.params.m_headshell, y: currentFreq }, curveData: generateResonanceCurveData('m_headshell', Array.from({length: 231}, (_, i) => 2 + i * 0.1)) },
{ chart: charts.cw, point: { x: store.params.m4_adj_cw, y: currentFreq }, curveData: generateResonanceCurveData('m4_adj_cw', Array.from({length: 161}, (_, i) => 40 + i * 1)) },
{ chart: charts.compliance, point: { x: store.params.compliance, y: currentFreq }, curveData: generateResonanceCurveData('compliance', Array.from({length: 351}, (_, i) => 5 + i * 0.1)) },
{ chart: charts.armwand, point: { x: store.params.m_tube_percentage, y: currentFreq }, curveData: generateResonanceCurveData('m_tube_percentage', Array.from({length: 101}, (_, i) => i)) },
{ chart: charts.cwDistance, point: { x: store.params.m4_adj_cw, y: currentCwDistance }, curveData: generateCwDistanceCurveData(Array.from({length: 161}, (_, i) => 40 + i * 1)) },
];
for (const update of chartUpdates) {
if (update.chart) {
update.chart.data.datasets[0].data = update.curveData; // Blå kurva
update.chart.data.datasets[1].data = [update.point]; // Röd prick
update.chart.update('none');
}
}
};

onMounted(() => {
const commonDatasetConfig = [{
label: 'Theoretical Curve', data: [], borderColor: '#007bff', borderWidth: 2, fill: false, tension: 0.1, pointRadius: 0
}, {
label: 'Your Current Value', data: [], backgroundColor: 'red', borderColor: 'darkred', pointRadius: 6, type: 'scatter'
}];

const resonanceChartConfig = {
type: 'line', data: { datasets: JSON.parse(JSON.stringify(commonDatasetConfig)) },
options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' }, annotation: { annotations: {
idealZone: { type: 'box', yMin: 8, yMax: 11, backgroundColor: 'rgba(40, 167, 69, 0.15)', borderColor: 'rgba(40, 167, 69, 0.05)'},
warningZoneLower: { type: 'box', yMin: 7, yMax: 8, backgroundColor: 'rgba(255, 193, 7, 0.15)', borderColor: 'rgba(255, 193, 7, 0.05)'},
warningZoneUpper: { type: 'box', yMin: 11, yMax: 12, backgroundColor: 'rgba(255, 193, 7, 0.15)', borderColor: 'rgba(255, 193, 7, 0.05)'}
}}},
scales: { y: { min: 5, max: 15, ticks: { stepSize: 1 }, title: { display: true, text: 'Resonance Frequency (Hz)' } }, x: { grid: { color: '#e9ecef' } } }
};

const cwDistanceConfig = {
type: 'line', data: { datasets: JSON.parse(JSON.stringify(commonDatasetConfig)) },
options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: '5. Counterweight Distance vs. Mass', font: { size: 16 } }, legend: { position: 'top' }}, scales: { y: { beginAtZero: true, title: { display: true, text: 'Required Distance from Pivot (mm)'} }, x: { title: { display: true, text: 'Adjustable Counterweight Mass (g)'} } }}
};

charts.headshell = createChart(headshellChartCanvas, { ...JSON.parse(JSON.stringify(resonanceChartConfig)), options: { ...resonanceChartConfig.options, plugins: { ...resonanceChartConfig.options.plugins, title: { display: true, text: '1. Effect of Headshell Mass'}}, scales: { ...resonanceChartConfig.options.scales, x: { ...resonanceChartConfig.options.scales.x, title: { display: true, text: 'Headshell Mass (g)'}}}}});
charts.cw = createChart(cwChartCanvas, { ...JSON.parse(JSON.stringify(resonanceChartConfig)), options: { ...resonanceChartConfig.options.plugins, title: { display: true, text: '2. Effect of Adjustable Counterweight Mass'}}, scales: { ...resonanceChartConfig.options.scales, x: { ...resonanceChartConfig.options.scales.x, title: { display: true, text: 'Adjustable Counterweight Mass (g)'}}}}});
charts.compliance = createChart(complianceChartCanvas, { ...JSON.parse(JSON.stringify(resonanceChartConfig)), options: { ...resonanceChartConfig.options.plugins, title: { display: true, text: '3. Effect of Cartridge Compliance'}}, scales: { ...resonanceChartConfig.options.scales, x: { ...resonanceChartConfig.options.scales.x, title: { display: true, text: 'Cartridge Compliance (µm/mN)'}}}}});
charts.armwand = createChart(armwandChartCanvas, { ...JSON.parse(JSON.stringify(resonanceChartConfig)), options: { ...resonanceChartConfig.options.plugins, title: { display: true, text: '4. Effect of Armwand/Fixed CW Mass Distribution'}}, scales: { ...resonanceChartConfig.options.scales, x: { ...resonanceChartConfig.options.scales.x, title: { display: true, text: 'Armwand Percentage of Rear Mass (%)'}}}}});
charts.cwDistance = createChart(cwDistanceChartCanvas, cwDistanceConfig);

// Anropa updateCharts en gång efter att allt är initialiserat
setTimeout(updateCharts, 0);
});

watch(() => store.params, updateCharts, { deep: true });
</script>

<template>
<div class="charts-grid">
<div class="panel chart-container">
<canvas ref="headshellChartCanvas"></canvas>
</div>
<div class="panel chart-container">
<canvas ref="cwChartCanvas"></canvas>
</div>
<div class="panel chart-container">
<canvas ref="complianceChartCanvas"></canvas>
</div>
<div class="panel chart-container">
<canvas ref="armwandChartCanvas"></canvas>
</div>
<div class="panel chart-container">
<canvas ref="cwDistanceChartCanvas"></canvas>
</div>
</div>
</template>

<style scoped>
.charts-grid {
display: grid;
grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
gap: 2rem;
margin-top: 2rem;
}
.chart-container {
height: 350px;
padding: 1rem;
background-color: #fff;
border-radius: 6px;
border: 1px solid var(--border-color);
}
</style>


