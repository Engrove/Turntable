<!-- src/views/ComplianceEstimatorView.vue -->
<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useHead } from '@unhead/vue';
import { useEstimatorStore } from '@/store/estimatorStore.js';
import EstimatorInputPanel from '@/components/EstimatorInputPanel.vue';
import EstimatorResultsPanel from '@/components/EstimatorResultsPanel.vue';
import EstimatorChart from '@/components/EstimatorChart.vue';
import InfoPanel from '@/components/InfoPanel.vue';
import HelpModal from '@/components/HelpModal.vue';
import { html as complianceContent } from '@/content/complianceEstimator.md';

const store = useEstimatorStore();
const showHelp = ref(false);
const router = useRouter();

useHead({
  title: 'Cartridge Compliance Estimator | Engrove Audio Toolkit',
  meta: [
    { name: 'description', content: 'Estimate a cartridge\'s dynamic compliance at 10Hz using its 100Hz or static compliance value. A data-driven tool for better tonearm matching.' },
    { property: 'og:title', content: 'Cartridge Compliance Estimator | Engrove Audio Toolkit' },
    { property: 'og:description', content: 'A data-driven tool to estimate cartridge compliance for better tonearm matching.' },
  ],
});

onMounted(() => {
  if (!store.estimationRules || !store.staticEstimationRules) {
    store.initialize();
  }
  store.calculateEstimate();
});

watch(() => store.userInput, () => {
  store.calculateEstimate();
}, { deep: true });

