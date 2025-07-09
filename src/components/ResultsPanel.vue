<!-- src/components/ResultsPanel.vue -->
<script setup>
import { useTonearmStore } from '../store/tonearmStore';
const store = useTonearmStore(); // Anslut till storen!
</script>

<template>
    <div>
        <h2>Calculated Results</h2>
        
        <div class="results-list">
            <div class="result-item">
                <span class="label">Total Front Mass (m1):</span>
                <!-- LÄS FRÅN STORENS GETTERS -->
                <span class="value">{{ store.totalFrontMass.toFixed(1) }} g</span>
            </div>
            <div class="result-item">
                <span class="label">Effective Mass (M_eff):</span>
                <span class="value">{{ store.effectiveMass.toFixed(1) }} g</span>
            </div>
            <div class="result-item">
                <span class="label">System Resonance Frequency:</span>
                <span class="value">{{ store.resonanceFrequency.toFixed(1) }} Hz</span>
            </div>
             <!-- Lägg till de andra resultaten du vill visa här -->
        </div>

        <!-- Använd en dynamisk class och v-if för att visa rätt meddelande och färg -->
        <div v-if="store.resonanceStatus === 'excellent'" class="feedback-box excellent">
            <div class="title">Excellent Match!</div>
            <div class="description">The system resonance is perfectly within the ideal range (8-11 Hz).</div>
        </div>
        <div v-else-if="store.resonanceStatus === 'acceptable'" class="feedback-box acceptable">
            <div class="title">Acceptable Match</div>
            <div class="description">The resonance is acceptable, but not ideal.</div>
        </div>
        <div v-else class="feedback-box poor">
            <div class="title">Poor Match</div>
            <div class="description">The resonance is outside the recommended range.</div>
        </div>
    </div>
</template>

<style scoped>
/* Lägg till stilar för de olika statusarna */
.feedback-box {
    margin-top: 1.5rem;
    padding: 1rem;
    border-radius: 6px;
    text-align: center;
    border: 1px solid;
}
.excellent {
    background-color: #d1e7dd;
    color: #0f5132;
    border-color: #b6d7c4;
}
.acceptable {
    background-color: #fff3cd;
    color: #664d03;
    border-color: #ffecb5;
}
.poor {
    background-color: #f8d7da;
    color: #842029;
    border-color: #f5c2c7;
}

h2 {
    margin-top: 0;
    margin-bottom: 1.5rem;
    font-size: 1.25rem;
    border-bottom: 1px solid var(--color-border);
    padding-bottom: 0.75rem;
}
</style>
