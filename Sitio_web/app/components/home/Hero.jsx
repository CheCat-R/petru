import { Titulo, useContenido } from '../../lib/contenido';
import Boton from '../ui/Boton';
import Etiqueta from '../ui/Etiqueta';

/** Un botón del hero: ruta interna o dirección externa, según lo que cargó el taller. */
function BotonHero({ boton, ...props }) {
  const externo = boton.href.startsWith('http') || boton.href.startsWith('mailto:') || boton.href.startsWith('tel:');
  return externo ? (
    <Boton href={boton.href} {...props}>{boton.text}</Boton>
  ) : (
    <Boton to={boton.href} {...props}>{boton.text}</Boton>
  );
}

export default function Hero() {
  const { hero } = useContenido().home;

  return (
    <section className="relative overflow-hidden">
      {/* Halo cálido detrás de la pieza */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-10%] top-[-15%] h-[36rem] w-[36rem] rounded-full bg-ambar-100/50 blur-3xl"
      />

      <div className="contenedor relative grid items-center gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
        <div className="max-w-xl">
          <Etiqueta>{hero.label}</Etiqueta>

          <h1 className="mt-6 text-display-md sm:text-display-lg lg:text-display-xl">
            <Titulo texto={hero.title} />
          </h1>

          <p className="mt-7 max-w-lg text-lg leading-relaxed text-piedra-600">{hero.intro}</p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <BotonHero boton={hero.primaryButton} tamano="lg" />
            <BotonHero boton={hero.secondaryButton} variante="secundario" tamano="lg" />
          </div>
        </div>

        <div className="relative">
          <img
            src={hero.image.url}
            alt={hero.image.alt}
            width={1024}
            height={1024}
            fetchPriority="high"
            decoding="async"
            className="mx-auto w-full max-w-lg drop-shadow-2xl"
          />
        </div>
      </div>
    </section>
  );
}
