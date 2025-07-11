<!-- src/App.vue -->
<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';

const router = useRouter();
const isMenuExpanded = ref(false);
const isMobile = ref(false);

const toggleMenu = () => {
  isMenuExpanded.value = !isMenuExpanded.value;
};

const closeMenu = () => {
  isMenuExpanded.value = false;
};

const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 768;
  if (isMobile.value) {
    isMenuExpanded.value = false;
  }
};

onMounted(() => {
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize);
});

const routeIcons = {
  'home': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
  'tonearm-calculator': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="2"></circle><line x1="12" y1="3" x2="12" y2="1"></line><line x1="19" y1="12" x2="21" y2="12"></line><path d="M16 8L12 12 8 8"></path></svg>`,
  'compliance-estimator': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"></path><path d="M18 20V4"></path><path d="M6 20V16"></path></svg>`
};
</script>

<template>
  <div class="app-layout" :class="{ 'mobile-view': isMobile }">
    <!-- Mobil-specifika element -->
    <template v-if="isMobile">
      <button @click="toggleMenu" class="mobile-menu-trigger">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>
      <div v-if="isMenuExpanded" @click="closeMenu" class="mobile-menu-overlay"></div>
    </template>

    <!-- Sidomeny (Sidebar) -->
    <aside class="sidebar" :class="{ 'is-expanded': isMenuExpanded }">
      <div class="sidebar-header">
        <h3 v-show="isMenuExpanded || !isMobile">Engrove Toolkit</h3>
      </div>
      <nav class="main-nav">
        <RouterLink
          v-for="route in router.options.routes"
          :key="route.name"
          :to="route.path"
          class="nav-link"
          :title="isMenuExpanded ? '' : route.meta.title"
          @click="isMobile && closeMenu()"
        >
          <span class="nav-icon" v-html="routeIcons[route.name]"></span>
          <span class="nav-text">{{ route.meta.title }}</span>
        </RouterLink>
      </nav>
      <!-- Toggle-knapp för desktop -->
      <div v-if="!isMobile" class="menu-toggle-wrap">
        <button @click="toggleMenu" class="menu-toggle" title="Toggle Menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
      </div>
    </aside>

    <!-- Huvudinnehåll -->
    <main class="content-area">
      <RouterView />
    </main>
  </div>
</template>

<style>
/* --- Grundläggande CSS-variabler och återställning --- */
:root {
  --sidebar-width-expanded: 250px;
  --sidebar-width-collapsed: 70px; /* Bredd för ikon-balken */
  --header-color: #2c3e50; /* Mörkare, mer modern färg */
  --accent-color: #3498db; /* Ljusare blå accent */
  --text-light: #ecf0f1;
  --text-muted: #bdc3c7;
  --bg-hover: #34495e;
  --panel-bg: #f8f9fa;
  --border-color: #dee2e6;
  --text-color: #212529;
  --label-color: #495057;
  --ideal-color: #d4edda;
  --warning-color: #fff3cd;
  --danger-color: #f8d7da;
  --ideal-text: #155724;
  --warning-text: #856404;
  --danger-text: #721c24;
}

/* --- VIKTIG FIX: Korrekt scroll-beteende --- */
html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background-color: #e9ecef;
}

#app {
  width: 100%;
}

/* --- Huvudlayout --- */
.app-layout {
  position: relative;
}

.content-area {
  padding: 2rem;
  transition: margin-left 0.3s ease;
  margin-left: var(--sidebar-width-collapsed);
}

/* --- Sidomeny (Sidebar) - Desktop-först --- */
.sidebar {
  background-color: var(--header-color);
  color: var(--text-light);
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width-collapsed);
  overflow: hidden;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.sidebar.is-expanded {
  width: var(--sidebar-width-expanded);
}

.sidebar-header {
  padding: 0 1.25rem;
  margin-top: 1rem;
  margin-bottom: 2rem;
  font-size: 1.2rem;
  white-space: nowrap;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sidebar.is-expanded .sidebar-header {
  justify-content: flex-start;
}

.sidebar-header h3 {
  margin: 0;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.sidebar.is-expanded .sidebar-header h3 {
  opacity: 1;
}

.main-nav {
  flex-grow: 1;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1rem;
  margin: 0.5rem;
  border-radius: 8px;
  color: var(--text-muted);
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease;
  white-space: nowrap;
}

.sidebar.is-expanded .nav-link {
  padding-left: 1.5rem;
}

.nav-link:hover {
  background-color: var(--bg-hover);
  color: #fff;
}

.nav-link.router-link-exact-active {
  background-color: rgba(52, 152, 219, 0.15);
  color: #fff;
  font-weight: 600;
}

.nav-link.router-link-exact-active .nav-icon {
  color: var(--accent-color);
}

.nav-icon {
  flex-shrink: 0;
  margin-left: 0.5rem;
  transition: margin 0.3s ease;
}

.sidebar.is-expanded .nav-icon {
  margin-left: 0;
}

.nav-text {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.sidebar.is-expanded .nav-text {
  opacity: 1;
}

.menu-toggle-wrap {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
}

.sidebar.is-expanded .menu-toggle-wrap {
  justify-content: flex-end;
  padding-right: 1rem;
}

.menu-toggle {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.2s ease, transform 0.3s ease-in-out;
}

.menu-toggle:hover {
  background-color: var(--bg-hover);
  color: #fff;
}

.sidebar.is-expanded .menu-toggle {
  transform: rotate(180deg);
}

/* --- Mobil-läge (Media Query) --- */
@media (max-width: 767px) {
  .content-area {
    margin-left: 0;
    padding: 1rem;
    padding-top: 5rem;
  }

  .sidebar {
    width: var(--sidebar-width-expanded);
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }

  .sidebar.is-expanded {
    transform: translateX(0);
  }

  .sidebar-header h3, .nav-text {
    opacity: 1;
  }

  .mobile-menu-trigger {
    position: fixed;
    top: 1rem;
    left: 1rem;
    z-index: 1001;
    background-color: rgba(255, 255, 255, 0.8);
    backdrop-filter: blur(5px);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0.5rem;
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  }

  .mobile-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 999;
  }
}

/* Paneler och generisk styling för vyer */
.panel {
    background-color: var(--panel-bg);
    padding: 1.5rem;
    border-radius: 6px;
    border: 1px solid var(--border-color);
}

.panel h2 {
    margin-top: 0;
    color: var(--header-color);
    font-size: 1.25rem;
    border-bottom: 1px solid var(--border-color);
    padding-bottom: 0.75rem;
    margin-bottom: 1.5rem;
}
</style>
