// src/views/AlignmentCalculatorView.vue
/**
* @file src/views/AlignmentCalculatorView.vue
* @description Huvudvyn för Alignment Calculator-verktyget.
* Denna komponent agerar som en container och orchestrerar alla underkomponenter
* som tillsammans utgör verktyget. Den hanterar laddnings- och feltillstånd
* och ser till att all data från storen skickas vidare till rätt komponent.
*/
import { ref, onMounted, computed } from 'vue';
import { useHead } from '@unhead/vue';
import { useAlignmentStore } from '@/store/alignmentStore.js';
import AlignmentInputPanel from '@/components/AlignmentInputPanel.vue';
import AlignmentResultsPanel from '@/components/AlignmentResultsPanel.vue';
import InfoPanel from '@/components/InfoPanel.vue';
import HelpModal from '@/components/HelpModal.vue';
import TrackingErrorChart from '@/components/TrackingErrorChart.vue';
import AlignmentGeometry from '@/components/AlignmentGeometry.vue';
import AlignmentProtractor from '@/components/AlignmentProtractor.vue';
import { html as alignmentContent } from '@/content/alignmentCalculator.md';

// Skapar en instans av storen
const store = useAlignmentStore();
const showHelp = ref(false);

// Beräknad egenskap för att avgöra om den valda armen är pivoterande
const isPivotingArm = computed(() => store.calculatedValues.trackingMethod === 'pivoting');

// Sätter sidans metadata för SEO och webbläsarfliken
useHead({
  title: 'Tonearm Alignment Calculator | Engrove Audio Toolkit',
  meta: [
    { name: 'description', content: 'Dynamically generate printable protractors and visualize tracking error for various tonearm alignment geometries like Baerwald, Löfgren, and Stevenson.' },
    { property: 'og:title', content: 'Tonearm Alignment Calculator | Engrove Audio Toolkit' },
    { property: 'og:description', content: 'Visualize and generate custom alignment protractors for your specific tonearm.' },
  ],
});

// Anropas när komponenten monteras
onMounted(() => {
  store.initialize();
});

