<!-- src/views/ComplianceEstimatorView.vue -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import { useEstimatorStore } from '@/store/estimatorStore.js';
import EstimatorInputPanel from '@/components/EstimatorInputPanel.vue';
import EstimatorResultsPanel from '@/components/EstimatorResultsPanel.vue';
import EstimatorChart from '@/components/EstimatorChart.vue';
import HelpModal from '@/components/HelpModal.vue';

const store = useEstimatorStore();
const showHelp = ref(false);
const router = useRouter();

useHead({
  title: 'Cartridge Compliance Estimator | Engrove Audio Toolkit',
  meta: [
    { 
      name: 'description', 
      content: 'Estimate a cartridge\'s dynamic compliance at 10Hz using its 100Hz or static compliance value. A data-driven tool for better tonearm matching.' 
    },
    { property: 'og:title', content: 'Cartridge Compliance Estimator | Engrove Audio Toolkit' },
    { property: 'og:description', content: 'A data-driven tool to estimate cartridge compliance for better tonearm matching.' },
  ],
});

const printReport = () => {
  window.print();
};

onMounted(() => {
  if (!store.estimationRules) {
    store.initialize();
  }
});

onUnmounted(() => {
  if (store && typeof store.resetInput === 'function') {
    store.resetInput();
  }
});
</script>

<template>
  <div>
    <div v-if="store.isLoading" class="status-container">
      <h2>Loading Estimator...</h2>
      <p>Fetching analysis rules and database...</p>
    </div>
    <div v-else-if="store.error" class="status-container error">
      <h2>Initialization Failed</h2>
      <p>{{ store.error }}</p>
    </div>
    
    <div v-else class="tool-view">
      <div class="tool-header">
        <h1>Compliance Estimator</h1>
        <div class="header-buttons">
          <button @click="printReport" class="print-report-btn" title="Print Report">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
          </button>
          <button @click="store.resetInput()" class="reset-button">Reset Fields</button>
          <button @click="showHelp = true" class="icon-help-button" title="Help & Methodology">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          </button>
        </div>
      </div>
      <p class="tool-description">
        Estimate a cartridge's dynamic compliance at 10Hz based on other known specifications.
        The more details you provide, the higher the confidence in the result. The calculation updates in real-time.
      </p>

      <div class="estimator-grid">
        <EstimatorInputPanel />
        <EstimatorResultsPanel :result="store.result" />
        <EstimatorChart 
          v-if="store.result.chartConfig && store.result.chartConfig.dataPoints.length > 0"
          :chart-config="store.result.chartConfig"
        />
      </div>

      <div class="data-summary-panel panel">
        <h3>Data Source Information</h3>
        <div class="summary-items">
          <div class="summary-item">
            <span class="label">Total Cartridges in Database:</span>
            <span class="value">{{ store.allPickups.length }}</span>
          </div>
          <div v-if="store.estimationRules && store.estimationRules.timestamp" class="summary-item">
            <span class="label">Analysis Last Updated:</span>
            <span class="value">{{ new Date(store.estimationRules.timestamp).toLocaleDateString() }}</span>
          </div>
        </div>
        <p class="summary-note">
          This tool's intelligence relies on our growing open-source database.
          The analysis is periodically updated by running a machine learning script on the available data.
        </p>
      </div>
      
      <HelpModal :isOpen="showHelp" @close="showHelp = false">
        <template #header>
          <h2>Estimator Methodology</h2>
        </template>
        <template #default>
          <h4>How It Works</h4>
          <p>This tool estimates a cartridge's dynamic compliance at 10Hz, which is the standard frequency for matching with a tonearm's effective mass. Many manufacturers, especially from Japan, only provide a measurement at 100Hz.</p>
          <p>Historically, a simple multiplier (e.g., 1.5x to 2x) was used to convert the 100Hz value. This tool improves upon that by using a data-driven, hierarchical approach.</p>
          <hr>
          
          <h4>The Hierarchical Rule System</h4>
          <p>The estimator uses a pre-calculated set of rules generated from a database of cartridges. It attempts to find the most specific rule that matches your input, in the following order of priority:</p>
          <ol>
              <li><strong>Priority 1 (Most Specific):</strong> Looks for a rule matching the cartridge's <strong>Type, Cantilever Class, and Stylus Family</strong>.</li>
              <li><strong>Priority 2:</strong> If no match is found, it looks for a rule matching just the <strong>Type and Cantilever Class</strong>.</li>
              <li><strong>Priority 3:</strong> If still no match, it looks for a rule matching only the <strong>Type</strong>.</li>
              <li><strong>Global Fallback:</strong> If no specific rule can be found, it uses a general conversion factor calculated from all relevant cartridges in the database.</li>
          </ol>
          <p>The confidence level and the description text in the results panel will tell you exactly which level of rule was used for your estimate.</p>
          <hr>

          <h4>Frequently Asked Questions (FAQ)</h4>
          <h5>Why is the 'sample size' sometimes a low number?</h5>
          <p>
            This is a sign of <strong>high precision</strong>, not a lack of data. To be included in the statistical analysis, a pickup in our database must have a known value for <strong>BOTH 100Hz and 10Hz</strong> compliance.
          </p>
          <p>
            A "sample size" of 18 for a high-priority rule means the system has found a very specific and homogenous group of 18 pickups that match <em>all your criteria</em> and also have complete data for analysis. This provides a more reliable estimate than a general rule based on hundreds of different pickups. The "Confidence Level" takes this into account.
          </p>
          
          <h5>What if I only have a static compliance value?</h5>
          <p>
            The tool can use static compliance as a fallback if the 100Hz value is missing. It then applies a well-established rule of thumb: dynamic compliance at 10Hz is roughly half (50%) of the static value. Since this is a general approximation and not a data-driven rule, this method receives a fixed, medium confidence score (50%).
          </p>

          <h5>Why are Cantilever Class and Stylus Family optional?</h5>
          <p>
            The tool works with just the basics (Type and one compliance value). However, by providing more details, you allow the estimation engine to find a more specific, and therefore likely more accurate, rule. Adding these details will usually increase the confidence level of the result.
          </p>

          <hr>
          <h4>Why Data Matters</h4>
          <p>The accuracy of this tool is directly proportional to the quality and quantity of data in the underlying `pickup_data.json` file. The more cartridges with known 10Hz and 100Hz values we have, the more precise and reliable the generated rules become. The statistical analysis only creates rules for combinations with a sufficient number of data points to be considered meaningful.</p>
        </template>
      </HelpModal>
    </div>

    <div v-else class="status-container error">
      <h2>An Unexpected Error Occurred</h2>
      <p>Could not render the tool. The state after loading was not as expected. Please see debug log below.</p>
      <ol class="debug-log">
        <li v-for="(entry, index) in store.debugLog" :key="index">{{ entry }}</li>
      </ol>
    </div>
  </div>
