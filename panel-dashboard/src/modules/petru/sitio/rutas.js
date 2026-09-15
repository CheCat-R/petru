/**
 * Lectura y escritura por ruta ("hero.title", "highlights.2.detail") sobre el
 * objeto del formulario, que tiene la forma exacta del JSON de la API. Los
 * errores 422 de Laravel usan estas mismas rutas, así que caen solos en su campo.
 */

export const leer = (obj, ruta) =>
  ruta.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

/** Copia inmutable con el valor puesto en la ruta. */
export const escribir = (obj, ruta, valor) => {
  const [k, ...resto] = ruta.split(".");
  const clon = Array.isArray(obj) ? [...obj] : { ...(obj ?? {}) };
  clon[k] = resto.length ? escribir(obj?.[k], resto.join("."), valor) : valor;
  return clon;
};
