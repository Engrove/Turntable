<script setup>
import { ref, watch } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';

const router = useRouter();
// Sätt menyn till stängd som standard, speciellt viktigt för mobil
const isMenuExpanded = ref(false);

const toggleMenu = () => {
  isMenuExpanded.value = !isMenuExpanded.value;
};

// Stäng menyn automatiskt vid navigering (bra UX på mobil)
watch(() => router.currentRoute.value, () => {
  if (isMenuExpanded.value) {
    isMenuExpanded.value = false;
  }
});

const routeIcons = {
  'tonearm-calculator': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="2"></circle><line x1="12" y1="3" x2="12" y2="1"></line><line x1="19" y1="12" x2="21" y2="12"></line><path d="M16 8L12 12 8 8"></path></svg>`,
  'compliance-estimator': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"></path><path d="M18 20V4"></path><path d="M6 20V16"></path></svg>`
};
</script>

<template>
  <div class="app-layout" :class="{ 'menu-expanded': isMenuExpanded }">
    
    <!-- NYTT: Overlay för att stänga menyn på mobil -->
    <div v-if="isMenuExpanded" class="menu-overlay" @click="toggleMenu"></div>

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
          :title="isMenuExpanded ? '' : route.meta.title"
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

<!-- VIKTIGT: Denna stil är global, inte 'scoped', vilket är korrekt för en huvudlayout -->
<style>
:root {
  --sidebar-width-expanded: 260px;
  --sidebar-width-collapsed: 68px; /* Justerad för bättre passform */
  --header-color: #2c3e50; /* Mörkare färg för bättre kontrast */
  --accent-color: #3498db; /* En trevligare blå */
}

html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: #f4f7f9;
}

.app-layout {
  display: flex;
  height: 100vh;
}

/* --- MOBIL-FÖRST STILAR (Off-canvas meny) --- */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  z-index: 1001; /* Sidomenyn ska vara överst */
  width: var(--sidebar-width-expanded);
  background-color: var(--header-color);
  color: #ecf0f1;
  display: flex;
  flex-direction: column;
  padding: 1rem 0;
  transform: translateX(-100%); /* Dold som standard */
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 15px rgba(0,0,0,0.2);
}

.app-layout.menu-expanded .sidebar {
  transform: translateX(0); /* Visas när menyn är expanderad */
}

.content-area {
  flex-grow: 1;
  padding: 2rem;
  overflow-y: auto;
  height: 100vh;
  box-sizing: border-box;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.menu-toggle {
  position: fixed; /* Knappen är alltid synlig */
  bottom: 1rem;
  left: 1rem;
  z-index: 1002; /* Ovanpå allt annat */
  background: var(--header-color);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  transition: transform 0.3s ease-in-out;
}

.app-layout.menu-expanded .menu-toggle {
  transform: rotate(180deg);
}

.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

/* --- PC/DESKTOP STILAR (min-width: 768px) --- */
@media (min-width: 768px) {
  .sidebar {
    transform: translateX(0); /* Alltid på skärmen */
    width: var(--sidebar-width-collapsed);
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow: none;
  }

  .app-layout.menu-expanded .sidebar {
    width: var(--sidebar-width-expanded);
  }

  .content-area {
    /* Skapa utrymme för den kollapsade menyn */
    margin-left: var(--sidebar-width-collapsed);
  }

  .menu-toggle {
    /* Återställ positionen till inuti sidomenyn */
    position: relative;
    bottom: auto;
    left: auto;
    width: auto;
    height: auto;
    background: none;
    box-shadow: none;
    margin: 0 auto; /* Centrera knappen */
  }

  .menu-toggle-wrap {
    padding: 0;
    margin-top: auto; /* Knappen längst ner */
  }
  
  .app-layout.menu-expanded .menu-toggle {
    transform: rotate(0deg); /* Återställ rotation */
  }
  
  .app-layout .menu-toggle {
      transform: rotate(180deg);
  }

  .menu-overlay {
    display: none; /* Overlay behövs inte på PC */
  }
}

/* --- Gemensamma stilar för menyns innehåll --- */
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
  overflow: hidden;
}

.app-layout:not(.menu-expanded) .nav-link {
  justify-content: center;
  padding: 1rem;
}

.nav-link:hover {
  background-color: #34495e;
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
}

.nav-text {
  transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 1;
}

.app-layout:not(.menu-expanded) .nav-text {
  opacity: 0;
  width: 0;
}
</style>
