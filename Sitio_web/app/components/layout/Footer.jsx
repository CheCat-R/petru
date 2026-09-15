import { Link } from 'react-router';

import { enlacesLegales } from '../../data/legales';
import { footer, sitio } from '../../data/sitio';
import { useContenidoOpcional } from '../../lib/contenido';

const REDES = {
  instagram: {
    nombre: 'Instagram',
    icono: <path d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Zm5 5.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM17.5 6.5h.01" strokeLinecap="round" strokeLinejoin="round" />,
  },
  facebook: {
    nombre: 'Facebook',
    icono: <path d="M14 8h2.5V4.5H14A3.5 3.5 0 0 0 10.5 8v2.5H8V14h2.5v6h3.5v-6h2.5l.5-3.5H14V8Z" strokeLinecap="round" strokeLinejoin="round" />,
  },
  tiktok: {
    nombre: 'TikTok',
    icono: <path d="M14 4v9.5a3.5 3.5 0 1 1-3.5-3.5M14 4c0 2.5 2 4.5 4.5 4.5" strokeLinecap="round" strokeLinejoin="round" />,
  },
};

export default function Footer() {
  const anio = new Date().getFullYear();
  const contenido = useContenidoOpcional();
  const contacto = contenido?.contact;
  const redes = Object.entries(contacto?.social ?? {}).filter(([, url]) => url);

  return (
    <footer className="border-t border-piedra-300/60 bg-hueso-oscuro">
      <div className="contenedor py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr] lg:gap-16">
          {/* Marca */}
          <div className="max-w-sm">
            <img
              src={contenido?.general.logo ?? '/img/petru-logo.png'}
              alt="Pëtru"
              width={150}
              height={76}
              className="h-12 w-auto"
              loading="lazy"
            />
            <p className="mt-6 text-sm leading-relaxed text-piedra-600">
              {contenido?.general.description ?? sitio.descripcion}
            </p>
            {contacto ? (
              <a
                href={contacto.whatsapp.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-tinta transition-colors hover:text-ambar-600"
              >
                <span
                  className="inline-block h-2 w-2 rounded-full bg-jade"
                  aria-hidden
                />
                {contacto.whatsapp.number}
              </a>
            ) : null}
            {redes.length > 0 ? (
              <ul className="mt-6 flex gap-3" aria-label="Redes sociales">
                {redes.map(([red, url]) => (
                  <li key={red}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={REDES[red]?.nombre ?? red}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-piedra-300 text-piedra-600 transition-colors hover:border-tinta hover:text-tinta"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden className="h-5 w-5">
                        {REDES[red]?.icono}
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* Columnas de enlaces */}
          {footer.columnas.map((columna) => (
            <nav key={columna.titulo} aria-label={columna.titulo}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-tinta">
                {columna.titulo}
              </h3>
              <ul className="mt-6 flex flex-col gap-3.5">
                {columna.enlaces.map((enlace) => (
                  <li key={enlace.href}>
                    <Link
                      to={enlace.href}
                      className="text-sm text-piedra-600 transition-colors hover:text-ambar-600"
                    >
                      {enlace.nombre}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* Obligatorios para venta online en Argentina: Res. 424/2020 y 244/2020 */}
      <div className="border-t border-piedra-300/60">
        <div className="contenedor flex flex-col gap-3 py-5 text-xs text-piedra-500 sm:flex-row sm:items-center sm:gap-8">
          <Link
            to="/arrepentimiento"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-piedra-300 px-4 py-2 font-semibold text-tinta transition-colors hover:border-ambar-600 hover:text-ambar-600"
          >
            Botón de arrepentimiento
          </Link>
          {enlacesLegales.map((enlace) => (
            <a
              key={enlace.href}
              href={enlace.href}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-ambar-600"
            >
              {enlace.nombre} ↗
            </a>
          ))}
        </div>
      </div>

      {/* Barra legal */}
      <div className="border-t border-piedra-300/60">
        <div className="contenedor flex flex-col gap-4 py-6 text-xs text-piedra-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {anio} {sitio.nombre}. Todos los derechos reservados.{' '}
            {footer.credito.texto}{' '}
            <a
              href={footer.credito.href}
              target="_blank"
              rel="noopener"
              className="font-semibold text-piedra-600 transition-colors hover:text-ambar-600"
            >
              {footer.credito.autor}
            </a>
          </p>
          <ul className="flex gap-6">
            {footer.legales.map((enlace) => (
              <li key={enlace.href}>
                <Link to={enlace.href} className="transition-colors hover:text-ambar-600">
                  {enlace.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
