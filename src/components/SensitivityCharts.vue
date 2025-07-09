<!-- src/components/SensitivityCharts.vue -->
<script setup>
import { ref, onMounted, watchEffect } from 'vue'
import Chart from 'chart.js/auto'
import { useTonearmStore } from '@/store/tonearmStore'

const store = useTonearmStore()
const chartRef = ref(null)
let chart = null

const calculateFrequency = (mass, compliance) => {
    const effMassKg = mass / 1000
    const complianceMetersPerNewton = compliance * 1e-6
    if (effMassKg <= 0 || complianceMetersPerNewton <= 0) return 0
    return 1 / (2 * Math.PI * Math.sqrt(effMassKg * complianceMetersPerNewton))
}

onMounted(() => {
  const ctx = chartRef.value.getContext('2d')
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [-2, -1, 0, 1, 2].map(v => `${v} g`),
      datasets: [{
        label: 'Resonance Frequency',
        data: [],
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        fill: false,
        tension: 0.1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          title: {
            display: true,
            text: 'Resonance (Hz)'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Change in Front Mass (g)'
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Resonance Sensitivity to Mass Change'
        }
      }
    }
  })
})

watchEffect(() => {
  if (chart) {
    const massRange = [-2, -1, 0, 1, 2]
    const currentEffectiveMass = store.effectiveMass
    const currentCompliance = store.cartridgeCompliance
    
    chart.data.datasets[0].data = massRange.map(massDelta => {
      const newMass = currentEffectiveMass + massDelta
      return calculateFrequency(newMass, currentCompliance)
    })
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
  height: 250px; /* Ge den lite mer höjd */
}
</style>
