<!-- src/components/EstimatorResultsPanel.vue -->
<script setup>
import { computed } from 'vue';

const props = defineProps({
  result: {
    type: Object,
    required: true,
    default: () => ({
      compliance_min: null,
      compliance_median: null,
      compliance_max: null,
      confidence: 0,
      sampleSize: 0,
      description: 'Please enter data to begin.'
    })
  }
});

const confidenceDetails = computed(() => {
  const conf = props.result.confidence;
  if (conf >= 80) return { level: 'High', class: 'high' };
  if (conf >= 60) return { level: 'Medium', class: 'medium' };
  if (conf > 0) return { level: 'Low', class: 'low' };
  return { level: 'N/A', class: 'none' };
});

const showRange = computed(() => {
    return props.result.compliance_min !== null &&
           props.result.compliance_max !== null &&
           props.result.compliance_min.toFixed(2) !== props.result.compliance_max.toFixed(2);
});
</script>

<template>
  <div class="results-panel panel">
    <h2>Estimated Result</h2>

    <div class="result-display">
      <div class="value-wrapper">
        <template v-if="result.compliance_median !== null">
          <h2 class="result-value-main">
            <template v-if="showRange">
              {{ result.compliance_min.toFixed(1) }} – {{ result.compliance_max.toFixed(1) }}
            </template>
            <template v-else>
              {{ result.compliance_median.toFixed(1) }}
            </template>
          </h2>
        </template>
        <span v-else class="result-placeholder">--</span>
        
        <span class="result-unit">µm/mN @ 10Hz</span>
      </div>
      <p v-if="showRange" class="median-note">
          (Median Estimate: {{ result.compliance_median.toFixed(1) }})
      </p>
    </div>

    <div class="confidence-display">
      <div class="confidence-header">
        <span class="confidence-label">Confidence Level</span>
        <span v-if="result.confidence > 0" :class="['confidence-badge', confidenceDetails.class]">{{ confidenceDetails.level }}</span>
      </div>
      <div class="confidence-bar-container">
        <div class="confidence-bar" :class="confidenceDetails.class" :style="{ width: result.confidence + '%' }"></div>
      </div>
      <span v-if="result.confidence > 0" class="confidence-percent">{{ result.confidence }}%</span>
    </div>

    <div class="description-box">
      <p class="methodology-text">{{ result.description }}</p>
      <p v-if="result.sampleSize > 0" class="sample-size-text">
        (This rule is based on a sample of <strong>{{ result.sampleSize }}</strong> cartridges from the database.)
      </p>
    </div>
  </div>
</template>

<style scoped>
.results-panel { text-align: center; }
.result-display { background-color: var(--header-color); color: #fff; padding: 1.5rem 1rem; border-radius: 6px; margin-bottom: 2rem; }
.value-wrapper { display: flex; justify-content: center; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; }

.result-value-main {
  font-size: 3.5rem;
  font-weight: 700;
  line-height: 1;
  margin: 0;
  white-space: nowrap;
  color: #fff; /* <-- KORRIGERING: Sätt vit textfärg explicit */
}
.result-placeholder { font-size: 4.5rem; font-weight: 700; line-height: 1; color: #6c757d; }
.result-unit { font-size: 1.25rem; font-weight: 300; }
.median-note {
    font-size: 0.9rem;
    font-style: italic;
    color: var(--text-muted);
    margin: 0.5rem 0 0 0;
}
.confidence-display { margin-bottom: 1.5rem; }
.confidence-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
.confidence-label { font-weight: 600; color: var(--header-color); font-size: 1.1rem; }
.confidence-badge { font-size: 0.8rem; font-weight: 700; padding: 0.2rem 0.6rem; border-radius: 12px; color: #fff; text-transform: uppercase; }
.confidence-bar-container { width: 100%; background-color: #e9ecef; height: 12px; border-radius: 6px; overflow: hidden; margin-bottom: 0.25rem; }
.confidence-bar { height: 100%; border-radius: 6px; transition: width 0.4s ease-out; }
.confidence-percent { display: block; text-align: right; font-weight: 600; font-size: 0.9rem; color: var(--label-color); }
.high { background-color: #28a745; }
.medium { background-color: #ffc107; }
.low { background-color: #dc3545; }
.none { background-color: #6c757d; }
.confidence-badge.medium { color: var(--text-color); }
.description-box { background-color: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 4px; padding: 0.5rem 1rem; font-size: 0.9rem; color: var(--label-color); text-align: left; }
.description-box p { margin: 0.5rem 0; }
.sample-size-text { font-style: italic; font-size: 0.85rem; margin-top: 0.75rem; border-top: 1px dashed #ced4da; padding-top: 0.75rem; }
</style>
