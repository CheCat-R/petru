import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { useCarrito } from '../../lib/carrito';

/**
 * Agrega una pieza al carrito y lo confirma en el propio botón durante un
 * momento, con acceso directo al carrito. Sin drawer ni modal: la persona
 * sigue mirando el catálogo.
 */
export default function BotonAgregar({ producto, tamano = 'md', className, etiqueta = 'Agregar al carrito' }) {
  const agregar = useCarrito((s) => s.agregar);
  const enCarrito = useCarrito((s) => s.items.find((i) => i.productId === producto.id)?.qty ?? 0);
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    if (!confirmado) return undefined;
    const id = setTimeout(() => setConfirmado(false), 2200);
    return () => clearTimeout(id);
  }, [confirmado]);

  if (!producto.isAvailable) return null;

  const agotadoEnCarrito = enCarrito >= (producto.stock ?? 10);

  const tamanos = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-3 text-sm', lg: 'px-8 py-4 text-base' };

  if (confirmado) {
    return (
      <Link
        to="/carrito"
        className={clsx(
          'inline-flex items-center justify-center gap-2 rounded-full bg-jade font-semibold tracking-wide text-white transition-all',
          tamanos[tamano],
          className,
        )}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4" aria-hidden>
          <path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Agregada · Ver carrito
      </Link>
    );
  }

  return (
    <button
      type="button"
      disabled={agotadoEnCarrito}
      onClick={() => {
        agregar(producto, 1);
        setConfirmado(true);
      }}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-full bg-tinta font-semibold tracking-wide text-hueso shadow-sm transition-all duration-200 ease-out hover:bg-tinta-suave hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        tamanos[tamano],
        className,
      )}
    >
      {agotadoEnCarrito ? 'Ya tenés todas las unidades' : etiqueta}
    </button>
  );
}
