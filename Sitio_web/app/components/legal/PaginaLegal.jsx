import { Link } from 'react-router';

import Etiqueta from '../ui/Etiqueta';
import { ACTUALIZADO, legales } from '../../data/legales';

/** Render de una página legal a partir de su entrada en `data/legales.js`. */
export default function PaginaLegal({ pagina }) {
  const otras = Object.values(legales).filter((p) => p.slug !== pagina.slug);

  return (
    <div className="contenedor py-14 lg:py-20">
      <div className="grid gap-12 lg:grid-cols-[1fr_16rem] lg:gap-20">
        <article className="max-w-3xl">
          <Etiqueta>{pagina.etiqueta}</Etiqueta>
          <h1 className="mt-4 text-display-sm lg:text-display-md">{pagina.titulo}</h1>
          <p className="mt-6 text-lg leading-relaxed text-piedra-600">{pagina.intro}</p>

          <div className="mt-12 flex flex-col gap-10">
            {pagina.secciones.map((seccion) => {
              const items = seccion.parrafos.filter((p) => p.startsWith('- '));
              const parrafos = seccion.parrafos.filter((p) => !p.startsWith('- '));
              return (
                <section key={seccion.titulo}>
                  <h2 className="text-xl">{seccion.titulo}</h2>
                  {items.length > 0 ? (
                    <ul className="mt-4 flex flex-col gap-2 pl-5 leading-relaxed text-piedra-700 marker:text-ambar-600" role="list">
                      {items.map((item) => (
                        <li key={item} className="list-disc">{item.slice(2)}</li>
                      ))}
                    </ul>
                  ) : null}
                  {parrafos.map((parrafo) => (
                    <p key={parrafo} className="mt-4 leading-relaxed text-piedra-700">{parrafo}</p>
                  ))}
                </section>
              );
            })}
          </div>

          <p className="mt-14 border-t border-piedra-300/60 pt-6 text-sm text-piedra-500">
            Última actualización: {ACTUALIZADO}
          </p>
        </article>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-piedra-500">También te puede servir</p>
          <ul className="mt-4 flex flex-col gap-2.5" role="list">
            {otras.map((p) => (
              <li key={p.slug}>
                <Link to={`/${p.slug}`} className="text-sm font-medium text-piedra-700 transition-colors hover:text-ambar-600">
                  {p.titulo}
                </Link>
              </li>
            ))}
            <li>
              <Link to="/arrepentimiento" className="text-sm font-medium text-piedra-700 transition-colors hover:text-ambar-600">
                Botón de arrepentimiento
              </Link>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
