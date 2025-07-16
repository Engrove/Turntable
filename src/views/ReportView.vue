<!-- src/views/ReportView.vue -->
<script setup>
import { computed } from 'vue';
import { useReportStore } from '@/store/reportStore';
import { useRouter } from 'vue-router';
import EstimatorChart from '@/components/EstimatorChart.vue';

const reportStore = useReportStore();
const router = useRouter();

const reportData = computed(() => reportStore.reportData);
const generationDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

const reportTitle = computed(() => {
  if (!reportData.value) return "Error: No Report Data";
  return reportData.value.type === 'tonearm'
    ? 'Tonearm Resonance Report'
    : 'Compliance Estimation Report';
});

// NYTT: Dynamisk länk för att gå tillbaka till rätt verktyg
const backRoute = computed(() => {
    if (!reportData.value) return { name: 'home' };
    return reportData.value.type === 'tonearm'
        ? { name: 'tonearm-calculator' }
        : { name: 'compliance-estimator' };
});

const printReport = () => window.print();
function goHome() {
    router.push({ name: 'home' });
}
const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

// ... resten av computed-properties förblir oförändrade ...
const filteredEstimatorParams = computed(() => {
    const def = [{ key: 'cu_dynamic_100hz', label: 'Compliance @ 100Hz' }, { key: 'cu_static', label: 'Static Compliance' }, { key: 'type', label: 'Pickup Type' }, { key: 'cantilever_class', label: 'Cantilever Class' }, { key: 'stylus_family', label: 'Stylus Family' }];
    if (!reportData.value?.userInput) return [];
    return def.filter(p => reportData.value.userInput[p.key] !== null && reportData.value.userInput[p.key] !== undefined && reportData.value.userInput[p.key] !== '');
});
const tonearmParamsDetailed = computed(() => {
    if (!reportData.value?.params) return [];
    const def = [{ key: 'm_headshell', label: 'Headshell Mass', unit: 'g' }, { key: 'm_pickup', label: 'Cartridge Mass', unit: 'g' }, { key: 'm_screws', label: 'Screws Mass', unit: 'g' }, { key: 'compliance', label: 'Compliance @ 10Hz', unit: 'cu' }, { key: 'vtf', label: 'Tracking Force', unit: 'g' }, { key: 'L1', label: 'Effective Length', unit: 'mm' }, { key: 'm_rear_assembly', label: 'Rear Assembly Mass', unit: 'g'}, { key: 'm4_adj_cw', label: 'Adjustable CW Mass', unit: 'g' }];
    return def.filter(p => reportData.value.params[p.key] !== null && reportData.value.params[p.key] !== undefined);
});
const tonearmParamsDirect = computed(() => {
    if (!reportData.value?.params) return [];
    const def = [{ key: 'm_pickup', label: 'Cartridge Mass', unit: 'g' }, { key: 'compliance', label: 'Compliance @ 10Hz', unit: 'cu' }, { key: 'directEffectiveMass', label: 'Tonearm Effective Mass', unit: 'g' }];
    return def.filter(p => reportData.value.params[p.key] !== null && reportData.value.params[p.key] !== undefined);
});
const frontMassMoment = computed(() => reportData.value ? reportData.value.m1 * reportData.value.params.L1 : 0);
const vtfMoment = computed(() => reportData.value ? reportData.value.params.vtf * reportData.value.params.L1 : 0);
const totalFrontMoment = computed(() => frontMassMoment.value + vtfMoment.value);
const m3Moment = computed(() => reportData.value ? reportData.value.m3_fixed_cw * reportData.value.params.L3_fixed_cw : 0);
const m4Moment = computed(() => reportData.value ? reportData.value.params.m4_adj_cw * reportData.value.results.L4_adj_cw : 0);
const totalRearMoment = computed(() => m3Moment.value + m4Moment.value);
const i1 = computed(() => reportData.value ? reportData.value.m1 * (reportData.value.params.L1 ** 2) : 0);
const i2 = computed(() => reportData.value ? reportData.value.m2_tube * (reportData.value.params.L2 ** 2) : 0);
const i3 = computed(() => reportData.value ? reportData.value.m3_fixed_cw * (reportData.value.params.L3_fixed_cw ** 2) : 0);
const i4 = computed(() => reportData.value ? reportData.value.params.m4_adj_cw * (reportData.value.results.L4_adj_cw ** 2) : 0);
const totalInertia = computed(() => i1.value + i2.value + i3.value + i4.value);
const resultRange = computed(() => {
    if (!reportData.value?.result?.compliance_median) return '--';
    const { compliance_min, compliance_median, compliance_max } = reportData.value.result;
    if (compliance_min && compliance_max && compliance_min.toFixed(1) !== compliance_max.toFixed(1)) {
        return `${compliance_min.toFixed(1)} – ${compliance_max.toFixed(1)}`;
    }
    return compliance_median.toFixed(1);
});
const showMedianNote = computed(() => {
    if (!reportData.value?.result?.compliance_median) return false;
    const { compliance_min, compliance_max } = reportData.value.result;
    return compliance_min && compliance_max && compliance_min.toFixed(1) !== compliance_max.toFixed(1);
});
const confidenceLevel = computed(() => {
    if (!reportData.value?.result) return 'N/A';
    const conf = reportData.value.result.confidence;
    if (conf >= 80) return 'High';
    if (conf >= 60) return 'Medium';
    return 'Low';
});
const confidenceClass = computed(() => {
    if (!reportData.value?.result) return '';
    const conf = reportData.value.result.confidence;
    if (conf >= 80) return 'ideal';
    if (conf >= 60) return 'warning';
    return 'danger';
});

