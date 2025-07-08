<script setup>
import { computed } from 'vue'
import { useTonearmStore } from '@/store/tonearmStore.js'
import SensitivityChart from './charts/SensitivityChart.vue'

const store = useTonearmStore()

// A simplified, non-reactive calculation function for simulations
function calculateSimulatedFrequency(params) {
    const p = { ...params }; // Use a copy
    
    const m1 = p.m_headshell + p.m_pickup + p.m_screws;
    const m2_tube = p.m_rear_assembly * (p.m_tube_percentage / 100.0);
    const m3_fixed_cw = p.m_rear_assembly - m2_tube;

    if (p.m4_adj_cw <= 0) return NaN;

    const numerator = (m1 * p.L1) + (m2_tube * p.L2) - (m3_fixed_cw * p.L3_fixed_cw) - (p.vtf * p.L1);
    const L4_adj_cw = (numerator >= 0) ? numerator / p.m4_adj_cw : -1;
    
    if (L4_adj_cw < 0) return NaN;

    const Itot = (m1 * p.L1**2) + (m2_tube * p.L2**2) + (m3_fixed_cw * p.L3_fixed_cw**2) + (p.m4_adj_cw * L4_adj_cw**2);
    const M_eff = Itot / (p.L1 ** 2);
    return 1000 / (2 * Math.PI * Math.sqrt(Math.max(1, M_eff * p.compliance)));
}

function runSimulation(paramToVary, range) {
  const labels = [];
  const values = [];
  const baseParams = store.params;

  for (const val of range) {
    labels.push(val);
    const simParams = { ...baseParams, [paramToVary]: val };
    values.push(calculateSimulatedFrequency(simParams));
  }
  return { labels, values };
}

const headshellSim = computed(() => runSimulation('m_headshell', Array.from({length: 100}, (_, i) => 2 + i * (23/99))));
const counterweightSim = computed(() => runSimulation('m4_adj_cw', Array.from({length: 100}, (_, i) => 40 + i * (160/99))));
const complianceSim = computed(() => runSimulation('compliance', Array.from({length: 100}, (_, i) => 5 + i * (35/99))));

</script>

<template>
  <div class="visualizations-panel panel">
    <h2>Sensitivity Analysis</h2>
    <div class="charts-grid">
      <SensitivityChart
        title="1. Effect of Headshell Mass"
        label="Headshell Mass (g)"
        :simulationData="headshellSim"
        :currentValue="{ x: store.params.m_headshell, y: store.calculatedResults.F }"
      />
      <SensitivityChart
        title="2. Effect of Adjustable Counterweight Mass"
        label="Adjustable Counterweight Mass (g)"
        :simulationData="counterweightSim"
        :currentValue="{ x: store.params.m4_adj_cw, y: store.calculatedResults.F }"
      />
      <SensitivityChart
        title="3. Effect of Cartridge Compliance"
        label="Cartridge Compliance (µm/mN)"
        :simulationData="complianceSim"
        :currentValue="{ x: store.params.compliance, y: store.calculatedResults.F }"
      />
    </div>
  </div>
</template>

<style scoped>
.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}
.visualizations-panel {
  grid-column: 1 / -1; /* Make this panel span full width if needed */
}
</style>
