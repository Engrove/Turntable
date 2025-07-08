import { setActivePinia, createPinia } from 'pinia'
import { useTonearmStore } from '../tonearmStore.js'
import { describe, it, expect, beforeEach } from 'vitest'

describe('Tonearm Store Calculations', () => {

beforeEach(() => {
setActivePinia(createPinia())
})

it('calculates resonance frequency correctly with default parameters', () => {
const store = useTonearmStore()
const results = store.calculatedResults

// Använd mer robusta kontroller istället för exakta värden
expect(results.isUnbalanced).toBe(false)
expect(results.M_eff).toBeGreaterThan(21.8)
expect(results.M_eff).toBeLessThan(22.0)

expect(results.L4_adj_cw).toBeGreaterThan(39.0)
expect(results.L4_adj_cw).toBeLessThan(39.2)

// Kontrollera att frekvensen ligger inom ett mycket snävt, korrekt intervall
expect(results.F).toBeGreaterThan(10.7)
expect(results.F).toBeLessThan(10.9)
})
it('correctly identifies an unbalanced state with a physically impossible scenario', () => {
const store = useTonearmStore()
// Detta är ett garanterat obalanserbart scenario.
// Den fasta motvikten är så tung och långt bak att den ensam
// överväger den främre massan. Numeratorn blir negativ.
store.params.m_headshell = 2.0         // Lätt headshell
store.params.m_rear_assembly = 100.0   // Tung bakre enhet...
store.params.m_tube_percentage = 10.0  // ...där nästan allt är den fasta motvikten (90g)...
store.params.L3_fixed_cw = 50.0        // ...placerad extremt långt bak.

// Förväntningen är nu korrekt. Detta MÅSTE resultera i `isUnbalanced: true`.
expect(store.calculatedResults.isUnbalanced).toBe(true)
})

it('calculates a high resonance frequency with a very light headshell', () => {
const store = useTonearmStore()
store.params.m_headshell = 2.0
expect(store.calculatedResults.F).toBeGreaterThan(12)
})

it('calculates a low resonance frequency with high compliance cartridge', () => {
const store = useTonearmStore()
store.params.compliance = 35.0
expect(store.calculatedResults.F).toBeLessThan(8)
})
})

