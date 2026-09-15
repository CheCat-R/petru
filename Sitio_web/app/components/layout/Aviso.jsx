import { Link } from 'react-router';

import { useContenidoOpcional } from '../../lib/contenido';

/**
 * Barra de aviso arriba del header: promos, vacaciones, un plazo especial.
 * Se prende y apaga desde el panel; si no está activa no ocupa lugar.
 */
export default function Aviso() {
  const aviso = useContenidoOpcional()?.announcement;
  if (!aviso?.enabled || !aviso.text) return null;

  const externo = aviso.link?.startsWith('http');
  const enlace = aviso.link && aviso.linkLabel ? (
    externo ? (
      <a href={aviso.link} target="_blank" rel="noopener noreferrer" className="ml-2 font-semibold underline underline-offset-4">
        {aviso.linkLabel}
      </a>
    ) : (
      <Link to={aviso.link} className="ml-2 font-semibold underline underline-offset-4">
        {aviso.linkLabel}
      </Link>
    )
  ) : null;

  return (
    <div className="bg-tinta text-hueso" role="region" aria-label="Aviso">
      <p className="contenedor py-2.5 text-center text-sm">
        {aviso.text}
        {enlace}
      </p>
    </div>
  );
}
