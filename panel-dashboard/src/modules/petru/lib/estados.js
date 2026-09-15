/** Vocabulario de estados de Pëtru, en un solo lugar. Los valores son los de la API. */

export const ESTADOS_PRODUCTO = ["Activo", "Agotado", "Borrador"];

export const ESTADOS_PAGO = [
  "Pendiente", "Pagado", "Rechazado", "Cancelado", "Reembolso pendiente", "Reembolsado",
];

export const ESTADOS_ENVIO = ["Sin despachar", "Despachado", "Entregado", "Devuelto", "Cancelado"];

export const TRANSPORTISTAS = ["Andreani", "Correo Argentino", "Retiro en taller"];

export const MOTIVOS_CONSULTA = {
  custom: "Pieza customizada",
  pedido: "Pedido en curso",
  otro: "Otra consulta",
  arrepentimiento: "Arrepentimiento",
};

export const ESTADOS_CONSULTA = {
  nueva: "Nueva",
  leida: "Leída",
  respondida: "Respondida",
};

/**
 * Qué acciones ofrece el panel para un pedido según sus dos estados. Espeja las
 * reglas del modelo `Pedido` de Laravel: si acá se ofrece algo que allá no se
 * permite, la API responde 409 y el panel lo muestra.
 */
export const accionesDePedido = (pedido) => {
  const { paymentStatus: pago, fulfillmentStatus: envio } = pedido;
  const acciones = [];

  if (pago === "Pendiente") {
    acciones.push({ accion: "confirmar-pago", etiqueta: "Confirmar pago", variante: "primary", pideReferencia: true });
    acciones.push({ accion: "rechazar-pago", etiqueta: "Rechazar pago", variante: "secondary", pideMotivo: true });
    acciones.push({ accion: "cancelar", etiqueta: "Cancelar pedido", variante: "danger", pideMotivo: true });
  }
  if (pago === "Rechazado") {
    acciones.push({ accion: "cancelar", etiqueta: "Cancelar pedido", variante: "danger", pideMotivo: true });
  }
  if (pago === "Pagado" && envio === "Sin despachar") {
    acciones.push({ accion: "despachar", etiqueta: "Despachar", variante: "primary", pideEnvio: true });
    acciones.push({ accion: "reembolsar", etiqueta: "Reembolsar", variante: "danger", confirmar: true });
  }
  if (envio === "Despachado") {
    acciones.push({ accion: "entregado", etiqueta: "Marcar entregado", variante: "primary" });
  }
  if (["Despachado", "Entregado"].includes(envio) && pago === "Pagado") {
    acciones.push({ accion: "devolucion", etiqueta: "Registrar devolución", variante: "secondary", confirmar: true });
  }
  if (pago === "Reembolso pendiente") {
    acciones.push({ accion: "confirmar-reembolso", etiqueta: "Confirmar reembolso", variante: "primary", confirmar: true });
  }

  return acciones;
};
