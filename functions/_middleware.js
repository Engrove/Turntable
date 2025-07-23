// Fil: functions/_middleware.js

// Samma DNSBL-listor som i ditt Python-skript
const DNSBL_ZONES = [
  "zen.spamhaus.org",
  "bl.spamcop.net",
  "dnsbl.sorbs.net"
];

/**
 * Kontrollerar en IP-adress mot en lista av DNSBL-zoner via DNS-över-HTTPS.
 * @param {string} ip - IP-adressen som ska kontrolleras.
 * @returns {Promise<boolean>} - True om IP:n är listad, annars false.
 */
async function isBlacklisted(ip) {
  // Invertera IP-adressens delar (t.ex. 8.8.4.4 -> 4.4.8.8)
  const reversedIp = ip.split('.').reverse().join('.');

  for (const zone of DNSBL_ZONES) {
    const query = `${reversedIp}.${zone}`;
    const dohUrl = `https://cloudflare-dns.com/dns-query?name=${query}&type=A`;

    try {
      const response = await fetch(dohUrl, {
        headers: { 'accept': 'application/dns-json' },
      });

      if (response.ok) {
        const data = await response.json();
        // Om Status är 0 (NOERROR) och det finns ett svar (Answer), är IP:n listad.
        if (data.Status === 0 && data.Answer) {
          console.log(`IP ${ip} är svartlistad av ${zone}.`);
          return true; // Funnen i en blockeringslista
        }
      }
    } catch (error) {
      // Ignorera fel och fortsätt till nästa lista
      console.error(`Fel vid kontroll mot ${zone}:`, error);
    }
  }

  return false; // Inte funnen i någon lista
}

/**
 * Huvudfunktionen som körs vid varje förfrågan till din sida.
 */
export async function onRequest(context) {
  // Hämta besökarens IP-adress. Cloudflare tillhandahåller detta säkert.
  const clientIP = context.request.headers.get('CF-Connecting-IP');

  // Om det finns en IP-adress, kontrollera den
  if (clientIP) {
    const blacklisted = await isBlacklisted(clientIP);

    if (blacklisted) {
      // Om IP:n är svartlistad, returnera en anpassad 401 Unauthorized-sida.
      const body = `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>401 Unauthorized</title>
            <style>
              body { font-family: sans-serif; text-align: center; padding: 40px; background: #f8f9fa; color: #343a40; }
              h1 { font-size: 2.5em; }
              p { font-size: 1.2em; }
            </style>
          </head>
          <body>
            <h1>401 Unauthorized</h1>
            <p>Access from your IP address has been restricted for security reasons.</p>
          </body>
        </html>
      `;
      
      // Skicka 401-svaret
      return new Response(body, {
        status: 401,
        statusText: 'Unauthorized',
        headers: { 'Content-Type': 'text/html' },
      });
    }
  }

  // Om IP:n är "ren" eller inte kan hämtas, fortsätt till din vanliga webbplats
  return await context.next();
    }
