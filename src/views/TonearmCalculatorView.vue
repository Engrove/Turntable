<!-- src/views/TonearmCalculatorView.vue -->
<script setup>
import { ref } from 'vue';
import InputPanel from '@/components/InputPanel.vue';
import ResultsPanel from '@/components/ResultsPanel.vue';
import TonearmVisualizer from '@/components/TonearmVisualizer.vue';
import SensitivityCharts from '@/components/SensitivityCharts.vue';
import CounterweightChart from '@/components/CounterweightChart.vue';
import HelpModal from '@/components/HelpModal.vue';

const showHelp = ref(false);
</script>

<template>
  <div class="tool-view">
    <div class="tool-header">
      <h1>Tonearm Resonance Calculator</h1>
      <button @click="showHelp = true" class="icon-help-button" title="Help & Methodology">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
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
        
        <!-- UPPDATERAD SEKTION HÄR -->
        <h4>Disclaimer and Limitations</h4>
        <p>
          This toolkit is provided as a design aid for theoretical exploration and educational purposes only. The calculations are based on established physical principles but are the product of a hobbyist project. Data is compiled from publicly available sources, including manufacturer specifications and community-driven databases.
        </p>
        <p>
          While every effort is made to verify accuracy, there is no guarantee of the absolute correctness of the data or calculations. Users are encouraged to cross-reference the results with their own measurements and practical experience. The ultimate responsibility for any physical build or component matching rests with the user.
        </p>
        <!-- SLUT PÅ UPPDATERAD SEKTION -->
      </template>
    </HelpModal>
  </div>
</template>

<style scoped>
/* Befintlig CSS förblir oförändrad */
.tool-view { display: flex; flex-direction: column; }
.tool-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 1.5rem; margin-bottom: 2rem; border-bottom: 1px solid var(--border-color); }
.tool-header h1 { margin: 0; font-size: 1.75rem; color: var(--header-color); }
.main-content { display: flex; flex-direction: column; gap: 2rem; }
.calculator-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem; }
.icon-help-button { background: none; border: 1px solid transparent; border-radius: 50%; cursor: pointer; color: var(--label-color); display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; transition: all 0.2s ease; padding: 0; }
.icon-help-button:hover { background-color: #e9ecef; border-color: var(--border-color); color: var(--text-color); }
</style>
