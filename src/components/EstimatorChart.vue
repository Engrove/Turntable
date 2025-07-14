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
      labels: { x: 'X-Axis', y: 'Y-Axis', title: 'Chart', lineLabel: 'Line' }
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

  // Hitta det högsta x-värdet i den nya datamängden för att rita linjen realistiskt
  const maxXValue = config.dataPoints.reduce((max, p) => (p.x > max ? p.x : max), 1);
  const lineEndX = Math.max(maxXValue, 1);

  let lineAnnotation = {};

  // KORRIGERING: Hantera båda typerna av linjer (regression och median-kvot)
  if (config.k !== undefined && config.m !== undefined) {
    // Regressionslinje: y = kx + m
    lineAnnotation = {
      type: 'line',
      xMin: 0,
      yMin: config.m, // Startar vid intercept
      xMax: lineEndX,
      yMax: config.k * lineEndX + config.m, // Slutar vid max X
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
  } else if (config.medianRatio !== undefined) {
    // Median-kvot linje: y = ratio * x
    lineAnnotation = {
      type: 'line',
      xMin: 0,
      yMin: 0, // Startar vid origo
      xMax: lineEndX,
      yMax: lineEndX * config.medianRatio,
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
  }
  
  chartInstance.options.plugins.annotation.annotations.mainLine = lineAnnotation;

  // Uppdatera dynamiska texter och skalor
  chartInstance.options.plugins.title.text = config.labels.title;
  chartInstance.options.scales.x.title.text = config.labels.x;
  chartInstance.options.scales.y.title.text = config.labels.y;
  
  // Justera skalans maxvärde för att ge lite marginal
  const suggestedMaxX = Math.ceil(lineEndX * 1.1);
  const suggestedMaxY = Math.ceil(config.dataPoints.reduce((max, p) => (p.y > max ? p.y : max), 0) * 1.1);
  chartInstance.options.scales.x.max = suggestedMaxX > 10 ? suggestedMaxX : 10;
  chartInstance.options.scales.y.max = suggestedMaxY > 10 ? suggestedMaxY : 10;

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
            mainLine: {} // Definieras dynamiskt
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
