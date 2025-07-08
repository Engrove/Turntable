<script setup>
import { ref, computed } from 'vue'
import InputPanel from '@/components/InputPanel.vue'
import ResultsPanel from '@/components/ResultsPanel.vue'
import TonearmVisualizer from '@/components/TonearmVisualizer.vue'
import SensitivityCharts from '@/components/SensitivityCharts.vue'
import HelpModal from '@/components/HelpModal.vue'
import { useTonearmStore } from '@/store/tonearmStore.js' // Importera storen

const store = useTonearmStore(); // Initiera storen för att komma åt datan

// Reaktiva variabler för att styra modalerna
const showHelp = ref(false);
const showDebug = ref(false);
const copyButtonText = ref('Copy Log');

// En computed property som samlar all relevant data till en läsbar textsträng
const debugLog = computed(() => {
  return `
--- DEBUG LOG ---
Timestamp: ${new Date().toISOString()}

[Store Parameters (params)]
${JSON.stringify(store.params, null, 2)}

[Computed: m1 (Front Mass)]
${JSON.stringify(store.m1, null, 2)}

[Computed: calculatedResults]
${JSON.stringify(store.calculatedResults, null, 2)}

[Computed: diagnosis]
${JSON.stringify(store.diagnosis, null, 2)}
  `.trim();
});

// Funktion för att kopiera loggen till urklipp
const copyLog = () => {
  navigator.clipboard.writeText(debugLog.value).then(() => {
    copyButtonText.value = 'Copied!';
    setTimeout(() => {
      copyButtonText.value = 'Copy Log';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy log: ', err);
    copyButtonText.value = 'Failed to copy!';
  });
};
</script>

<template>
  <div class="tool-view">
    <div class="tool-header">
      <h1>Tonearm Resonance Calculator</h1>
      <div class="header-buttons">
        <button @click="showDebug = true" class="debug-button">
          Debug Log
        </button>
        <button @click="showHelp = true" class="help-button">
          ? Help & Methodology
        </button>
      </div>
    </div>

    <div class="main-content">
      <div class="calculator-grid">
        <InputPanel />
        <ResultsPanel />
      </div>
      <TonearmVisualizer />
      <SensitivityCharts />
    </div>

    <!-- Hjälp-modalen -->
    <HelpModal :isOpen="showHelp" @close="showHelp = false">
      <template #header>
        <h2>Methodology & User Guide</h2>
      </template>
      <template #default>
        <h4>How to Use This Tool</h4>
        <p>This calculator is a design aid for exploring the relationship between a tonearm's physical properties and its resonant frequency when paired with a specific cartridge. Adjust the sliders for each parameter to see the results update in real-time.</p>
        <hr>
        <h4>The Core Physics</h4>
        <p>The tool is built on three fundamental principles: Static Balance, Effective Mass (Moment of Inertia), and System Resonance.</p>
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
      </template>
    </HelpModal>

    <!-- Debug-modalen (din utmärkta idé) -->
    <HelpModal :isOpen="showDebug" @close="showDebug = false">
        <template #header>
            <h2>Live Debug Log</h2>
        </template>
        <template #default>
            <div class="debug-controls">
                <button @click="copyLog" class="copy-button">{{ copyButtonText }}</button>
            </div>
            <pre class="log-content"><code>{{ debugLog }}</code></pre>
        </template>
    </HelpModal>

  </div>
</template>

<style scoped>
.tool-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid var(--border-color);
}

.tool-header h1 {
  margin: 0;
  font-size: 1.75rem;
  color: var(--header-color);
}

.header-buttons {
  display: flex;
  gap: 1rem;
}

.help-button, .debug-button {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.help-button {
  background-color: #f8f9fa;
  border: 1px solid var(--border-color);
}
.help-button:hover {
  background-color: #e9ecef;
  border-color: #adb5bd;
}

.debug-button {
  background-color: #fff3cd;
  border: 1px solid #ffeeba;
  color: #856404;
}
.debug-button:hover {
  background-color: #ffeeba;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.calculator-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
}

/* Stilar för innehållet i debug-modalen */
.debug-controls {
    margin-bottom: 1rem;
}
.copy-button {
    padding: 0.6rem 1.2rem;
    font-weight: 600;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    cursor: pointer;
}
.log-content {
    background-color: #f8f9fa;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 1rem;
    white-space: pre-wrap; /* Låt texten radbrytas */
    word-wrap: break-word;
    max-height: 50vh;
    overflow-y: auto;
}
</style>
