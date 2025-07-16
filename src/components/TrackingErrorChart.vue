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
  if (!chartInstance || !props.chartData || !props.chartData.datasets) return;

  chartInstance.data.datasets = props.chartData.datasets;
  
  // Funktion för att bestämma etikettens position
  const getLabelPosition = (yValue) => {
    // Om Y-värdet är i den övre 20% av skalan, flytta ner etiketten. Annars upp.
    const yMax = chartInstance.scales.y.max;
    const yMin = chartInstance.scales.y.min;
    return yValue > (yMax - (yMax - yMin) * 0.2) ? 'start' : 'end';
  };

  // Funktion för att bestämma Y-justering
  const getYAdjust = (position) => (position === 'start' ? 15 : -15);
  
  const innerNullValue = props.nullPoints.inner;
  const outerNullValue = props.nullPoints.outer;

  const innerPosition = getLabelPosition(chartInstance.data.datasets[0]?.data.find(p => p.x >= innerNullValue)?.y ?? 0);
  const outerPosition = getLabelPosition(chartInstance.data.datasets[0]?.data.find(p => p.x >= outerNullValue)?.y ?? 0);
  
  chartInstance.options.plugins.annotation.annotations.innerNull = {
    type: 'line',
    scaleID: 'x',
    value: innerNullValue,
    borderColor: 'rgba(231, 76, 60, 0.7)',
    borderWidth: 1.5,
    borderDash: [6, 6],
    label: {
      content: `Null ${innerNullValue.toFixed(1)}mm`,
      display: true,
      position: innerPosition,
      font: { size: 10 },
      backgroundColor: 'rgba(231, 76, 60, 0.7)',
      yAdjust: getYAdjust(innerPosition),
    }
  };
  chartInstance.options.plugins.annotation.annotations.outerNull = {
    type: 'line',
    scaleID: 'x',
    value: outerNullValue,
    borderColor: 'rgba(231, 76, 60, 0.7)',
    borderWidth: 1.5,
    borderDash: [6, 6],
    label: {
      content: `Null ${outerNullValue.toFixed(1)}mm`,
      display: true,
      position: outerPosition,
      font: { size: 10 },
      backgroundColor: 'rgba(231, 76, 60, 0.7)',
      yAdjust: getYAdjust(outerPosition),
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
            title: (tooltipItems) => {
              const xVal = tooltipItems[0].parsed.x;
              return `At ${xVal.toFixed(1)} mm radius`;
            },
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.parsed.y !== null) {
                label += `${context.parsed.y.toFixed(2)}°`;
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
              borderColor: 'rgba(0, 0, 0, 0.5)',
              borderWidth: 1.5,
              borderDash: [2, 2],
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
  grid-column: 1 / -1;
}
</style>