</script>

<template>
  <div class="report-wrapper">
    <!-- Huvud-diven har nu klassen panel för att smälta in -->
    <div class="panel"> 
        <header class="report-header">
            <!-- NYTT: Tillbaka-knapp -->
            <router-link :to="backRoute" class="back-button">← Back to Tool</router-link>
            <div class="header-main">
                <h1>{{ reportTitle }}</h1>
                <p v-if="reportData">Generated by Engrove Audio Toolkit on {{ generationDate }}</p>
            </div>
            <button v-if="reportData" @click="printReport" class="print-button">Print or Save as PDF</button>
        </header>

        <main class="report-content" v-if="reportData">
            <!-- Tonearm Report Section -->
            <section v-if="reportData.type === 'tonearm'" class="report-section">
                <h2>Tonearm Resonance Calculation</h2>
                <div class="data-grid">
                    <div class="data-group">
                        <h3>Input Parameters</h3>
                        <ul>
                            <template v-if="reportData.params.calculationMode === 'detailed'">
                                <li v-for="param in tonearmParamsDetailed" :key="param.key">
                                    <strong>{{ param.label }}:</strong>
                                    <span>{{ reportData.params[param.key] }} {{ param.unit }}</span>
                                </li>
                            </template>
                            <template v-else>
                                <li v-for="param in tonearmParamsDirect" :key="param.key">
                                    <strong>{{ param.label }}:</strong>
                                    <span>{{ reportData.params[param.key] }} {{ param.unit }}</span>
                                </li>
                            </template>
                        </ul>
                    </div>
                    <div class="data-group">
                        <h3>Calculated Results</h3>
                        <ul>
                            <li v-if="reportData.results.isUnbalanced && reportData.params.calculationMode === 'detailed'"><strong>Status:</strong> <span class="danger-text">Unbalanced</span></li>
                            <li v-if="!reportData.results.isUnbalanced || reportData.params.calculationMode === 'direct'"><strong>Effective Mass:</strong> <span>{{ reportData.results.M_eff.toFixed(1) }} g</span></li>
                            <li v-if="!reportData.results.isUnbalanced || reportData.params.calculationMode === 'direct'"><strong>Resonance Frequency:</strong> <span class="final-result">{{ reportData.results.F.toFixed(1) }} Hz</span></li>
                        </ul>
                        <div v-if="!reportData.results.isUnbalanced || reportData.params.calculationMode === 'direct'" class="diagnosis-box" :class="reportData.diagnosis.status">
                            <h4>{{ reportData.diagnosis.title }}</h4>
                            <p>{{ reportData.diagnosis.recommendations.join(' ') }}</p>
                        </div>
                    </div>
                </div>
                <div class="visualizations-container" v-if="reportData.params.calculationMode === 'detailed' && !reportData.results.isUnbalanced">
                    <div class="viz-panel report-section">
                        <h3>Static Balance (Moment Equilibrium)</h3>
                        <div class="balance-diagram">
                            <div class="balance-side"><div class="moment-box front"><div class="moment-item">m₁ × L₁ = {{ formatNumber(frontMassMoment) }} g·mm</div><div class="moment-item vtf">+ VTF × L₁ = {{ formatNumber(vtfMoment) }} g·mm</div><div class="moment-total">Total Front: <span>{{ formatNumber(totalFrontMoment) }} g·mm</span></div></div></div>
                            <div class="pivot-point">▲</div>
                            <div class="balance-side"><div class="moment-box rear"><div class="moment-item">m₃ × L₃ = {{ formatNumber(m3Moment) }} g·mm</div><div class="moment-item">m₄ × D = {{ formatNumber(m4Moment) }} g·mm</div><div class="moment-total">Total Rear: <span>{{ formatNumber(totalRearMoment) }} g·mm</span></div></div></div>
                        </div>
                    </div>
                    <div class="viz-panel report-section">
                        <h3>Rotational Inertia (Effective Mass Contribution)</h3>
                        <div class="inertia-diagram">
                            <div class="inertia-bar"><div class="segment i1" :style="{ flexGrow: i1 }"></div><div class="segment i2" :style="{ flexGrow: i2 }"></div><div class="segment i3" :style="{ flexGrow: i3 }"></div><div class="segment i4" :style="{ flexGrow: i4 }"></div></div>
                            <div class="inertia-legend">
                                <div><span class="dot i1"></span>I₁: {{ formatNumber(i1) }}</div>
                                <div><span class="dot i2"></span>I₂: {{ formatNumber(i2) }}</div>
                                <div><span class="dot i3"></span>I₃: {{ formatNumber(i3) }}</div>
                                <div><span class="dot i4"></span>I₄: {{ formatNumber(i4) }}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Compliance Estimator Report Section -->
            <section v-if="reportData.type === 'estimator'" class="report-section">
                <h2>Compliance Estimation</h2>
                <div class="data-grid">
                    <div class="data-group">
                        <h3>Input Specifications</h3>
                        <ul>
                            <li v-for="param in filteredEstimatorParams" :key="param.key">
                                <strong>{{ param.label }}:</strong>
                                <span>{{ reportData.userInput[param.key] }}</span>
                            </li>
                        </ul>
                    </div>
                    <div class="data-group">
                        <h3>Estimated Result</h3>
                        <div class="main-result">
                            <div class="result-value">{{ resultRange }}<span>µm/mN @ 10Hz</span></div>
                            <p v-if="showMedianNote" class="median-note">(Median Estimate: {{ reportData.result.compliance_median.toFixed(1) }})</p>
                        </div>
                        <div class="diagnosis-box" :class="confidenceClass">
                            <h4>Confidence: {{ confidenceLevel }} ({{ reportData.result.confidence }}%)</h4>
                            <p>{{ reportData.result.description }} (Sample size: {{ reportData.result.sampleSize }})</p>
                        </div>
                    </div>
                </div>
                <div class="chart-wrapper" v-if="reportData.result.chartConfig">
                    <h3>Reference Data & Trend Line</h3>
                    <EstimatorChart :chart-config="reportData.result.chartConfig" />
                </div>
            </section>
        </main>

        <main v-else class="report-content">
            <div class="error-box">
                <h2>Error: No Report Data Found</h2>
                <p>Please return to the previous tool and click "Generate Report" again.</p>
                <button @click="goHome" class="home-link">Return to Home</button>
            </div>
        </main>

        <footer class="report-footer">
            <h3>Disclaimer</h3>
            <p>This report is provided as a design aid for theoretical exploration and educational purposes. The calculations are based on established physical principles but are the product of a hobbyist project. Data is compiled from publicly available sources.</p>
            <p>While every effort is made to verify accuracy, there is no guarantee of the absolute correctness of the data or calculations. Users are encouraged to cross-reference the results with their own measurements and practical experience. The ultimate responsibility for any physical build or component matching rests with the user.</p>
        </footer>
    </div>
  </div>
