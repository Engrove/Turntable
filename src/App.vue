<script setup>
import { ref } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';

const router = useRouter();

// En reaktiv variabel för att hålla koll på om menyn är expanderad
const isMenuExpanded = ref(true);

// Funktion för att växla menyns tillstånd
const toggleMenu = () => {
  isMenuExpanded.value = !isMenuExpanded.value;
};

// Associera varje route med en SVG-ikon
const routeIcons = {
  'tonearm-calculator': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="2"></circle><line x1="12" y1="3" x2="12" y2="1"></line><line x1="19" y1="12" x2="21" y2="12"></line><path d="M16 8L12 12 8 8"></path></svg>`,
  'compliance-estimator': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"></path><path d="M18 20V4"></path><path d="M6 20V16"></path></svg>`
};
</script>

<template>
  <div class="app-layout">
    <!-- SIDOMENYN (Sidebar) -->
    <!-- Klassen 'is-expanded' styr bredd och innehållets synlighet -->
    <aside class="sidebar" :class="{ 'is-expanded': isMenuExpanded }">
      <div class="sidebar-header">
        <h3 v-show="isMenuExpanded">Engrove Toolkit</h3>
      </div>
      <nav class="main-nav">
        <RouterLink
          v-for="route in router.options.routes"
          :key="route.name"
          :to="route.path"
          class="nav-link"
          :title="route.meta.title"
        >
          <span class="nav-icon" v-html="routeIcons[route.name]"></span>
          <span class="nav-text" v-show="isMenuExpanded">{{ route.meta.title }}</span>
        </RouterLink>
      </nav>

      <!-- Meny-växlare i botten -->
      <div class="menu-toggle-wrap">
        <button @click="toggleMenu" class="menu-toggle" title="Toggle Menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>
    </aside>

    <!-- HUVUDINNEHÅLL -->
    <main class="content-area">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
:root {
  --sidebar-width-expanded: 260px;
  --sidebar-width-collapsed: 80px;
}

.app-layout {
  display: flex;
}

/* Sidomenyn (Sidebar) */
.sidebar {
  background-color: var(--header-color);
  color: #ecf0f1;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
  /* Animera bredd-förändringen */
  transition: width 0.3s ease-in-out;
  width: var(--sidebar-width-expanded); /* Standard är expanderad */
}

/* Stilar för minimerad meny */
.sidebar:not(.is-expanded) {
  width: var(--sidebar-width-collapsed);
}
.sidebar:not(.is-expanded) .nav-link {
  justify-content: center;
}
.sidebar:not(.is-expanded) .sidebar-header {
  height: 36px; /* Matcha höjden för när texten visas för att undvika hopp */
}

.sidebar-header {
  padding: 0 1.5rem;
  margin-bottom: 2rem;
  font-size: 1.2rem;
  transition: opacity 0.2s ease-in-out;
}
.sidebar-header h3 {
  margin: 0;
  white-space: nowrap; /* Förhindra textbrytning under animation */
}

.main-nav {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  color: #bdc3c7;
  text-decoration: none;
  transition: background-color 0.2s ease, color 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
}
.nav-link:hover {
  background-color: #495057;
  color: #fff;
}
.nav-link.router-link-exact-active {
  background-color: rgba(0, 123, 255, 0.15);
  color: #fff;
  font-weight: 600;
}
.nav-link.router-link-exact-active .nav-icon {
  color: var(--accent-color, #007bff);
}

.nav-icon {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: inline-block;
}

.nav-text {
  opacity: 1;
  transition: opacity 0.2s ease-in-out;
}
.sidebar:not(.is-expanded) .nav-text {
  opacity: 0;
}

/* Meny-växlare (Toggle) */
.menu-toggle-wrap {
  display: flex;
  justify-content: flex-end;
  padding: 0 1.5rem;
  margin-top: 1rem;
}
.menu-toggle {
  background: none;
  border: none;
  color: #bdc3c7;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.2s ease, transform 0.3s ease-in-out;
}
.menu-toggle:hover {
  background-color: #495057;
  color: #fff;
}
/* Rotera pilen när menyn är minimerad */
.sidebar:not(.is-expanded) .menu-toggle {
  transform: rotate(180deg);
}


/* Huvudinnehållet */
.content-area {
  flex-grow: 1;
  padding: 2rem;
  overflow-y: auto;
  height: 100vh;
}
</style>

<style>
/* Globala stilar - oförändrade */
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
#app {
  height: 100%;
  padding: 0;
  max-width: none;
}
</style>
