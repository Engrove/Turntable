// src/services/dataLoader.js

/**
 * Hämtar JSON-data från en angiven sökväg i public-mappen.
 * Denna funktion är designad för att fungera både under utveckling (Vite dev server)
 * och i produktion (statiskt serverade filer).
 *
 * @param {string} path - Sökvägen till JSON-filen, relativt till public-mappen (t.ex. '/data/pickup_data.json').
 * @returns {Promise<any>} En promise som resolverar med den parsade JSON-datan.
 * @throws {Error} Kastar ett fel om fetch-operationen misslyckas.
 */
export async function fetchJsonData(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      // Om servern returnerar ett fel (t.ex. 404 Not Found), kasta ett informativt fel.
      throw new Error(`HTTP error! status: ${response.status} for path: ${path}`);
    }
    // Omvandla svaret till JSON och returnera det.
    return await response.json();
  } catch (error) {
    // Logga felet till konsolen för felsökning.
    console.error(`Failed to fetch JSON from ${path}:`, error);
    // Kasta om felet så att den anropande funktionen (i din store) kan hantera det.
    throw error;
  }
}
