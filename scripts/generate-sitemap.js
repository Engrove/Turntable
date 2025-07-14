// scripts/generate-sitemap.js

import fs from 'fs';
import path from 'path';

// Definiera projektets rotkatalog. __dirname är inte tillgängligt i ES-moduler.
// Vi använder import.meta.url för att få en korrekt sökväg.
const __dirname = path.dirname(new URL(import.meta.url).pathname);
const projectRoot = path.resolve(__dirname, '..');

// Manuell lista över rutter. Detta är mer robust än att försöka parsa Vue-router-filen.
// Se till att denna lista hålls uppdaterad när nya vyer läggs till.
const routes = [
  { path: '/', name: 'home' },
  { path: '/tonearm-calculator', name: 'tonearm-calculator' },
  { path: '/compliance-estimator', name: 'compliance-estimator' },
  { path: '/data-explorer', name: 'data-explorer' },
  { path: '/alignment-calculator', name: 'alignment-calculator' }
];

const baseUrl = 'https://engrove.netlify.app';
const today = new Date().toISOString().split('T')[0];

const sitemapContent = `
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${routes
    .map(route => {
      // Hantera rotsökvägen korrekt
      const fullPath = route.path === '/' ? '' : route.path;
      return `
  <url>
    <loc>${baseUrl}${fullPath}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route.path === '/' ? '1.0' : '0.8'}</priority>
  </url>`;
    })
    .join('')}
</urlset>
`.trim();

try {
  const publicPath = path.join(projectRoot, 'public');
  if (!fs.existsSync(publicPath)) {
    fs.mkdirSync(publicPath);
  }
  fs.writeFileSync(path.join(publicPath, 'sitemap.xml'), sitemapContent);
  console.log('Sitemap generated successfully!');
} catch (error) {
  console.error('Error generating sitemap:', error);
}
