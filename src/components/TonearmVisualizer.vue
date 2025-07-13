<!-- src/components/TonearmVisualizer.vue -->
<script setup>
import { useTonearmStore } from '@/store/tonearmStore.js'
import { computed } from 'vue'

const store = useTonearmStore()

// --- Beräkningar för Balansdiagram ---
const frontMassMoment = computed(() => store.m1 * store.params.L1);
const vtfMoment = computed(() => store.params.vtf * store.params.L1);
const totalFrontMoment = computed(() => frontMassMoment.value + vtfMoment.value);

// KORRIGERING: Använder nu store.m3_fixed_cw direkt (utan .value)
const m3Moment = computed(() => store.m3_fixed_cw * store.params.L3_fixed_cw);
const m4Moment = computed(() => store.params.m4_adj_cw * store.calculatedResults.L4_adj_cw);
const totalRearMoment = computed(() => m3Moment.value + m4Moment.value);

// --- Beräkningar för Inertia-diagram ---
const i1 = computed(() => store.m1 * (store.params.L1 ** 2));
const i2 = computed(() => store.m2_tube * (store.params.L2 ** 2));
// KORRIGERING: Använder nu store.m3_fixed_cw direkt (utan .value)
const i3 = computed(() => store.m3_fixed_cw * (store.params.L3_fixed_cw ** 2));
const i4 = computed(() => store.params.m4_adj_cw * (store.calculatedResults.L4_adj_cw ** 2));
const totalInertia = computed(() => i1.value + i2.value + i3.value + i4.value);

const formatNumber = (num) => {
  if (num === null || num === undefined || isNaN(num)) return 'N/A';
  return num.toLocaleString('en-US', { maximumFractionDigits: 0 });
};

</script>

<template>
  <div class="visualizer-wrapper" v-if="!store.calculatedResults.isUnbalanced">
    
    <!-- ======================= -->
    <!-- === BALANSDIAGRAM === -->
    <!-- ======================= -->
    <div class="viz-panel">
      <h4 class="viz-title">1. Static Balance (Moment Equilibrium)</h4>
      <p class="viz-description">This diagram shows how the tonearm achieves balance. The total moment (mass × distance) on the front must be balanced by the rear moment to achieve the desired Vertical Tracking Force (VTF).</p>
      
      <div class="balance-diagram">
        <div class="balance-side">
          <div class="moment-box front">
            <div class="moment-item">m<sub>1</sub> × L<sub>1</sub> = {{ formatNumber(frontMoment) }} g·mm</div>
            <div class="moment-item vtf">+ VTF × L<sub>1</sub> = {{ formatNumber(vtfMoment) }} g·mm</div>
            <div class="moment-total">Total Front Moment: <span>{{ formatNumber(totalFrontMoment) }} g·mm</span></div>
          </div>
        </div>
        <div class="pivot-point">▲</div>
        <div class="balance-side">
          <div class="moment-box rear">
            <div class="moment-item">m<sub>3</sub> × L<sub>3</sub> = {{ formatNumber(m3Moment) }} g·mm</div>
            <div class="moment-item">m<sub>4</sub> × D = {{ formatNumber(m4Moment) }} g·mm</div>
            <div class="moment-total">Total Rear Moment: <span>{{ formatNumber(totalRearMoment) }} g·mm</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ====================== -->
    <!-- === INERTIA-DIAGRAM === -->
    <!-- ====================== -->
    <div class="viz-panel">
      <h4 class="viz-title">2. Rotational Inertia (Effective Mass Contribution)</h4>
      <p class="viz-description">This diagram shows how each component contributes to the total Moment of Inertia (I = m × d²). The final effective mass is this total inertia divided by the effective length squared (L₁²).</p>
      
      <div class="inertia-diagram">
        <div class="inertia-bar">
          <div class="segment i1" :style="{ flexGrow: i1 }"><span>I<sub>1</sub></span></div>
          <div class="segment i2" :style="{ flexGrow: i2 }"><span>I₂</span></div>
          <div class="segment i3" :style="{ flexGrow: i3 }"><span>I₃</span></div>
          <div class="segment i4" :style="{ flexGrow: i4 }"><span>I₄</span></div>
        </div>
        <div class="inertia-legend">
          <div><span class="dot i1"></span>I<sub>1</sub> (Front): {{ formatNumber(i1) }} g·mm²</div>
          <div><span class="dot i2"></span>I₂ (Armwand): {{ formatNumber(i2) }} g·mm²</div>
          <div><span class="dot i3"></span>I₃ (Fixed CW): {{ formatNumber(i3) }} g·mm²</div>
          <div><span class="dot i4"></span>I₄ (Adj. CW): {{ formatNumber(i4) }} g·mm²</div>
        </div>
      </div>
      <!-- NY, TYDLIGARE LAYOUT FÖR SLUTBERÄKNING -->
      <div class="final-calc">
        <div class="formula-line">
            <div class="term">M<sub>eff</sub></div>
            <div class="operator">=</div>
            <div class="fraction">
                <span class="numerator">I<sub>1</sub> + I₂ + I₃ + I₄</span>
                <span class="denominator">L₁<sup>2</sup></span>
            </div>
            <div class="operator">=</div>
            <div class="fraction">
                <span class="numerator">{{ formatNumber(totalInertia) }}</span>
                <span class="denominator">{{ store.params.L1 }}<sup>2</sup></span>
            </div>
             <div class="operator">=</div>
            <div class="term final-value">{{ store.calculatedResults.M_eff.toFixed(1) }} g</div>
        </div>
      </div>
    </div>

  </div>
  <div v-else class="visualizer-wrapper unbalanced-message">
      Arm is unbalanced. Cannot display detailed visualization. Please adjust parameters.
  </div>
