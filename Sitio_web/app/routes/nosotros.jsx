import Etiqueta from '../components/ui/Etiqueta';
import Seccion from '../components/ui/Seccion';
import TituloSeccion from '../components/ui/TituloSeccion';
import { useContenido } from '../lib/contenido';
import { meta as construirMeta } from '../lib/seo';

export const meta = ({ matches }) => {
  const about = matches?.[0]?.data?.contenido?.about;
  return construirMeta({
    ruta: '/nosotros',
    titulo: 'Nosotros',
    descripcion:
      about?.header.intro.slice(0, 160) ??
      'La filosofía detrás del molde: por qué en Pëtru reivindicamos el peso, la textura y la imperfección sagrada del yeso pintado a mano.',
  });
};

const iniciales = (nombre) =>
  nombre
    .split(' ')
    .map((p) => p.charAt(0))
    .join('');

export default function Nosotros() {
  const { header, manifesto, team } = useContenido().about;

  return (
    <>
      {/* Encabezado */}
      <section className="border-b border-piedra-300/60">
        <div className="contenedor max-w-3xl py-20 text-center lg:py-28">
          <Etiqueta>{header.label}</Etiqueta>
          <h1 className="mt-6 text-display-md lg:text-display-lg">{header.title}</h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-piedra-600">{header.intro}</p>
        </div>
      </section>

      {/* Manifiesto */}
      <Seccion>
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-20">
          <div>
            <Etiqueta>{manifesto.label}</Etiqueta>
            <blockquote className="mt-8 border-l-2 border-ambar-600 pl-7">
              <p className="font-display text-2xl italic leading-snug lg:text-3xl">“{manifesto.quote}”</p>
            </blockquote>
          </div>

          <div className="flex flex-col justify-center gap-6 text-lg leading-relaxed text-piedra-600">
            {manifesto.paragraphs.map((parrafo, i) => (
              <p key={i}>{parrafo}</p>
            ))}
          </div>
        </div>
      </Seccion>

      {/* Equipo */}
      <Seccion fondo="claro">
        <TituloSeccion etiqueta={team.label} titulo={team.title} bajada={team.intro} />

        <ul className="mx-auto mt-14 grid max-w-4xl gap-8 sm:grid-cols-2">
          {team.people.map((persona) => (
            <li key={persona.name} className="rounded-3xl bg-white p-8 ring-1 ring-piedra-300/60">
              {persona.photo ? (
                <img
                  src={persona.photo}
                  alt={persona.name}
                  width={64}
                  height={64}
                  loading="lazy"
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div
                  aria-hidden
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-ambar-100 to-ambar-50 font-display text-2xl text-ambar-700"
                >
                  {iniciales(persona.name)}
                </div>
              )}
              <h3 className="mt-6 text-xl">{persona.name}</h3>
              <p className="mt-1 text-sm font-semibold uppercase tracking-wider text-ambar-600">{persona.role}</p>
              <p className="mt-4 leading-relaxed text-piedra-600">{persona.bio}</p>
            </li>
          ))}
        </ul>
      </Seccion>
    </>
  );
}
