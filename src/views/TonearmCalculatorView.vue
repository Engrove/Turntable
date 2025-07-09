<script setup>
import { ref } from 'vue'
import InputPanel from '@/components/InputPanel.vue'
import ResultsPanel from '@/components/ResultsPanel.vue'
import TonearmVisualizer from '@/components/TonearmVisualizer.vue'
import SensitivityCharts from '@/components/SensitivityCharts.vue'
import CounterweightChart from '@/components/CounterweightChart.vue'
import HelpModal from '@/components/HelpModal.vue'

const showHelp = ref(false);
</script>

<template>
  <div class="tool-view">
    <div class="tool-header">
      <h1>Tonearm Resonance Calculator</h1>
      <button @click="showHelp = true" class="help-button">
        ? Help & Methodology
      </button>
    </div>

    <div class="main-content">
      <div class="calculator-grid">
        <InputPanel />
        <ResultsPanel />
      </div>
      <TonearmVisualizer />
      <SensitivityCharts />
      <CounterweightChart />
    </div>

    <HelpModal :isOpen="showHelp" @close="showHelp = false">
      <template #header>
        <h2>Methodology & User Guide</h2>
      </template>
      <template #default>
        <!-- (Samma hjälpinnehåll som tidigare) -->
        <h4>How to Use This Tool</h4>
        <p>This calculator is a design aid for exploring the relationship between a tonearm's physical properties and its resonant frequency when paired with a specific cartridge. Adjust the sliders or enter values directly to see the results update in real-time.</p>
        <ul>
            <li><strong>Input Parameters:</strong> Manipulate the physical properties of your theoretical tonearm design.</li>
            <li><strong>Calculated Results:</strong> See the direct output of the calculations, including the all-important System Resonance Frequency.</li>
            <li><strong>Visualizations:</strong> The diagrams provide immediate visual feedback on the tonearm's geometry and the sensitivity of the system to changes in each parameter.</li>
        </ul>
        <hr>

        <h4>The Core Physics</h4>
        <p>The tool is built on three fundamental principles:</p>
        <ol>
            <li><strong>Static Balance:</strong> A tonearm is a complex lever. To achieve the desired Vertical Tracking Force (VTF), the moments (mass × distance) on both sides of the pivot must be in equilibrium. The calculator finds the position for the adjustable counterweight (m4) that balances the front assembly (m1, pickup, screws) and the rear assembly (m2, m3), while also accounting for the VTF.</li>
            <li><strong>Effective Mass (Moment of Inertia):</strong> This is the most critical concept. Effective mass is not the physical weight of the arm, but its rotational *inertia* as seen by the stylus. It's calculated from the Moment of Inertia (I), which is roughly <strong>Mass × Distance²</strong>. This is why a heavy weight far from the pivot (like the counterweight) has a massive impact on the effective mass.</li>
            <li><strong>System Resonance:</strong> The tonearm and cartridge compliance form a classic mass-spring system. The goal is to place its natural resonance frequency in the "sweet spot" (typically 8-12 Hz) to avoid amplifying low-frequency rumble from warps (<8 Hz) and interfering with audible bass frequencies (>12 Hz).</li>
        </ol>
                <hr>

        <h4>Understanding the Visualizations</h4>
        <p>The toolkit provides several interactive graphs to give you immediate visual feedback:</p>
        <ul>
            <li><strong>Tonearm Visualization:</strong> This top-down view shows the physical layout of your tonearm based on your inputs. It helps you visualize the balance and the crucial distances between the components and the pivot.</li>
            <li><strong>Sensitivity Analysis (The 4 Charts):</strong> These charts are perhaps the most powerful design feature. Each chart shows how the final Resonance Frequency changes when you alter just <em>one</em> specific parameter (like Headshell Mass). A steep curve means the system is very sensitive to that parameter, while a flat curve means it has little effect. This helps you understand the trade-offs in your design.</li>
            <li><strong>Counterweight Mass vs. Required Distance:</strong> This graph specifically explores the relationship between the adjustable counterweight's mass (m4) and how far it needs to be from the pivot to balance the arm. It clearly illustrates the principle that a heavier counterweight can be placed much closer to the pivot, which is key to reducing effective mass.</li>
        </ul>
        <hr>

        <h4>The Two-Part Counterweight Philosophy</h4>
        <p>A key design feature this calculator models is a two-part counterweight system. Instead of a single large weight, the task is split:</p>
        <ul>
            <li><strong>The Fixed Counterweight (m3):</strong> A mass integrated into the arm structure, very close to the pivot. Its purpose is to provide some of the balancing mass with a negligible contribution to the total inertia (since its distance, L3, is small).</li>
            <li><strong>The Adjustable Counterweight (m4):</strong> This larger weight provides the final, precise balancing. Because m3 is already doing some work, m4 can be placed much closer to the pivot, significantly reducing its own contribution to inertia and thereby lowering the total effective mass.</li>
        </ul>
        <hr>

        <h4>Core Formulas Used</h4>
        <p>Adjustable Counterweight Distance (D or L4):</p>
        <code>D = ( (m1*L1) + (m2*L2) - (m3*L3) - (VTF*L1) ) / m4</code>
        <p>Total Moment of Inertia (Itot):</p>
        <code>Itot = (m1*L1²) + (m2*L2²) + (m3*L3²) + (m4*D²)</code>
        <p>Effective Mass (M_eff):</p>
        <code>M_eff = Itot / L1²</code>
        <p>Resonance Frequency (F):</p>
        <code>F = 1000 / (2π * √(M_eff * Compliance))</code>
        
        <hr>
        <p><em><strong>Disclaimer:</strong> This is a design tool for theoretical exploration. The ultimate proof is always in the physical build, where real-world factors and manufacturing tolerances come into play.</em></p>
      </template>
    </HelpModal>
  </div>
</template>

<style scoped>
/* ... (samma CSS som tidigare) ... */
.tool-view{display:flex;flex-direction:column}.tool-header{display:flex;justify-content:space-between;align-items:center;padding-bottom:1.5rem;margin-bottom:2rem;border-bottom:1px solid var(--border-color)}.tool-header h1{margin:0;font-size:1.75rem;color:var(--header-color)}.help-button{padding:.5rem 1rem;font-size:.9rem;font-weight:600;background-color:#f8f9fa;border:1px solid var(--border-color);border-radius:6px;cursor:pointer;transition:all .2s ease}.help-button:hover{background-color:#e9ecef;border-color:#adb5bd}.main-content{display:flex;flex-direction:column;gap:2rem}.calculator-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(400px,1fr));gap:2rem}
</style>
