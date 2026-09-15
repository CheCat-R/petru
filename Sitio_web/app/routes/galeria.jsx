import clsx from 'clsx';
import { useLoaderData, useSearchParams } from 'react-router';

import TarjetaProducto from '../components/catalogo/TarjetaProducto';
import Boton from '../components/ui/Boton';
import Etiqueta from '../components/ui/Etiqueta';
import { obtenerCategorias, obtenerProductos } from '../lib/api';
import { meta as construirMeta } from '../lib/seo';

export const meta = () =>
  construirMeta({
    ruta: '/galeria',
    titulo: 'Galería',
    descripcion:
      'El catálogo Pëtru: estatuillas de yeso pintadas a mano. Colección Mitología, línea Pop Art y miniaturas de colección, con envíos a todo el país.',
  });

/**
 * Corre en build time (prerender) y en navegaciones del cliente. Trae el catálogo
 * completo: el filtro por categoría es instantáneo y no pega a la API por cada clic.
 */
async function cargar() {
  const [categorias, productos] = await Promise.all([obtenerCategorias(), obtenerProductos()]);
  return { categorias, productos };
}

// Con ssr:false el bundle del cliente elimina `loader`: por eso no se alias uno al otro.
export const loader = () => cargar();
export const clientLoader = () => cargar();

export default function Galeria() {
  const { categorias, productos } = useLoaderData();
  const [parametros, setParametros] = useSearchParams();
  const categoriaActiva = parametros.get('categoria');

  const visibles = categoriaActiva
    ? productos.filter((producto) => producto.category?.slug === categoriaActiva)
    : productos;

  function filtrar(slug) {
    const siguientes = new URLSearchParams(parametros);
    if (slug) {
      siguientes.set('categoria', slug);
    } else {
      siguientes.delete('categoria');
    }
    setParametros(siguientes, { preventScrollReset: true });
  }

  // Solo se ofrecen como filtro las categorías que tienen piezas publicadas
  const filtros = [
    { slug: null, name: 'Todas' },
    ...categorias.filter((categoria) => categoria.productCount > 0),
  ];

  return (
    <>
      {/* Encabezado */}
      <section className="border-b border-piedra-300/60">
        <div className="contenedor max-w-3xl py-20 text-center lg:py-24">
          <Etiqueta>Exclusividad en tus repisas</Etiqueta>
          <h1 className="mt-6 text-display-md lg:text-display-lg">El Catálogo Pëtru</h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-piedra-600">
            Cada pieza se moldea, se cura y se pinta a mano en el taller. Los tonos y los detalles
            varían de una unidad a otra: eso es exactamente lo que las hace irrepetibles.
          </p>
        </div>
      </section>

      <div className="contenedor py-14 lg:py-20">
        {/* Filtros */}
        <div className="flex flex-wrap items-center justify-between gap-6">
          <ul className="flex flex-wrap gap-2.5" role="list">
            {filtros.map((filtro) => {
              const activo = filtro.slug === categoriaActiva;
              return (
                <li key={filtro.slug ?? 'todas'}>
                  <button
                    type="button"
                    onClick={() => filtrar(filtro.slug)}
                    aria-pressed={activo}
                    className={clsx(
                      'rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200',
                      activo
                        ? 'bg-tinta text-hueso'
                        : 'bg-white text-piedra-600 ring-1 ring-inset ring-piedra-300 hover:ring-tinta hover:text-tinta',
                    )}
                  >
                    {filtro.name}
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="text-sm text-piedra-500 tabular-nums">
            {visibles.length} {visibles.length === 1 ? 'pieza' : 'piezas'}
          </p>
        </div>

        {/* Grilla */}
        {visibles.length > 0 ? (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list">
            {visibles.map((producto) => (
              <li key={producto.id}>
                <TarjetaProducto producto={producto} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-16 rounded-3xl border border-dashed border-piedra-300 py-20 text-center">
            <p className="font-display text-2xl">Todavía no hay piezas en esta categoría</p>
            <p className="mx-auto mt-3 max-w-md text-piedra-500">
              Estamos moldeando la próxima tanda. Contanos qué buscás y te avisamos apenas salga del
              taller.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Boton onClick={() => filtrar(null)} variante="secundario">
                Ver todas las piezas
              </Boton>
              <Boton to="/contacto">Encargar una pieza</Boton>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