function generateReport() {
  const data = store.getReportData();
  // KORRIGERING: Använd encodeURIComponent för att göra Base64-strängen URL-säker.
  const encodedData = encodeURIComponent(btoa(JSON.stringify(data)));
  router.push({ name: 'report', query: { data: encodedData } });
}
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
      <h4>Debug Progression:</h4>
      <ol class="debug-log">
        <li v-for="(entry, index) in store.debugLog" :key="index">{{ entry }}</li>
      </ol>
    </div>
    
    <div v-else-if="store.estimationRules && store.allPickups.length > 0" class="tool-view">
      <div class="tool-header">
        <h1>Compliance Estimator</h1>
        <div class="header-buttons">
          <button @click="generateReport" class="report-button">Generate Report</button>
          <button @click="store.resetInput()" class="reset-button" title="Reset all fields">Reset Fields</button>
          <button @click="showHelp = true" class="icon-help-button" title="Help & Methodology">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
          </button>
        </div>
      </div>
      
      <InfoPanel :content-html="complianceContent" @open-technical-help="showHelp = true" />

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
          <p>This tool estimates a cartridge's dynamic compliance at 10Hz, which is the standard frequency for matching with a tonearm's effective mass. Many manufacturers, especially from Japan, only provide a measurement at 100Hz, while others only provide a static compliance value.</p>
          <p>This tool improves upon simple multipliers (e.g., static × 0.5) by using a data-driven, hierarchical approach for both 100Hz and static compliance values.</p>
          <hr>
          <h4>The Hierarchical Rule System</h4>
          <p>For both methods, the estimator uses a pre-calculated set of rules generated from a database of cartridges. It attempts to find the most specific rule that matches your input, in the following order of priority:</p>
          <ol>
              <li><strong>Priority 1 (Most Specific):</strong> Looks for a rule matching the cartridge's <strong>Type, Cantilever Class, and Stylus Family</strong>.</li>
              <li><strong>Priority 2:</strong> If no match is found, it looks for a rule matching just the <strong>Type and Cantilever Class</strong>.</li>
              <li><strong>Priority 3:</strong> If still no match, it looks for a rule matching only the <strong>Type</strong>.</li>
              <li><strong>Global Fallback:</strong> If no specific rule can be found, it uses a general conversion factor or regression model calculated from all relevant cartridges in the database.</li>
          </ol>
          <p>The confidence level and the description text in the results panel will tell you exactly which level of rule was used for your estimate.</p>
          <hr>
          <h4>The Confidence Score</h4>
          <p>A detailed confidence score is calculated based on three factors from the applied rule:</p>
          <ul>
            <li><strong>Specificity (max 30 pts):</strong> How specific was the rule that matched your input? (e.g., a rule for "MC, Boron" is more specific than just "MC").</li>
            <li><strong>Sample Size (max 20 pts):</strong> How many data points was the rule based on? More data leads to higher confidence.</li>
            <li><strong>Regression Accuracy (R², max 25 pts):</strong> How well did a regression model fit the data for this segment? A higher R² value (closer to 1.0) means the variables have a strong correlation.</li>
          </ul>
          <p>These points are summed (max 75) and converted to a percentage, giving you a transparent look at the estimate's reliability.</p>
          <hr>
          <h4>Frequently Asked Questions (FAQ)</h4>
          <h5>Why is the 'sample size' sometimes a low number?</h5>
          <p>This is a sign of <strong>high precision</strong>, not a lack of data. To be included in the statistical analysis, a pickup in our database must have verified values for the parameters being compared (e.g., both 100Hz and 10Hz, or both static and 10Hz).</p>
          <p>A "sample size" of 18 for a high-priority rule means the system has found a very specific and homogenous group of 18 pickups that match <em>all your criteria</em> and also have complete data for analysis. This provides a more reliable estimate than a general rule based on hundreds of different pickups. The "Confidence Level" takes this into account.</p>
          <h5>Which input is better: 100Hz or Static Compliance?</h5>
          <p>Generally, a measured 100Hz value is a better starting point than a static value because it's a dynamic measurement. However, the confidence score will always give you the best indication of the estimate's reliability based on the available data for the specific rule applied.</p>
          <h5>Why are Cantilever Class and Stylus Family optional?</h5>
          <p>The tool works with just the basics (Type and one compliance value). However, by providing more details, you allow the estimation engine to find a more specific, and therefore likely more accurate, rule. Adding these details will usually increase the confidence level of the result.</p>
          <hr>
          <h4>Why Data Matters</h4>
          <p>The accuracy of this tool is directly proportional to the quality and quantity of data in the underlying `pickup_data.json` file. The more cartridges with known 10Hz, 100Hz, and static values we have, the more precise and reliable the generated rules become. The statistical analysis only creates rules for combinations with a sufficient number of data points to be considered meaningful.</p>
        </template>
      </HelpModal>
    </div>
    <div v-else class="status-container error">
      <h2>An Unexpected Error Occurred</h2>
      <p>Could not render the tool. The state after loading was not as expected. Please see debug log below.</p>
      <h4>Debug Progression:</h4>
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
.tool-view { display: flex; flex-direction: column; }
.tool-header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; padding-bottom: 0; margin-bottom: 0; border-bottom: none; }
.tool-header h1 { margin: 0; font-size: 1.75rem; color: var(--header-color); }
.header-buttons { display: flex; align-items: center; gap: 0.5rem; }
.report-button, .reset-button, .icon-help-button { transition: all 0.2s ease; }
.report-button { padding: 0.5rem 1rem; font-size: 0.9rem; font-weight: 600; color: var(--accent-color); background-color: transparent; border: 1px solid var(--accent-color); border-radius: 6px; cursor: pointer; }
.report-button:hover { background-color: var(--accent-color); color: white; }
.reset-button { padding: 0.5rem 1rem; font-size: 0.9rem; font-weight: 600; color: var(--label-color); background-color: transparent; border: 1px solid var(--border-color); border-radius: 6px; cursor: pointer; }
.reset-button:hover { background-color: #f8f9fa; border-color: #adb5bd; color: var(--text-color); }
.icon-help-button { background: none; border: 1px solid transparent; border-radius: 50%; cursor: pointer; color: var(--label-color); display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; padding: 0; }
.icon-help-button:hover { background-color: #e9ecef; border-color: var(--border-color); color: var(--text-color); }
.estimator-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem; align-items: start; margin-top: 0; }
.data-summary-panel { margin-top: 2rem; padding: 1rem 1.5rem; background-color: #f8f9fa; grid-column: 1 / -1; border: 1px solid var(--border-color); border-radius: 8px;}
.data-summary-panel h3 { margin-top: 0; margin-bottom: 1rem; font-size: 1.1rem; color: var(--header-color); border-bottom: 1px solid var(--border-color); padding-bottom: 0.5rem; }
.summary-items { display: flex; gap: 2rem; margin-bottom: 1rem; flex-wrap: wrap; }
.summary-item { display: flex; flex-direction: column; }
.summary-item .label { font-size: 0.9rem; color: var(--label-color); margin-bottom: 0.25rem; }
.summary-item .value { font-size: 1.1rem; font-weight: 600; color: var(--text-color); }
.summary-note { font-size: 0.85rem; color: #6c757d; font-style: italic; margin: 0; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color); }
</style>
