<script setup>
import { onMounted, ref, watch } from 'vue';
import { useTonearmStore } from '@/store/tonearmStore.js';
import { Chart } from 'chart.js/auto';

const store = useTonearmStore();
const chartCanvas = ref(null);
let chartInstance = null;

const generateData = () => {
    const dataPoints = [];
    const originalParams = JSON.parse(JSON.stringify(store.params));
    const range = Array.from({ length: 161 }, (_, i) => 40 + i * 1);

    for (const m4_val of range) {
        let simParams = { ...originalParams, m4_adj_cw: m4_val };
        const m1 = simParams.m_headshell + simParams.m_pickup + simParams.m_screws;
        const m2_tube = simParams.m_rear_assembly * (simParams.m_tube_percentage / 100.0);
        const m3_fixed_cw = simParams.m_rear_assembly - m2_tube;
        const numerator = (m1 * simParams.L1) + (m2_tube * simParams.L2) - (m3_fixed_cw * simParams.L3_fixed_cw) - (simParams.vtf * simParams.L1);
        if (m4_val > 0) {
            const L4_adj_cw = (numerator >= 0) ? numerator / m4_val : NaN;
            dataPoints.push({ x: m4_val, y: L4_adj_cw });
        }
    }
    return dataPoints;
};

const updateChart = () => {
    if (!chartInstance) return;
    chartInstance.data.datasets[0].data = generateData();
    const currentL4 = store.calculatedResults.isUnbalanced ? NaN : store.calculatedResults.L4_adj_cw;
    chartInstance.data.datasets[1].data = [{ x: store.params.m4_adj_cw, y: currentL4 }];
    chartInstance.update('none');
};

onMounted(() => {
    const ctx = chartCanvas.value.getContext('2d');
    chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [
                { label: 'Required Distance', data: [], borderColor: '#27ae60', borderWidth: 2, pointRadius: 0 },
                { label: 'Your Current Value', data: [], backgroundColor: '#c0392b', pointRadius: 6, type: 'scatter' }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { title: { display: true, text: 'Counterweight Mass vs. Required Distance', font: { size: 16 } } },
            scales: {
                x: { title: { display: true, text: 'Adjustable Counterweight Mass (g)' }, min: 40, max: 200 },
                y: { title: { display: true, text: 'Distance from Pivot (mm)' }, min: 0 }
            }
        }
    });
    updateChart();
});

watch(() => store.params, updateChart, { deep: true });
</script>

<template>
  <div class="panel chart-container">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<style scoped>
.chart-container{height:400px;padding:1rem;background-color:#fff;border-radius:6px;margin-top:2rem}
</style>
