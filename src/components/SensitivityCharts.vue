<script setup>
import { onMounted, ref, watch } from 'vue';
import { useTonearmStore } from '@/store/tonearmStore.js';
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

// En enda reaktiv variabel för att hålla alla grafer
const charts = ref({});

// Hjälpfunktion för att generera data för resonansfrekvens
const generateResonanceCurveData = (paramToVary, range) => {
    store.addDebugMessage('SensitivityCharts:generateResonanceCurveData', `Generating data for ${paramToVary}`);
    const dataPoints = [];
    const originalParams = JSON.parse(JSON.stringify(store.params)); // Använd JSON.parse/stringify för djup kopia

    for (const val of range) {
        let simParams = { ...originalParams }; // Skapa en kopia för varje simuleringssteg
        simParams[paramToVary] = val;

        // Kopierad beräkningslogik från storen
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
                if (!isNaN(F) && isFinite(F)) {
                    dataPoints.push({ x: val, y: F });
                }
            }
        }
    }
    store.addDebugMessage('SensitivityCharts:generateResonanceCurveData', `Generated ${paramToVary} data points (${dataPoints.length}):`, dataPoints.slice(0, 5));
    return dataPoints;
};

// Hjälpfunktion för motviktsdistans-kurvan
const generateCwDistanceCurveData = (range) => {
    store.addDebugMessage('SensitivityCharts:generateCwDistanceCurveData', `Generating data for Counterweight Distance`);
    const dataPoints = [];
    const originalParams = JSON.parse(JSON.stringify(store.params));
    
    for (const val of range) {
        let simParams = { ...originalParams, m4_adj_cw: val };

        // Kopierad beräkningslogik från storen
        const m1 = simParams.m_headshell + simParams.m_pickup + simParams.m_screws;
        const m2_tube = simParams.m_rear_assembly * (simParams.m_tube_percentage / 100.0);
        const m3_fixed_cw = simParams.m_rear_assembly - m2_tube;
        
        const numerator = (m1 * simParams.L1) + (m2_tube * simParams.L2) - (m3_fixed_cw * simParams.L3_fixed_cw) - (simParams.vtf * simParams.L1);
        
        if (simParams.m4_adj_cw > 0) {
            const L4_adj_cw = (numerator >= 0) ? numerator / simParams.m4_adj_cw : -1;
            if (L4_adj_cw >= 0 && !isNaN(L4_adj_cw) && isFinite(L4_adj_cw)) {
                dataPoints.push({ x: val, y: L4_adj_cw });
            }
        }
    }
    store.addDebugMessage('SensitivityCharts:generateCwDistanceCurveData', `Generated Counterweight Distance data points (${dataPoints.length}):`, dataPoints.slice(0, 5));
    return dataPoints;
};

const createChart = (canvasRef, options) => {
    if (!canvasRef.value) {
        store.addDebugMessage('SensitivityCharts:createChart', 'Canvas reference is null for chart creation.', { canvasRef });
        return null;
    }
    const ctx = canvasRef.value.getContext('2d');
    if (Chart.getChart(ctx)) {
      Chart.getChart(ctx).destroy();
    }
    const newChart = new Chart(ctx, options);
    store.addDebugMessage('SensitivityCharts:createChart', `Chart created for ${options.options.plugins.title.text}`);
    return newChart;
};

// Denna funktion uppdaterar grafdata och ritar om graferna
const updateCharts = () => {
    // Vänta tills alla grafer har initierats i onMounted
    if (Object.keys(charts.value).length === 0) {
        store.addDebugMessage('SensitivityCharts:updateCharts', 'Charts object is empty. Skipping update.');
        return;
    }
    // Hoppa över uppdatering om resultaten är obalanserade eller ännu inte beräknade
    if (!store.calculatedResults || store.calculatedResults.isUnbalanced) {
        store.addDebugMessage('SensitivityCharts:updateCharts', 'CalculatedResults is unbalanced or null. Skipping update.', { calculatedResults: store.calculatedResults });
        return;
    }

    store.addDebugMessage('SensitivityCharts:updateCharts', 'Attempting to update chart data.', {
      currentFreq: store.calculatedResults.F,
      currentCwDistance: store.calculatedResults.L4_adj_cw,
      params: store.params
    });

    const currentFreq = store.calculatedResults.F;
    const currentCwDistance = store.calculatedResults.L4_adj_cw;
    
    // Uppdatera punkter (röda pricken)
    charts.value.headshell.data.datasets[1].data = [{ x: store.params.m_headshell, y: currentFreq }];
    charts.value.cw.data.datasets[1].data = [{ x: store.params.m4_adj_cw, y: currentFreq }];
    charts.value.compliance.data.datasets[1].data = [{ x: store.params.compliance, y: currentFreq }];
    charts.value.armwand.data.datasets[1].data = [{ x: store.params.m_tube_percentage, y: currentFreq }];
    charts.value.cwDistance.data.datasets[1].data = [{ x: store.params.m4_adj_cw, y: currentCwDistance }];

    // Uppdatera kurvorna
    charts.value.headshell.data.datasets[0].data = generateResonanceCurveData('m_headshell', Array.from({length: 231}, (_, i) => 2 + i * 0.1));
    charts.value.cw.data.datasets[0].data = generateResonanceCurveData('m4_adj_cw', Array.from({length: 161}, (_, i) => 40 + i * 1));
    charts.value.compliance.data.datasets[0].data = generateResonanceCurveData('compliance', Array.from({length: 351}, (_, i) => 5 + i * 0.1));
    charts.value.armwand.data.datasets[0].data = generateResonanceCurveData('m_tube_percentage', Array.from({length: 101}, (_, i) => i));
    charts.value.cwDistance.data.datasets[0].data = generateCwDistanceCurveData(Array.from({length: 161}, (_, i) => 40 + i * 1));
    
    // Anropa update() på alla grafer för att rita om dem
    Object.values(charts.value).forEach(chart => {
        if (chart) chart.update('none');
    });
    store.addDebugMessage('SensitivityCharts:updateCharts', 'Charts update completed.');
};

