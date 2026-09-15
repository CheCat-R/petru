/**
 * Genera build/client/sitemap.xml y robots.txt después del build.
 *
 * Las URLs son las mismas que se prerenderizan (páginas fijas + una ficha por
 * pieza publicada), así que el sitemap y el HTML estático siempre coinciden.
 * Corre con la API levantada, igual que el build.
 */
import { writeFile } from 'node:fs/promises';
import { loadEnv } from 'vite';

import { sitio } from '../app/data/sitio.js';

const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), 'VITE_');
const apiUrl = (env.VITE_API_URL ?? 'http://localhost:8000/api').replace(/\/$/, '');
const dominio = sitio.dominio.replace(/\/$/, '');

const fijas = [
  ['/', 'weekly', '1.0'],
  ['/galeria', 'weekly', '0.9'],
  ['/nosotros', 'monthly', '0.6'],
  ['/contacto', 'monthly', '0.6'],
  ['/envios', 'monthly', '0.4'],
  ['/cuidados', 'monthly', '0.4'],
  ['/devoluciones', 'yearly', '0.3'],
  ['/privacidad', 'yearly', '0.2'],
  ['/terminos', 'yearly', '0.2'],
  ['/arrepentimiento', 'yearly', '0.2'],
];

const respuesta = await fetch(`${apiUrl}/productos?por_pagina=60`, { headers: { Accept: 'application/json' } });
if (!respuesta.ok) throw new Error(`No se pudo leer el catálogo desde ${apiUrl} (HTTP ${respuesta.status}).`);
const { data: productos } = await respuesta.json();

const hoy = new Date().toISOString().slice(0, 10);
const url = (ruta, freq, prio, mod = hoy) =>
  `  <url><loc>${dominio}${ruta === '/' ? '' : ruta}</loc><lastmod>${mod}</lastmod><changefreq>${freq}</changefreq><priority>${prio}</priority></url>`;

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${fijas.map(([r, f, p]) => url(r, f, p)).join('\n')}
${productos.map((p) => url(`/producto/${p.slug}`, 'weekly', '0.8', (p.updatedAt ?? hoy).slice(0, 10))).join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /
Disallow: /carrito
Disallow: /checkout
Disallow: /pedido/

Sitemap: ${dominio}/sitemap.xml
`;

await writeFile('build/client/sitemap.xml', xml);
await writeFile('build/client/robots.txt', robots);
console.log(`sitemap.xml: ${fijas.length + productos.length} URLs · robots.txt`);
