/**
 * Cliente HTTP de la API de Laravel.
 *
 * Funciona en dos contextos: en Node durante el prerender (los `loader` corren en
 * build time) y en el navegador (los `clientLoader` y las mutaciones).
 */

const BASE_URL = (import.meta.env?.VITE_API_URL ?? 'http://localhost:8000/api').replace(/\/$/, '');

export class ErrorApi extends Error {
  constructor(mensaje, { status, errores, cuerpo } = {}) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.status = status;
    /** Errores de validación por campo, tal como los devuelve Laravel (422). */
    this.errores = errores ?? {};
    /** La respuesta completa, para errores con forma propia (409 del carrito). */
    this.cuerpo = cuerpo ?? null;
  }
}

async function pedir(ruta, { metodo = 'GET', cuerpo, parametros } = {}) {
  const url = new URL(`${BASE_URL}${ruta}`);
  if (parametros) {
    for (const [clave, valor] of Object.entries(parametros)) {
      if (valor !== undefined && valor !== null && valor !== '') url.searchParams.set(clave, valor);
    }
  }

  const respuesta = await fetch(url, {
    method: metodo,
    headers: {
      Accept: 'application/json',
      ...(cuerpo ? { 'Content-Type': 'application/json' } : {}),
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });

  const datos = respuesta.status === 204 ? null : await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    throw new ErrorApi(datos?.message ?? `Error ${respuesta.status}`, {
      status: respuesta.status,
      errores: datos?.errors,
      cuerpo: datos,
    });
  }

  return datos;
}

// --- Catálogo ---

export async function obtenerCategorias() {
  const { data } = await pedir('/categorias');
  return data;
}

/** Trae el catálogo completo publicado. Con un catálogo chico, una sola página alcanza. */
export async function obtenerProductos({ categoria, destacado, orden } = {}) {
  const { data } = await pedir('/productos', {
    parametros: { categoria, destacado: destacado ? 1 : undefined, orden, por_pagina: 60 },
  });
  return data;
}

export async function obtenerProducto(slug) {
  const { data } = await pedir(`/productos/${encodeURIComponent(slug)}`);
  return data;
}

// --- Contacto ---

export function enviarConsulta(consulta) {
  return pedir('/consultas', { metodo: 'POST', cuerpo: consulta });
}

// --- Helpers ---

/** Formatea un precio en pesos argentinos, sin centavos. */
export function formatearPrecio(valor) {
  return Number(valor).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/**
 * Las imágenes del seed son rutas del propio sitio (`/img/...`). Cuando la API
 * suba imágenes reales van a ser URLs absolutas. Se aceptan las dos.
 */
export function urlImagen(url) {
  if (!url) return null;
  return url.startsWith('http') ? url : url;
}

// --- Checkout ---

/** Opciones de envío para un código postal y un carrito. */
export async function cotizarEnvio(codigoPostal, items) {
  return pedir('/envios/cotizar', {
    metodo: 'POST',
    cuerpo: {
      codigo_postal: codigoPostal,
      items: items.map((i) => ({ producto_id: i.productId, cantidad: i.qty })),
    },
  });
}

/** Crea el pedido. Devuelve { data: pedido, paymentUrl }. */
export function crearPedido(datos) {
  return pedir('/pedidos', { metodo: 'POST', cuerpo: datos });
}

export async function obtenerPedido(token) {
  const { data } = await pedir(`/pedidos/${encodeURIComponent(token)}`);
  return data;
}

/** Solo existe cuando la API corre con la pasarela simulada (sin MercadoPago). */
export async function simularPago(token, resultado) {
  const { data } = await pedir(`/pedidos/${encodeURIComponent(token)}/simular-pago`, {
    metodo: 'POST',
    cuerpo: { resultado },
  });
  return data;
}

// --- Contenido editable del sitio ---

/** Textos e imágenes que el taller edita desde el panel. Lo pide el root loader. */
export async function obtenerContenido() {
  const { data } = await pedir('/sitio');
  return data;
}
