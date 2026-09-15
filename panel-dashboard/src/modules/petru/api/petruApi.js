/**
 * Capa `api/` del módulo Pëtru: la única puerta del panel hacia Laravel.
 *
 * A diferencia de los `api/` del ERP (síncronos, sobre mocks en memoria), estas
 * funciones son asíncronas y las pantallas las consumen con TanStack Query.
 * Los nombres de campos son los que devuelve la API (camelCase en inglés); ver
 * ../../../../docs/MODELO-DOMINIO.md §0.1.
 */
import { api, dataDe } from "../../../lib/apiClient";

/* -------------------------------------------------------------- sesión */

export const login = (email, password) =>
  api("/api/auth/login", { method: "POST", body: { email, password } }).then(dataDe);

export const logout = () => api("/api/auth/logout", { method: "POST" });

export const usuarioActual = () => api("/api/auth/usuario").then(dataDe);

/* ------------------------------------------------------------ productos */

export const listarProductos = (params = {}) => api("/api/admin/productos", { params });

export const obtenerProducto = (id) => api(`/api/admin/productos/${id}`).then(dataDe);

export const crearProducto = (datos) =>
  api("/api/admin/productos", { method: "POST", body: datos }).then(dataDe);

export const actualizarProducto = (id, datos) =>
  api(`/api/admin/productos/${id}`, { method: "PUT", body: datos }).then(dataDe);

export const eliminarProducto = (id) => api(`/api/admin/productos/${id}`, { method: "DELETE" });

/* ------------------------------------------------------------- imágenes */

export const subirImagen = (productoId, archivo, alt) => {
  const formData = new FormData();
  formData.append("imagen", archivo);
  if (alt) formData.append("alt", alt);
  return api(`/api/admin/productos/${productoId}/imagenes`, { method: "POST", formData }).then(dataDe);
};

export const actualizarImagen = (productoId, imagenId, datos) =>
  api(`/api/admin/productos/${productoId}/imagenes/${imagenId}`, { method: "PATCH", body: datos }).then(dataDe);

export const eliminarImagen = (productoId, imagenId) =>
  api(`/api/admin/productos/${productoId}/imagenes/${imagenId}`, { method: "DELETE" });

/* ----------------------------------------------------------- categorías */

export const listarCategorias = () => api("/api/admin/categorias").then(dataDe);

export const crearCategoria = (datos) =>
  api("/api/admin/categorias", { method: "POST", body: datos }).then(dataDe);

export const actualizarCategoria = (id, datos) =>
  api(`/api/admin/categorias/${id}`, { method: "PUT", body: datos }).then(dataDe);

export const eliminarCategoria = (id) => api(`/api/admin/categorias/${id}`, { method: "DELETE" });

/* ------------------------------------------------------------ consultas */

export const listarConsultas = (params = {}) => api("/api/admin/consultas", { params });

export const cambiarEstadoConsulta = (id, estado) =>
  api(`/api/admin/consultas/${id}`, { method: "PATCH", body: { estado } }).then(dataDe);

/* -------------------------------------------------------------- pedidos */

export const listarPedidos = (params = {}) => api("/api/admin/pedidos", { params });

export const obtenerPedido = (numero) => api(`/api/admin/pedidos/${numero}`).then(dataDe);

export const guardarNotasPedido = (numero, notas) =>
  api(`/api/admin/pedidos/${numero}/notas`, { method: "PATCH", body: { notas } }).then(dataDe);

/** Transiciones explícitas. La regla de cada una vive en el modelo Pedido de Laravel. */
export const transicionarPedido = (numero, accion, datos = {}) =>
  api(`/api/admin/pedidos/${numero}/${accion}`, { method: "POST", body: datos }).then(dataDe);

/* ------------------------------------------------------------- helpers */

