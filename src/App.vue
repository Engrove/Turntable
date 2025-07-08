<script setup>
import { RouterLink, RouterView } from 'vue-router'
import router from '@/router'
</script>

<template>
<div class="toolkit-wrapper">
<aside class="sidebar">
<div class="sidebar-header">
<h3>Engrove Toolkit</h3>
</div>
<nav class="main-nav">
<RouterLink
v-for="route in router.options.routes"
:key="route.name"
:to="route.path"
>
{{ route.meta.title }}
</RouterLink>
</nav>
<div class="sidebar-footer">
<p>v0.2.0</p>
</div>
</aside>

<main class="content-area">
  <!-- Den aktiva vyn/verktyget kommer att renderas här -->
  <RouterView />
</main>
</div>
</template>

<style scoped>
.toolkit-wrapper {
display: flex;
height: 100%;
}

.sidebar {
width: 240px;
background-color: var(--header-color);
color: #ecf0f1;
display: flex;
flex-direction: column;
padding: 1.5rem 0;
flex-shrink: 0;
}

.sidebar-header {
padding: 0 1.5rem;
margin-bottom: 2rem;
font-size: 1.2rem;
}
.sidebar-header h3 {
margin: 0;
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
transition: background-color 0.2s ease, color 0.2s ease;
}

.main-nav a:hover {
background-color: #495057;
color: #fff;
}

.main-nav a.router-link-exact-active {
background-color: var(--accent-color, #007bff);
color: #fff;
font-weight: 600;
}

.sidebar-footer {
padding: 0 1.5rem;
font-size: 0.8rem;
color: #7f8c8d;
}

.content-area {
flex-grow: 1;
padding: 2rem;
overflow-y: auto; /* Gör innehållet scrollbart om det blir för långt */
}
</style>
<style>
/* Globala justeringar för app-layouten */
#app {
padding: 0; /* Tar bort padding från #app för att wrappern ska fylla utrymmet */
max-width: none;
height: 100vh;
}
body {
padding: 0;
}
</style>