</template>

<style scoped>
.debug-log { text-align: left; background: #fff; border: 1px solid #ddd; padding: 1rem; padding-left: 3rem; border-radius: 4px; font-family: monospace; font-size: 0.85rem; color: #333; max-height: 300px; overflow-y: auto; }
.status-container { padding: 2rem; text-align: center; background-color: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 6px; }
.status-container.error { background-color: var(--danger-color); color: var(--danger-text); border-color: #f5c6cb; }
.status-container pre { white-space: pre-wrap; word-wrap: break-word; text-align: left; background-color: rgba(0,0,0,0.05); padding: 1rem; border-radius: 4px; }
.tool-view { display: flex; flex-direction: column; }
.tool-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding-bottom: 1rem; margin-bottom: 0.5rem; border-bottom: 1px solid var(--border-color); }
.tool-header h1 { margin: 0; font-size: 1.75rem; color: var(--header-color); }
.header-buttons { display: flex; align-items: center; gap: 0.5rem; }
.reset-button { padding: 0.5rem 1rem; font-size: 0.9rem; font-weight: 600; color: var(--label-color); background-color: transparent; border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; transition: all 0.2s ease; }
.reset-button:hover { background-color: #f8f9fa; border-color: #adb5bd; color: var(--text-color); }
.icon-help-button { background: none; border: 1px solid transparent; border-radius: 50%; cursor: pointer; color: var(--label-color); display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; transition: all 0.2s ease; padding: 0; }
.icon-help-button:hover { background-color: #e9ecef; border-color: var(--border-color); color: var(--text-color); }
.tool-description { margin-top: 0; margin-bottom: 2rem; color: var(--label-color); max-width: 80ch; }
.estimator-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem; align-items: start; }
.data-summary-panel { margin-top: 2rem; padding: 1rem 1.5rem; background-color: #f8f9fa; grid-column: 1 / -1; }
.data-summary-panel h3 { margin-top: 0; margin-bottom: 1rem; font-size: 1.1rem; color: var(--header-color); border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
.summary-items { display: flex; gap: 2rem; margin-bottom: 1rem; flex-wrap: wrap; }
.summary-item { display: flex; flex-direction: column; }
.summary-item .label { font-size: 0.9rem; color: var(--label-color); margin-bottom: 0.25rem; }
.summary-item .value { font-size: 1.1rem; font-weight: 600; color: var(--text-color); }
.summary-note { font-size: 0.85rem; color: #6c757d; font-style: italic; margin: 0; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color); }
.print-report-btn { background: none; border: 1px solid var(--border-color); border-radius: 50%; cursor: pointer; color: var(--label-color); display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; transition: all 0.2s ease; padding: 0; }
.print-report-btn:hover { background-color: #e9ecef; color: var(--text-color); }
</style>