const template = `
<div class="tool-view">
  <div class="tool-header">
    <h1>Alignment Calculator</h1>
    <div class="header-buttons">
      <button @click="showHelp = true" class="icon-help-button" title="Help & Methodology">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
      </button>
    </div>
  </div>

  <InfoPanel :content-html="alignmentContent" @open-technical-help="showHelp = true" ></InfoPanel> <!-- KORRIGERING: Ändrad till fullständigt tagg-par -->    
  <!-- Visar en laddningsindikator medan databasen hämtas -->
  <div v-if="store.isLoading" class="status-container">
    <h2>Loading Database...</h2>
  </div>
  <!-- Visar ett felmeddelande om något gick fel vid laddningen -->
  <div v-else-if="store.error" class="status-container error">
    <h2>Failed to load data</h2>
    <p>{{ store.error }}</p>
  </div>

  <!-- Huvudlayouten för verktyget när datan är laddad -->
  <div v-else class="main-grid">
    <AlignmentInputPanel />
    
    <div class="results-and-visuals-column">
      <AlignmentResultsPanel />

      <TrackingErrorChart 
        v-if="!store.calculatedValues.error"
        :chartData="store.trackingErrorChartData"
        :nullPoints="store.calculatedValues.nulls"
        :trackingMethod="store.calculatedValues.trackingMethod"
        class="tracking-chart"
      />

      <AlignmentGeometry
          v-if="isPivotingArm && !store.calculatedValues.error"
          :pivotToSpindle="store.userInput.pivotToSpindle"
          :effectiveLength="store.calculatedValues.effectiveLength"
          :overhang="store.calculatedValues.overhang"
          :offsetAngle="store.calculatedValues.offsetAngle"
          :nulls="store.calculatedValues.nulls"
      />

      <AlignmentProtractor
          v-if="isPivotingArm && !store.calculatedValues.error"
          :pivotToSpindle="store.userInput.pivotToSpindle"
          :effectiveLength="store.calculatedValues.effectiveLength"
          :nulls="store.calculatedValues.nulls"
          :alignmentType="store.userInput.alignmentType"
      />
    </div>
  </div>

  <HelpModal :isOpen="showHelp" @close="showHelp = false">
  <template #header>
    <h2>Alignment Calculator Methodology</h2>
  </template>
  <template #default>
    <div class="help-content">
      <h4>The Goal: Minimizing Tracking Error</h4>
      <p>
        A vinyl record is cut by a lathe where the cutting stylus moves in a straight line across the record. A standard pivoted tonearm, however, moves in an arc. This geometric difference creates a **tracking error** – a small angular deviation between the cartridge's cantilever and the true tangent of the record groove. This error introduces distortion. The goal of proper alignment is to minimize this distortion across the entire playable surface of the record.
      </p>

      <h4>Key Geometric Concepts</h4>
      <ul>
        <li><strong>Effective Length:</strong> The distance from the tonearm's pivot point to the stylus tip.</li>
        <li><strong>Pivot-to-Spindle Distance:</strong> The distance from the tonearm's pivot point to the center of the turntable spindle. This is the most critical measurement you provide.</li>
        <li><strong>Overhang:</strong> The distance the stylus "overhangs" the spindle when the tonearm is moved directly over it. It is the difference between Effective Length and Pivot-to-Spindle distance.</li>
        <li><strong>Offset Angle:</strong> The angle of the cartridge/headshell relative to a straight line drawn between the pivot and the stylus. This angle is crucial for reducing tracking error.</li>
        <li><strong>Null Points:</strong> The two specific points on the record's surface where the cantilever is perfectly tangent to the groove, resulting in **zero tracking error**. All alignment geometries are defined by the placement of these two points.</li>
      </ul>

      <h4>Understanding the Alignment Geometries</h4>
      <p>
        There is no single "perfect" alignment; each is a different mathematical compromise. This tool allows you to compare the most common ones:
      </p>
      <ul>
        <li>
          <strong>Baerwald (Löfgren A):</strong> This is the most common geometry. It aims to minimize and equalize the distortion at three peak points: the inner groove, the outer groove, and the point of maximum error between the null points. It's considered an excellent all-around compromise.
        </li>
        <li>
          <strong>Löfgren B:</strong> This geometry aims to minimize the overall RMS (Root Mean Square) tracking error across the record. It results in lower peak distortion between the null points compared to Baerwald, but the error can rise more steeply at the very beginning and end of the record.
        </li>
        <li>
          <strong>Stevenson A:</strong> This geometry prioritizes minimizing distortion at the innermost groove, where the groove velocity is lowest and distortion is theoretically most audible. This comes at the cost of higher distortion elsewhere on the record. It's often favored for classical music, which can have powerful passages near the end of a side.
        </li>
      </ul>

      <h4>How to Use the Printable Protractor</h4>
      <ol>
        <li>Select your desired Alignment Geometry and Groove Standard in the control panel.</li>
        <li>Choose the correct Paper Format (A4 or Letter) for your printer.</li>
        <li>Use your browser's print function (Ctrl/Cmd + P).</li>
        <li>
          <strong>CRITICAL:</strong> In the print dialog, ensure scaling is set to **100%** or **"Actual Size"**. Do NOT use "Fit to Page" or any other scaling, as this will make the protractor inaccurate.
        </li>
        <li>Set the page orientation to **Landscape**.</li>
        <li>After printing, use a precise ruler to measure the **100mm Scale Reference** line on the printout. If it does not measure exactly 100mm, your printer settings are incorrect.</li>
        <li>Once verified, carefully cut out the protractor and the spindle hole. Place it on your turntable and proceed with the alignment by placing the stylus on each null point and adjusting the cartridge until the cantilever is perfectly parallel with the grid lines.</li>
      </ol>

      <h4>Frequently Asked Questions (FAQ)</h4>
      <p>
        <strong>Q: Why are the calculated values different from my tonearm manufacturer's specifications?</strong><br>
        A: Many manufacturers use their own proprietary alignment geometry, which may be a variation of or completely different from the standard Baerwald/Löfgren/Stevenson geometries. This tool calculates the theoretically optimal values based on these established mathematical models. Using a standard geometry can often result in lower overall distortion than the manufacturer's default.
      </p>
      <p>
        <strong>Q: Which alignment geometry is the "best"?</strong><br>
        A: There is no single "best" geometry; it's a matter of preference and trade-offs. Baerwald is a safe and excellent starting point. If you are particularly sensitive to inner-groove distortion, try Stevenson. Experiment and listen to what sounds best for your system and your music collection.
      </p>
      <p>
        <strong>Q: What are the different Groove Standards (IEC, DIN, JIS)?</strong><br>
        A: These are international standards that define the minimum and maximum playable radii of a record. Since the optimal null points are mathematically derived from these radii, changing the standard will slightly alter the calculated alignment. The IEC standard is the most common and modern one.
      </p>
    </div>
  </template>
</HelpModal>
</div>
`;

const style = `
.tool-view { display: flex; flex-direction: column; }
.tool-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0; border-bottom: none; }
.tool-header h1 { margin: 0; font-size: 1.75rem; color: var(--header-color); }
.header-buttons { display: flex; align-items: center; gap: 0.5rem; }
.icon-help-button { background: none; border: 1px solid transparent; border-radius: 50%; cursor: pointer; color: var(--label-color); display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; transition: all 0.2s ease; padding: 0; }
.icon-help-button:hover { background-color: #e9ecef; border-color: var(--border-color); color: var(--text-color); }
.status-container { padding: 4rem 2rem; text-align: center; background-color: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 6px; }
.status-container.error { background-color: var(--danger-color); color: var(--danger-text); border-color: #f5c6cb; }
.main-grid { display: grid; grid-template-columns: 400px 1fr; gap: 2rem; align-items: start; margin-top: 2rem; }
.results-and-visuals-column { display: flex; flex-direction: column; gap: 2rem; }
.tracking-chart { margin-top: 0; }
@media (max-width: 900px) { .main-grid { grid-template-columns: 1fr; } }
`;

export default {
  components: {
    AlignmentInputPanel,
    AlignmentResultsPanel,
    InfoPanel,
    HelpModal,
    TrackingErrorChart,
    AlignmentGeometry,
    AlignmentProtractor
  },
  setup() {
    return {
      store,
      showHelp,
      isPivotingArm,
      alignmentContent
    };
  },
  template,
  style
};