</template>

<style scoped>
/* Behåll alla befintliga stilar och lägg till/justera dessa */

/* Gör så att rapporten inte ser ut som en separat sida på skärmen */
.report-wrapper {
  max-width: none;
  margin: 0;
  padding: 0;
  background-color: transparent;
  border: none;
  box-shadow: none;
}

/* Header-justeringar för ny layout */
.report-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    text-align: left;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--border-color);
}
.header-main {
    text-align: center;
    flex-grow: 1;
}
.header-main h1 {
    font-size: 1.75rem; /* Mindre titel för att passa bättre i layouten */
    margin: 0;
}
.header-main p {
    margin: 0.25rem 0 0 0;
    font-size: 0.9rem;
}

/* Ny tillbaka-knapp */
.back-button {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--label-color);
    background-color: #fff;
    border: 1px solid var(--border-color);
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    text-decoration: none;
    transition: all 0.2s ease;
}
.back-button:hover {
    background-color: var(--panel-bg);
    border-color: #adb5bd;
    color: var(--text-color);
}

.report-content {
    background-color: #fff;
    padding: 2rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
}

/* Specifika utskriftsstilar */
@media print {
  body {
      background-color: #fff !important;
  }
  .report-wrapper {
      /* Inga specifika regler behövs här längre då App.vue hanterar layouten */
  }
  .report-content {
      box-shadow: none;
      border: none;
      padding: 0;
      border-radius: 0;
  }
  .report-header {
      text-align: center;
      justify-content: center;
  }
  .back-button, .print-button {
      display: none;
  }
  .visualizations-container, .chart-wrapper {
      page-break-inside: avoid;
  }
  .chart-wrapper :deep(.chart-panel) {
      height: 350px !important;
      padding: 0 !important;
      border: 1px solid #ccc !important;
  }
}

