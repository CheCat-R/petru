import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';

import { navegacion } from '../../data/sitio';
import { useCarrito, useCarritoListo } from '../../lib/carrito';
import { useContenidoOpcional } from '../../lib/contenido';

function IconoCarrito(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden {...props}>
      <path
        d="M3 4h2l2.4 11.3a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 8H6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

function IconoMenu({ abierto, ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      {abierto ? (
        <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
      )}
    </svg>
  );
}

export default function Header() {
  const logo = useContenidoOpcional()?.general.logo ?? '/img/petru-logo.png';
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [scrolleado, setScrolleado] = useState(false);
  const location = useLocation();

  // El carrito vive en localStorage: se muestra recién montado para no romper la hidratación
  const carritoListo = useCarritoListo();
  const items = useCarrito((s) => s.items);
  const itemsCarrito = carritoListo ? items.reduce((n, i) => n + i.qty, 0) : 0;
  const totalCarrito = carritoListo ? items.reduce((n, i) => n + i.price * i.qty, 0) : 0;

  useEffect(() => {
    const alScrollear = () => setScrolleado(window.scrollY > 8);
    alScrollear();
    window.addEventListener('scroll', alScrollear, { passive: true });
    return () => window.removeEventListener('scroll', alScrollear);
  }, []);

  // Cerrar el menú móvil al navegar. Se ajusta durante el render en vez de en
  // un efecto para no encadenar un segundo render con el menú todavía abierto.
  const [rutaPrevia, setRutaPrevia] = useState(location.pathname);
  if (location.pathname !== rutaPrevia) {
    setRutaPrevia(location.pathname);
    setMenuAbierto(false);
  }

  // Bloquear el scroll del body con el menú abierto
  useEffect(() => {
    document.body.style.overflow = menuAbierto ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuAbierto]);

  return (
    <header
      className={clsx(
        'sticky top-0 z-40 transition-all duration-300',
        scrolleado
          ? 'border-b border-piedra-300/50 bg-hueso/85 backdrop-blur-lg'
          : 'border-b border-transparent bg-hueso',
      )}
    >
      <div className="contenedor flex h-20 items-center justify-between gap-6 lg:h-24">
        <Link to="/" className="shrink-0" aria-label="Pëtru — inicio">
          <img
            src={logo}
            alt="Pëtru"
            width={150}
            height={76}
            className="h-11 w-auto lg:h-12"
          />
        </Link>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {navegacion.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    clsx(
                      'relative py-2 text-sm font-medium transition-colors',
                      'after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-ambar-600 after:transition-transform after:duration-300',
                      isActive
                        ? 'text-ambar-600 after:scale-x-100'
                        : 'text-piedra-600 after:scale-x-0 hover:text-tinta hover:after:scale-x-100',
                    )
                  }
                >
                  {item.nombre}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/carrito"
            className="group flex items-center gap-3 rounded-full border border-piedra-300 px-4 py-2 transition-colors hover:border-tinta hover:bg-white"
            aria-label={`Carrito, ${itemsCarrito} ${itemsCarrito === 1 ? 'producto' : 'productos'}`}
          >
            <span className="hidden text-sm font-semibold tabular-nums sm:inline">
              {totalCarrito.toLocaleString('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </span>
            <span className="relative">
              <IconoCarrito className="h-5 w-5 text-tinta" />
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-ambar-600 px-1 text-[10px] font-bold leading-none text-white tabular-nums">
                {itemsCarrito}
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            className="flex h-11 w-11 items-center justify-center rounded-full text-tinta transition-colors hover:bg-hueso-oscuro lg:hidden"
            aria-expanded={menuAbierto}
            aria-controls="menu-movil"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
          >
            <IconoMenu abierto={menuAbierto} className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Menú móvil */}
      <div
        id="menu-movil"
        className={clsx(
          'overflow-hidden border-t border-piedra-300/50 bg-hueso transition-[max-height] duration-300 ease-out lg:hidden',
          menuAbierto ? 'max-h-96' : 'max-h-0 border-t-transparent',
        )}
      >
        <nav aria-label="Principal móvil" className="contenedor py-4">
          <ul className="flex flex-col">
            {navegacion.map((item) => (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  end={item.href === '/'}
                  className={({ isActive }) =>
                    clsx(
                      'block border-b border-piedra-300/40 py-4 text-lg font-medium transition-colors last:border-0',
                      isActive ? 'text-ambar-600' : 'text-tinta',
                    )
                  }
                >
                  {item.nombre}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
