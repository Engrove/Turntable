<script setup>
// ... (samma kod som tidigare för att rendera grafer) ...
// Denna kod är komplex så vi behåller den som den är.
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

let charts = {};

const generateCurveData = (paramToVary, range) => {
    const dataPoints = [];
    const originalParams = JSON.parse(JSON.stringify(store.params));

    for (const val of range) {
        let simParams = { ...originalParams };
        
        if (paramToVary === 'm_tube_percentage') {
            simParams.m2_tube = simParams.m_rear_assembly * (val / 100.0);
            simParams.m3_fixed_cw = simParams.m_rear_assembly - simParams.m2_tube;
        } else {
            simParams[paramToVary] = val;
        }
        
        const m1 = simParams.m_headshell + simParams.m_pickup + simParams.m_screws;
        const m2_tube = paramToVary === 'm_tube_percentage' ? simParams.m2_tube : store.m2_tube;
        const m3_fixed_cw = paramToVary === 'm_tube_percentage' ? simParams.m3_fixed_cw : store.m3_fixed_cw;
        
        const numerator = (m1 * simParams.L1) + (m2_tube * simParams.L2) - (m3_fixed_cw * simParams.L3_fixed_cw) - (simParams.vtf * simParams.L1);
        
        if (simParams.m4_adj_cw > 0) {
            const L4_adj_cw = (numerator >= 0) ? numerator / simParams.m4_adj_cw : -1;
            if (L4_adj_cw >= 0) {
                const I1 = m1 * (simParams.L1 ** 2);
                const I2 = m2_tube * (simParams.L2 ** 2);
                const I3 = m3_fixed_cw * (simParams.L3_fixed_cw ** 2);
                const I4 = simParams.m4_adj_cw * (L4_adj_cw ** 2);
                const Itot = I1 + I2 + I3 + I4;
                const M_eff = Itot / (simParams.L1 ** 2);
                const F = 1000 / (2 * Math.PI * Math.sqrt(Math.max(1, M_eff * simParams.compliance)));
                dataPoints.push({ x: val, y: F });
            } else {
                 dataPoints.push({ x: val, y: NaN });
            }
        }
    }
    return dataPoints;
};

const createChart = (canvasRef, title, xLabel, data) => {
    if (!canvasRef.value) return null;
    const ctx = canvasRef.value.getContext('2d');
    return new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{ label: 'Theoretical Curve', data: data, borderColor: '#007bff', borderWidth: 2, fill: false, tension: 0.1, pointRadius: 0 }, 
                       { label: 'Your Current Value', data: [], backgroundColor: 'red', borderColor: 'darkred', pointRadius: 6, type: 'scatter' }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { title: { display: true, text: title, font: { size: 16 } }, legend: { position: 'top' },
                annotation: { annotations: {
                    idealZone: { type: 'box', yMin: 8, yMax: 11, backgroundColor: 'rgba(40, 167, 69, 0.15)', borderColor: 'rgba(40, 167, 69, 0.05)' },
                    warningZoneLower: { type: 'box', yMin: 7, yMax: 8, backgroundColor: 'rgba(255, 193, 7, 0.15)', borderColor: 'rgba(255, 193, 7, 0.05)' },
                    warningZoneUpper: { type: 'box', yMin: 11, yMax: 12, backgroundColor: 'rgba(255, 193, 7, 0.15)', borderColor: 'rgba(255, 193, 7, 0.05)' }
                }}
            },
            scales: { x: { type: 'linear', title: { display: true, text: xLabel }, grid: { color: '#e9ecef' } },
                      y: { type: 'linear', title: { display: true, text: 'Resonance Frequency (Hz)' }, min: 5, max: 15, ticks: { stepSize: 1 }, grid: { color: '#e9ecef' } }
            },
        }
    });
};

const updateCharts = () => {
    if (Object.keys(charts).length === 0 || !store.calculatedResults || store.calculatedResults.isUnbalanced) {
      Object.values(charts).forEach(chart => { if (chart) chart.data.datasets[1].data = []; chart.update('none'); });
      return;
    }
    const currentFreq = store.calculatedResults.F;
    charts.headshell.data.datasets[1].data = [{ x: store.params.m_headshell, y: currentFreq }];
    charts.cw.data.datasets[1].data = [{ x: store.params.m4_adj_cw, y: currentFreq }];
    charts.compliance.data.datasets[1].data = [{ x: store.params.compliance, y: currentFreq }];
    charts.armwand.data.datasets[1].data = [{ x: store.params.m_tube_percentage, y: currentFreq }];

    charts.headshell.data.datasets[0].data = generateCurveData('m_headshell', Array.from({length: 231}, (_, i) => 2 + i * 0.1));
    charts.cw.data.datasets[0].data = generateCurveData('m4_adj_cw', Array.from({length: 161}, (_, i) => 40 + i * 1));
    charts.compliance.data.datasets[0].data = generateCurveData('compliance', Array.from({length: 351}, (_, i) => 5 + i * 0.1));
    charts.armwand.data.datasets[0].data = generateCurveData('m_tube_percentage', Array.from({length: 101}, (_, i) => i));

    Object.values(charts).forEach(chart => chart.update('none'));
};

onMounted(() => {
    charts.headshell = createChart(headshellChartCanvas, '1. Effect of Headshell Mass', 'Headshell Mass (g)', []);
    charts.cw = createChart(cwChartCanvas, '2. Effect of Adjustable CW Mass', 'Adjustable Counterweight Mass (g)', []);
    charts.compliance = createChart(complianceChartCanvas, '3. Effect of Cartridge Compliance', 'Cartridge Compliance (µm/mN)', []);
    charts.armwand = createChart(armwandChartCanvas, '4. Effect of Armwand Mass %', 'Armwand Percentage of Rear Mass (%)', []);
    updateCharts();
});

watch(() => store.params, updateCharts, { deep: true });
</script>
<template>
  <div class="charts-grid">
    <div class="panel chart-container"><canvas ref="headshellChartCanvas"></canvas></div>
    <div class="panel chart-container"><canvas ref="cwChartCanvas"></canvas></div>
    <div class="panel chart-container"><canvas ref="complianceChartCanvas"></canvas></div>
    <div class="panel chart-container"><canvas ref="armwandChartCanvas"></canvas></div>
  </div>
</template>
<style scoped>
.charts-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:2rem;margin-top:2rem}.chart-container{height:350px;padding:1rem;background-color:#fff;border-radius:6px}
</style>
