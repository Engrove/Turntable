<!-- src/components/TrackingErrorChart.vue -->
<script setup>
import { onMounted, ref, watch } from 'vue';
import { Chart } from 'chart.js/auto';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(annotationPlugin);

const props = defineProps({
  chartData: {
    type: Object,
    required: true,
  },
  nullPoints: {
    type: Object,
    required: true,
    default: () => ({ inner: 0, outer: 0 })
  }
});

const chartCanvas = ref(null);
let chartInstance = null;

const updateChart = () => {
  if (!chartInstance || !props.chartData) return;

  // Uppdatera dataset
  chartInstance.data.datasets = props.chartData.datasets;
  
  // Uppdatera annotations för nollpunkter
  chartInstance.options.plugins.annotation.annotations.innerNull = {
    type: 'line',
    scaleID: 'x',
    value: props.nullPoints.inner,
    borderColor: 'rgba(231, 76, 60, 0.7)',
    borderWidth: 1.5,
    borderDash: [6, 6],
    label: {
      content: 'Null',
      display: true,
      position: 'start',
      font: { size: 10 },
      backgroundColor: 'rgba(231, 76, 60, 0.7)',
    }
  };
  chartInstance.options.plugins.annotation.annotations.outerNull = {
    type: 'line',
    scaleID: 'x',
    value: props.nullPoints.outer,
    borderColor: 'rgba(231, 76, 60, 0.7)',
    borderWidth: 1.5,
    borderDash: [6, 6],
    label: {
      content: 'Null',
      display: true,
      position: 'start',
      font: { size: 10 },
      backgroundColor: 'rgba(231, 76, 60, 0.7)',
    }
  };

  chartInstance.update();
};

onMounted(() => {
  if (!chartCanvas.value) return;
  const ctx = chartCanvas.value.getContext('2d');

  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: []
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Tracking Error vs. Groove Radius',
          font: { size: 16 }
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += `${context.parsed.y.toFixed(2)}° at ${context.parsed.x.toFixed(1)}mm`;
              }
              return label;
            }
          }
        },
        annotation: {
          annotations: {
            zeroLine: {
              type: 'line',
              yMin: 0,
              yMax: 0,
              borderColor: 'rgba(0, 0, 0, 0.3)',
              borderWidth: 1,
            },
            innerNull: {},
            outerNull: {}
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: { display: true, text: 'Groove Radius (mm)' },
          min: 60,
          max: 147,
        },
        y: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: 'Tracking Error (°)' },
        }
      }
    }
  });
  updateChart();
});

watch(() => [props.chartData, props.nullPoints], updateChart, { deep: true });
</script>

<template>
  <div class="chart-panel panel">
    <canvas ref="chartCanvas"></canvas>
  </div>
</template>

<style scoped>
.chart-panel {
  height: 400px;
  padding: 1.5rem;
  background-color: #ffffff;
  border-radius: 6px;
  grid-column: 1 / -1; /* Får grafen att ta upp hela bredden i grid-layout */
}
</style>
