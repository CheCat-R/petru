/**
 * Contenido y configuración del sitio.
 *
 * Todo lo que hoy es texto fijo vive acá para que más adelante pueda salir
 * de la API sin tocar los componentes.
 */

export const sitio = {
  nombre: 'Pëtru',
  dominio: 'https://petru.com.ar',
  tagline: 'Hecho a mano, pintado para trascender.',
  descripcion:
    'Estudio de diseño y manufactura de arte pop y clásico en yeso. Estatuillas esculpidas y pintadas a mano, pieza por pieza.',
};

export const navegacion = [
  { nombre: 'Home', href: '/' },
  { nombre: 'Galería', href: '/galeria' },
  { nombre: 'Nosotros', href: '/nosotros' },
  { nombre: 'Contacto', href: '/contacto' },
];

export const contacto = {
  whatsapp: {
    numero: '+54 9 11 2345-6789',
    // Formato internacional sin signos, para el link wa.me
    link: 'https://wa.me/5491123456789',
    horario: 'Lunes a Sábado • 09:00 a 19:00 hs',
  },
  email: {
    direccion: 'hola@petru.art',
    detalle: 'Para colaboraciones o soporte postventa',
  },
  ubicacion: {
    ciudad: 'Rosario, Santa Fe',
    pais: 'Argentina',
    detalle: 'Hacemos envíos protegidos a todo el país',
  },
};

export const footer = {
  columnas: [
    {
      titulo: 'Comprar',
      enlaces: [
        { nombre: 'Colección Mitología', href: '/galeria?categoria=mitologia' },
        { nombre: 'Línea Pop Art', href: '/galeria?categoria=pop-art' },
        { nombre: 'Miniaturas de Colección', href: '/galeria?categoria=miniaturas' },
        { nombre: 'Tarjetas de Regalo', href: '/galeria?categoria=gift-cards' },
      ],
    },
    {
      titulo: 'Soporte & Ayuda',
      enlaces: [
        { nombre: 'Tiempos de Envío (Nacional)', href: '/envios' },
        { nombre: '¿Cómo cuidamos tu Yeso?', href: '/cuidados' },
        { nombre: 'Políticas de Devolución Rotura Cero', href: '/devoluciones' },
        { nombre: 'Contacto', href: '/contacto' },
      ],
    },
  ],
  legales: [
    { nombre: 'Privacidad', href: '/privacidad' },
    { nombre: 'Términos', href: '/terminos' },
  ],
  credito: {
    texto: 'Diseñado y desarrollado por',
    autor: 'CheCAT',
    // Con UTM para que CheCAT vea en sus estadísticas que la visita vino del
    // footer de este cliente. El <a> va sin "noreferrer" a propósito: el
    // referer también sirve para atribuir.
    href: 'https://checatdevelopers.com/?utm_source=petru.com.ar&utm_medium=referral&utm_campaign=footer-clientes&utm_content=petru',
  },
};
