<script setup>
import { computed } from 'vue';

const props = defineProps({
  estimatedCompliance: {
    type: Number,
    default: null
  },
  confidence: {
    type: Number,
    required: true
  },
  sampleSize: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  }
});

// Bestämmer färg och text för konfidensnivån
const confidenceDetails = computed(() => {
  if (props.confidence >= 85) {
    return { level: 'High', class: 'high' };
  } else if (props.confidence >= 70) {
    return { level: 'Medium', class: 'medium' };
  } else if (props.confidence > 0) {
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
        <span v-if="estimatedCompliance" class="result-value">
          {{ estimatedCompliance.toFixed(1) }}
        </span>
        <span v-else class="result-placeholder">--</span>
        <span class="result-unit">µm/mN @ 10Hz</span>
      </div>
    </div>

    <div class="confidence-display">
      <div class="confidence-header">
        <span class="confidence-label">Confidence Level</span>
        <span
          v-if="confidence > 0"
          :class="['confidence-badge', confidenceDetails.class]"
        >
          {{ confidenceDetails.level }}
        </span>
      </div>
      <div class="confidence-bar-container">
        <div
          class="confidence-bar"
          :class="confidenceDetails.class"
          :style="{ width: confidence + '%' }"
        ></div>
      </div>
      <span v-if="confidence > 0" class="confidence-percent">{{ confidence }}%</span>
    </div>

    <div class="description-box">
      <p v-if="confidence > 0">
        Estimate based on a comparison with
        <strong>{{ sampleSize }}</strong> similar cartridge(s) in our database.
      </p>
      <p v-else>
        Please provide more data, including 'Pickup Type' and at least one compliance value, to get an estimate.
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
</style>