export const formatearPrecio = (valor) =>
  Number(valor ?? 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

export const formatearFecha = (iso) =>
  iso
    ? new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" })
    : "—";

/** Claves de caché de TanStack Query, en un solo lugar. */
export const claves = {
  usuario: ["petru", "usuario"],
  productos: (params) => ["petru", "productos", params ?? {}],
  producto: (id) => ["petru", "producto", String(id)],
  categorias: ["petru", "categorias"],
  consultas: (params) => ["petru", "consultas", params ?? {}],
  pedidos: (params) => ["petru", "pedidos", params ?? {}],
  pedido: (numero) => ["petru", "pedido", String(numero)],
  novedades: ["petru", "novedades"],
  sitio: ["petru", "sitio"],
  mercadopago: ["petru", "integraciones", "mercadopago"],
  usuarios: ["petru", "usuarios"],
  envios: ["petru", "integraciones", "envios"],
  estadisticas: (dias) => ["petru", "estadisticas", dias],
};

/* ------------------------------------------------------------ novedades */

/** Pedidos pagados sin despachar + consultas sin leer. El panel lo sondea. */
export const obtenerNovedades = () => api("/api/admin/novedades");

/* ----------------------------------------------------------------- sitio */

/** Contenido editable del sitio: { data, defaults, customized, icons }. */
export const obtenerSitio = () => api("/api/admin/sitio");

export const guardarSeccionSitio = (seccion, contenido) =>
  api(`/api/admin/sitio/${seccion}`, { method: "PUT", body: contenido });

export const restaurarSeccionSitio = (seccion) =>
  api(`/api/admin/sitio/${seccion}`, { method: "DELETE" });

export const subirImagenSitio = (archivo) => {
  const formData = new FormData();
  formData.append("imagen", archivo);
  return api("/api/admin/sitio/imagenes", { method: "POST", formData });
};

/* --------------------------------------------------------- integraciones */

export const obtenerMercadoPago = () => api("/api/admin/integraciones/mercadopago").then(dataDe);

/** Campos vacíos conservan el secreto guardado. */
export const guardarMercadoPago = (datos) =>
  api("/api/admin/integraciones/mercadopago", { method: "PUT", body: datos }).then(dataDe);

/** Prueba credenciales sin guardarlas (o las guardadas si no se mandan). */
export const probarMercadoPago = (datos) =>
  api("/api/admin/integraciones/mercadopago/probar", { method: "POST", body: datos });

export const borrarMercadoPago = (que) =>
  api(`/api/admin/integraciones/mercadopago/${que}`, { method: "DELETE" }).then(dataDe);

export const limpiarErrorMercadoPago = () =>
  api("/api/admin/integraciones/mercadopago/error", { method: "DELETE" }).then(dataDe);

/* ------------------------------------------------------------- perfil */

export const actualizarPerfil = (datos) => api("/api/auth/perfil", { method: "PUT", body: datos }).then(dataDe);

export const cambiarPassword = (datos) => api("/api/auth/perfil/password", { method: "PUT", body: datos });

export const cerrarOtrasSesiones = (password) =>
  api("/api/auth/perfil/cerrar-otras-sesiones", { method: "POST", body: { password } });

/** Sin sesión: link por mail y restablecimiento. */
export const olvidePassword = (email) => api("/api/auth/olvide", { method: "POST", body: { email } });

export const restablecerPassword = (datos) => api("/api/auth/restablecer", { method: "POST", body: datos });

/* ----------------------------------------------------------- usuarios */

export const listarUsuarios = () => api("/api/admin/usuarios").then(dataDe);

export const crearUsuario = (datos) => api("/api/admin/usuarios", { method: "POST", body: datos }).then(dataDe);

export const actualizarUsuario = (id, datos) => api(`/api/admin/usuarios/${id}`, { method: "PUT", body: datos }).then(dataDe);

export const restablecerPasswordUsuario = (id, datos) =>
  api(`/api/admin/usuarios/${id}/password`, { method: "PUT", body: datos });

export const eliminarUsuario = (id) => api(`/api/admin/usuarios/${id}`, { method: "DELETE" });

/* ------------------------------------------------------------- envios */

export const obtenerEnvios = () => api("/api/admin/integraciones/envios").then(dataDe);

export const guardarEnvios = (datos) => api("/api/admin/integraciones/envios", { method: "PUT", body: datos }).then(dataDe);

export const probarAndreani = (credenciales) =>
  api("/api/admin/integraciones/envios/probar-andreani", { method: "POST", body: credenciales });

export const borrarAndreani = () => api("/api/admin/integraciones/envios/andreani", { method: "DELETE" }).then(dataDe);

export const limpiarErrorEnvios = () => api("/api/admin/integraciones/envios/error", { method: "DELETE" }).then(dataDe);

/* ------------------------------------------------------- estadisticas */

export const obtenerEstadisticas = (dias) => api("/api/admin/estadisticas", { params: { dias } }).then(dataDe);
