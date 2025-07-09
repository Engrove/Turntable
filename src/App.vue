<!-- src/App.vue -->
<script setup>
import HelpModal from './components/HelpModal.vue';
import { useTonearmStore } from '@/store/tonearmStore';
const store = useTonearmStore();
</script>

<template>
  <div class="app-container">
    <aside class="sidebar">
      <!-- ... din sidomeny som förut ... -->
    </aside>

    <main class="main-content">
      <router-view />
    </main>
    
    <!-- Lägg till modalen här, den visas/döljs via storen -->
    <HelpModal v-if="store.isHelpModalVisible" />
  </div>
</template>
