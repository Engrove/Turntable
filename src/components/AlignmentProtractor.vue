<!-- src/components/AlignmentProtractor.vue -->

<script setup>
/**
* @file src/components/AlignmentProtractor.vue
* @description En värdkomponent som renderar en utskriftsvänlig protraktor
* med hjälp av en HTML Canvas och den dedikerade protractorRenderer-tjänsten.
*/
import { ref, onMounted, watchEffect } from 'vue';
import { useAlignmentStore } from '@/store/alignmentStore.js';
import { renderProtractor } from '@/services/protractorRenderer.js';

const store = useAlignmentStore();
const canvasRef = ref(null);

watchEffect(() => {
  if (canvasRef.value) {
    const ctx = canvasRef.value.getContext('2d');
    
    // Sätt canvasens interna upplösning till samma som pappersmåtten i mm.
    // Detta skapar en 1:1 pixel-till-mm mappning.
    ctx.canvas.width = store.protractorRenderData.paper.width;
    ctx.canvas.height = store.protractorRenderData.paper.height;
    
    renderProtractor(ctx, store.protractorRenderData);
  }
});

function printProtractor() {
    if (!canvasRef.value) return;

    const dataUrl = canvasRef.value.toDataURL('image/png');
    const paper = store.protractorRenderData.paper;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Engrove Audio Toolkit - Printable Protractor</title>
                <style>
                    @page {
                        size: ${paper.width}mm ${paper.height}mm;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        background-color: #FFF;
                    }
                    img {
                        width: ${paper.width}mm;
                        height: ${paper.height}mm;
                        display: block;
                    }
                </style>
            </head>
            <body>
                <img src="${dataUrl}" alt="Printable Tonearm Protractor">
                <script>
                    window.onload = function() {
                        window.print();
                        window.close();
                    }
                </script>
            </body>
        </html>
    `);
    printWindow.document.close();
}

</script>

<template>
    <div class="protractor-panel panel" id="protractor-section">
        <div class="protractor-header">
            <h3>Printable Protractor Preview</h3>
            <div class="header-controls">
                 <button @click="printProtractor" class="print-button">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Print Protractor
                </button>
            </div>
        </div>
        <div class="print-info">
            <p><strong>Printing Instructions:</strong> Click the "Print Protractor" button. In the print dialog, ensure scaling is set to <strong>100% or "Actual Size"</strong> and orientation is <strong>Landscape</strong>. Verify the printed 100mm scale with a ruler before use.</p>
        </div>

        <div class="protractor-container">
            <canvas ref="canvasRef" class="protractor-canvas"></canvas>
        </div>
    </div>
</template>

<style scoped>
.protractor-panel {
    grid-column: 1 / -1;
    margin-top: 1rem;
}
.protractor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}
.protractor-header h3 {
    margin: 0;
    color: var(--header-color);
    font-size: 1.25rem;
}
.print-info {
    font-size: 0.8rem;
    color: var(--label-color);
    background-color: #e9ecef;
    padding: 0.5rem 1rem;
    border-radius: 4px;
    border-left: 3px solid var(--accent-color);
    margin-bottom: 1rem;
}
.print-info p {
    margin: 0;
}
.print-button {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: #fff;
    background-color: var(--accent-color);
    border: 1px solid var(--accent-color);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
}
.print-button:hover {
    background-color: #2980b9;
    border-color: #2980b9;
}
.protractor-container {
    width: 100%;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 6px;
    padding: 1rem;
    overflow: auto;
}
.protractor-canvas {
    width: 100%;
    height: auto;
    display: block;
}
</style>
<!-- src/components/AlignmentProtractor.vue -->
