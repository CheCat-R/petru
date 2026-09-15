import clsx from 'clsx';
import { Link } from 'react-router';

import { formatearPrecio, urlImagen } from '../../lib/api';
import BotonAgregar from './BotonAgregar';

/** Tarjeta de la galería. Recibe el producto con la forma que devuelve la API. */
export default function TarjetaProducto({ producto }) {
  const ruta = `/producto/${producto.slug}`;
  const imagen = urlImagen(producto.image?.url);
  const enOferta = producto.compareAtPrice != null && producto.compareAtPrice > producto.price;

  return (
    <article
      className={clsx(
        'group flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-piedra-300/60 transition-all duration-300',
        producto.isAvailable
          ? 'hover:-translate-y-1 hover:shadow-xl hover:ring-piedra-400'
          : 'opacity-75',
      )}
    >
      <Link to={ruta} className="relative block aspect-square overflow-hidden bg-hueso-oscuro">
        {imagen ? (
          <img
            src={imagen}
            alt={producto.image?.alt ?? producto.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-display text-6xl text-piedra-300">
            {producto.name.charAt(0)}
          </span>
        )}

        {!producto.isAvailable ? (
          <span className="absolute left-4 top-4 rounded-full bg-tinta px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-hueso">
            Sin stock
          </span>
        ) : enOferta ? (
          <span className="absolute left-4 top-4 rounded-full bg-ambar-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
            Oferta
          </span>
        ) : producto.featured ? (
          <span className="absolute left-4 top-4 rounded-full bg-ambar-600 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white">
            Destacada
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col p-6">
        {producto.category ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-piedra-400">
            {producto.category.name}
          </p>
        ) : null}

        <h3 className="mt-2 text-lg leading-snug">
          <Link to={ruta} className="transition-colors hover:text-ambar-600">
            {producto.name}
          </Link>
        </h3>

        {producto.summary ? (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-piedra-500">
            {producto.summary}
          </p>
        ) : null}

        <div className="mt-5 flex items-end justify-between gap-4 pt-1">
          <div>
            <p className="font-display text-xl tabular-nums">
              {formatearPrecio(producto.price)}
              {enOferta ? (
                <span className="ml-2 text-sm text-piedra-400 line-through">
                  {formatearPrecio(producto.compareAtPrice)}
                </span>
              ) : null}
            </p>
            {producto.pieceHeightCm ? (
              <p className="mt-0.5 text-xs text-piedra-400">Alto {producto.pieceHeightCm} cm</p>
            ) : null}
          </div>

          {producto.isAvailable ? (
            <BotonAgregar producto={producto} tamano="sm" etiqueta="Agregar" />
          ) : (
            <span className="rounded-full bg-hueso-oscuro px-4 py-2 text-sm font-semibold text-piedra-400">
              Agotada
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
