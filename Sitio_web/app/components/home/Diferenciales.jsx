import { useContenido } from '../../lib/contenido';

/**
 * Iconos disponibles para los diferenciales. Las claves son las que ofrece el
 * panel (ContenidoSitio::ICONOS en la API); si llega una desconocida se dibuja
 * la estrella antes que romper la grilla.
 */
export const ICONOS = {
  brush: <path d="M4 20c4-1 5-3 6.5-6.5S14 6 20 4c-1 6-3.5 8.5-7 10S5 16 4 20Z" strokeLinecap="round" strokeLinejoin="round" />,
  cube: <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 0v18m8-13.5L4 16.5" strokeLinecap="round" strokeLinejoin="round" />,
  shield: <path d="M12 3 4 6v6c0 4.5 3.2 7.9 8 9 4.8-1.1 8-4.5 8-9V6l-8-3Zm-2.5 9 2 2 4-4.5" strokeLinecap="round" strokeLinejoin="round" />,
  pencil: <path d="M15 4.5 19.5 9 9 19.5l-5 1 1-5L15 4.5Zm-2 2 4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.2l1.1-6.2L3 9.6l6.2-.9L12 3Z" strokeLinecap="round" strokeLinejoin="round" />,
  heart: <path d="M12 20.5 4.5 13a4.5 4.5 0 0 1 6.4-6.4l1.1 1.1 1.1-1.1a4.5 4.5 0 1 1 6.4 6.4L12 20.5Z" strokeLinecap="round" strokeLinejoin="round" />,
  truck: <path d="M3 6h11v10H3V6Zm11 4h4l3 3v3h-7v-6ZM7 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" strokeLinecap="round" strokeLinejoin="round" />,
  gift: <path d="M4 11h16v10H4V11Zm-1-4h18v4H3V7Zm9 0v14m0-14c-1.5 0-4-1-4-3 0-1.5 2.5-1.5 4 3Zm0 0c1.5 0 4-1 4-3 0-1.5-2.5-1.5-4 3Z" strokeLinecap="round" strokeLinejoin="round" />,
  sparkles: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Zm7 11 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14ZM5 15l.6 1.6L7.2 17l-1.6.6L5 19.2 4.4 17.6 2.8 17l1.6-.4L5 15Z" strokeLinecap="round" strokeLinejoin="round" />,
  hand: <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12m0-7.5v-1a1.5 1.5 0 0 1 3 0V12m0-6.5a1.5 1.5 0 0 1 3 0V13m0-4a1.5 1.5 0 0 1 3 0v5.5A6.5 6.5 0 0 1 13.5 21h-1a6.5 6.5 0 0 1-5.4-2.9L4 13.5a1.6 1.6 0 0 1 2.6-1.9L8 13" strokeLinecap="round" strokeLinejoin="round" />,
};

export default function Diferenciales() {
  const { highlights } = useContenido().home;

  return (
    <section className="border-y border-piedra-300/60 bg-white">
      <div className="contenedor">
        <ul className="grid grid-cols-2 divide-piedra-300/60 lg:grid-cols-4 lg:divide-x">
          {highlights.map((item, i) => (
            <li
              key={i}
              className="flex flex-col items-center gap-3 px-4 py-10 text-center lg:px-8"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                aria-hidden
                className="h-7 w-7 text-ambar-600"
              >
                {ICONOS[item.icon] ?? ICONOS.star}
              </svg>
              <h3 className="text-lg">{item.title}</h3>
              <p className="text-sm text-piedra-500">{item.detail}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
