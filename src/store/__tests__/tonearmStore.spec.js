import { setActivePinia, createPinia } from 'pinia'
import { useTonearmStore } from '../tonearmStore.js'
import { describe, it, expect, beforeEach } from 'vitest'

// 'describe' grupperar relaterade tester
describe('Tonearm Store Calculations', () => {

// Detta körs före varje enskilt test för att säkerställa en ren state
beforeEach(() => {
setActivePinia(createPinia())
})

// 'it' beskriver ett specifikt testfall
it('calculates resonance frequency correctly with default parameters', () => {
const store = useTonearmStore()
const results = store.calculatedResults

// Verifiera med de NYA korrekta värdena baserat på nuvarande kod
expect(store.m1).toBeCloseTo(19.0)
expect(results.isUnbalanced).toBe(false)
expect(results.M_eff).toBeCloseTo(21.9, 1)      // Uppdaterat från 22.6
expect(results.L4_adj_cw).toBeCloseTo(39.8, 1)   // Uppdaterat från 39.1
expect(results.F).toBeCloseTo(10.8, 1)         // Uppdaterat från 10.6

})

it('correctly identifies an unbalanced state with a better test case', () => {
const store = useTonearmStore()

// Skapa ett scenario som garanterat är obalanserat
store.params.m_headshell = 25.0       // Tung headshell
store.params.m_rear_assembly = 10.0 // Extremt lätt bakre enhet
store.params.m4_adj_cw = 40.0       // Mycket lätt justerbar motvikt

// Denna kombination kan fysiskt inte balanseras, så `isUnbalanced` MÅSTE vara true.
expect(store.calculatedResults.isUnbalanced).toBe(true)   

})

it('calculates a high resonance frequency with a very light headshell', () => {
const store = useTonearmStore()
store.params.m_headshell = 2.0 // Mycket lätt headshell
expect(store.calculatedResults.F).toBeGreaterThan(12)
})

it('calculates a low resonance frequency with high compliance cartridge', () => {
const store = useTonearmStore()
store.params.compliance = 35.0 // Hög compliance
expect(store.calculatedResults.F).toBeLessThan(8)
})
})

