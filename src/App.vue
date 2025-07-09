<script setup>
import { ref } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';

const router = useRouter();
const isMenuExpanded = ref(true);

const toggleMenu = () => {
  isMenuExpanded.value = !isMenuExpanded.value;
};

const routeIcons = {
  'tonearm-calculator': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="2"></circle><line x1="12" y1="3" x2="12" y2="1"></line><line x1="19" y1="12" x2="21" y2="12"></line><path d="M16 8L12 12 8 8"></path></svg>`,
  'compliance-estimator': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"></path><path d="M18 20V4"></path><path d="M6 20V16"></path></svg>`
};
</script>

<template>
  <div class="app-layout" :class="{ 'menu-collapsed': !isMenuExpanded }">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h3 v-show="isMenuExpanded">Engrove Toolkit</h3>
      </div>
      <nav class="main-nav">
        <RouterLink
          v-for="route in router.options.routes"
          :key="route.name"
          :to="route.path"
          class="nav-link"
          :title="isMenuExpanded ? route.meta.title : ''"
        >
          <span class="nav-icon" v-html="routeIcons[route.name]"></span>
          <span class="nav-text">{{ route.meta.title }}</span>
        </RouterLink>
      </nav>
      <div class="menu-toggle-wrap">
        <button @click="toggleMenu" class="menu-toggle" title="Toggle Menu">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
      </div>
    </aside>
    <main class="content-area">
      <RouterView />
    </main>
  </div>
</template>

<!-- OBS: DENNA ÄR INTE 'SCOPED' - DETTA ÄR NYCKELN TILL LÖSNINGEN -->
<style>
:root {
  --sidebar-width-expanded: 260px;
  --sidebar-width-collapsed: 80px;
}
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
.app-layout {
  display: flex;
  height: 100vh;
}
.sidebar {
  background-color: var(--header-color);
  color: #ecf0f1;
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
  flex-shrink: 0;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  width: var(--sidebar-width-expanded);
}
.app-layout.menu-collapsed .sidebar {
  width: var(--sidebar-width-collapsed);
}
.sidebar-header {
  padding: 0 1.5rem;
  margin-bottom: 2rem;
  font-size: 1.2rem;
  white-space: nowrap;
  overflow: hidden;
  height: 36px;
  display: flex;
  align-items: center;
}
.sidebar-header h3 { margin: 0; }
.main-nav {
  flex-grow: 1;
  overflow: hidden;
}
.nav-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  color: #bdc3c7;
  text-decoration: none;
  transition: background-color 0.2s ease;
  white-space: nowrap;
}
.app-layout.menu-collapsed .nav-link {
  justify-content: center;
  padding: 1rem;
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
}
.nav-text {
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 1;
}
.app-layout.menu-collapsed .nav-text {
  opacity: 0;
  width: 0;
}
.menu-toggle-wrap {
  display: flex;
  justify-content: flex-end;
  padding: 0 1.5rem;
}
.app-layout.menu-collapsed .menu-toggle-wrap {
  justify-content: center;
  padding: 0;
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
.app-layout.menu-collapsed .menu-toggle {
  transform: rotate(180deg);
}
.content-area {
  flex-grow: 1;
  padding: 2rem;
  overflow-y: auto;
  height: 100vh;
  min-width: 0; /* Viktigt för flexbox-innehåll */
}
</style>