// onMounted körs när DOM-elementen är tillgängliga och canvas-elementen finns
onMounted(() => {
    store.addDebugMessage('SensitivityCharts', 'Component mounted. Initializing chart instances...');
    const commonDatasetConfig = () => ([{ // Funktion för att skapa en ny array varje gång
        label: 'Theoretical Curve', data: [], borderColor: '#007bff', borderWidth: 2, fill: false, tension: 0.1, pointRadius: 0
    }, {
        label: 'Your Current Value', data: [], backgroundColor: 'red', borderColor: 'darkred', pointRadius: 6, type: 'scatter'
    }]);
    
    const resonanceChartOptions = (title, xLabel) => ({
      type: 'line',
      data: { datasets: commonDatasetConfig() }, // Ny data-objekt
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { title: { display: true, text: title, font: { size: 16 } }, legend: { position: 'top' }, annotation: { annotations: {
            idealZone: { type: 'box', yMin: 8, yMax: 11, backgroundColor: 'rgba(40, 167, 69, 0.15)', borderColor: 'rgba(40, 167, 69, 0.05)'},
            warningZoneLower: { type: 'box', yMin: 7, yMax: 8, backgroundColor: 'rgba(255, 193, 7, 0.15)', borderColor: 'rgba(255, 193, 7, 0.05)'},
            warningZoneUpper: { type: 'box', yMin: 11, yMax: 12, backgroundColor: 'rgba(255, 193, 7, 0.15)', borderColor: 'rgba(255, 193, 7, 0.05)'}
        }}},
        scales: { y: { min: 5, max: 17, ticks: { stepSize: 1 }, title: { display: true, text: 'Resonance Frequency (Hz)' } }, x: { title: { display: true, text: xLabel }, grid: { color: '#e9ecef' } } }
    });

    const cwDistanceChartOptions = {
        type: 'line',
        data: { datasets: commonDatasetConfig() }, // Ny data-objekt
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { title: { display: true, text: '5. Counterweight Distance vs. Mass', font: { size: 16 } }, legend: { position: 'top' }},
            scales: { y: { min: 0, title: { display: true, text: 'Required Distance from Pivot (mm)'} }, x: { title: { display: true, text: 'Adjustable Counterweight Mass (g)'} } }
        }
    };

    charts.value = {
        headshell: createChart(headshellChartCanvas, resonanceChartOptions('1. Effect of Headshell Mass', 'Headshell Mass (g)')),
        cw: createChart(cwChartCanvas, resonanceChartOptions('2. Effect of Adjustable Counterweight Mass', 'Adjustable Counterweight Mass (g)')),
        compliance: createChart(complianceChartCanvas, resonanceChartOptions('3. Effect of Cartridge Compliance', 'Cartridge Compliance (µm/mN)')),
        armwand: createChart(armwandChartCanvas, resonanceChartOptions('4. Effect of Armwand/Fixed CW Mass Distribution', 'Armwand Percentage of Rear Mass (%)')),
        cwDistance: createChart(cwDistanceChartCanvas, cwDistanceChartOptions)
    };
    store.addDebugMessage('SensitivityCharts', 'All chart instances initialized and stored.');
});

// Watcher som reagerar på ändringar i store.params och anropar updateCharts
// 'immediate: true' säkerställer att den körs vid komponentladdning ELLER när store.params är redo
watch(() => store.params, () => {
    store.addDebugMessage('SensitivityCharts:watch', 'store.params changed or immediate watch triggered. Calling updateCharts().');
    updateCharts();
}, { deep: true, immediate: true });

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
