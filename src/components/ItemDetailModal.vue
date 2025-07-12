<!-- src/components/ItemDetailModal.vue -->
<template>
  <transition name="fade">
    <div v-if="isOpen && item" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content" @click.stop>
        <header class="modal-header">
          <h2>{{ item.manufacturer }} {{ item.model }}</h2>
          <button @click="closeModal" class="close-btn">×</button>
        </header>
        <main class="modal-body">
          <div class="details-grid">
            <!-- Dynamiskt genererade fält -->
            <div v-for="field in visibleFields" :key="field.key" class="detail-item">
              <span class="label">{{ field.label }}</span>
              <span class="value">{{ item[field.key] || '-' }}</span>
            </div>
          </div>

          <div v-if="item.review_summary_en" class="notes-section">
            <h4>Review Summary</h4>
            <p>{{ item.review_summary_en }}</p>
          </div>

          <div v-if="item.notes_en" class="notes-section">
            <h4>Notes</h4>
            <p>{{ item.notes_en }}</p>
          </div>
          
          <!-- NYTT (1d): Använder den nya 'filteredSources'-beräkningen -->
          <div v-if="filteredSources.length > 0" class="notes-section">
            <h4>Sources</h4>
            <ul>
              <li v-for="(source, index) in filteredSources" :key="index">
                <!-- Hanterar källor utan URL -->
                <a v-if="source.url" :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.name }}</a>
                <span v-else>{{ source.name }}</span>
              </li>
            </ul>
          </div>

        </main>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  item: Object,
  dataType: String
});

const emit = defineEmits(['close']);

const closeModal = () => {
  emit('close');
};

const allFields = {
  cartridges: [
    { key: 'type', label: 'Type' }, { key: 'weight_g', label: 'Weight (g)' },
    { key: 'cu_dynamic_10hz', label: 'Compliance @ 10Hz' }, { key: 'cu_dynamic_100hz', label: 'Compliance @ 100Hz' },
    { key: 'cu_static', label: 'Static Compliance' }, { key: 'stylus_family', label: 'Stylus Family' },
    { key: 'cantilever_class', label: 'Cantilever Class' }, { key: 'output_voltage_mv', label: 'Output (mV)' },
    { key: 'tracking_force_min_g', label: 'VTF Min (g)' }, { key: 'tracking_force_max_g', label: 'VTF Max (g)' }
  ],
  tonearms: [
    { key: 'effective_mass_g', label: 'Effective Mass (g)' }, { key: 'effective_length_mm', label: 'Effective Length (mm)' },
    { key: 'pivot_to_spindle_mm', label: 'Pivot to Spindle (mm)' }, { key: 'overhang_mm', label: 'Overhang (mm)' },
    { key: 'bearing_type', label: 'Bearing Type' }, { key: 'arm_material', label: 'Arm Material' },
    { key: 'headshell_connector', label: 'Headshell' }
  ]
};

const visibleFields = computed(() => {
  if (!props.dataType || !props.item) return [];
  return allFields[props.dataType].filter(field => props.item[field.key] !== null && props.item[field.key] !== undefined);
});

// NYTT (1d): Helt ny logik för att filtrera och gruppera källor
const filteredSources = computed(() => {
  if (!props.item?.sources) return [];
  
  const highQualitySources = [];
  let hasCommunityData = false;
  
  // Nyckelord som indikerar en mer pålitlig källa
  const trustedKeywords = ['official', 'labs', 'hifi-wiki', 'manual'];

  props.item.sources.forEach(source => {
    // Trimma och kontrollera om URL är giltig
    const hasValidUrl = source.url && source.url.trim().startsWith('http');
    const nameLower = source.name ? source.name.toLowerCase() : '';

    // Kontrollera om namnet innehåller något av de betrodda nyckelorden
    const hasTrustedKeyword = trustedKeywords.some(keyword => nameLower.includes(keyword));

    if (hasValidUrl || hasTrustedKeyword) {
      highQualitySources.push(source);
    } else {
      hasCommunityData = true; // Markera att det finns minst en "svag" källa
    }
  });

  const finalSources = [...highQualitySources];
  
  // Om det fanns några "svaga" källor, lägg till en enskild post för "Community Data"
  if (hasCommunityData) {
    finalSources.push({ name: 'Community Data', url: null });
  }

  return finalSources;
});
</script>

<style scoped>
.modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 1000; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.modal-content { background: white; padding: 2rem; border-radius: 8px; width: 90%; max-width: 800px; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 5px 15px rgba(0,0,0,0.3); }
.modal-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1.5rem; }
.modal-header h2 { margin: 0; color: var(--header-color); }
.close-btn { border: none; background: none; font-size: 2rem; font-weight: bold; cursor: pointer; color: #aaa; line-height: 1; }
.close-btn:hover { color: #333; }
.modal-body { overflow-y: auto; line-height: 1.6; }

.details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  background-color: var(--panel-bg);
  padding: 1rem;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}
.detail-item {
  display: flex;
  flex-direction: column;
}
.detail-item .label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--label-color);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.detail-item .value {
  font-size: 1.1rem;
  color: var(--text-color);
  text-transform: capitalize;
}
.notes-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px dashed var(--border-color);
}
.notes-section h4 {
  margin-top: 0;
  margin-bottom: 0.5rem;
  color: var(--header-color);
}
.notes-section p, .notes-section ul {
  margin: 0;
  color: var(--label-color);
}
.notes-section ul {
  padding-left: 1.25rem;
}
.notes-section a {
  color: var(--accent-color);
  text-decoration: none;
}
.notes-section a:hover {
  text-decoration: underline;
}
</style>
