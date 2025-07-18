// src/components/TrackingErrorChart.vue
import { onMounted, ref, watch } from 'vue';
import { Chart } from 'chart.js/auto';
import annotationPlugin from 'chartjs-plugin-annotation';

// Registrerar annotation-pluginet för att kunna rita linjer för nollpunkter.
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
  trackingMethod: {
    type: String,
    required: true,
    default: 'pivoting'
  }
});

const chartCanvas = ref(null);
let chartInstance = null;

/**
* @description Uppdaterar diagrammet med ny data och nya annotationer.
* Anropas när props ändras.
*/
const updateChart = () => {
  if (!chartInstance || !props.chartData || !props.chartData.datasets) return;

  // Uppdaterar dataseten med de nya kurvorna från storen
  chartInstance.data.datasets = props.chartData.datasets;

  // Nollställer befintliga annotationer för att undvika gamla linjer
  chartInstance.options.plugins.annotation.annotations = { 
    zeroLine: chartInstance.options.plugins.annotation.annotations.zeroLine 
  };

  // Ritar bara nollpunktslinjer om det är en pivoterande arm
  if (props.trackingMethod === 'pivoting' && props.nullPoints.inner && props.nullPoints.outer) {
    const activeDataset = props.chartData.datasets.find(ds => ds.borderWidth > 2);
    const activeColor = activeDataset ? activeDataset.borderColor : 'rgba(231, 76, 60, 0.9)';

    // Funktion för att smart placera etiketten antingen överst eller underst
    const getLabelPosition = (yValue) => {
      if (!yValue) return 'end';
      const yMax = chartInstance.scales.y.max;
      const yMin = chartInstance.scales.y.min;
      return yValue > (yMax - (yMax - yMin) * 0.2) ? 'start' : 'end';
    };
    const getYAdjust = (position) => (position === 'start' ? 15 : -15);

    // Hitta Y-värdet för nollpunkterna för att bestämma etikettens position
    let innerYValue = 0;
    let outerYValue = 0;
    if (activeDataset && activeDataset.data) {
      const innerPoint = activeDataset.data.find(p => p.x >= props.nullPoints.inner);
      const outerPoint = activeDataset.data.find(p => p.x >= props.nullPoints.outer);
      innerYValue = innerPoint ? innerPoint.y : 0;
      outerYValue = outerPoint ? outerPoint.y : 0;
    }

    const innerPosition = getLabelPosition(innerYValue);
    const outerPosition = getLabelPosition(outerYValue);

    // Skapar annotationsobjekten för nollpunkterna
    chartInstance.options.plugins.annotation.annotations.innerNull = {
      type: 'line',
      scaleID: 'x',
      value: props.nullPoints.inner,
      borderColor: 'rgba(231, 76, 60, 0.7)',
      borderWidth: 1.5,
      borderDash: [5, 5],
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
      borderDash: [5, 5],
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

  // Ritar om diagrammet med den nya datan
  chartInstance.update();
};

// Körs när komponenten har monterats i DOM
onMounted(() => {
  if (!chartCanvas.value) return;
  const ctx = chartCanvas.value.getContext('2d');

  // Skapar en ny Chart.js-instans med grundläggande konfiguration
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
              if (label) { label += ': '; }
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
              borderDash: [5, 5],
            }
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
  updateChart(); // Fyller diagrammet med initial data
});

// Övervakar props för ändringar och anropar updateChart när något ändras
watch(() => [props.chartData, props.nullPoints, props.trackingMethod], updateChart, { deep: true });

const template = `
<div class="chart-panel panel">
  <canvas ref="chartCanvas"></canvas>
</div>
`;

const style = `
.chart-panel {
  height: 400px;
  padding: 1.5rem;
  background-color: #ffffff;
  border-radius: 6px;
  grid-column: 1 / -1;
}
`;

export default {
  props,
  setup() {
    return {
      chartCanvas
    };
  },
  template,
  style
};
