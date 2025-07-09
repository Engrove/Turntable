<!-- src/components/ResultsPanel.vue -->
<template>
    <div>
        <h2>Calculated Results</h2>
        
        <div class="results-list">
            <div class="result-item">
                <span class="label">Total Front Mass (m1):</span>
                <span class="value">19.0 g</span>
            </div>
            <div class="result-item">
                <span class="label">Adj. CW Distance (D):</span>
                <span class="value">39.1 mm</span>
            </div>
            <div class="result-item">
                <span class="label">Effective Mass (M_eff):</span>
                <span class="value">21.9 g</span>
            </div>
            <div class="result-item">
                <span class="label">System Resonance Frequency:</span>
                <span class="value">10.7 Hz</span>
            </div>
        </div>

        <div class="feedback-box">
            <div class="title">Excellent Match!</div>
            <div class="description">The system resonance is perfectly within the ideal range (8-11 Hz).</div>
        </div>
    </div>
</template>

<style scoped>
/* Scoped styles om det behövs */
h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.25rem;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0.75rem;
}
</style>
