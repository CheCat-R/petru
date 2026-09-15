/**
 * Cliente HTTP del panel contra la API de Laravel.
 *
 * Autenticación por cookie de sesión (Sanctum SPA): el navegador guarda una
 * cookie httpOnly que JavaScript nunca ve, y cada request de escritura viaja
 * con el header X-XSRF-TOKEN leído de la cookie XSRF-TOKEN. No hay token en
 * localStorage ni en memoria.
 */

const BASE_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  constructor(message, { status, errors } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    /** Errores de validación por campo (422), tal como los manda Laravel. */
    this.errors = errors ?? {};
  }

  /** Primer mensaje de un campo, para pintarlo bajo el input. */
  fieldError(field) {
    return this.errors?.[field]?.[0] ?? null;
  }
}

const leerCookie = (nombre) => {
  const match = document.cookie.match(new RegExp(`(?:^|; )${nombre}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

let csrfListo = false;

/** Sanctum exige la cookie XSRF antes de la primera escritura. Idempotente. */
export async function asegurarCsrf() {
  if (csrfListo && leerCookie("XSRF-TOKEN")) return;
  await fetch(`${BASE_URL}/sanctum/csrf-cookie`, { credentials: "include" });
  csrfListo = true;
}

/** Se invoca cuando la API responde 401: la sesión venció o se cerró en otro lado. */
let alPerderSesion = null;
export const onUnauthorized = (fn) => {
  alPerderSesion = fn;
};

/**
 * @param {string} ruta      p. ej. "/api/admin/productos"
 * @param {object} opciones  { method, body, params, formData }
 */
export async function api(ruta, { method = "GET", body, params, formData } = {}) {
  const url = new URL(`${BASE_URL}${ruta}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
  }

  const escribe = method !== "GET";
  if (escribe) await asegurarCsrf();

  const headers = { Accept: "application/json" };
  if (escribe) headers["X-XSRF-TOKEN"] = leerCookie("XSRF-TOKEN") ?? "";
  if (body && !formData) headers["Content-Type"] = "application/json";

  const respuesta = await fetch(url, {
    method,
    headers,
    credentials: "include",
    body: formData ?? (body ? JSON.stringify(body) : undefined),
  });

  const datos = respuesta.status === 204 ? null : await respuesta.json().catch(() => null);

  if (respuesta.status === 401) {
    alPerderSesion?.();
  }

  if (!respuesta.ok) {
    throw new ApiError(datos?.message ?? `Error ${respuesta.status}`, {
      status: respuesta.status,
      errors: datos?.errors,
    });
  }

  return datos;
}

/** Desenvuelve `{ data }` de los Resources de Laravel. */
export const dataDe = (respuesta) => respuesta?.data;
