import { Link } from 'react-router';

import Boton from '../components/ui/Boton';
import Etiqueta from '../components/ui/Etiqueta';
import { sitio } from '../data/sitio';
import { formatearPrecio, urlImagen } from '../lib/api';
import { useCarrito, useCarritoListo } from '../lib/carrito';

export const meta = () => [
  { title: `Tu carrito | ${sitio.nombre}` },
  { name: 'robots', content: 'noindex' },
];

function ControlCantidad({ item }) {
  const cambiar = useCarrito((s) => s.cambiarCantidad);
  const tope = item.stock ?? 10;

  return (
    <div className="inline-flex items-center rounded-full border border-piedra-300 bg-white">
      <button
        type="button"
        onClick={() => cambiar(item.productId, item.qty - 1)}
        aria-label="Quitar una unidad"
        className="h-9 w-9 rounded-full text-lg leading-none transition-colors hover:bg-hueso-oscuro"
      >
        −
      </button>
      <span className="w-8 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {item.qty}
      </span>
      <button
        type="button"
        onClick={() => cambiar(item.productId, item.qty + 1)}
        disabled={item.qty >= tope}
        aria-label="Agregar una unidad"
        className="h-9 w-9 rounded-full text-lg leading-none transition-colors hover:bg-hueso-oscuro disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  );
}

export default function Carrito() {
  const listo = useCarritoListo();
  const items = useCarrito((s) => s.items);
  const quitar = useCarrito((s) => s.quitar);
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);

  if (!listo) return <div className="contenedor py-24" aria-busy="true" />;

  if (items.length === 0) {
    return (
      <div className="contenedor max-w-xl py-24 text-center">
        <Etiqueta>Tu carrito</Etiqueta>
        <h1 className="mt-6 text-display-sm lg:text-display-md">Todavía está vacío</h1>
        <p className="mt-5 text-lg text-piedra-600">
          Las piezas que agregues desde la galería aparecen acá.
        </p>
        <div className="mt-10">
          <Boton to="/galeria" tamano="lg">
            Explorar la galería
          </Boton>
        </div>
      </div>
    );
  }

  return (
    <div className="contenedor py-14 lg:py-20">
      <Etiqueta>Tu carrito</Etiqueta>
      <h1 className="mt-4 text-display-sm lg:text-display-md">
        {items.length === 1 ? 'Una pieza' : `${items.length} piezas`} esperando
      </h1>

      <div className="mt-12 grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <ul className="divide-y divide-piedra-300/60" role="list">
          {items.map((item) => (
            <li key={item.productId} className="flex gap-5 py-6">
              <Link
                to={`/producto/${item.slug}`}
                className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-hueso-oscuro"
              >
                {item.imageUrl ? (
                  <img src={urlImagen(item.imageUrl)} alt="" className="h-full w-full object-contain p-2" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-display text-3xl text-piedra-300">
                    {item.name.charAt(0)}
                  </span>
                )}
              </Link>

              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-lg leading-snug">
                    <Link to={`/producto/${item.slug}`} className="transition-colors hover:text-ambar-600">
                      {item.name}
                    </Link>
                  </h2>
                  <p className="mt-1 text-sm text-piedra-500">{formatearPrecio(item.price)} c/u</p>
                  <button
                    type="button"
                    onClick={() => quitar(item.productId)}
                    className="mt-3 text-sm text-piedra-500 underline-offset-4 transition-colors hover:text-red-700 hover:underline"
                  >
                    Quitar
                  </button>
                </div>

                <div className="flex items-center gap-6 sm:flex-col sm:items-end sm:gap-2">
                  <ControlCantidad item={item} />
                  <p className="font-display text-xl tabular-nums">{formatearPrecio(item.price * item.qty)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-3xl bg-white p-8 ring-1 ring-piedra-300/60 lg:sticky lg:top-28">
          <h2 className="text-xl">Resumen</h2>
          <dl className="mt-6 flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-piedra-600">Subtotal</dt>
              <dd className="font-semibold tabular-nums">{formatearPrecio(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-piedra-600">Envío</dt>
              <dd className="text-piedra-500">Se calcula en el siguiente paso</dd>
            </div>
          </dl>
          <div className="mt-6 flex justify-between border-t border-piedra-300/60 pt-6">
            <span className="font-semibold">Total estimado</span>
            <span className="font-display text-2xl tabular-nums">{formatearPrecio(subtotal)}</span>
          </div>
          <Boton to="/checkout" tamano="lg" className="mt-8 w-full">
            Iniciar compra
          </Boton>
          <p className="mt-4 text-center text-xs text-piedra-500">
            Pago seguro con MercadoPago · Envíos a Rosario y alrededores
          </p>
          <Link to="/galeria" className="mt-5 block text-center text-sm font-semibold text-ambar-600 hover:text-ambar-700">
            Seguir mirando la galería
          </Link>
        </aside>
      </div>
    </div>
  );
}
