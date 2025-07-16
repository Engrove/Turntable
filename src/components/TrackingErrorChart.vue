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
  },
  // NY PROP för att veta armtyp
  trackingMethod: {
    type: String,
    required: true,
    default: 'pivoting'
  }
});

const chartCanvas = ref(null);
let chartInstance = null;

const updateChart = () => {
  if (!chartInstance || !props.chartData || !props.chartData.datasets) return;

  chartInstance.data.datasets = props.chartData.datasets;
  
  // Nollställ annotationer
  chartInstance.options.plugins.annotation.annotations.innerNull = {};
  chartInstance.options.plugins.annotation.annotations.outerNull = {};

  // NY LOGIK: Visa bara nollpunkter för pivoterande armar
  if (props.trackingMethod === 'pivoting' && props.nullPoints.inner && props.nullPoints.outer) {
    const activeDataset = props.chartData.datasets.find(ds => ds.borderWidth === 4);
    const activeColor = activeDataset ? activeDataset.borderColor : 'rgba(231, 76, 60, 0.9)';

    const getLabelPosition = (yValue) => {
      if (!yValue) return 'end';
      const yMax = chartInstance.scales.y.max;
      const yMin = chartInstance.scales.y.min;
      return yValue > (yMax - (yMax - yMin) * 0.2) ? 'start' : 'end';
    };
    const getYAdjust = (position) => (position === 'start' ? 15 : -15);
    
    let innerYValue = 0;
    let outerYValue = 0;
    if (activeDataset && activeDataset.data) {
        innerYValue = activeDataset.data.find(p => p.x >= props.nullPoints.inner)?.y ?? 0;
        outerYValue = activeDataset.data.find(p => p.x >= props.nullPoints.outer)?.y ?? 0;
    }
    
    const innerPosition = getLabelPosition(innerYValue);
    const outerPosition = getLabelPosition(outerYValue);

    chartInstance.options.plugins.annotation.annotations.innerNull = {
      type: 'line',
      scaleID: 'x',
      value: props.nullPoints.inner,
      borderColor: 'rgba(231, 76, 60, 0.7)',
      borderWidth: 1.5,
      borderDash: [6, 6],
      label: {
        content: `Null ${props.nullPoints.inner.toFixed(1)}mm`,
        display: true,
        position: innerPosition,
        font: { size: 10, weight: 'bold' },
        backgroundColor: activeColor,
        yAdjust: getYAdjust(innerPosition),
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
        content: `Null ${props.nullPoints.outer.toFixed(1)}mm`,
        display: true,
        position: outerPosition,
        font: { size: 10, weight: 'bold' },
        backgroundColor: activeColor,
        yAdjust: getYAdjust(outerPosition),
      }
    };
  }

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

watch(() => [props.chartData, props.nullPoints, props.trackingMethod], updateChart, { deep: true });
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
