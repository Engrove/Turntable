<!-- src/components/EstimatorChart.vue -->
<script setup>
import { onMounted, ref, watch } from 'vue';
import { Chart } from 'chart.js/auto';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(annotationPlugin);

const props = defineProps({
  chartConfig: {
    type: Object,
    required: true,
    default: () => ({
      dataPoints: [],
      medianRatio: 1,
      labels: { x: 'X-Axis', y: 'Y-Axis', title: 'Chart', lineLabel: 'Ratio' },
      scales: { suggestedMax: { x: 20, y: 40 } }
    })
  }
});

const chartCanvas = ref(null);
let chartInstance = null;

const updateChart = () => {
  if (!chartInstance || !props.chartConfig) return;

  const config = props.chartConfig;

  // Uppdatera scatter-data
  chartInstance.data.datasets[0].data = config.dataPoints;

  // Uppdatera linjen baserat på den nya konfigurationen
  const chartMaxX = chartInstance.scales.x.max;
  const lineEndX = chartMaxX;
  const lineEndY = chartMaxX * config.medianRatio;

  chartInstance.options.plugins.annotation.annotations.medianLine = {
    type: 'line',
    xMin: 0,
    yMin: 0,
    xMax: lineEndX,
    yMax: lineEndY,
    borderColor: 'rgba(231, 76, 60, 0.8)',
    borderWidth: 2,
    borderDash: [6, 6],
    label: {
      content: config.labels.lineLabel,
      display: true,
      position: 'end',
      backgroundColor: 'rgba(231, 76, 60, 0.8)',
      color: 'white',
      font: { size: 10 },
      yAdjust: -10
    }
  };

  // Uppdatera dynamiska texter och skalor
  chartInstance.options.plugins.title.text = config.labels.title;
  chartInstance.options.scales.x.title.text = config.labels.x;
  chartInstance.options.scales.y.title.text = config.labels.y;
  chartInstance.options.scales.x.suggestedMax = config.scales.suggestedMax.x;
  chartInstance.options.scales.y.suggestedMax = config.scales.suggestedMax.y;

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
          label: 'Reference Data Points',
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
          text: '', // Blir dynamisk
          font: { size: 16 }
        },
        tooltip: {
            callbacks: {
                label: function(context) {
                    const dataPoint = context.raw;
                    const xLabel = context.chart.options.scales.x.title.text || 'x';
                    const yLabel = context.chart.options.scales.y.title.text || 'y';
                    if (dataPoint && dataPoint.model) {
                        return `${dataPoint.model}: (${xLabel}: ${dataPoint.x}, ${yLabel}: ${dataPoint.y.toFixed(1)})`;
                    }
                    return `(${xLabel}: ${context.parsed.x}, ${yLabel}: ${context.parsed.y.toFixed(1)})`;
                }
            }
        },
        annotation: {
          annotations: {
            medianLine: {} // Definieras dynamiskt
          }
        }
      },
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          title: { display: true, text: '' }, // Blir dynamisk
          min: 0,
        },
        y: {
          type: 'linear',
          position: 'left',
          title: { display: true, text: '' }, // Blir dynamisk
          min: 0,
        }
      }
    }
  });

  updateChart();
});

watch(() => props.chartConfig, updateChart, { deep: true });
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
