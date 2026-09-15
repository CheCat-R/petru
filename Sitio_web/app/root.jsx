import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useRouteLoaderData,
} from 'react-router';

import './app.css';
import Aviso from './components/layout/Aviso';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Boton from './components/ui/Boton';
import { registrar } from './lib/analitica';
import { obtenerContenido } from './lib/api';
import { ContenidoEstatico, ProveedorContenido } from './lib/contenido';

export const links = () => [{ rel: 'preload', as: 'image', href: '/img/buda-home.webp' }];

const TIPO_ICONO = { svg: 'image/svg+xml', png: 'image/png', ico: 'image/x-icon', webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg' };

/**
 * Google Analytics, píxel de Meta y verificación de Search Console, si el
 * taller los cargó en el panel. Nada de esto se emite cuando están vacíos.
 */
function Seguimiento() {
  const t = useRouteLoaderData('root')?.contenido?.general?.tracking;
  if (!t) return null;
  return (
    <>
      {t.searchConsole ? <meta name="google-site-verification" content={t.searchConsole} /> : null}
      {t.ga4 ? (
        <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${t.ga4}`} />
          <script
            dangerouslySetInnerHTML={{
              __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${t.ga4}',{send_page_view:false});`,
            }}
          />
        </>
      ) : null}
      {t.metaPixel ? (
        <script
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${t.metaPixel}');`,
          }}
        />
      ) : null}
    </>
  );
}

/** El favicon lo elige el taller desde el panel; `links()` es estático, así que va acá. */
function Favicon() {
  const href = useRouteLoaderData('root')?.contenido?.general?.favicon ?? '/favicon.svg';
  const extension = href.split('?')[0].split('.').pop()?.toLowerCase();
  return <link rel="icon" href={href} type={TIPO_ICONO[extension]} />;
}

// El contenido editable viaja con el root: se prerenderiza en el build y se
// refresca en el navegador (ver lib/contenido.jsx). `loader` y `clientLoader`
// van separados porque con ssr:false el build quita `loader` del bundle.
async function cargar() {
  return { contenido: await obtenerContenido() };
}
export const loader = () => cargar();
export const clientLoader = () => cargar();

export function Layout({ children }) {
  return (
    <html lang="es-AR">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#f9f8f6" />
        <Meta />
        <Links />
        <Favicon />
        <Seguimiento />
      </head>
      <body className="min-h-dvh">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-tinta focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-hueso"
        >
          Ir al contenido
        </a>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { contenido } = useLoaderData();
  const { pathname } = useLocation();

  // Una página vista por cada cambio de ruta: analítica propia (lib/analitica.js)
  // y, si están cargados, Google Analytics y el píxel de Meta.
  useEffect(() => {
    registrar('pageview');
    window.gtag?.('event', 'page_view', { page_path: pathname });
    window.fbq?.('track', 'PageView');
  }, [pathname]);
  // Un QueryClient por sesión de navegador. Los datos de página vienen por loaders
  // (así se prerenderizan); React Query queda para mutaciones y estado de servidor
  // interactivo (formulario de contacto, carrito, seguimiento de pedido).
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60_000, retry: 1 } } }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ProveedorContenido inicial={contenido}>
        <div className="flex min-h-dvh flex-col">
          <Aviso />
          <Header />
          <main id="contenido" className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
      </ProveedorContenido>
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }) {
  // Si el que falló fue el root loader no hay contenido; el Footer lo tolera.
  const contenido = useRouteLoaderData('root')?.contenido ?? null;
  const esRespuesta = isRouteErrorResponse(error);
  const titulo = esRespuesta && error.status === 404 ? 'Esta pieza no existe' : 'Algo se rompió';
  const detalle =
    esRespuesta && error.status === 404
      ? 'La página que buscás no está acá. Puede que la hayamos movido o que el enlace esté mal escrito.'
      : 'Tuvimos un problema inesperado. Si el error persiste, escribinos y lo resolvemos.';

  return (
    <ContenidoEstatico contenido={contenido}>
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="flex flex-1 items-center">
        <div className="contenedor py-24 text-center">
          <p className="font-mono text-sm uppercase tracking-[0.25em] text-ambar-600">
            Error {esRespuesta ? error.status : 500}
          </p>
          <h1 className="mt-6 text-display-md lg:text-display-lg">{titulo}</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-piedra-600">{detalle}</p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Boton to="/">Volver al inicio</Boton>
            <Boton to="/galeria" variante="secundario">
              Ver la galería
            </Boton>
          </div>
          {import.meta.env.DEV && error instanceof Error ? (
            <pre className="mx-auto mt-12 max-w-3xl overflow-x-auto rounded-2xl bg-tinta p-6 text-left text-xs text-hueso">
              {error.stack}
            </pre>
          ) : null}
        </div>
      </main>
      <Footer />
    </div>
    </ContenidoEstatico>
  );
}

