<!-- src/components/TonearmVisualization.vue -->
<template>
  <div class="visualization-wrapper">
    <!-- Här skulle din riktiga D3, Chart.js eller SVG-visualisering ligga. -->
    <!-- Detta är en förenklad SVG-platshållare baserad på din bild. -->
    <svg width="100%" height="150" viewBox="0 0 600 150">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#6c757d" />
        </marker>
      </defs>
      <!-- Pivot point -->
      <path d="M 300 50 L 290 70 L 310 70 Z" fill="#343a40" />
      <text x="300" y="90" text-anchor="middle" font-size="12">Pivot</text>
      
      <!-- Tonearm tube -->
      <line x1="50" y1="60" x2="480" y2="60" stroke="#adb5bd" stroke-width="6" />
      
      <!-- Headshell/Cartridge (m1) -->
      <rect x="40" y="55" width="20" height="10" fill="#6c757d" />
      <text x="50" y="80" text-anchor="middle" font-size="12">m1 (19.0g)</text>

      <!-- Counterweight (m3, m4) -->
      <rect x="470" y="52.5" width="10" height="15" fill="#6c757d" />
      <circle cx="500" cy="60" r="15" fill="#343a40" />
      <text x="475" y="80" text-anchor="middle" font-size="12">m3</text>
      <text x="500" y="80" text-anchor="middle" font-size="12">m4</text>
      
      <!-- Dimensions -->
      <line x1="50" y1="30" x2="300" y2="30" stroke="#6c757d" marker-start="url(#arrow)" marker-end="url(#arrow)" />
      <text x="175" y="25" text-anchor="middle" font-size="12">L (eff): 237.0 mm</text>
    </svg>
  </div>
</template>

<style scoped>
.visualization-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}
</style>
