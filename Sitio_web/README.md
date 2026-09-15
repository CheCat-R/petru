# Pëtru — Sitio público

Sitio web público de Pëtru. Reemplaza al WordPress + Elementor + WooCommerce actual.

## Stack y por qué

| Pieza | Elección | Motivo |
|---|---|---|
| Build | Vite 8 | Rápido y es el estándar del resto del proyecto. |
| Framework | React 19 + React Router 7 (*framework mode*) | `ssr: false` + `prerender` genera un HTML real por ruta en build time: SEO sin necesitar Node corriendo en el servidor. |
| Estilos | Tailwind CSS 4 | Los tokens del sitio actual (`#F9F8F6`, `#1C1917`, `#D97706`, `#78716C`) son la paleta `stone` + `amber` de Tailwind, así que el calce es directo. |
| Tipografías | `@fontsource-variable` (Playfair Display + Plus Jakarta Sans) | Self-hosted: sin pedido a Google Fonts, mejor LCP y sin dependencia externa. |
| Datos del servidor | TanStack Query | Cuando llegue la API. |

### Sobre el prerender

`react-router.config.js` lista las rutas que se convierten en HTML estático.
Hoy son las cuatro fijas. Cuando exista la API, esa función pasa a consultar el
catálogo y devolver también las fichas de producto:

```js
async prerender() {
  const productos = await fetch(`${process.env.API_URL}/productos`).then((r) => r.json());
  return ['/', '/galeria', '/nosotros', '/contacto',
          ...productos.map((p) => `/producto/${p.slug}`)];
}
```

**Implicancia:** el HTML se congela en el build. Si el cliente carga un producto
desde el panel, hay que regenerar el sitio para que esa ficha exista como HTML
indexable. Se resuelve con un webhook de deploy o un cron. Las rutas que no
necesitan SEO (carrito, checkout, cuenta) las resuelve el bundle en el cliente
vía el fallback SPA.

## Comandos

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # genera build/client con un index.html por ruta
```

## Estructura

```
app/
├── root.jsx                 Layout raíz, <html>, header/footer, ErrorBoundary
├── routes.js                Declaración de rutas
├── app.css                  Tokens de marca (@theme) y estilos base
├── routes/                  Una página por archivo
├── components/
│   ├── layout/              Header (con carrito) y Footer
│   ├── ui/                  Boton, Seccion, Etiqueta, TituloSeccion
│   ├── home/                Secciones del home
│   └── catalogo/            TarjetaProducto
├── data/                    Contenido y config (sitio.js) + catálogo provisorio
└── lib/                     seo.js (meta tags + JSON-LD)
public/
├── .htaccess                Reglas de deploy para Apache/hPanel
└── img/                     Logo y assets de marca
```

## Estado actual

- ✅ Home, Galería, Nosotros y Contacto replicadas y prerenderizadas
- ✅ Catálogo, categorías y destacadas **desde la API** (`app/lib/api.js`), vía
  `loader` (build time) + `clientLoader` (navegación en el cliente)
- ✅ Ficha de producto `/producto/:slug` con meta tags, Open Graph y JSON-LD `Product`;
  el build genera una página estática por producto publicado
- ✅ Formulario de contacto con POST real (TanStack Query) y errores de validación por campo
- ✅ Carrito (Zustand + localStorage), checkout con cotización de envío por CP y
  pago por MercadoPago, y página de seguimiento `/pedido/:token` (hace polling
  mientras el pago está pendiente). Estas tres rutas no se prerenderizan ni se
  indexan: las resuelve el fallback SPA
- ✅ Páginas legales e informativas (`/envios`, `/cuidados`, `/devoluciones`,
  `/privacidad`, `/terminos`) y **botón de arrepentimiento** (`/arrepentimiento`,
  Res. 424/2020) con enlace a Defensa del Consumidor en el footer (Res. 244/2020).
  El contenido vive en `app/data/legales.js` y son **borradores**: antes de publicar,
  el taller tiene que completar razón social, CUIT y domicilio, y revisar plazos y textos.

**El build necesita la API corriendo** (lee `VITE_API_URL` de `.env`): el
prerender consulta el catálogo para saber qué fichas generar.

## Deploy en hosting compartido

1. `npm run build`
2. Subir **el contenido** de `build/client/` al document root del dominio.
3. El `.htaccess` ya viaja adentro: fuerza HTTPS, sirve el HTML prerenderizado
   cuando existe y cae al fallback SPA para el resto.

## Nota sobre Node

React Router 8 pide Node ≥ 22.22 y el entorno actual tiene 22.17, así que el
proyecto está en React Router 7 (Node ≥ 20). Funciona igual: mismo *framework
mode*, mismo prerender. Actualizando Node se puede subir a la 8 sin tocar código
de aplicación.
