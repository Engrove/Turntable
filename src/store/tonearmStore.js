import { defineStore } from 'pinia'
import { reactive, computed, ref } from 'vue' // Kom ihåg att importera ref

export const useTonearmStore = defineStore('tonearm', () => {
  // --- STATE ---
  const params = reactive({
    m_headshell: 11.4,
    m_pickup: 6.3,
    m_screws: 1.3,
    m_rear_assembly: 63.0,
    m4_adj_cw: 100.0,
    L1: 237.0,
    vtf: 1.75,
    compliance: 10.0,
    m_tube_percentage: 35.0,
    L2: 15.0,
    L3_fixed_cw: 12.5,
  });

  // Debug-logg för att få meddelanden från hela appen
  const debugMessages = ref([]); // Använder ref för en array
  const DEBUG_LOG_MAX_SIZE = 500; // Max antal meddelanden att lagra

  function addDebugMessage(source, message, data = null) {
    const timestamp = new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3 });
    let logEntry = `[${timestamp}] [${source}] ${message}`;
    if (data !== null && typeof data !== 'undefined') {
      try {
        // Försök att stringifiera objekt/arrayer för bättre läsbarhet
        logEntry += ` - Data: ${JSON.stringify(data, null, 2)}`;
      } catch (e) {
        logEntry += ` - Data: ${data.toString()}`;
      }
    }
    debugMessages.value.push(logEntry);
    // Håll loggen begränsad för att inte överbelasta minnet
    if (debugMessages.value.length > DEBUG_LOG_MAX_SIZE) {
      debugMessages.value.shift(); // Ta bort äldsta meddelandet
    }
  }

  function clearDebugMessages() {
    debugMessages.value = [];
  }

  // --- COMPUTED PROPERTIES ---
  const m1 = computed(() => params.m_headshell + params.m_pickup + params.m_screws);
  const m2_tube = computed(() => params.m_rear_assembly * (params.m_tube_percentage / 100.0));
  const m3_fixed_cw = computed(() => params.m_rear_assembly - m2_tube.value);

  const calculatedResults = computed(() => {
    // Logga ingångsparametrarna här för att felsöka beräkningarna
    addDebugMessage('Store:calculatedResults', 'Calculating with params:', params);

    if (params.m4_adj_cw <= 0) {
      addDebugMessage('Store:calculatedResults', 'm4_adj_cw is zero or negative. Unbalanced.', { m4_adj_cw: params.m4_adj_cw });
      return { isUnbalanced: true, M_eff: 0, F: 0, L4_adj_cw: -1 };
    }

    const numerator = (m1.value * params.L1) + (m2_tube.value * params.L2) - (m3_fixed_cw.value * params.L3_fixed_cw) - (params.vtf * params.L1);
    const L4_adj_cw = (numerator >= 0) ? numerator / params.m4_adj_cw : -1;

    if (L4_adj_cw < 0) {
      addDebugMessage('Store:calculatedResults', 'Arm cannot be balanced (L4_adj_cw < 0). Unbalanced.', { numerator, m4_adj_cw: params.m4_adj_cw });
      return { isUnbalanced: true, M_eff: 0, F: 0, L4_adj_cw: -1 };
    }

    const Itot = (m1.value * params.L1**2) + (m2_tube.value * params.L2**2) + (m3_fixed_cw.value * params.L3_fixed_cw**2) + (params.m4_adj_cw * L4_adj_cw**2);
    const M_eff = Itot / (params.L1 ** 2);
    const F = 1000 / (2 * Math.PI * Math.sqrt(Math.max(1, M_eff * params.compliance)));

    const results = { L4_adj_cw, M_eff, F, isUnbalanced: false };
    addDebugMessage('Store:calculatedResults', 'Calculation successful. Results:', results);
    return results;
  });
  
  const diagnosis = computed(() => {
    if (!calculatedResults.value || calculatedResults.value.isUnbalanced) {
        return {
            text: 'The arm cannot be balanced. Try a heavier adjustable counterweight or a lighter headshell.',
            className: 'danger'
        };
    }
    const freq = calculatedResults.value.F;
    if (freq >= 8.0 && freq <= 11.0) {
        return { text: `CONGRATULATIONS! Resonance is ideal at ${freq.toFixed(1)} Hz.`, className: 'ideal' };
    }
    if (freq >= 7.0 && freq < 8.0 || freq > 11.0 && freq <= 12.0) {
        return { text: `ACCEPTABLE. Resonance at ${freq.toFixed(1)} Hz is slightly outside the ideal range.`, className: 'warning' };
    }
    const status = freq < 7.0 ? 'TOO LOW' : 'TOO HIGH';
    return { text: `DANGER! Resonance frequency of ${freq.toFixed(1)} Hz is ${status}. Re-evaluation is advised.`, className: 'danger' };
  });

  return { params, m1, calculatedResults, diagnosis, debugMessages, addDebugMessage, clearDebugMessages };
});
