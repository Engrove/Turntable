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

let charts = {};

const generateCurveData = (paramToVary, range) => {
    const dataPoints = [];
    // Create a deep copy of the current store parameters to use as a base for simulation
    // This ensures we don't modify the actual store state during simulation
    const originalParams = JSON.parse(JSON.stringify(store.params));

    for (const val of range) {
        let simParams = { ...originalParams }; // Create a new object for each simulation point

        // Apply the varied parameter to the simulation parameters
        simParams[paramToVary] = val;

        // --- Crucial Fix: Always recalculate derived masses for each simulation point ---
        // This ensures m2_tube and m3_fixed_cw are consistent with the current simParams
        const m1 = simParams.m_headshell + simParams.m_pickup + simParams.m_screws;
        const m2_tube = simParams.m_rear_assembly * (simParams.m_tube_percentage / 100.0);
        const m3_fixed_cw = simParams.m_rear_assembly - m2_tube;

        // Check for valid adjustable counterweight mass to avoid division by zero
        if (simParams.m4_adj_cw <= 0) {
            dataPoints.push({ x: val, y: NaN }); // Cannot balance if CW mass is zero or negative
            continue;
        }

        // Calculate L4_adj_cw (Adjustable Counterweight Distance)
        const numerator = (m1 * simParams.L1) + (m2_tube * simParams.L2) - (m3_fixed_cw * simParams.L3_fixed_cw) - (simParams.vtf * simParams.L1);
        const L4_adj_cw = (numerator >= 0) ? numerator / simParams.m4_adj_cw : -1;

        if (L4_adj_cw < 0) {
            // If L4_adj_cw is negative, it means the arm cannot be balanced with the current parameters
            // In this case, the system is "unbalanced", and we should not calculate a frequency.
            dataPoints.push({ x: val, y: NaN });
        } else {
            // Calculate Moment of Inertia and Effective Mass
            const I1 = m1 * (simParams.L1 ** 2);
            const I2 = m2_tube * (simParams.L2 ** 2);
            const I3 = m3_fixed_cw * (simParams.L3_fixed_cw ** 2);
            const I4 = simParams.m4_adj_cw * (L4_adj_cw ** 2);
            const Itot = I1 + I2 + I3 + I4;
            const M_eff = Itot / (simParams.L1 ** 2);

            // Calculate Resonance Frequency
            // Ensure M_eff * compliance is positive to avoid sqrt of negative number
            // Math.max(1, ...) prevents issues if M_eff * compliance somehow becomes zero or negative
            const F = 1000 / (2 * Math.PI * Math.sqrt(Math.max(1, M_eff * simParams.compliance)));
            dataPoints.push({ x: val, y: F });
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
            datasets: [
                { label: 'Theoretical Curve', data: data, borderColor: '#007bff', borderWidth: 2, fill: false, tension: 0.1, pointRadius: 0 },
                { label: 'Your Current Value', data: [], backgroundColor: 'red', pointRadius: 6, type: 'scatter' }
            ]
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
    // Only update charts if calculatedResults exist and the arm is balanced
    if (!store.calculatedResults || store.calculatedResults.isUnbalanced) {
      // If unbalanced, clear the current value point on all charts
      Object.values(charts).forEach(chart => {
          if (chart) {
              chart.data.datasets[1].data = []; // Clear 'Your Current Value' point
              chart.update('none');
          }
      });
      // No need to generate theoretical curves if the base state is unbalanced,
      // as many points might also be unbalanced.
      // However, for a more complete view, we can still generate the curves,
      // which will contain NaNs where unbalanced.
      // The current implementation of generateCurveData already handles NaNs.
    }

    const currentFreq = store.calculatedResults.isUnbalanced ? NaN : store.calculatedResults.F;

    // Update 'Your Current Value' point for each chart
    if (charts.headshell) charts.headshell.data.datasets[1].data = [{ x: store.params.m_headshell, y: currentFreq }];
    if (charts.cw) charts.cw.data.datasets[1].data = [{ x: store.params.m4_adj_cw, y: currentFreq }];
    if (charts.compliance) charts.compliance.data.datasets[1].data = [{ x: store.params.compliance, y: currentFreq }];
    if (charts.armwand) charts.armwand.data.datasets[1].data = [{ x: store.params.m_tube_percentage, y: currentFreq }];

    // Regenerate theoretical curves
    if (charts.headshell) charts.headshell.data.datasets[0].data = generateCurveData('m_headshell', Array.from({length: 231}, (_, i) => 2 + i * 0.1));
    if (charts.cw) charts.cw.data.datasets[0].data = generateCurveData('m4_adj_cw', Array.from({length: 161}, (_, i) => 40 + i * 1));
    if (charts.compliance) charts.compliance.data.datasets[0].data = generateCurveData('compliance', Array.from({length: 351}, (_, i) => 5 + i * 0.1));
    if (charts.armwand) charts.armwand.data.datasets[0].data = generateCurveData('m_tube_percentage', Array.from({length: 101}, (_, i) => i));

    // Update all chart instances
    Object.values(charts).forEach(chart => { if (chart) chart.update('none'); });
};

onMounted(() => {
    // Initialize charts on mount
    charts.headshell = createChart(headshellChartCanvas, '1. Effect of Headshell Mass', 'Headshell Mass (g)', []);
    charts.cw = createChart(cwChartCanvas, '2. Effect of Adjustable CW Mass', 'Adjustable Counterweight Mass (g)', []);
    charts.compliance = createChart(complianceChartCanvas, '3. Effect of Cartridge Compliance', 'Cartridge Compliance (µm/mN)', []);
    charts.armwand = createChart(armwandChartCanvas, '4. Effect of Armwand Mass %', 'Armwand Percentage of Rear Mass (%)', []);
    updateCharts(); // Initial data load
});

// Watch for changes in store.params to trigger chart updates
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
