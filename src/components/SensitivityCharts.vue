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

// --- Beräkningsfunktioner (Dessa är korrekta) ---
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
const Itot = (m1 * simParams.L1**2) + (m2_tube * simParams.L2**2) + (m3_fixed_cw * simParams.L3_fixed_cw**2) + (simParams.m4_adj_cw * L4_adj_cw**2);
const M_eff = Itot / (simParams.L1 ** 2);
const F = 1000 / (2 * Math.PI * Math.sqrt(Math.max(1, M_eff * simParams.compliance)));
dataPoints.push({ x: val, y: F });
}
}
}
return dataPoints;
};

const generateCwDistanceCurveData = (range) => {
const dataPoints = [];
const originalParams = JSON.parse(JSON.stringify(store.params));
for (const val of range) {
let simParams = { ...originalParams, m4_adj_cw: val };
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

// --- Uppdateringslogik ---
const updateAllCharts = () => {
if (Object.keys(charts).length === 0 || !store.calculatedResults || store.calculatedResults.isUnbalanced) return;
const { F: currentFreq, L4_adj_cw: currentCwDistance } = store.calculatedResults;

// Funktion för att uppdatera en enskild graf
const updateChartData = (chart, point, curveData) => {
if (chart) {
chart.data.datasets[0].data = curveData; // Blå kurva
chart.data.datasets[1].data = [point]; // Röd prick
chart.update('none');
}
};

updateChartData(charts.headshell, { x: store.params.m_headshell, y: currentFreq }, generateResonanceCurveData('m_headshell', Array.from({length: 231}, (_, i) => 2 + i * 0.1)));
updateChartData(charts.cw, { x: store.params.m4_adj_cw, y: currentFreq }, generateResonanceCurveData('m4_adj_cw', Array.from({length: 161}, (_, i) => 40 + i * 1)));
updateChartData(charts.compliance, { x: store.params.compliance, y: currentFreq }, generateResonanceCurveData('compliance', Array.from({length: 351}, (_, i) => 5 + i * 0.1)));
updateChartData(charts.armwand, { x: store.params.m_tube_percentage, y: currentFreq }, generateResonanceCurveData('m_tube_percentage', Array.from({length: 101}, (_, i) => i)));
updateChartData(charts.cwDistance, { x: store.params.m4_adj_cw, y: currentCwDistance }, generateCwDistanceCurveData(Array.from({length: 161}, (_, i) => 40 + i * 1)));
};


// --- Initialisering ---
onMounted(() => {
// Gemensam konfiguration för resonansgraferna
const resonanceChartOptions = {
responsive: true, maintainAspectRatio: false,
plugins: { legend: { position: 'top' }, annotation: { annotations: {
idealZone: { type: 'box', yMin: 8, yMax: 11, backgroundColor: 'rgba(40, 167, 69, 0.15)', borderColor: 'rgba(40, 167, 69, 0.05)'},
warningZoneLower: { type: 'box', yMin: 7, yMax: 8, backgroundColor: 'rgba(255, 193, 7, 0.15)', borderColor: 'rgba(255, 193, 7, 0.05)'},
warningZoneUpper: { type: 'box', yMin: 11, yMax: 12, backgroundColor: 'rgba(255, 193, 7, 0.15)', borderColor: 'rgba(255, 193, 7, 0.05)'}
}}},
scales: { y: { min: 5, max: 15, ticks: { stepSize: 1 }, title: { display: true, text: 'Resonance Frequency (Hz)' } }, x: { grid: { color: '#e9ecef' } } }
};
// Hjälpfunktion för att skapa en resonansgraf
const createResonanceChart = (canvasRef, title, xLabel) => {
const datasets = [{ label: 'Theoretical Curve', data: [], borderColor: '#007bff', borderWidth: 2, fill: false, tension: 0.1, pointRadius: 0 }, { label: 'Your Current Value', data: [], backgroundColor: 'red', borderColor: 'darkred', pointRadius: 6, type: 'scatter' }];
const config = JSON.parse(JSON.stringify(resonanceChartOptions));
config.plugins.title = { display: true, text: title, font: { size: 16 } };
config.scales.x.title = { display: true, text: xLabel };
return new Chart(canvasRef.value.getContext('2d'), { type: 'line', data: { datasets }, options: config });
};

charts.headshell = createResonanceChart(headshellChartCanvas, '1. Effect of Headshell Mass', 'Headshell Mass (g)');
charts.cw = createResonanceChart(cwChartCanvas, '2. Effect of Adjustable Counterweight Mass', 'Adjustable Counterweight Mass (g)');
charts.compliance = createResonanceChart(complianceChartCanvas, '3. Effect of Cartridge Compliance', 'Cartridge Compliance (µm/mN)');
charts.armwand = createResonanceChart(armwandChartCanvas, '4. Effect of Armwand/Fixed CW Mass Distribution', 'Armwand Percentage of Rear Mass (%)');

// Skapa motviktsgrafen
charts.cwDistance = new Chart(cwDistanceChartCanvas.value.getContext('2d'), {
type: 'line',
data: { datasets: [{ label: 'Theoretical Curve', data: [], borderColor: '#007bff', borderWidth: 2, fill: false, tension: 0.1, pointRadius: 0 }, { label: 'Your Current Value', data: [], backgroundColor: 'red', borderColor: 'darkred', pointRadius: 6, type: 'scatter' }] },
options: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: '5. Counterweight Distance vs. Mass', font: { size: 16 } }, legend: { position: 'top' }}, scales: { y: { beginAtZero: true, title: { display: true, text: 'Required Distance from Pivot (mm)'} }, x: { title: { display: true, text: 'Adjustable Counterweight Mass (g)'} } }}
});

setTimeout(updateAllCharts, 100); // Liten fördröjning för säkerhets skull
});

// Lyssna på ändringar och uppdatera
watch(() => store.params, updateAllCharts, { deep: true });
</script>

<template>
<div class="charts-grid">
<div class="panel chart-container"><canvas ref="headshellChartCanvas"></canvas></div>
<div class="panel chart-container"><canvas ref="cwChartCanvas"></canvas></div>
<div class="panel chart-container"><canvas ref="complianceChartCanvas"></canvas></div>
<div class="panel chart-container"><canvas ref="armwandChartCanvas"></canvas></div>
<div class="panel chart-container"><canvas ref="cwDistanceChartCanvas"></canvas></div>
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

