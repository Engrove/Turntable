<script setup>
import { onMounted, ref, watchEffect } from 'vue' // <-- Importera watchEffect
import { useTonearmStore } from '@/store/tonearmStore.js'
import { Chart } from 'chart.js/auto';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(annotationPlugin);

const store = useTonearmStore();

// Referenser till alla canvas-element
const headshellChartCanvas = ref(null);
const cwChartCanvas = ref(null);
const complianceChartCanvas = ref(null);
const armwandChartCanvas = ref(null);
const cwDistanceChartCanvas = ref(null);

let charts = {};
const chartsReady = ref(false); // Flagga för att signalera när graferna är skapade

// Hjälpfunktion för att generera data för resonansfrekvens
const generateResonanceCurveData = (paramToVary, range) => {
    const dataPoints = [];
    const originalParams = JSON.parse(JSON.stringify(store.params));

    for (const val of range) {
        let simParams = { ...originalParams };
        
        if (paramToVary === 'm_tube_percentage') {
            simParams.m_tube_percentage = val;
        } else {
            simParams[paramToVary] = val;
        }

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

// Hjälpfunktion för motviktsdistans-kurvan
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

const createChart = (canvasRef, options) => {
    if (!canvasRef.value) return;
    const ctx = canvasRef.value.getContext('2d');
    // Förstör en eventuell befintlig graf på samma canvas (bra vid hot-reloading)
    if (Chart.getChart(ctx)) {
      Chart.getChart(ctx).destroy();
    }
    return new Chart(ctx, { type: 'line', data: { datasets: options.datasets }, options: options.config });
};

const updateCharts = () => {
    if (Object.keys(charts).length === 0) return;

    const currentFreq = store.calculatedResults.F;
    const currentCwDistance = store.calculatedResults.L4_adj_cw;

    // Uppdatera punkter och kurvor för resonansgraferna
    charts.headshell.data.datasets[1].data = [{ x: store.params.m_headshell, y: currentFreq }];
    charts.cw.data.datasets[1].data = [{ x: store.params.m4_adj_cw, y: currentFreq }];
    charts.compliance.data.datasets[1].data = [{ x: store.params.compliance, y: currentFreq }];
    charts.armwand.data.datasets[1].data = [{ x: store.params.m_tube_percentage, y: currentFreq }];
    
    charts.headshell.data.datasets[0].data = generateResonanceCurveData('m_headshell', Array.from({length: 231}, (_, i) => 2 + i * 0.1));
    charts.cw.data.datasets[0].data = generateResonanceCurveData('m4_adj_cw', Array.from({length: 161}, (_, i) => 40 + i * 1));
    charts.compliance.data.datasets[0].data = generateResonanceCurveData('compliance', Array.from({length: 351}, (_, i) => 5 + i * 0.1));
    charts.armwand.data.datasets[0].data = generateResonanceCurveData('m_tube_percentage', Array.from({length: 101}, (_, i) => i));

    // Uppdatera punkt och kurva för motviktsgrafen
    charts.cwDistance.data.datasets[1].data = [{ x: store.params.m4_adj_cw, y: currentCwDistance }];
    charts.cwDistance.data.datasets[0].data = generateCwDistanceCurveData(Array.from({length: 161}, (_, i) => 40 + i * 1));

    Object.values(charts).forEach(chart => chart.update('none'));
};

onMounted(() => {
    const commonDatasetConfig = [{
        label: 'Theoretical Curve', data: [], borderColor: '#007bff', borderWidth: 2, fill: false, tension: 0.1, pointRadius: 0
    }, {
        label: 'Your Current Value', data: [], backgroundColor: 'red', borderColor: 'darkred', pointRadius: 6, type: 'scatter'
    }];
    
    const resonanceChartOptions = {
        responsive: true, maintainAspectRatio: false,
        plugins: { title: { display: true, font: { size: 16 } }, legend: { position: 'top' }, annotation: { annotations: {
            idealZone: { type: 'box', yMin: 8, yMax: 11, backgroundColor: 'rgba(40, 167, 69, 0.15)', borderColor: 'rgba(40, 167, 69, 0.05)'},
            warningZoneLower: { type: 'box', yMin: 7, yMax: 8, backgroundColor: 'rgba(255, 193, 7, 0.15)', borderColor: 'rgba(255, 193, 7, 0.05)'},
            warningZoneUpper: { type: 'box', yMin: 11, yMax: 12, backgroundColor: 'rgba(255, 193, 7, 0.15)', borderColor: 'rgba(255, 193, 7, 0.05)'}
        }}},
        scales: { y: { min: 5, max: 15, ticks: { stepSize: 1 }, title: { display: true, text: 'Resonance Frequency (Hz)' } }, x: { grid: { color: '#e9ecef' } } }
    };

    charts.headshell = createChart(headshellChartCanvas, { datasets: commonDatasetConfig, config: { ...resonanceChartOptions, plugins: { ...resonanceChartOptions.plugins, title: { ...resonanceChartOptions.plugins.title, text: '1. Effect of Headshell Mass'}}, scales: { ...resonanceChartOptions.scales, x: { ...resonanceChartOptions.scales.x, title: { display: true, text: 'Headshell Mass (g)'}}}}});
    charts.cw = createChart(cwChartCanvas, { datasets: commonDatasetConfig, config: { ...resonanceChartOptions, plugins: { ...resonanceChartOptions.plugins, title: { ...resonanceChartOptions.plugins.title, text: '2. Effect of Adjustable Counterweight Mass'}}, scales: { ...resonanceChartOptions.scales, x: { ...resonanceChartOptions.scales.x, title: { display: true, text: 'Adjustable Counterweight Mass (g)'}}}}});
    charts.compliance = createChart(complianceChartCanvas, { datasets: commonDatasetConfig, config: { ...resonanceChartOptions, plugins: { ...resonanceChartOptions.plugins, title: { ...resonanceChartOptions.plugins.title, text: '3. Effect of Cartridge Compliance'}}, scales: { ...resonanceChartOptions.scales, x: { ...resonanceChartOptions.scales.x, title: { display: true, text: 'Cartridge Compliance (µm/mN)'}}}}});
    charts.armwand = createChart(armwandChartCanvas, { datasets: commonDatasetConfig, config: { ...resonanceChartOptions, plugins: { ...resonanceChartOptions.plugins, title: { ...resonanceChartOptions.plugins.title, text: '4. Effect of Armwand/Fixed CW Mass Distribution'}}, scales: { ...resonanceChartOptions.scales, x: { ...resonanceChartOptions.scales.x, title: { display: true, text: 'Armwand Percentage of Rear Mass (%)'}}}}});
    
    charts.cwDistance = createChart(cwDistanceChartCanvas, { datasets: commonDatasetConfig, config: { responsive: true, maintainAspectRatio: false, plugins: { title: { display: true, text: '5. Counterweight Distance vs. Mass', font: { size: 16 } }, legend: { position: 'top' }}, scales: { y: { min: 0, title: { display: true, text: 'Required Distance from Pivot (mm)'} }, x: { title: { display: true, text: 'Adjustable Counterweight Mass (g)'} } }}});
    
    // När alla grafer har skapats, sätt flaggan till true
    chartsReady.value = true;
});

// DENNA ERSÄTTER DEN GAMLA `watch`-FUNKTIONEN
// `watchEffect` körs när `chartsReady` blir true, och körs sedan om
// varje gång `store.calculatedResults` ändras.
watchEffect(() => {
    if (chartsReady.value && store.calculatedResults && !store.calculatedResults.isUnbalanced) {
        updateCharts();
    }
});

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
}
</style>
