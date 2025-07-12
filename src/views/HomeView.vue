<!-- src/views/HomeView.vue -->
<template>
  <div class="home-view">
    <header class="home-header">
      <h1 class="main-title">Engrove Audio Toolkit</h1>
      <p class="subtitle">A Hobbyist's Collection of Interactive Tools</p>
    </header>

    <section class="intro-section">
      <p>
        Welcome to the Engrove Toolkit! This is an open-source project born from a passion for DIY audio and the "95% overthinking" philosophy detailed in the 
        <a href="https://www.lencoheaven.net/forum/index.php?topic=45949.0" target="_blank" rel="noopener noreferrer">Double Decker Madness Lenco Project</a> on Lenco Heaven.
      </p>
      <p>
        I'm not a professional engineer, just a layman with ambitions and imagination. This toolkit is my attempt to transform complex audio theory into a dynamic, visual, and intuitive environment. The goal is to create tools that allow fellow enthusiasts to explore the trade-offs in audio design in real-time.
      </p>
      <p class="note">
        This is a live project. Features are added and updated sporadically. If something isn't working, it might be under construction! Check out the <a :href="githubUrl" target="_blank" rel="noopener noreferrer">GitHub repository</a> for the latest updates.
      </p>
    </section>

    <section class="tools-section">
      <h2>Available Tools</h2>
      <!-- UPPDATERAD SEKTION HÄR -->
      <div class="tools-grid">
        <RouterLink to="/tonearm-calculator" class="tool-card">
          <h3>Tonearm Resonance Calculator</h3>
          <p>An interactive simulator for calculating a tonearm's effective mass and its resonant frequency. Visualize the critical relationship between all physical parameters of a tonearm's design.</p>
        </RouterLink>

        <RouterLink to="/compliance-estimator" class="tool-card">
          <h3>Compliance Estimator</h3>
          <p>A data-driven tool to estimate a cartridge's dynamic compliance at 10Hz. Uses a statistical model for higher accuracy and provides transparent feedback on its confidence.</p>
        </RouterLink>

        <!-- NYTT KORT FÖR DATA EXPLORER -->
        <RouterLink to="/data-explorer" class="tool-card">
          <h3>Component Database Explorer</h3>
          <p>Search, filter, and explore the complete database of tonearms and cartridges. A tool for researching components and discovering suitable matches for your system.</p>
        </RouterLink>
      </div>
      <!-- SLUT PÅ UPPDATERAD SEKTION -->
    </section>

    <footer class="home-footer">
      <h3>Disclaimer</h3>
      <p>
        This toolkit is provided as a design aid for theoretical exploration and educational purposes only. The calculations are based on established physical principles but are the product of a hobbyist project. Data is compiled from publicly available sources, including manufacturer specifications and community-driven databases.
      </p>
      <p>
        While every effort is made to verify accuracy, there is no guarantee of the absolute correctness of the data or calculations. Users are encouraged to cross-reference the results with their own measurements and practical experience. The ultimate responsibility for any physical build or component matching rests with the user.
      </p>
    </footer>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router';

const githubUrl = 'https://github.com/Engrove/Turntable';
</script>

<style scoped>
.home-view {
  max-width: 1200px; /* Ökad bredd för att bättre rymma tre kort */
  margin: 0 auto;
  padding: 1rem 2rem 2rem;
  text-align: center;
}

.home-header {
  margin-bottom: 3rem;
}

.main-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--header-color);
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.25rem;
  color: var(--label-color);
  font-style: italic;
}

.intro-section {
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--text-color);
  margin-bottom: 3rem;
  text-align: left;
  background-color: var(--panel-bg);
  padding: 1.5rem 2rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
}

.intro-section a {
  color: var(--accent-color);
  font-weight: 600;
  text-decoration: none;
}

.intro-section a:hover {
  text-decoration: underline;
}

p.note {
    margin-top: 1.5rem;
    padding-top: 1rem;
    border-top: 1px dashed var(--border-color);
    font-size: 0.95rem;
    font-style: italic;
    color: var(--label-color);
}

.tools-section h2 {
  font-size: 1.75rem;
  color: var(--header-color);
  border-bottom: 2px solid var(--accent-color);
  display: inline-block;
  padding-bottom: 0.5rem;
  margin-bottom: 2rem;
}

/* UPPDATERAD CSS FÖR GRID */
.tools-grid {
  display: grid;
  /* Anpassar sig för 1, 2 eller 3 kolumner baserat på tillgängligt utrymme */
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  text-align: left;
}

.tool-card {
  display: flex; /* Använd flexbox för bättre kontroll över innehållet */
  flex-direction: column; /* Stapla innehållet vertikalt */
  background-color: #fff;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 1.5rem;
  text-decoration: none;
  color: inherit;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.tool-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.08);
}

.tool-card h3 {
  margin-top: 0;
  margin-bottom: 0.75rem; /* Justerat marginal */
  color: var(--accent-color);
}

.tool-card p {
  color: var(--label-color);
  line-height: 1.6;
  flex-grow: 1; /* Låter p-taggen växa för att fylla utrymmet, justerar korten */
}

.home-footer {
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid var(--border-color);
  color: var(--label-color);
  font-size: 0.9rem;
  text-align: left;
}

.home-footer h3 {
    text-align: center;
    color: var(--header-color);
}
</style>
