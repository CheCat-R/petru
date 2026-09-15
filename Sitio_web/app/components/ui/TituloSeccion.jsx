import clsx from 'clsx';

import Etiqueta from './Etiqueta';

/** Bloque etiqueta + título + bajada, centrado o alineado a la izquierda. */
export default function TituloSeccion({
  etiqueta,
  titulo,
  bajada,
  centrado = true,
  className,
  claro = false,
}) {
  return (
    <div
      className={clsx(
        'flex flex-col gap-4',
        centrado ? 'mx-auto max-w-2xl text-center items-center' : 'max-w-2xl items-start',
        className,
      )}
    >
      {etiqueta ? <Etiqueta>{etiqueta}</Etiqueta> : null}
      <h2 className={clsx('text-display-sm lg:text-display-md', claro && 'text-hueso')}>{titulo}</h2>
      {bajada ? (
        <p className={clsx('text-lg leading-relaxed', claro ? 'text-piedra-300' : 'text-piedra-600')}>
          {bajada}
        </p>
      ) : null}
    </div>
  );
}
