<!-- src/components/InfoPanel.vue -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

// Denna komponent tar emot färdigrenderad HTML-kod som en egenskap (prop).
defineProps({
  contentHtml: {
    type: String,
    required: true
  }
});

// Definierar 'open-technical-help'-händelsen som komponenten kan skicka uppåt.
const emit = defineEmits(['open-technical-help']);

// Intern state för att kontrollera om panelen är expanderad.
const isExpanded = ref(false);

const togglePanel = () => {
  isExpanded.value = !isExpanded.value;
};

// Denna funktion kommer att anropas från `onclick` i den injicerade HTML-koden.
const triggerHelp = () => {
  emit('open-technical-help');
};

// När komponenten monteras (visas på sidan), gör vi vår hjälpfunktion globalt tillgänglig.
onMounted(() => {
  window.triggerTechnicalHelp = triggerHelp;
});

// När komponenten avmonteras (försvinner från sidan), städar vi upp den globala funktionen
// för att undvika minnesläckor och konflikter.
onUnmounted(() => {
  if (window.triggerTechnicalHelp === triggerHelp) {
    delete window.triggerTechnicalHelp;
  }
});
</script>

<template>
  <div class="info-panel-container">
    <div class="info-header" @click="togglePanel" role="button" :aria-expanded="isExpanded" tabindex="0">
      <button class="info-toggle-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="info-icon" :class="{ 'is-expanded': isExpanded }"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
        <span>{{ isExpanded ? 'Hide' : 'Show' }} Quick Guide & Methodology</span>
         <svg xmlns="http://www.w3.org/2000/svg" class="chevron" :class="{ 'is-expanded': isExpanded }" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>
    </div>

    <transition name="slide-fade">
      <div v-if="isExpanded" class="info-content-wrapper">
        <div class="info-content" v-html="contentHtml"></div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.info-panel-container {
  margin-top: 2rem;
  margin-bottom: 2rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: #f8f9fa;
  transition: box-shadow 0.2s ease;
}

.info-header {
  padding: 0.5rem 1rem;
  cursor: pointer;
}

.info-toggle-button {
  background: none;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--accent-color);
  padding: 0.5rem;
  width: 100%;
  text-align: left;
}

.info-icon, .chevron {
  flex-shrink: 0;
  transition: transform 0.3s ease;
}

.chevron {
    margin-left: auto;
    color: var(--label-color);
}

.chevron.is-expanded {
    transform: rotate(180deg);
}

.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}
.slide-fade-leave-active {
  transition: all 0.2s ease-in;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  max-height: 0;
  opacity: 0;
  transform: translateY(-10px);
}
.slide-fade-enter-to,
.slide-fade-leave-from {
  max-height: 1500px; /* Sätt ett tillräckligt högt värde */
  opacity: 1;
  transform: translateY(0);
}

.info-content-wrapper {
  overflow: hidden;
}
.info-content {
  padding: 0rem 1.5rem 1.5rem 1.5rem;
  border-top: 1px solid var(--border-color);
}

/* Djupgående styling för innehållet som kommer från Markdown */
.info-content :deep(h3) {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: var(--header-color);
  font-size: 1.25rem;
}
.info-content :deep(h4) {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: var(--header-color);
  font-size: 1.1rem;
}
.info-content :deep(p) {
  line-height: 1.6;
  color: var(--label-color);
  margin-bottom: 1rem;
  max-width: 80ch;
}
.info-content :deep(ul),
.info-content :deep(ol) {
  padding-left: 1.5rem;
  color: var(--label-color);
}
.info-content :deep(li) {
  margin-bottom: 0.5rem;
  line-height: 1.6;
}
.info-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 2rem 0;
}
.info-content :deep(a) {
  color: var(--accent-color);
  font-weight: 600;
  text-decoration: none;
}
.info-content :deep(a:hover) {
  text-decoration: underline;
}
.info-content :deep(code) {
  background-color: #e9ecef;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Courier New', Courier, monospace;
}
.info-content :deep(.technical-help-link) {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #e9ecef;
  border: 1px solid var(--border-color);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--header-color);
  text-decoration: none;
}
.info-content :deep(.technical-help-link:hover) {
  background-color: #d0d5db;
  border-color: #adb5bd;
  text-decoration: none;
}
</style>
