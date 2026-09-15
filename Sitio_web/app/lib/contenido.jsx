/**
 * Contenido editable del sitio (textos, contacto, imágenes), que viene de la API.
 *
 * El root loader lo trae en el build, así queda prerenderizado; en el navegador
 * se vuelve a pedir apenas monta, para que un cambio hecho en el panel se vea
 * sin rebuild. Los componentes lo leen con `useContenido()`.
 */
import { useQuery } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

import { obtenerContenido } from './api';

const ContenidoContext = createContext(null);

export function ProveedorContenido({ inicial, children }) {
  const { data } = useQuery({
    queryKey: ['contenido'],
    queryFn: obtenerContenido,
    initialData: inicial,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  return <ContenidoContext.Provider value={data ?? inicial}>{children}</ContenidoContext.Provider>;
}

/** Sin lanzar: para el Footer y el Aviso, que también se dibujan en el ErrorBoundary del root. */
export function useContenidoOpcional() {
  return useContext(ContenidoContext);
}

/** Provider sin React Query, para el ErrorBoundary del root (que no tiene QueryClient). */
export function ContenidoEstatico({ contenido, children }) {
  return <ContenidoContext.Provider value={contenido}>{children}</ContenidoContext.Provider>;
}

export function useContenido() {
  const contenido = useContext(ContenidoContext);
  if (!contenido) throw new Error('useContenido() solo funciona dentro de <ProveedorContenido>.');
  return contenido;
}

/** Atajo para el bloque de contacto, que se usa en media docena de lugares. */
export function useContacto() {
  return useContenido().contact;
}

/**
 * Título con marcas simples: `_texto_` va en cursiva ámbar y el salto de
 * línea se respeta. Es todo lo que el taller puede "formatear": suficiente
 * para el hero, imposible de romper.
 */
export function Titulo({ texto, className }) {
  const lineas = texto.split('\n');
  return lineas.map((linea, i) => (
    <span key={i} className={className}>
      {linea.split(/(_[^_]+_)/).map((parte, j) =>
        parte.startsWith('_') && parte.endsWith('_') ? (
          <span key={j} className="italic text-ambar-600">{parte.slice(1, -1)}</span>
        ) : (
          parte
        ),
      )}
      {i < lineas.length - 1 ? <br /> : null}
    </span>
  ));
}
