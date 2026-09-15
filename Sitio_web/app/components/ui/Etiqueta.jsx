import clsx from 'clsx';

/** Antetítulo en mayúsculas con tracking amplio. */
export default function Etiqueta({ children, className, ...props }) {
  return (
    <p
      className={clsx(
        'text-xs font-semibold uppercase tracking-[0.28em] text-ambar-600',
        className,
      )}
      {...props}
    >
      {children}
    </p>
  );
}
