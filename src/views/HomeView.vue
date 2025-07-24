<!-- src/views/HomeView.vue -->
<script setup>
import { RouterLink } from 'vue-router';
import { useHead } from '@unhead/vue';

const githubUrl = 'https://github.com/Engrove/engrove';

useHead({
  title: 'Engrove Audio Toolkit | Home',
  meta: [
    { 
      name: 'description', 
      content: 'Welcome to the Engrove Audio Toolkit. A collection of interactive tools for the DIY audio enthusiast, including calculators for tonearm resonance and cartridge compliance.' 
    },
    { property: 'og:title', content: 'Engrove Audio Toolkit | Home' },
    { property: 'og:description', content: 'A collection of interactive tools for the DIY audio enthusiast.' },
  ],
});
</script>

<template>
  <div class="home-view">
    <header class="home-header">
      <h1 class="main-title">Engrove Audio Toolkit</h1>
      <p class="subtitle">A Hobbyist's Collection of Interactive Tools</p>
    </header>

    <section class="intro-section">
      <!-- NY STRUKTUR FÖR INTRO-SEKTIONEN -->
      <div class="intro-container">
        <div class="avatar-wrapper">
          <img src="/images/engrove.webp" alt="Avatar of the site author" class="avatar-image" loading="lazy" width="200" height="200"/>
        </div>
        <div class="intro-text">
          <p class="intro-hook">
            Want to easily see how your cartridge and tonearm match, or optimize your turntable without complex math? You've come to the right place!
          </p>
          <p>
            Hi! I am a hi fi enthusiast who loves vinyl and technology. This toolkit transforms complex audio theory into a dynamic visual and intuitive environment and also tests how AI and other cutting edge technologies can help develop and verify ideas code and functionality.
            
            I have a personal goal to deepen my knowledge of acoustics and audio theory and to create tools that let fellow enthusiasts explore trade offs in audio design in real time. Along the way I hope to show how modern technology can speed up learning and spark new innovations in audio engineering.          </p>
          <p class="note">
            This is a live project. Features are added and updated sporadically. If something isn't working, it might be under construction!
          </p>
        </div>
      </div>
      <!-- SLUT PÅ NY STRUKTUR -->
    </section>

    <section class="tools-section">
      <h2>Available Tools</h2>
      <div class="tools-grid">
        <RouterLink to="/tonearm-calculator" class="tool-card">
          <img src="/images/preview-resonance.webp" alt="Tonearm Resonance Calculator Preview" class="tool-preview-image" loading="lazy" width="320" height="200"/>
          <div class="card-content">
            <h3>Tonearm Resonance Calculator</h3>
            <p>Visualize the critical relationship between tonearm effective mass and cartridge compliance to find the perfect resonant frequency.</p>
            <span class="card-action">Explore Calculator →</span>
          </div>
        </RouterLink>

        <RouterLink to="/compliance-estimator" class="tool-card">
          <img src="/images/preview-compliance.webp" alt="Compliance Estimator Preview" class="tool-preview-image" loading="lazy" width="320" height="200"/>
          <div class="card-content">
            <h3>Compliance Estimator</h3>
            <p>A data-driven tool to estimate a cartridge's dynamic compliance at 10Hz. Uses a statistical model for higher accuracy.</p>
            <span class="card-action">Explore Estimator →</span>
          </div>
        </RouterLink>
        
