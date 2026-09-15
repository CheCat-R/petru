import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Link, useLoaderData } from 'react-router';

import BotonAgregar from '../components/catalogo/BotonAgregar';
import Boton from '../components/ui/Boton';
import { registrar } from '../lib/analitica';
import Etiqueta from '../components/ui/Etiqueta';
import { sitio } from '../data/sitio';
import { useContacto } from '../lib/contenido';
import { ErrorApi, formatearPrecio, obtenerProducto, urlImagen } from '../lib/api';
import { meta as construirMeta } from '../lib/seo';

async function cargar(slug) {
  try {
    return { producto: await obtenerProducto(slug) };
  } catch (error) {
    if (error instanceof ErrorApi && error.status === 404) {
      throw new Response('Producto no encontrado', { status: 404 });
    }
    throw error;
  }
}

export const loader = ({ params }) => cargar(params.slug);
export const clientLoader = ({ params }) => cargar(params.slug);

export const meta = ({ data }) => {
  if (!data?.producto) return [{ title: `Pieza no encontrada | ${sitio.nombre}` }];
  const { producto } = data;
  return construirMeta({
    ruta: `/producto/${producto.slug}`,
    titulo: producto.name,
    descripcion: producto.summary ?? producto.description?.slice(0, 160) ?? sitio.descripcion,
    imagen: urlImagen(producto.image?.url) ?? undefined,
  });
};

function jsonLdProducto(producto) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: producto.name,
    sku: producto.sku,
    description: producto.summary ?? producto.description,
    image: producto.images?.map((imagen) => `${sitio.dominio}${urlImagen(imagen.url)}`),
    brand: { '@type': 'Brand', name: sitio.nombre },
    category: producto.category?.name,
    offers: {
      '@type': 'Offer',
      url: `${sitio.dominio}/producto/${producto.slug}`,
      priceCurrency: 'ARS',
      price: producto.price,
      availability: producto.isAvailable
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
    },
  };
}

export default function Producto() {
  const contacto = useContacto();
  const { producto } = useLoaderData();

  useEffect(() => {
    registrar('product_view', { producto_id: producto.id });
  }, [producto.id]);
  const imagenes = producto.images?.length ? producto.images : producto.image ? [producto.image] : [];
  const [activa, setActiva] = useState(0);
  const imagenActiva = imagenes[activa];
  const enOferta = producto.compareAtPrice != null && producto.compareAtPrice > producto.price;

  const parrafos = (producto.description ?? '').split(/\n{2,}/).filter(Boolean);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdProducto(producto)) }}
      />

      <div className="contenedor py-10 lg:py-16">
        {/* Migas */}
        <nav aria-label="Migas de pan" className="text-sm text-piedra-500">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link to="/galeria" className="transition-colors hover:text-tinta">
                Galería
              </Link>
            </li>
            {producto.category ? (
              <>
                <li aria-hidden>/</li>
                <li>
                  <Link
                    to={`/galeria?categoria=${producto.category.slug}`}
                    className="transition-colors hover:text-tinta"
                  >
                    {producto.category.name}
                  </Link>
                </li>
              </>
            ) : null}
            <li aria-hidden>/</li>
            <li className="text-tinta" aria-current="page">
              {producto.name}
            </li>
          </ol>
        </nav>

        <div className="mt-8 grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          {/* Galería de imágenes */}
          <div>
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-hueso-oscuro">
              {imagenActiva ? (
                <img
                  src={urlImagen(imagenActiva.url)}
                  alt={imagenActiva.alt ?? producto.name}
                  width={1024}
                  height={1024}
                  fetchPriority="high"
                  className="h-full w-full object-contain p-8"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center font-display text-8xl text-piedra-300">
                  {producto.name.charAt(0)}
                </span>
              )}

              {!producto.isAvailable ? (
                <span className="absolute left-5 top-5 rounded-full bg-tinta px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-hueso">
                  Sin stock
                </span>
              ) : null}
            </div>

            {imagenes.length > 1 ? (
              <ul className="mt-4 flex gap-3" role="list">
                {imagenes.map((imagen, indice) => (
                  <li key={imagen.id ?? indice}>
                    <button
                      type="button"
                      onClick={() => setActiva(indice)}
                      aria-label={`Ver imagen ${indice + 1}`}
                      aria-pressed={indice === activa}
                      className={clsx(
                        'h-20 w-20 overflow-hidden rounded-xl bg-hueso-oscuro ring-2 transition-all',
                        indice === activa ? 'ring-ambar-600' : 'ring-transparent hover:ring-piedra-300',
                      )}
                    >
                      <img src={urlImagen(imagen.url)} alt="" className="h-full w-full object-contain p-2" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* Información */}
          <div className="flex flex-col">
            {producto.category ? <Etiqueta>{producto.category.name}</Etiqueta> : null}

            <h1 className="mt-4 text-display-sm lg:text-display-md">{producto.name}</h1>

            {producto.summary ? (
              <p className="mt-5 text-lg leading-relaxed text-piedra-600">{producto.summary}</p>
            ) : null}

            <div className="mt-8 flex items-baseline gap-3">
              <p className="font-display text-4xl tabular-nums">{formatearPrecio(producto.price)}</p>
              {enOferta ? (
                <p className="text-lg text-piedra-400 line-through tabular-nums">
                  {formatearPrecio(producto.compareAtPrice)}
                </p>
              ) : null}
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              {producto.pieceHeightCm ? (
                <div>
                  <dt className="text-piedra-400">Alto</dt>
                  <dd className="mt-0.5 font-semibold">{producto.pieceHeightCm} cm</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-piedra-400">Material</dt>
                <dd className="mt-0.5 font-semibold">Yeso alabastrino</dd>
              </div>
              <div>
                <dt className="text-piedra-400">Disponibilidad</dt>
                <dd className={clsx('mt-0.5 font-semibold', producto.isAvailable ? 'text-jade' : 'text-piedra-500')}>
                  {producto.isAvailable
                    ? producto.stock === 1
                      ? 'Última unidad'
                      : 'En stock'
                    : 'Agotada'}
                </dd>
              </div>
            </dl>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {producto.isAvailable ? (
                <BotonAgregar producto={producto} tamano="lg" className="sm:flex-1" />
              ) : (
                <Boton href={contacto.whatsapp.link} variante="ambar" tamano="lg" className="sm:flex-1">
                  Avisame cuando vuelva
                </Boton>
              )}
              <Boton href={contacto.whatsapp.link} variante="secundario" tamano="lg">
                Consultar por WhatsApp
              </Boton>
            </div>

            {parrafos.length > 0 ? (
              <div className="mt-10 border-t border-piedra-300/60 pt-8">
                <h2 className="text-xl">Sobre esta pieza</h2>
                <div className="mt-4 flex flex-col gap-4 leading-relaxed text-piedra-600">
                  {parrafos.map((parrafo, indice) => (
                    <p key={indice}>{parrafo}</p>
                  ))}
                </div>
              </div>
            ) : null}

            <ul className="mt-8 grid gap-3 text-sm text-piedra-600 sm:grid-cols-2" role="list">
              <li className="flex items-center gap-2">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ambar-600" />
                Pintada a mano en Rosario
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ambar-600" />
                Embalaje blindado, rotura cero
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ambar-600" />
                Envío por Andreani
              </li>
              <li className="flex items-center gap-2">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-ambar-600" />
                Pago con MercadoPago
              </li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}
