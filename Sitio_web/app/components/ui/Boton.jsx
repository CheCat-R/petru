import clsx from 'clsx';
import { Link } from 'react-router';

const variantes = {
  primario:
    'bg-tinta text-hueso hover:bg-tinta-suave focus-visible:outline-tinta shadow-sm hover:shadow-md',
  secundario:
    'bg-transparent text-tinta ring-1 ring-inset ring-piedra-300 hover:ring-tinta hover:bg-hueso-oscuro',
  ambar: 'bg-ambar-600 text-white hover:bg-ambar-700 shadow-sm hover:shadow-md',
  fantasma: 'bg-transparent text-tinta hover:bg-hueso-oscuro',
};

const tamanos = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
};

/**
 * Botón único del sitio. Renderiza <Link> para rutas internas,
 * <a> para externas y <button> cuando recibe onClick.
 */
export default function Boton({
  children,
  to,
  href,
  variante = 'primario',
  tamano = 'md',
  className,
  ...props
}) {
  const clases = clsx(
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold tracking-wide',
    'transition-all duration-200 ease-out active:scale-[0.98]',
    variantes[variante],
    tamanos[tamano],
    className,
  );

  if (to) {
    return (
      <Link to={to} className={clases} {...props}>
        {children}
      </Link>
    );
  }

  if (href) {
    const esExterno = href.startsWith('http');
    return (
      <a
        href={href}
        className={clases}
        {...(esExterno ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <button type="button" className={clases} {...props}>
      {children}
    </button>
  );
}
