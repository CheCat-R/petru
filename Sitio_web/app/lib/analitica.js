/**
 * Analítica propia del sitio: manda eventos a la API para el panel del taller.
 *
 * Sin cookies ni datos personales. Lo único que persiste es un id de sesión
 * (sessionStorage: muere al cerrar la pestaña) y los datos de llegada —
 * referente y UTM del primer pageview— para atribuir a esa misma fuente lo
 * que pase después en la visita (ver una pieza, comprar).
 *
 * Los eventos van con `sendBeacon`, que no bloquea la navegación y llega
 * aunque la pestaña se cierre.
 */

const BASE_URL = (import.meta.env?.VITE_API_URL ?? 'http://localhost:8000/api').replace(/\/$/, '');
const CLAVE = 'petru-visita';

function visita() {
  if (typeof window === 'undefined') return null;
  try {
    const guardada = sessionStorage.getItem(CLAVE);
    if (guardada) return JSON.parse(guardada);

    const url = new URL(window.location.href);
    const nueva = {
      sesion: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      referente: document.referrer || null,
      utm_source: url.searchParams.get('utm_source'),
      utm_medium: url.searchParams.get('utm_medium'),
      utm_campaign: url.searchParams.get('utm_campaign'),
    };
    sessionStorage.setItem(CLAVE, JSON.stringify(nueva));
    return nueva;
  } catch {
    return null; // almacenamiento bloqueado: no se registra nada
  }
}

let ultimo = { firma: null, en: 0 };

/**
 * @param {'pageview'|'product_view'|'add_to_cart'|'checkout_start'|'order'} tipo
 * @param {{ producto_id?: number, pedido_numero?: string }} [datos]
 */
export function registrar(tipo, datos = {}) {
  const v = visita();
  if (!v || import.meta.env?.SSR) return;

  // El mismo evento dos veces en un segundo es un efecto repetido (StrictMode en
  // desarrollo, un doble clic), no dos hechos: se manda una vez.
  const firma = `${tipo}|${window.location.pathname}|${JSON.stringify(datos)}`;
  if (firma === ultimo.firma && Date.now() - ultimo.en < 1000) return;
  ultimo = { firma, en: Date.now() };

  const cuerpo = JSON.stringify({
    tipo,
    ruta: window.location.pathname,
    sesion: v.sesion,
    referente: v.referente,
    utm_source: v.utm_source,
    utm_medium: v.utm_medium,
    utm_campaign: v.utm_campaign,
    ancho: window.innerWidth,
    ...datos,
  });

  const url = `${BASE_URL}/eventos`;
  try {
    // sendBeacon no permite el header Content-Type: JSON; la API lee el cuerpo igual (text/plain).
    if (navigator.sendBeacon?.(url, new Blob([cuerpo], { type: 'application/json' }))) return;
  } catch {
    // cae al fetch
  }
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: cuerpo, keepalive: true }).catch(() => {});
}
