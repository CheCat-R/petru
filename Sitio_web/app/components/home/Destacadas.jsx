import { useContenido } from '../../lib/contenido';
import TarjetaProducto from '../catalogo/TarjetaProducto';
import Boton from '../ui/Boton';
import Seccion from '../ui/Seccion';
import TituloSeccion from '../ui/TituloSeccion';

/** Piezas marcadas como destacadas desde el panel. No se renderiza si no hay ninguna. */
export default function Destacadas({ productos }) {
  const { featured } = useContenido().home;
  if (!productos?.length) return null;

  return (
    <Seccion fondo="claro">
      <TituloSeccion etiqueta={featured.label} titulo={featured.title} bajada={featured.intro} />

      <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" role="list">
        {productos.slice(0, 3).map((producto) => (
          <li key={producto.id}>
            <TarjetaProducto producto={producto} />
          </li>
        ))}
      </ul>

      <div className="mt-14 flex justify-center">
        <Boton to="/galeria" tamano="lg">
          Ver todo el catálogo
        </Boton>
      </div>
    </Seccion>
  );
}
