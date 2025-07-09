<!-- src/components/CounterweightChart.vue -->
<script setup>
import { ref, onMounted, watchEffect } from 'vue'
import Chart from 'chart.js/auto'
import { useTonearmStore } from '@/store/tonearmStore'

const store = useTonearmStore()
const chartRef = ref(null)
let chart = null

onMounted(() => {
  const ctx = chartRef.value.getContext('2d')
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Counterweight Position'],
      datasets: [
        {
          label: 'Distance (mm)',
          data: [0],
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Distance from Pivot (mm)'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
            display: true,
            text: 'Counterweight Balance Point'
        }
      }
    }
  })
})

watchEffect(() => {
  if (chart) {
    chart.data.datasets[0].data = [store.adjCWDistance]
    chart.update()
  }
})
</script>

<template>
  <div class="chart-container">
    <canvas ref="chartRef"></canvas>
  </div>
</template>

<style scoped>
.chart-container {
  position: relative;
  height: 150px;
}
</style>
