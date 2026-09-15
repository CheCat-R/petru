/**
 * Páginas legales e informativas del footer.
 *
 * BORRADORES escritos a partir de lo que el sitio ya promete (Rotura Cero,
 * plazos, cobertura Rosario) y de la normativa argentina de venta a distancia:
 * Ley 24.240 (Defensa del Consumidor), Ley 25.326 (Datos Personales),
 * Res. 424/2020 (botón de arrepentimiento) y Res. 244/2020 (enlace a Defensa
 * del Consumidor). Antes de publicar, Delfina y Viviana tienen que revisar cada
 * texto: razón social, CUIT, domicilio y los plazos son de ellas, no míos.
 *
 * Formato: cada sección tiene `titulo` y `parrafos` (strings). Un párrafo que
 * empieza con "- " se renderiza como ítem de lista.
 */

import { contacto as contactoFijo, sitio } from './sitio';

const ACTUALIZADO = '11 de septiembre de 2026';

/**
 * Arma las páginas con los datos editables (contacto y datos legales vienen
 * del panel). Sin contenido —solo pasa en `meta` y en el ErrorBoundary— usa
 * los valores fijos y deja los placeholders a la vista.
 */
export function construirLegales(contenido) {
  const contacto = contenido
    ? {
        whatsapp: { numero: contenido.contact.whatsapp.number, horario: contenido.contact.whatsapp.hours },
        email: { direccion: contenido.contact.email.address },
      }
    : contactoFijo;

  // Datos del responsable: se cargan en el panel (Sitio → Datos legales).
  const titular = {
    nombre: 'Pëtru',
    razonSocial: contenido?.legal.businessName || '[Razón social o nombre y apellido del titular — completar en el panel]',
    cuit: contenido?.legal.taxId || '[CUIT — completar en el panel]',
    domicilio: contenido?.legal.address || 'Rosario, Santa Fe, Argentina',
    email: contacto.email.direccion,
  };

  return {
  envios: {
    slug: 'envios',
    titulo: 'Tiempos de envío',
    etiqueta: 'Envíos',
    descripcion: 'Adónde enviamos, cuánto tarda y cómo viaja tu pieza. Rosario y alrededores, con embalaje blindado.',
    intro: 'Cada estatuilla sale del taller embalada a mano. Estos son los plazos y las condiciones con las que trabajamos hoy.',
    secciones: [
      {
        titulo: 'Zona de cobertura',
        parrafos: [
          'Por el momento enviamos a domicilio en Rosario y localidades del Gran Rosario: Funes, Roldán, Villa Gobernador Gálvez, Granadero Baigorria, Capitán Bermúdez, Fray Luis Beltrán, San Lorenzo, Pérez, Soldini, Alvear, Pueblo Esther, Arroyo Seco e Ibarlucea.',
          'Si estás fuera de esa zona, escribinos por WhatsApp: en muchos casos podemos coordinar un envío a medida.',
        ],
      },
      {
        titulo: 'Plazos',
        parrafos: [
          '- Rosario: 24 a 48 horas hábiles desde que el pago se acredita.',
          '- Gran Rosario: 48 a 72 horas hábiles desde que el pago se acredita.',
          '- Retiro en el taller: sin costo, con cita previa por WhatsApp.',
          '- Piezas a medida (Custom Lab): 7 a 12 días hábiles de producción, más el plazo de envío.',
          'Los plazos se cuentan en días hábiles y arrancan cuando MercadoPago nos confirma el pago. Si pagás en efectivo (Rapipago, Pago Fácil), la acreditación puede demorar hasta 48 horas hábiles.',
        ],
      },
      {
        titulo: 'Costo',
        parrafos: [
          'El costo del envío se calcula en el checkout a partir de tu código postal y se muestra antes de pagar. Retirar en el taller no tiene cargo.',
        ],
      },
      {
        titulo: 'Cómo viaja',
        parrafos: [
          'El yeso es pesado y frágil, así que cada pieza va en una caja rígida con relleno amortiguante en todas las caras, sin contacto directo con las paredes de la caja. Es lo que llamamos embalaje blindado.',
          'Cuando el paquete sale del taller te avisamos por email con el transportista y el código de seguimiento.',
        ],
      },
      {
        titulo: 'Si no hay nadie para recibirlo',
        parrafos: [
          'El transportista deja aviso y vuelve a intentar. Si después de los intentos el paquete vuelve al taller, coordinamos un nuevo envío; el costo del reenvío corre por cuenta del comprador salvo que el error haya sido nuestro.',
        ],
      },
    ],
  },

  cuidados: {
    slug: 'cuidados',
    titulo: '¿Cómo cuidamos tu yeso?',
    etiqueta: 'Cuidados',
    descripcion: 'Cómo limpiar, dónde ubicar y qué evitar para que tu estatuilla de yeso pintada a mano dure toda la vida.',
    intro: 'El yeso alabastrino es noble y duradero, pero tiene sus reglas. Con estos cuidados, la pieza va a durar tanto como el mueble donde la apoyes.',
    secciones: [
      {
        titulo: 'Dónde ubicarla',
        parrafos: [
          '- Interior, siempre. El yeso absorbe humedad y la pintura no está pensada para intemperie.',
          '- Lejos de la luz solar directa: los pigmentos, sobre todo los fluorescentes de la línea Pop Art, pueden virar con el tiempo.',
          '- Sobre una superficie firme y nivelada. Las piezas son pesadas y una repisa que se flexiona es un riesgo.',
          '- Evitá baños y cocinas sin ventilación: el vapor constante ablanda el yeso.',
        ],
      },
      {
        titulo: 'Limpieza',
        parrafos: [
          'Un plumero suave o un pincel de cerdas blandas alcanza para el polvo. Si necesitás más, un paño apenas humedecido con agua, sin frotar, y secar enseguida con otro paño.',
          'Nada de productos de limpieza, alcohol, solventes ni esponjas abrasivas: levantan la pintura y el pan de oro.',
        ],
      },
      {
        titulo: 'Manipulación',
        parrafos: [
          'Tomala siempre por la base o por la parte más maciza, nunca por brazos, hojas, cuernos o cualquier saliente fina. Con las dos manos si supera los 20 cm.',
        ],
      },
      {
        titulo: 'Si se golpea o se descascara',
        parrafos: [
          'No intentes pegarla con adhesivos de contacto: manchan el yeso. Escribinos con una foto y te decimos cómo seguir; en muchos casos podemos restaurarla en el taller.',
        ],
      },
    ],
  },

  devoluciones: {
    slug: 'devoluciones',
    titulo: 'Política de devolución Rotura Cero',
    etiqueta: 'Devoluciones',
    descripcion: 'Si tu pieza llega dañada, te enviamos otra o te devolvemos el dinero. Y podés arrepentirte de la compra dentro de los 10 días.',
    intro: 'Vendemos piezas frágiles a distancia. Nuestro compromiso es simple: el riesgo del viaje es nuestro, no tuyo.',
    secciones: [
      {
        titulo: 'Compromiso Rotura Cero',
        parrafos: [
          'Si tu pieza sufre un daño físico durante el envío, te mandamos una pieza nueva del mismo modelo sin cargo o te devolvemos el 100% del dinero. Vos elegís.',
          'Para gestionarlo necesitamos que nos escribas dentro de las 48 horas hábiles de recibido el paquete, con fotos de la pieza y del embalaje. Es lo que nos pide el transportista para el reclamo, y lo que nos permite mejorar el embalaje.',
          'Como cada pieza se pinta a mano, la de reemplazo no va a ser idéntica a la que se rompió: va a ser igual de única.',
        ],
      },
      {
        titulo: 'Derecho de arrepentimiento',
        parrafos: [
          `Por tratarse de una compra a distancia, tenés derecho a revocar la aceptación dentro de los 10 días corridos desde que recibiste la pieza, sin necesidad de dar motivos y sin costo (art. 34 de la Ley 24.240). Para ejercerlo, usá el botón de arrepentimiento que está al pie de todas las páginas del sitio, o escribinos a ${contacto.email.direccion}.`,
          'La pieza tiene que volver en el estado en que la recibiste y, en lo posible, en su embalaje original. Los gastos de devolución del envío corren por nuestra cuenta. Reintegramos el dinero por el mismo medio de pago dentro de los 10 días hábiles de recibida la pieza en el taller.',
        ],
      },
      {
        titulo: 'Piezas a medida',
        parrafos: [
          'Las piezas del Custom Lab se producen según tus indicaciones. Por eso, una vez confirmado el diseño y comenzada la producción, no admiten arrepentimiento (art. 1116, inc. b del Código Civil y Comercial). El compromiso Rotura Cero sí las cubre.',
        ],
      },
      {
        titulo: 'Diferencias que no son defectos',
        parrafos: [
          'No hay dos pinceladas iguales: variaciones de tono, intensidad del color y distribución del dorado entre la foto del catálogo y tu pieza son parte de lo que la hace única, y no constituyen un defecto. Si algo no te convence, igual escribinos: preferimos conversarlo.',
        ],
      },
      {
        titulo: 'Cómo iniciar un reclamo',
        parrafos: [
          `- Por WhatsApp al ${contacto.whatsapp.numero}, ${contacto.whatsapp.horario.toLowerCase()}.`,
          `- Por email a ${contacto.email.direccion}.`,
          '- Desde la página de seguimiento de tu pedido.',
          'Respondemos en un máximo de 3 horas hábiles.',
        ],
      },
    ],
  },

  privacidad: {
    slug: 'privacidad',
    titulo: 'Política de privacidad',
    etiqueta: 'Privacidad',
    descripcion: 'Qué datos guardamos cuando comprás o nos escribís, para qué los usamos y cómo pedir que los borremos.',
    intro: 'Guardamos lo mínimo para poder venderte una pieza y hacértela llegar. Acá está el detalle, sin letra chica.',
    secciones: [
      {
        titulo: 'Quién es responsable',
        parrafos: [
          `${titular.razonSocial}, CUIT ${titular.cuit}, con domicilio en ${titular.domicilio}, es responsable de la base de datos. Contacto: ${titular.email}.`,
        ],
      },
      {
        titulo: 'Qué datos recogemos y para qué',
        parrafos: [
          '- Al comprar: nombre, email, teléfono, DNI (si lo cargás) y dirección de entrega. Los usamos para procesar el pedido, entregarlo, emitir la documentación que corresponda y avisarte por email de cada cambio de estado.',
          '- Al escribirnos por el formulario: nombre, email o teléfono y tu mensaje. Los usamos para responderte.',
          '- Datos técnicos: dirección IP y fecha, con fines de seguridad y para prevenir abusos del formulario y del checkout.',
          'No usamos tus datos para publicidad ni los cedemos a terceros con fines comerciales.',
        ],
      },
      {
        titulo: 'Pagos',
        parrafos: [
          'El pago se realiza en MercadoPago. Nosotros nunca vemos ni guardamos los datos de tu tarjeta: recibimos de MercadoPago únicamente el estado del pago y un identificador de la operación. Podés leer la política de privacidad de MercadoPago en su sitio.',
        ],
      },
      {
        titulo: 'Con quién compartimos datos',
        parrafos: [
          'Solo con quienes necesitan tenerlos para cumplir tu pedido: la empresa de transporte (nombre, dirección, teléfono y DNI para la entrega), MercadoPago (para procesar el pago) y el proveedor de hosting donde funciona el sitio. Ninguno puede usarlos para otro fin.',
        ],
      },
      {
        titulo: 'Cuánto tiempo los guardamos',
        parrafos: [
          'Los datos de los pedidos se conservan mientras existan obligaciones legales, contables o de garantía asociadas. Las consultas del formulario, hasta 12 meses después de respondidas.',
        ],
      },
      {
        titulo: 'Tus derechos',
        parrafos: [
          `Podés pedir acceder, rectificar, actualizar o suprimir tus datos escribiendo a ${titular.email}. Respondemos dentro de los 10 días corridos.`,
          'La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, órgano de control de la Ley 25.326, tiene la atribución de atender las denuncias y reclamos que se interpongan con relación al incumplimiento de las normas sobre protección de datos personales.',
        ],
      },
      {
        titulo: 'Cookies y almacenamiento local',
        parrafos: [
          'El sitio no usa cookies de seguimiento ni de publicidad. Guarda en tu navegador (localStorage) únicamente el contenido de tu carrito, para que no se pierda si cerrás la pestaña. Podés borrarlo en cualquier momento desde la configuración del navegador.',
        ],
      },
    ],
  },

  terminos: {
    slug: 'terminos',
    titulo: 'Términos y condiciones',
    etiqueta: 'Términos',
    descripcion: 'Condiciones de compra en el sitio de Pëtru: precios, pago, entrega, garantía y derechos del consumidor.',
    intro: 'Comprar en este sitio implica aceptar estas condiciones. Están escritas para que se entiendan; si algo no queda claro, preguntanos.',
    secciones: [
      {
        titulo: 'El vendedor',
        parrafos: [
          `Las ventas realizadas en ${sitio.dominio} son efectuadas por ${titular.razonSocial}, CUIT ${titular.cuit}, con domicilio en ${titular.domicilio}. Contacto: ${titular.email}.`,
        ],
      },
      {
        titulo: 'Los productos',
        parrafos: [
          'Vendemos estatuillas de yeso alabastrino moldeadas y pintadas a mano. Cada unidad es única: las fotos del catálogo son representativas y pueden existir variaciones de tono, textura y detalle respecto de la pieza que recibas. Las medidas indicadas son aproximadas, con una tolerancia de ±1 cm.',
        ],
      },
      {
        titulo: 'Precios y pago',
        parrafos: [
          'Los precios están expresados en pesos argentinos y son precios finales al público. El costo de envío se informa antes de confirmar la compra.',
          'El pago se realiza a través de MercadoPago, con los medios que esa plataforma habilite. El pedido queda confirmado cuando MercadoPago acredita el pago. Mientras tanto, las piezas quedan reservadas durante 30 minutos; si el pago no se concreta en ese plazo, la reserva se libera y el pedido se cancela automáticamente.',
          'Ante un error evidente en el precio publicado, nos reservamos el derecho de cancelar el pedido y reintegrar íntegramente lo pagado, avisándote antes.',
        ],
      },
      {
        titulo: 'Entrega',
        parrafos: [
          'Los plazos, la zona de cobertura y las condiciones de entrega son los detallados en la página de Tiempos de envío. Los plazos son estimados y se cuentan en días hábiles desde la acreditación del pago.',
        ],
      },
      {
        titulo: 'Garantía y devoluciones',
        parrafos: [
          'Todas las piezas están cubiertas por el compromiso Rotura Cero y por la garantía legal de la Ley 24.240. Las condiciones de devolución y el derecho de arrepentimiento se detallan en la Política de devolución.',
        ],
      },
      {
        titulo: 'Piezas a medida',
        parrafos: [
          'Los trabajos del Custom Lab se cotizan y acuerdan por WhatsApp. El plazo de producción es de 7 a 12 días hábiles desde la confirmación del diseño y de la seña, salvo que se acuerde otro. Por ser productos confeccionados según las especificaciones del cliente, no admiten arrepentimiento una vez iniciada la producción.',
        ],
      },
      {
        titulo: 'Propiedad intelectual',
        parrafos: [
          'Los diseños, fotografías y textos de este sitio son de Pëtru. Podés compartirlos citando la fuente; no podés reproducirlos con fines comerciales sin autorización.',
        ],
      },
      {
        titulo: 'Defensa del consumidor',
        parrafos: [
          'Para consultas o reclamos ante la autoridad de aplicación podés ingresar a la Dirección Nacional de Defensa del Consumidor: argentina.gob.ar/defensadelconsumidor, o a la oficina de Defensa del Consumidor de tu jurisdicción.',
        ],
      },
      {
        titulo: 'Cambios en estas condiciones',
        parrafos: [
          `Podemos actualizar estos términos. La versión vigente es siempre la publicada en el sitio, con su fecha. Última actualización: ${ACTUALIZADO}.`,
        ],
      },
    ],
  },
  };
}

/** Solo para `meta` y los enlaces entre páginas: títulos y descripciones, que no se editan. */
export const legales = construirLegales(null);

export const enlacesLegales = [
  { nombre: 'Defensa del Consumidor', href: 'https://www.argentina.gob.ar/defensadelconsumidor', externo: true },
];

export { ACTUALIZADO };
