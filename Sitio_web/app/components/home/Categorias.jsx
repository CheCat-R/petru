import { Link } from 'react-router';

import Boton from '../ui/Boton';
import Seccion from '../ui/Seccion';
import TituloSeccion from '../ui/TituloSeccion';

// Fondo de la tarjeta mientras la categoría no tenga foto de portada cargada
const acentos = [
  'from-ambar-100 to-ambar-50',
  'from-emerald-100 to-emerald-50',
  'from-orange-100 to-orange-50',
  'from-stone-200 to-stone-100',
];

export default function Categorias({ categorias }) {
  return (
    <Seccion>
      <TituloSeccion
        etiqueta="Categorías"
        titulo="Encuentra la estatuilla que hable de ti"
        bajada="Desde el minimalismo nórdico hasta el maximalismo urbano, dividimos nuestro arte por tu estilo de vida."
      />

      <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {categorias.map((categoria, indice) => (
          <li key={categoria.id}>
            <Link
              to={`/galeria?categoria=${categoria.slug}`}
              className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-piedra-300/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:ring-piedra-400"
            >
              {categoria.imageUrl ? (
                <img
                  src={categoria.imageUrl}
                  alt=""
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div
                  className={`flex aspect-[4/3] items-center justify-center bg-gradient-to-br ${acentos[indice % acentos.length]}`}
                >
                  <span className="font-display text-5xl text-tinta/15 transition-transform duration-500 group-hover:scale-110">
                    {categoria.name.charAt(0)}
                  </span>
                </div>
              )}

              <div className="flex flex-1 flex-col gap-2 p-6">
                <h3 className="text-xl">{categoria.name}</h3>
                {categoria.description ? (
                  <p className="text-sm leading-relaxed text-piedra-500">{categoria.description}</p>
                ) : null}
                <span className="mt-auto pt-4 text-sm font-semibold text-ambar-600">
                  {categoria.productCount > 0
                    ? `${categoria.productCount} ${categoria.productCount === 1 ? 'pieza' : 'piezas'}`
                    : 'Próximamente'}
                  <span
                    aria-hidden
                    className="ml-1 inline-block transition-transform duration-300 group-hover:translate-x-1"
                  >
                    →
                  </span>
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-14 flex justify-center">
        <Boton to="/galeria" variante="secundario" tamano="lg">
          Ver más productos
        </Boton>
      </div>
    </Seccion>
  );
}
