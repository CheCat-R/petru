import { sitio } from '../data/sitio';

/**
 * Arma el array de meta tags de una ruta (title, description, canonical,
 * Open Graph y Twitter Card) para exportar desde `meta` en cada página.
 */
export function meta({ titulo, descripcion, ruta = '/', imagen = '/img/buda-home.webp', tagline = sitio.tagline }) {
  const tituloCompleto = ruta === '/' ? `${sitio.nombre} — ${tagline}` : `${titulo} | ${sitio.nombre}`;
  const url = `${sitio.dominio}${ruta === '/' ? '' : ruta}`;
  const imagenAbsoluta = imagen.startsWith('http') ? imagen : `${sitio.dominio}${imagen}`;

  return [
    { title: tituloCompleto },
    { name: 'description', content: descripcion },
    { tagName: 'link', rel: 'canonical', href: url },

    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: sitio.nombre },
    { property: 'og:locale', content: 'es_AR' },
    { property: 'og:title', content: tituloCompleto },
    { property: 'og:description', content: descripcion },
    { property: 'og:url', content: url },
    { property: 'og:image', content: imagenAbsoluta },

    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: tituloCompleto },
    { name: 'twitter:description', content: descripcion },
    { name: 'twitter:image', content: imagenAbsoluta },
  ];
}

const absoluta = (url) => (url.startsWith('http') ? url : `${sitio.dominio}${url}`);

/** Datos estructurados de la organización, para el Home. */
export function jsonLdOrganizacion(contenido) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: sitio.nombre,
    url: sitio.dominio,
    logo: absoluta(contenido?.general.logo ?? '/img/petru-logo.png'),
    description: contenido?.general.description ?? sitio.descripcion,
    email: contenido?.contact.email.address,
    sameAs: Object.values(contenido?.contact.social ?? {}).filter(Boolean),
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Rosario',
      addressRegion: 'Santa Fe',
      addressCountry: 'AR',
    },
  };
}