/* Behåll all annan CSS oförändrad */
.data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
.data-group h3 { font-size: 1.2rem; margin-top: 0; margin-bottom: 1rem; color: var(--accent-color); }
.data-group ul { list-style: none; padding: 0; margin: 0; }
.data-group li { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #f0f0f0; }
.diagnosis-box { margin-top: 1.5rem; padding: 1rem; border-radius: 6px; }
.diagnosis-box.ideal { background-color: var(--ideal-color); color: var(--ideal-text); border: 1px solid #c3e6cb; }
.diagnosis-box.warning { background-color: var(--warning-color); color: var(--warning-text); border: 1px solid #ffeeba; }
.diagnosis-box.danger { background-color: var(--danger-color); color: var(--danger-text); border: 1px solid #f5c6cb; }
.main-result { text-align: center; padding: 1rem; background-color: var(--panel-bg); border-radius: 6px; margin-bottom: 1.5rem; }
.result-value { font-size: 2.5rem; font-weight: bold; line-height: 1; }
.result-value span { display: block; font-size: 1rem; font-weight: normal; color: var(--label-color); }
.median-note { font-size: 0.9rem; font-style: italic; color: var(--label-color); margin-top: 0.5rem; }
.report-footer { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #ddd; font-size: 0.8rem; color: #777; }
.error-box { padding: 2rem; text-align: center; background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; border-radius: 6px;}
.home-link { display: inline-block; margin-top: 1.5rem; padding: 0.75rem 1.5rem; background-color: var(--accent-color); color: white; text-decoration: none; font-weight: bold; border-radius: 6px; border: none; cursor: pointer; }
.visualizations-container { margin-top: 2rem; display: flex; flex-direction: column; gap: 1.5rem; }
.viz-panel { background-color: #f8f9fa; border: 1px solid var(--border-color); border-radius: 6px; padding: 1rem 1.5rem; }
.viz-panel h3 { font-size: 1.2rem; margin-top: 0; margin-bottom: 1rem; color: var(--header-color); }
.balance-diagram { display: flex; align-items: center; justify-content: center; padding: 1rem 0; }
.pivot-point { font-size: 2rem; color: #2c3e50; margin: 0 1rem; }
.balance-side { flex: 1; }
.moment-box { border: 1px solid #ccc; background-color: #fff; padding: 0.75rem; border-radius: 4px; font-family: monospace; font-size: 0.9rem; }
.moment-box.rear { text-align: left; }
.moment-box.front { text-align: right; }
.moment-item.vtf { color: #c0392b; }
.moment-total { border-top: 1px solid #ccc; margin-top: 0.5rem; padding-top: 0.5rem; font-weight: bold; }
.moment-total span { color: var(--accent-color); }
.inertia-bar { display: flex; width: 100%; height: 25px; border-radius: 4px; overflow: hidden; }
.segment { height: 100%; }
.inertia-legend { display: flex; justify-content: space-around; flex-wrap: wrap; gap: 1rem; margin-top: 0.75rem; font-size: 0.8rem; font-family: monospace; }
.dot { height: 10px; width: 10px; border-radius: 50%; display: inline-block; margin-right: 5px; vertical-align: middle; }
.i1 { background-color: #3498db; }
.i2 { background-color: #2ecc71; }
.i3 { background-color: #e67e22; }
.i4 { background-color: #9b59b6; }
.chart-wrapper { margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid #eee; }
.chart-wrapper h3 { text-align: center; font-size: 1.2rem; color: var(--header-color); margin-bottom: 1rem; }
@media (max-width: 600px) { .data-grid { grid-template-columns: 1fr; } .report-header { flex-direction: column; gap: 1rem; } }
</style>