<!--   <RouterLink to="/alignment-calculator" class="tool-card">
          <img src="/images/preview-alignment.webp" alt="Alignment Calculator Preview" class="tool-preview-image" loading="lazy" width="320" height="200"/>
          <div class="card-content">
            <h3>Alignment Calculator</h3>
            <p>Generate printable protractors and visualize tracking error for various alignment geometries like Baerwald, Löfgren, and Stevenson.</p>
            <span class="card-action">Explore Calculator →</span>
          </div>
        </RouterLink> -->

        <RouterLink to="/data-explorer" class="tool-card">
          <img src="/images/preview-explorer.webp" alt="Data Explorer Preview" class="tool-preview-image" loading="lazy" width="320" height="200"/>
          <div class="card-content">
            <h3>Component Database Explorer</h3>
            <p>Search, filter, and explore the complete database of tonearms and cartridges to research components for your system.</p>
            <span class="card-action">Explore Database →</span>
          </div>
        </RouterLink>
      </div>
    </section>

    <footer class="home-footer">
      <h3>Disclaimer</h3>
      <p>
        This toolkit is provided as a design aid for theoretical exploration and educational purposes only. The calculations are based on established physical principles but are the product of a hobbyist project. Data is compiled from publicly available sources, including manufacturer specifications and community-driven databases.
      </p>
      <p>
        While every effort is made to verify accuracy, there is no guarantee of the absolute correctness of the data or calculations. Users are encouraged to cross-reference the results with their own measurements and practical experience. The ultimate responsibility for any physical build or component matching rests with the user.
      </p>
      <p>
        To build and maintain a comprehensive database, AI is utilized to enrich, standardize, and verify technical data. While this process aims for a high degree of accuracy, all information should be treated as a reference and verified against the manufacturer's official specifications.
      </p>
      <br>
      <center>
        <a href="https://dashboard.simpleanalytics.com/engrove.pages.dev?utm_source=engrove.pages.dev&utm_content=badge&affiliate=kurof" referrerpolicy="origin" target="_blank"><picture><source srcset="https://simpleanalyticsbadges.com/engrove.pages.dev?mode=dark" media="(prefers-color-scheme: dark)" /><img src="https://simpleanalyticsbadges.com/engrove.pages.dev?mode=light" loading="lazy" referrerpolicy="no-referrer" crossorigin="anonymous" /></picture></a>
      </center>
    </footer>
  </div>
</template>

<style scoped>
/* Befintliga stilar */
.home-view { max-width: 1200px; margin: 0 auto; padding: 1rem 2rem 2rem; text-align: center; }
.home-header { margin-bottom: 3rem; }
.main-title { font-size: 2.5rem; font-weight: 700; color: var(--header-color); margin-bottom: 0.5rem; }
.subtitle { font-size: 1.25rem; color: var(--label-color); font-style: italic; }
.intro-section { padding: 2rem; border-radius: 8px; border: 1px solid var(--border-color); background-color: var(--panel-bg); margin-bottom: 3rem; }
.intro-section a { color: var(--accent-color); font-weight: 600; text-decoration: none; }
.intro-section a:hover { text-decoration: underline; }
p.note { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px dashed var(--border-color); font-size: 0.95rem; font-style: italic; color: var(--label-color); }
.tools-section h2 { font-size: 1.75rem; color: var(--header-color); border-bottom: 2px solid var(--accent-color); display: inline-block; padding-bottom: 0.5rem; margin-bottom: 2rem; }
.tools-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 2rem; text-align: left; }
.tool-card { display: flex; flex-direction: column; background-color: #fff; border: 1px solid var(--border-color); border-radius: 8px; text-decoration: none; color: inherit; transition: transform 0.2s ease, box-shadow 0.2s ease; overflow: hidden; }
.tool-card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0,0,0,0.08); }
.tool-preview-image { width: 100%; height: 200px; object-fit: cover; object-position: top center; border-bottom: 1px solid var(--border-color); }
.card-content { padding: 1.5rem; display: flex; flex-direction: column; flex-grow: 1; }
.card-content h3 { margin-top: 0; margin-bottom: 0.75rem; color: var(--accent-color); }
.card-content p { color: var(--label-color); line-height: 1.6; flex-grow: 1; margin-bottom: 1rem; }
.card-action { font-weight: 600; color: var(--accent-color); align-self: flex-start; transition: color 0.2s ease; }
.tool-card:hover .card-action { color: var(--header-color); }
.home-footer { margin-top: 4rem; padding-top: 2rem; border-top: 1px solid var(--border-color); color: var(--label-color); font-size: 0.9rem; text-align: left; }
.home-footer h3 { text-align: center; color: var(--header-color); }

/* --- NY CSS FÖR AVATAR OCH INTRO-LAYOUT --- */
.intro-container {
  display: flex;
  align-items: center;
  gap: 2.5rem; /* Lite mer avstånd */
}
.avatar-wrapper {
  flex-shrink: 0; /* Förhindrar att bilden krymper */
}
.avatar-image {
  max-width: 200px;
  border-radius: 50%;
  border: 4px solid #fff;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}
.intro-text {
  text-align: left;
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--text-color);
}
.intro-hook {
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--header-color);
  margin-top: 0;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

/* Responsivitet för mobila enheter */
@media (max-width: 768px) {
  .intro-container {
    flex-direction: column; /* Stapla på höjden */
    text-align: center;
    gap: 1.5rem;
  }
  .intro-text {
    text-align: left; /* Behåll texten vänsterjusterad för läsbarhet */
  }
  .avatar-image {
    max-width: 150px; /* Gör bilden mindre på mobil */
  }
}
</style>
