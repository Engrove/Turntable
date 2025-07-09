<!-- src/App.vue -->
<template>
  <div class="app-container">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <!-- Ikon (inline SVG) -->
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
        <span class="text">Engrove Toolkit</span>
      </div>

      <nav>
        <router-link to="/" class="nav-link active">
          <!-- Kalkylator-ikon -->
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
          <span class="text">Tonearm Calculator</span>
        </router-link>
        <!-- Framtida länkar kan läggas till här -->
      </nav>
    </aside>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
/* Scoped styles för App.vue om det skulle behövas, men det mesta ligger i main.css */
</style>
