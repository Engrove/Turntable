<script setup>
import { onMounted, ref, watch } from 'vue'
import { useTonearmStore } from '@/store/tonearmStore.js'
import { Chart } from 'chart.js/auto';

const store = useTonearmStore();

// Referenser till våra canvas-element i templaten
const headshellChartCanvas = ref(null);
const cwChartCanvas = ref(null);
const complianceChartCanvas = ref(null);
const armwandChartCanvas = ref(null);

// Håller våra Chart-instanser
let charts = {};

// Hjälpfunktion för att generera data för en kurva
const generateCurveData = (paramToVary, range) => {
    const dataPoints = [];
    const originalParams = JSON.parse(JSON.stringify(store.params)); // Djup kopia

    for (const val of range) {
        let simParams = { ...originalParams, [paramToVary]: val };

        // Simulera beräkningen
        const m1 = simParams.m_headshell + simParams.m_pickup + simParams.m_screws;
        const m2_tube = simParams.m_rear_assembly * (simParams.m_tube_percentage / 100.0);
        const m3_fixed_cw = simParams.m_rear_assembly - m2_tube;
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
            }
        }
    }
    return dataPoints;
};

// Generisk funktion för att skapa en graf
const createChart = (canvasRef, title, xLabel, data) => {
    const ctx = canvasRef.value.getContext('2d');
    
    // Gradient-bakgrund för "ideal range"
    const idealGradient = ctx.createLinearGradient(0, 0, 0, 300);
    idealGradient.addColorStop(0, '#fff3cd'); // Warning (top)
    idealGradient.addColorStop(0.3, '#d4edda'); // Ideal (middle)
    idealGradient.addColorStop(0.7, '#d4edda'); // Ideal (middle)
    idealGradient.addColorStop(1, '#fff3cd'); // Warning (bottom)


    return new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Theoretical Curve',
                data: data,
                borderColor: '#007bff',
                fill: false,
                tension: 0.1,
                pointRadius: 0
            }, {
                label: 'Your Current Value',
                data: [], // Uppdateras dynamiskt
                backgroundColor: 'red',
                pointRadius: 6,
                type: 'scatter'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: { display: true, text: title },
            },
            scales: {
                x: {
                    type: 'linear',
                    title: { display: true, text: xLabel }
                },
                y: {
                    type: 'linear',
                    title: { display: true, text: 'Resonance Frequency (Hz)' },
                    min: 5,
                    max: 15,
                    ticks: { stepSize: 1 }
                }
            },
            elements: {
                line: {
                    backgroundColor: idealGradient
                }
            }
        }
    });
};

const updateCharts = () => {
    if (Object.keys(charts).length === 0) return; // Kör ej om graferna inte är skapade

    // Uppdatera "Current Value"-punkten
    charts.headshell.data.datasets[1].data = [{ x: store.params.m_headshell, y: store.calculatedResults.F }];
    charts.cw.data.datasets[1].data = [{ x: store.params.m4_adj_cw, y: store.calculatedResults.F }];
    charts.compliance.data.datasets[1].data = [{ x: store.params.compliance, y: store.calculatedResults.F }];
    // charts.armwand.data.datasets[1].data = [{ x: store.params.m_tube_percentage, y: store.calculatedResults.F }];

    // Uppdatera kurvorna
    charts.headshell.data.datasets[0].data = generateCurveData('m_headshell', Array.from({length: 231}, (_, i) => 2 + i * 0.1));
    charts.cw.data.datasets[0].data = generateCurveData('m4_adj_cw', Array.from({length: 161}, (_, i) => 40 + i * 1));
    charts.compliance.data.datasets[0].data = generateCurveData('compliance', Array.from({length: 351}, (_, i) => 5 + i * 0.1));

    // Rendera om graferna
    Object.values(charts).forEach(chart => chart.update());
};

// Skapa graferna när komponenten är monterad
onMounted(() => {
    charts.headshell = createChart(headshellChartCanvas, '1. Effect of Headshell Mass', 'Headshell Mass (g)', []);
    charts.cw = createChart(cwChartCanvas, '2. Effect of Adjustable Counterweight Mass', 'Adjustable Counterweight Mass (g)', []);
    charts.compliance = createChart(complianceChartCanvas, '3. Effect of Cartridge Compliance', 'Cartridge Compliance (µm/mN)', []);
    // charts.armwand = createChart(armwandChartCanvas, '4. Effect of Armwand/Fixed CW Mass Distribution', 'Armwand Percentage of Rear Assembly (%)', []);
    updateCharts(); // Kör en första uppdatering
});

// Lyssna på ändringar i storen och uppdatera graferna
watch(() => store.calculatedResults.F, () => {
    updateCharts();
}, { deep: true });

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
    <!-- <div class="panel chart-container">
      <canvas ref="armwandChartCanvas"></canvas>
    </div> -->
  </div>
</template>

<style scoped>
.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}
.chart-container {
    height: 400px;
    padding: 1rem;
}
</style>
