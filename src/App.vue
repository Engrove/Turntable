<!-- src/App.vue -->
<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';

const router = useRouter();
const route = useRoute();

const isMenuExpanded = ref(false);
const isMobile = ref(false);
const bannerState = ref('none'); 

// --- NY LOGIK FÖR FLYTT-BANNERN ---
// 1. Kontrollera miljövariabeln som sattes i Netlify. Den kommer vara 'undefined' på Cloudflare.
const shouldShowMigrationBanner = computed(() => import.meta.env.VITE_HOSTING_PLATFORM === 'netlify');
// 2. State för att låta användaren stänga bannern.
const isMigrationBannerClosed = ref(false);
// --- SLUT PÅ NY LOGIK ---

const isReportPage = computed(() => route.meta.isReportPage);

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

const bannerClass = computed(() => {
  return bannerState.value === 'none' ? 'banner-hidden' : '';
});

onMounted(() => {
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);

  const deployTimestampStr = import.meta.env.VITE_DEPLOY_TIMESTAMP;
  if (deployTimestampStr) {
    const deployTime = new Date(deployTimestampStr).getTime();
    const now = new Date().getTime();
    const thirtyMinutesInMillis = 30 * 60 * 1000;
    const sixtyMinutesInMillis = 60 * 60 * 1000;
    const timeSinceDeploy = now - deployTime;

    if (timeSinceDeploy < thirtyMinutesInMillis) {
      bannerState.value = 'in-progress';
      const timeToGreen = thirtyMinutesInMillis - timeSinceDeploy;
      setTimeout(() => { bannerState.value = 'updated'; }, timeToGreen);
      const timeToHide = sixtyMinutesInMillis - timeSinceDeploy;
      setTimeout(() => { bannerState.value = 'none'; }, timeToHide);

    } else if (timeSinceDeploy < sixtyMinutesInMillis) {
      bannerState.value = 'updated';
      const timeRemaining = sixtyMinutesInMillis - timeSinceDeploy;
      setTimeout(() => { bannerState.value = 'none'; }, timeRemaining);
    }
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize);
});

const routeIcons = {
  'home': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
  'tonearm-calculator': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="2"></circle><line x1="12" y1="3" x2="12" y2="1"></line><line x1="19" y1="12" x2="21" y2="12"></line><path d="M16 8L12 12 8 8"></path></svg>`,
  'compliance-estimator': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"></path><path d="M18 20V4"></path><path d="M6 20V16"></path></svg>`,
  'alignment-calculator': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"></path><path d="M11.25 11.25c-1.39 1.39-1.39 3.61 0 5s3.61 1.39 5 0"></path><path d="m21 21-2.04-2.04"></path><path d="m16.25 16.25 2.04 2.04"></path><path d="M18 3v18"></path></svg>`,
  'data-explorer': `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>`
};
</script>

<template>
  <div class="app-layout" :class="{ 'mobile-view': isMobile, [bannerClass]: isMobile }">

    <!-- NY FLYTT-BANNER -->
    <div v-if="shouldShowMigrationBanner && !isMigrationBannerClosed" class="migration-banner">
      <div class="banner-content">
        <p>
          <strong>Site Has Moved!</strong> This version is now an archive. For the latest updates, please update your bookmarks to our new address:
          <a href="https://engrove.pages.dev" target="_blank" rel="noopener noreferrer">engrove.pages.dev</a>
        </p>
      </div>
      <button @click="isMigrationBannerClosed = true" class="close-banner-btn" title="Close this message">×</button>
    </div>

    <transition name="banner-fade">
      <div v-if="bannerState !== 'none'" class="update-banner" :class="bannerState">
        <p v-if="bannerState === 'in-progress'">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path></svg>
          An update is in progress...
        </p>
        <p v-if="bannerState === 'updated'">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"></path><path d="m9 12 2 2 4-4"></path></svg>
          Site has been updated. Please refresh the page.
        </p>
      </div>
    </transition>

    <template v-if="isMobile">
      <button @click="toggleMenu" class="mobile-menu-trigger">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
      </button>
      <div v-if="isMenuExpanded" @click="closeMenu" class="mobile-menu-overlay"></div>
    </template>

    <aside class="sidebar" :class="{ 'is-expanded': isMenuExpanded }">
      <div class="sidebar-header">
        <h3 v-show="isMenuExpanded || !isMobile">Engrove Toolkit</h3>
      </div>
      <nav class="main-nav">
        <RouterLink
          v-for="route in router.options.routes.filter(r => r.meta && r.meta.title)"
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
      <div v-if="!isMobile" class="menu-toggle-wrap">
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

