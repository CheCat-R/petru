import { loadEnv } from 'vite';

import { MOSTRAR_LEGALES_CONSUMIDOR } from './app/data/sitio.js';

/**
 * Configuración de React Router (framework mode).
 *
 * ssr:false + prerender => el build genera un HTML real por cada ruta listada.
 * Eso nos da SEO sin necesitar Node corriendo en el servidor: el resultado
 * (build/client) son archivos planos que se suben al document root del hosting.
 *
 * La API tiene que estar corriendo durante el build (VITE_API_URL en .env).
 */

/** @type {import('@react-router/dev/config').Config} */
export default {
  appDirectory: 'app',
  ssr: false,

  async prerender() {
    const fijas = [
      '/', '/galeria', '/nosotros', '/contacto',
      '/envios', '/cuidados', '/devoluciones', '/privacidad', '/terminos',
      ...(MOSTRAR_LEGALES_CONSUMIDOR ? ['/arrepentimiento'] : []),
    ];

    // Una ficha estática por cada producto publicado. Si un producto se carga
    // después del build, lo resuelve el fallback SPA hasta el próximo deploy.
    const env = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), 'VITE_');
    const apiUrl = (env.VITE_API_URL ?? 'http://localhost:8000/api').replace(/\/$/, '');

    const respuesta = await fetch(`${apiUrl}/productos?por_pagina=60`, {
      headers: { Accept: 'application/json' },
    });
    if (!respuesta.ok) {
      throw new Error(`No se pudo leer el catálogo desde ${apiUrl} (HTTP ${respuesta.status}). ¿Está corriendo la API?`);
    }
    const { data: productos } = await respuesta.json();

    return [...fijas, ...productos.map((producto) => `/producto/${producto.slug}`)];
  },
};