</template>

<style scoped>
.visualizer-wrapper {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.viz-panel {
  background-color: #f8f9fa;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 1rem 1.5rem;
}
.viz-title {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 1rem;
  font-weight: 600;
  color: var(--header-color);
  margin: 0 0 0.5rem 0;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 0.5rem;
}
.viz-description {
  font-size: 0.85rem;
  color: var(--label-color);
  margin: 0 0 1rem 0;
  line-height: 1.5;
}
.balance-diagram {
  display: flex;
  align-items: center;
  justify-content: center;
  background-image: linear-gradient(to right, #e0e0e0 1px, transparent 1px);
  background-size: 20px 100%;
  padding: 1rem 0;
}
.pivot-point {
  font-size: 2rem;
  color: #2c3e50;
  margin: 0 1rem;
}
.balance-side {
  flex: 1;
}
.moment-box {
  border: 1px solid #ccc;
  background-color: #fff;
  padding: 0.75rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9rem;
  text-align: right;
}
.moment-box.rear { text-align: left; }
.moment-item {
  padding: 0.2rem 0;
}
.moment-item.vtf {
    color: #c0392b;
}
.moment-total {
  border-top: 1px solid #ccc;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  font-weight: bold;
}
.moment-total span {
  color: var(--accent-color);
}
.inertia-diagram {
    margin-top: 1rem;
}
.inertia-bar {
  display: flex;
  width: 100%;
  height: 25px;
  border-radius: 4px;
  overflow: hidden;
  background-color: #e9ecef;
}
.segment {
  height: 100%;
  transition: flex-grow 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.segment span {
  color: white;
  font-weight: bold;
  font-size: 0.8rem;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
}
.inertia-legend {
  display: flex;
  justify-content: space-around;
  margin-top: 0.75rem;
  font-size: 0.8rem;
  font-family: monospace;
}
.dot {
  height: 10px;
  width: 10px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 5px;
}
.i1 { background-color: #3498db; }
.i2 { background-color: #2ecc71; }
.i3 { background-color: #e67e22; }
.i4 { background-color: #9b59b6; }

.final-calc {
  margin-top: 1rem;
  padding: 0.75rem;
  background-color: #e9ecef;
  border: 1px solid #ced4da;
  border-radius: 4px;
  text-align: center;
  font-family: monospace;
  font-size: 0.95rem;
}
.final-calc span {
  font-weight: bold;
  font-size: 1.1em;
  color: #2c3e50;
}
.unbalanced-message {
    padding: 2rem;
    text-align: center;
    font-weight: 500;
    color: var(--danger-text);
    background-color: var(--danger-color);
    border: 1px solid #f5c6cb;
    border-radius: 6px;
}
</style>
