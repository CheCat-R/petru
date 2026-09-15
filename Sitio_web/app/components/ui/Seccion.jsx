import clsx from 'clsx';

const fondos = {
  hueso: 'bg-hueso',
  claro: 'bg-hueso-oscuro',
  tinta: 'bg-tinta text-hueso',
  blanco: 'bg-white',
};

/** Envoltorio de sección con el ritmo vertical y el contenedor del sitio. */
export default function Seccion({
  children,
  fondo = 'hueso',
  className,
  contenedorClassName,
  compacta = false,
  ...props
}) {
  return (
    <section
      className={clsx(fondos[fondo], compacta ? 'py-14 lg:py-20' : 'py-20 lg:py-28', className)}
      {...props}
    >
      <div className={clsx('contenedor', contenedorClassName)}>{children}</div>
    </section>
  );
}
