import { useContenido } from '../../lib/contenido';
import Boton from '../ui/Boton';
import Etiqueta from '../ui/Etiqueta';

/** Bloque de piezas a medida. El taller lo puede apagar desde el panel. */
export default function CustomLab() {
  const { home, contact } = useContenido();
  const lab = home.customLab;
  if (!lab.enabled) return null;

  return (
    <section className="relative overflow-hidden bg-tinta py-20 text-hueso lg:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-ambar-600/15 blur-3xl"
      />

      <div className="contenedor relative max-w-3xl text-center">
        <Etiqueta className="text-durazno">{lab.label}</Etiqueta>

        <h2 className="mt-6 text-display-sm text-hueso lg:text-display-md">
          {lab.title}
        </h2>

        <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-piedra-300">
          {lab.text}
        </p>

        <div className="mt-10 flex justify-center">
          <Boton href={contact.whatsapp.link} variante="ambar" tamano="lg">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className="h-5 w-5">
              <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2Zm5.8 14.2c-.2.7-1.4 1.3-2 1.4-.5.1-1.2.1-1.9-.1-.4-.1-1-.3-1.8-.6-3.1-1.3-5.1-4.4-5.3-4.6-.1-.2-1.2-1.6-1.2-3s.7-2.1 1-2.4c.3-.3.6-.4.8-.4h.6c.2 0 .5-.1.7.5l1 2.4c.1.2.1.4 0 .6l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.2 1.4 2.5 1.5.3.1.4.1.6-.1l.9-1c.2-.2.4-.2.6-.1l2.2 1.1c.2.1.4.2.5.3.1.1.1.6-.1 1.3Z" />
            </svg>
            {lab.buttonText}
          </Boton>
        </div>

        {lab.note ? <p className="mt-6 text-sm text-piedra-400">{lab.note}</p> : null}
      </div>
    </section>
  );
}
