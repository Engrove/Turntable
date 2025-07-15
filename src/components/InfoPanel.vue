<!-- src/components/InfoPanel.vue -->
<script setup>
import { ref } from 'vue';

const isExpanded = ref(false);

const togglePanel = () => {
  isExpanded.value = !isExpanded.value;
};
</script>

<template>
  <div class="info-panel-container">
    <div class="info-header">
      <button @click="togglePanel" class="info-toggle-button" :aria-expanded="isExpanded">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        <span>{{ isExpanded ? 'Hide' : 'Show' }} Quick Guide</span>
      </button>
    </div>

    <transition name="slide-fade">
      <div v-if="isExpanded" class="info-content">
        <slot></slot>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.info-panel-container {
  margin-bottom: 2rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background-color: #f8f9fa; /* Lätt grå bakgrund för hela komponenten */
}

.info-header {
  padding: 0.5rem 1rem;
}

.info-toggle-button {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--accent-color);
  padding: 0.5rem;
  border-radius: 6px;
  width: 100%;
  text-align: left;
  transition: background-color 0.2s ease;
}

.info-toggle-button:hover {
  background-color: #e9ecef;
}

.info-toggle-button svg {
  flex-shrink: 0;
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.4s ease-out;
  max-height: 1000px; /* Sätt ett tillräckligt högt värde */
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
  max-height: 0;
}

.info-content {
  overflow: hidden;
  padding: 0 1.5rem 1.5rem 1.5rem;
  border-top: 1px solid var(--border-color);
}

/* Djupgående styling för innehållet som skickas in via slot */
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
}

.info-content :deep(ul),
.info-content :deep(ol) {
  padding-left: 1.5rem;
  color: var(--label-color);
}

.info-content :deep(li) {
  margin-bottom: 0.5rem;
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
</style>