<style>
/* Allmänna stilar */
:root { --sidebar-width-expanded: 250px; --sidebar-width-collapsed: 70px; --header-color: #2c3e50; --accent-color: #3498db; --text-light: #ecf0f1; --text-muted: #bdc3c7; --bg-hover: #34495e; --panel-bg: #f8f9fa; --border-color: #dee2e6; --text-color: #212529; --label-color: #495057; --ideal-color: #d4edda; --warning-color: #fff3cd; --danger-color: #f8d7da; --ideal-text: #155724; --warning-text: #856404; --danger-text: #721c24; }
html { scroll-behavior: smooth; }
body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background-color: #e9ecef; }
#app { width: 100%; }
.app-layout { position: relative; }
.content-area { padding: 2rem; transition: margin-left 0.3s ease; margin-left: var(--sidebar-width-collapsed); }
.panel { background-color: var(--panel-bg); padding: 1.5rem; border-radius: 6px; border: 1px solid var(--border-color); }
.panel h2 { margin-top: 0; color: var(--header-color); font-size: 1.25rem; border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem; margin-bottom: 1.5rem; }

/* --- NY STYLING FÖR FLYTT-BANNER --- */
.migration-banner {
  position: sticky;
  top: 0;
  left: 0;
  width: 100%;
  background-color: #34495e; /* Mörkblå färg för att skilja sig från röd/grön */
  color: white;
  z-index: 2001; /* Se till att den ligger överst */
  padding: 0.75rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}
.migration-banner .banner-content p {
  margin: 0;
  font-weight: 500;
}
.migration-banner .banner-content a {
  color: #a9cce3; /* Ljusare blå för länken */
  font-weight: 700;
  text-decoration: underline;
}
.close-banner-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  padding: 0 0.5rem;
  line-height: 1;
  opacity: 0.7;
  transition: opacity 0.2s ease;
}
.close-banner-btn:hover {
  opacity: 1;
}

/* Sidebar */
.sidebar { background-color: var(--header-color); color: var(--text-light); height: 100dvh; position: fixed; top: 0; left: 0; z-index: 1000; display: flex; flex-direction: column; width: var(--sidebar-width-collapsed); overflow: hidden; transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.sidebar.is-expanded { width: var(--sidebar-width-expanded); }
.sidebar-header { padding: 0 1.25rem; margin-top: 1rem; margin-bottom: 2rem; font-size: 1.2rem; white-space: nowrap; height: 36px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sidebar.is-expanded .sidebar-header { justify-content: flex-start; }
.sidebar-header h3 { margin: 0; opacity: 0; transition: opacity 0.3s ease; }
.sidebar.is-expanded .sidebar-header h3 { opacity: 1; }
.main-nav { flex-grow: 1; overflow-y: auto; overflow-x: hidden; }
.menu-toggle-wrap { flex-shrink: 0; display: flex; justify-content: center; padding: 1rem 0; border-top: 1px solid var(--bg-hover); }
.sidebar.is-expanded .menu-toggle-wrap { justify-content: flex-end; padding-right: 1rem; }
.nav-link { display: flex; align-items: center; gap: 1.25rem; padding: 1rem; margin: 0.5rem; border-radius: 8px; color: var(--text-muted); text-decoration: none; transition: background-color 0.2s ease, color 0.2s ease; white-space: nowrap; }
.sidebar.is-expanded .nav-link { padding-left: 1.5rem; }
.nav-link:hover { background-color: var(--bg-hover); color: #fff; }
.nav-link.router-link-exact-active { background-color: rgba(52, 152, 219, 0.15); color: #fff; font-weight: 600; }
.nav-link.router-link-exact-active .nav-icon { color: var(--accent-color); }
.nav-icon { flex-shrink: 0; margin-left: 0.5rem; transition: margin 0.3s ease; }
.sidebar.is-expanded .nav-icon { margin-left: 0; }
.nav-text { opacity: 0; transition: opacity 0.2s ease; }
.sidebar.is-expanded .nav-text { opacity: 1; }
.menu-toggle { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 0.5rem; border-radius: 50%; transition: background-color 0.2s ease, transform 0.3s ease-in-out; }
.menu-toggle:hover { background-color: var(--bg-hover); color: #fff; }
.sidebar.is-expanded .menu-toggle { transform: rotate(180deg); }

/* Banner för uppdatering */
.update-banner { position: sticky; top: 0; left: 0; width: 100%; color: white; text-align: center; padding: 0.75rem; z-index: 2000; box-shadow: 0 2px 10px rgba(0,0,0,0.2); transition: background-color 0.5s ease; }
.update-banner.updated { background-color: #27ae60; }
.update-banner.in-progress { background-color: #e74c3c; }
.update-banner.in-progress svg { animation: spin 2s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.update-banner p { margin: 0; display: flex; align-items: center; justify-content: center; gap: 0.75rem; font-weight: 500; }
.banner-fade-enter-active, .banner-fade-leave-active { transition: opacity 0.5s ease, transform 0.5s ease; }
.banner-fade-enter-from, .banner-fade-leave-to { opacity: 0; transform: translateY(-100%); }

/* Mobilanpassning */
@media (max-width: 767px) {
  .content-area { margin-left: 0; padding: 1rem; padding-top: 5rem; }
  .sidebar { width: var(--sidebar-width-expanded); transform: translateX(-100%); transition: transform 0.3s ease; }
  .sidebar.is-expanded { transform: translateX(0); }
  .sidebar-header h3, .nav-text { opacity: 1; }
  .mobile-menu-trigger { position: fixed; top: 1rem; left: 1rem; z-index: 1001; background-color: rgba(255, 255, 255, 0.8); backdrop-filter: blur(5px); border: 1px solid var(--border-color); border-radius: 8px; padding: 0.5rem; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: top 0.5s ease; }
  .mobile-menu-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.5); z-index: 999; }
  .app-layout.mobile-view:not(.banner-hidden) .mobile-menu-trigger { top: calc(1rem + 48px); }
  .update-banner p { font-size: 0.9rem; }
  .migration-banner { flex-direction: column; text-align: center; gap: 0.5rem; }
}

/* Utskriftsregler */
@media print {
  body { background-color: #fff !important; }
  .sidebar, .mobile-menu-trigger, .update-banner, .migration-banner { display: none !important; }
  .content-area { margin-left: 0 !important; padding: 0 !important; }
}
</style>
