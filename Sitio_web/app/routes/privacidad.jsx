import PaginaLegal from '../components/legal/PaginaLegal';
import { construirLegales, legales } from '../data/legales';
import { useContenido } from '../lib/contenido';
import { meta as construirMeta } from '../lib/seo';

const ficha = legales.privacidad;

export const meta = () =>
  construirMeta({ ruta: '/privacidad', titulo: ficha.titulo, descripcion: ficha.descripcion });

export default function Pagina() {
  return <PaginaLegal pagina={construirLegales(useContenido()).privacidad} />;
}
