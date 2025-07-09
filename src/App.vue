<script setup>
import { ref } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';

// Använd den rekommenderade metoden för att hämta routern
const router = useRouter();

// En reaktiv variabel för att hålla koll på om menyn är öppen eller stängd
const isMenuOpen = ref(false);

// Funktion för att stänga menyn. Anropas från flera ställen.
const closeMenu = () => {
  isMenuOpen.value = false;
};
</script>

<template>
  <div class="app-container">
    <!-- SIDOMENYN (Sidebar) -->
    <!-- Den har en klass 'is-open' när isMenuOpen är true, vilket styr dess synlighet via CSS -->
    <aside class="sidebar" :class="{ 'is-open': isMenuOpen }">
      <div class="sidebar-header">
        <h3>Engrove Toolkit</h3>
        <!-- En tydlig stängningsknapp inuti menyn -->
        <button @click="closeMenu" class="close-menu-btn">×</button>
      </div>
      <nav class="main-nav">
        <RouterLink
          v-for="route in router.options.routes"
          :key="route.name"
          :to="route.path"
          @click="closeMenu"
        >
          <template v-if="route.meta && route.meta.title">
            {{ route.meta.title }}
          </template>
        </RouterLink>
      </nav>
      <div class="sidebar-footer">
        <p>v1.0.0</p>
      </div>
    </aside>

    <!-- En overlay som täcker innehållet när menyn är öppen -->
    <!-- Ett klick på den stänger menyn -->
    <div v-if="isMenuOpen" class="menu-overlay" @click="closeMenu"></div>

    <!-- HUVUDINNEHÅLL -->
    <div class="main-wrapper">
      <header class="main-header">
        <!-- "Hamburger"-knappen för att öppna menyn -->
        <button @click="isMenuOpen = true" class="hamburger-btn">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </header>
      <main class="content-area">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Behållare för hela appen */
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
  background-color: #e9ecef;
}

/* Sidomenyn (Sidebar) - NU DOLD SOM STANDARD */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 260px;
  background-color: var(--header-color);
  color: #ecf0f1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0;
  z-index: 1001; /* Högst upp */
  transform: translateX(-100%); /* Dold utanför skärmen */
  transition: transform 0.3s ease-in-out;
}

/* Stilen för menyn när den är öppen */
.sidebar.is-open {
  transform: translateX(0);
  box-shadow: 5px 0 15px rgba(0,0,0,0.2);
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1.5rem;
  margin-bottom: 2rem;
  font-size: 1.2rem;
}
.sidebar-header h3 { margin: 0; }

.close-menu-btn {
  background: none;
  border: none;
  color: #bdc3c7;
  font-size: 2.5rem;
  line-height: 1;
  cursor: pointer;
  transition: color 0.2s ease;
}
.close-menu-btn:hover {
  color: #fff;
}

.main-nav {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}
.main-nav a {
  color: #bdc3c7;
  text-decoration: none;
  padding: 1rem 1.5rem;
  transition: background-color .2s ease,color .2s ease;
  border-left: 3px solid transparent;
}
.main-nav a:hover {
  background-color: #495057;
  color: #fff;
}
.main-nav a.router-link-exact-active {
  background-color: rgba(0, 123, 255, 0.15);
  color: #fff;
  font-weight: 600;
  border-left-color: var(--accent-color, #007bff);
}

.sidebar-footer {
  padding: 0 1.5rem;
  font-size: .8rem;
  color: #7f8c8d;
}

/* Overlay som täcker innehållet */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

/* Behållare för huvud-header och content-area */
.main-wrapper {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

/* Header för huvudinnehållet (med hamburger-knappen) */
.main-header {
  background: white;
  padding: 0.75rem 2rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  z-index: 100;
}

.hamburger-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 32px;
  height: 28px;
}
.hamburger-btn span {
  display: block;
  width: 100%;
  height: 3px;
  background: var(--header-color);
  border-radius: 3px;
}

/* Huvudinnehållet */
.content-area {
  flex-grow: 1;
  padding: 2rem;
  overflow-y: auto;
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
