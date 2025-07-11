<!-- src/components/EstimatorResultsPanel.vue -->

<script setup>
import { computed } from 'vue';

const props = defineProps({
  result: {
    type: Object,
    required: true,
    default: () => ({
      compliance: null,
      confidence: 0,
      sampleSize: 0,
      description: 'Please enter data to begin.'
    })
  }
});

// Bestämmer färg och text för konfidensnivån baserat på procentvärdet.
const confidenceDetails = computed(() => {
  const conf = props.result.confidence;
  if (conf >= 80) {
    return { level: 'High', class: 'high' };
  } else if (conf >= 60) {
    return { level: 'Medium', class: 'medium' };
  } else if (conf > 0) {
    return { level: 'Low', class: 'low' };
  }
  return { level: 'N/A', class: 'none' };
});
</script>

<template>
  <div class="results-panel panel">
    <h2>Estimated Result</h2>

    <div class="result-display">
      <div class="value-wrapper">
        <span v-if="result.compliance !== null" class="result-value">
          {{ result.compliance.toFixed(1) }}
        </span>
        <span v-else class="result-placeholder">--</span>
        <span class="result-unit">µm/mN @ 10Hz</span>
      </div>
    </div>

    <div class="confidence-display">
      <div class="confidence-header">
        <span class="confidence-label">Confidence Level</span>
        <span
          v-if="result.confidence > 0"
          :class="['confidence-badge', confidenceDetails.class]"
        >
          {{ confidenceDetails.level }}
        </span>
      </div>
      <div class="confidence-bar-container">
        <div
          class="confidence-bar"
          :class="confidenceDetails.class"
          :style="{ width: result.confidence + '%' }"
        ></div>
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
.results-panel {
  text-align: center;
}

.result-display {
  background-color: var(--header-color);
  color: #fff;
  padding: 2rem 1rem;
  border-radius: 6px;
  margin-bottom: 2rem;
}

.value-wrapper {
  display: flex;
  justify-content: center;
  align-items: baseline;
  gap: 0.5rem;
}

.result-value {
  font-size: 4.5rem;
  font-weight: 700;
  line-height: 1;
}

.result-placeholder {
  font-size: 4.5rem;
  font-weight: 700;
  line-height: 1;
  color: #6c757d;
}

.result-unit {
  font-size: 1.25rem;
  font-weight: 300;
}

/* Confidence Display */
.confidence-display {
  margin-bottom: 1.5rem;
}

.confidence-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.confidence-label {
  font-weight: 600;
  color: var(--header-color);
  font-size: 1.1rem;
}

.confidence-badge {
  font-size: 0.8rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  color: #fff;
  text-transform: uppercase;
}

.confidence-bar-container {
  width: 100%;
  background-color: #e9ecef;
  height: 12px;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.25rem;
}

.confidence-bar {
  height: 100%;
  border-radius: 6px;
  transition: width 0.4s ease-out;
}

.confidence-percent {
  display: block;
  text-align: right;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--label-color);
}

/* Färgklasser för konfidens */
.high { background-color: #28a745; } /* Grön */
.medium { background-color: #ffc107; } /* Gul */
.low { background-color: #dc3545; } /* Röd */
.none { background-color: #6c757d; } /* Grå */

.confidence-badge.medium {
  color: var(--text-color);
}

/* Description Box */
.description-box {
  background-color: var(--panel-bg);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  color: var(--label-color);
  text-align: left;
}

.description-box p {
  margin: 0.5rem 0;
}

.sample-size-text {
  font-style: italic;
  font-size: 0.85rem;
  margin-top: 0.75rem;
  border-top: 1px dashed #ced4da;
  padding-top: 0.75rem;
}
</style>
