<!-- src/components/EstimatorChart.vue -->
<script setup>
import { onMounted, ref, watch } from 'vue';
import { Chart } from 'chart.js/auto';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(annotationPlugin);

const props = defineProps({
  dataPoints: {
    type: Array,
    required: true,
    default: () => []
  },
  medianRatio: {
    type: Number,
    required: true,
    default: 1
  }
});

const chartCanvas = ref(null);
let chartInstance = null;

const updateChart = () => {
  if (!chartInstance) return;

  // Uppdatera scatter-data
  chartInstance.data.datasets[0].data = props.dataPoints;

  // **KORRIGERAD LOGIK FÖR LINJEN**
  // Vi definierar en linje som går genom (0,0) med lutningen = medianRatio.
  // Chart.js' annotation plugin ritar en linje mellan (xMin, yMin) och (xMax, yMax).
  // Vi sätter (xMin, yMin) till (0, 0) och räknar ut en rimlig slutpunkt.
  const chartMaxX = chartInstance.scales.x.max;
  const lineEndX = chartMaxX;
  const lineEndY = chartMaxX * props.medianRatio;

  chartInstance.options.plugins.annotation.annotations.medianLine = {
    type: 'line',
    // Startpunkt
    xMin: 0,
    yMin: 0,
    // Slutpunkt
    xMax: lineEndX,
    yMax: lineEndY,
    // Styling
    borderColor: 'rgba(231, 76, 60, 0.8)',
    borderWidth: 2,
    borderDash: [6, 6],
    label: {
      content: `Median Ratio: ${props.medianRatio.toFixed(2)}`,
      display: true,
      position: 'end',
      backgroundColor: 'rgba(231, 76, 60, 0.8)',
      color: 'white',
      font: { size: 10 },
      yAdjust: -10
    }
  };

  chartInstance.update();
};

onMounted(() => {
  if (!chartCanvas.value) return;
  const ctx = chartCanvas.value.getContext('2d');

  chartInstance = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [
        {
          label: 'Individual Pickups in Matched Rule',
          data: [],
          backgroundColor: 'rgba(52, 152, 219, 0.7)',
          borderColor: 'rgba(52, 152, 219, 1)',
          pointRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Underlying Data for Matched Rule',
          font: { size: 16 }
        },
        tooltip: {
            callbacks: {
                label: function(context) {
                    const dataPoint = context.raw;
                    if (dataPoint && dataPoint.model) {
                        return `${dataPoint.model}: (100Hz: ${dataPoint.x}, 10Hz: ${dataPoint.y.toFixed(1)})`;
                    }
                    return `(x: ${context.parsed.x}, y: ${context.parsed.y.toFixed(1)})`;
                }
            }
        },
        annotation: {
          annotations: {
            medianLine: {} // Definieras dynamiskt i updateChart
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: { display: true, text: 'Dynamic Compliance @ 100Hz' },
          min: 0,
          suggestedMax: 20
        },
        y: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Dynamic Compliance @ 10Hz' },
          min: 0,
          suggestedMax: 40
        }
      }
    }
  });

  updateChart();
});

watch(props, updateChart, { deep: true });
</script>

<template>
  <div class="panel chart-panel">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<style scoped>
.chart-panel {
  height: 400px;
  padding: 1.5rem;
  background-color: #ffffff;
  border-radius: 6px;
  grid-column: 1 / -1;
}
</style>
