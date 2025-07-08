<script setup>
import { Line } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale, Chart } from 'chart.js'
import { computed, watch } from 'vue'

ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale)

const props = defineProps({
  title: String,
  label: String,
  simulationData: Object,
  currentValue: Object
})

const chartData = computed(() => ({
  labels: props.simulationData.labels,
  datasets: [
    {
      label: 'Theoretical Curve',
      borderColor: '#007bff',
      data: props.simulationData.values,
      tension: 0.1,
      pointRadius: 0,
      borderWidth: 2,
    },
    {
      label: 'Your Current Value',
      backgroundColor: '#dc3545',
      borderColor: '#dc3545',
      data: [{ x: props.currentValue.x, y: props.currentValue.y }],
      pointRadius: 6,
      pointHoverRadius: 8,
    }
  ]
}))

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 200 // Faster animation for smoother updates
  },
  plugins: {
    legend: {
      position: 'top',
    },
    title: {
      display: true,
      text: props.title,
      font: {
          size: 16,
          weight: 'normal'
      }
    }
  },
  scales: {
    x: {
      title: { display: true, text: props.label },
      type: 'linear',
      ticks: {
          maxTicksLimit: 7
      }
    },
    y: {
      title: { display: true, text: 'Resonance Frequency (Hz)' },
      min: 5,
      max: 15,
      grid: {
          drawOnChartArea: true
      }
    }
  }
}

// Custom plugin to draw background color bands for ideal/warning ranges
const backgroundBandsPlugin = {
    id: 'backgroundBands',
    beforeDraw(chart) {
        const { ctx, chartArea: { top, bottom, left, right }, scales: { y } } = chart;
        ctx.save();
        
        const idealTop = y.getPixelForValue(11);
        const idealBottom = y.getPixelForValue(8);
        const warningTop = y.getPixelForValue(12);
        const warningBottom = y.getPixelForValue(7);

        // Warning bands
        ctx.fillStyle = 'rgba(255, 243, 205, 0.5)';
        ctx.fillRect(left, warningTop, right-left, idealTop-warningTop);
        ctx.fillRect(left, idealBottom, right-left, warningBottom-idealBottom);

        // Ideal band
        ctx.fillStyle = 'rgba(212, 237, 218, 0.5)';
        ctx.fillRect(left, idealTop, right-left, idealBottom-idealTop);

        ctx.restore();
    }
}

Chart.register(backgroundBandsPlugin);

</script>

<template>
  <div class="chart-container">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  height: 300px;
  margin-top: 1rem;
  background: white;
  border-radius: 4px;
  padding: 1rem;
  border: 1px solid var(--border-color);
}
</style>
