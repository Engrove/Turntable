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
    // Hämta en instans av vår store
    const store = useTonearmStore()

    // Verifiera att de beräknade resultaten matchar förväntade värden
    // (Dessa värden är tagna från en körning med default-parametrarna)
    
    // Förväntat Total Front Mass (11.4 + 6.3 + 1.3)
    expect(store.m1).toBeCloseTo(19.0)

    // Förväntade huvudresultat
    const results = store.calculatedResults
    expect(results.isUnbalanced).toBe(false)
    expect(results.M_eff).toBeCloseTo(22.6, 1) // Kontrollera med 1 decimals precision
    expect(results.L4_adj_cw).toBeCloseTo(39.1, 1)
    expect(results.F).toBeCloseTo(10.6, 1)
  })

  it('correctly identifies an unbalanced state', () => {
    const store = useTonearmStore()

    // Skapa ett scenario som garanterat är obalanserat
    store.params.m_headshell = 50.0 // Extremt tung headshell
    store.params.m4_adj_cw = 40.0   // Extremt lätt motvikt

    expect(store.calculatedResults.isUnbalanced).toBe(true)
  })

  it('calculates a high resonance frequency with a very light headshell', () => {
    const store = useTonearmStore()

    // Manipulera state för detta specifika test
    store.params.m_headshell = 2.0 // Mycket lätt headshell

    // Förväntar oss en hög frekvens eftersom effektiv massa blir lägre
    expect(store.calculatedResults.F).toBeGreaterThan(12)
  })

  it('calculates a low resonance frequency with high compliance cartridge', () => {
    const store = useTonearmStore()

    store.params.compliance = 35.0 // Hög compliance

    // Förväntar oss en låg frekvens
    expect(store.calculatedResults.F).toBeLessThan(8)
  })
})
