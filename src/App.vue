<!-- src/App.vue -->
<script setup>
import HelpModal from './components/HelpModal.vue';
import { useTonearmStore } from '@/store/tonearmStore';
const store = useTonearmStore();
</script>

<template>
  <div class="app-container">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <span class="icon">🎚️</span>
        <span class="text">Engrove Toolkit</span>
      </div>
      <nav>
        <router-link to="/" class="nav-link active">
          <span class="icon">🔧</span>
          <span class="text">Tonearm Calculator</span>
        </router-link>
      </nav>
    </aside>

    <main class="main-content">
      <router-view />
    </main>
    
    <HelpModal v-if="store.isHelpModalVisible" />
  </div>
</template>
