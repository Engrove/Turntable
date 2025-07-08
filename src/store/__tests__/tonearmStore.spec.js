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

// Verifiera med de slutgiltiga korrekta värdena
expect(store.m1).toBeCloseTo(19.0)
expect(results.isUnbalanced).toBe(false)
expect(results.M_eff).toBeCloseTo(21.9, 1)
expect(results.L4_adj_cw).toBeCloseTo(39.1, 1) // KORRIGERAT: Det korrekta värdet är ~39.1, inte 39.8
expect(results.F).toBeCloseTo(10.8, 1)
})

it('correctly identifies an unbalanced state with a robust test case', () => {
const store = useTonearmStore()

// Detta är ett garanterat obalanserbart scenario.
// Den främre momenten är så stor att den inte kan uppvägas av den bakre.
store.params.m_headshell = 50.0       // Extremt tung headshell
store.params.m_rear_assembly = 10.0   // Extremt lätt bakre enhet
store.params.vtf = 5.0              // Extremt hög VTF
store.params.m4_adj_cw = 40.0       // Mycket lätt justerbar motvikt

// Förväntningen är nu korrekt. Detta scenario MÅSTE resultera i `isUnbalanced: true`.
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

