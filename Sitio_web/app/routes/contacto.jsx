import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';

import Boton from '../components/ui/Boton';
import Etiqueta from '../components/ui/Etiqueta';
import { ErrorApi, enviarConsulta } from '../lib/api';
import { Titulo, useContacto } from '../lib/contenido';
import { meta as construirMeta } from '../lib/seo';

export const meta = () =>
  construirMeta({
    ruta: '/contacto',
    titulo: 'Contacto',
    descripcion:
      'Hablemos de arte. Escribinos por una pieza customizada, una consulta sobre tu pedido o una colaboración. Respondemos en un máximo de 3 horas hábiles.',
  });

const motivos = [
  { valor: 'custom', etiqueta: 'Quiero una pieza customizada' },
  { valor: 'pedido', etiqueta: 'Consulta sobre un pedido en curso' },
  { valor: 'otro', etiqueta: 'Otras consultas' },
];

const campoBase =
  'w-full rounded-xl border bg-white px-4 py-3 text-tinta placeholder:text-piedra-400 transition-colors focus:outline-none';

function EtiquetaCampo({ htmlFor, children, requerido }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-xs font-semibold uppercase tracking-[0.15em] text-piedra-600"
    >
      {children}
      {requerido ? <span className="ml-1 text-ambar-600">*</span> : null}
    </label>
  );
}

/** Mensaje de error de validación bajo un campo. */
function ErrorCampo({ id, mensaje }) {
  if (!mensaje) return null;
  return (
    <p id={id} role="alert" className="mt-2 text-sm text-red-700">
      {mensaje}
    </p>
  );
}

export default function Contacto() {
  const contacto = useContacto();
  const envio = useMutation({
    mutationFn: enviarConsulta,
  });

  const errores = envio.error instanceof ErrorApi ? envio.error.errores : {};
  const errorGeneral =
    envio.isError && !(envio.error instanceof ErrorApi && Object.keys(errores).length)
      ? envio.error.status === 429
        ? 'Mandaste varios mensajes seguidos. Esperá un rato o escribinos por WhatsApp.'
        : 'No pudimos enviar tu mensaje. Probá de nuevo en un momento o escribinos por WhatsApp.'
      : null;

  function alEnviar(evento) {
    evento.preventDefault();
    envio.mutate(Object.fromEntries(new FormData(evento.currentTarget)));
  }

  const claseCampo = (campo) =>
    clsx(campoBase, errores[campo] ? 'border-red-400 focus:border-red-600' : 'border-piedra-300 focus:border-ambar-600');

  return (
    <>
      {/* Encabezado */}
      <section className="border-b border-piedra-300/60">
        <div className="contenedor max-w-3xl py-20 text-center lg:py-24">
          <Etiqueta>{contacto.page.label}</Etiqueta>
          <h1 className="mt-6 text-display-md lg:text-display-lg">
            <Titulo texto={contacto.page.title} />
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-piedra-600">{contacto.page.intro}</p>
        </div>
      </section>

      <div className="contenedor grid gap-12 py-20 lg:grid-cols-[1.3fr_1fr] lg:gap-20 lg:py-24">
        {/* Formulario */}
        <div>
          <h2 className="text-2xl">Contanos tu proyecto o duda</h2>
          <p className="mt-2 text-sm text-piedra-500">
            Te respondemos personalmente en un plazo máximo de 3 horas hábiles.
          </p>

          {envio.isSuccess ? (
            <div className="mt-8 rounded-2xl border border-jade/30 bg-jade/5 p-8 text-center">
              <p className="font-display text-2xl">¡Mensaje recibido!</p>
              <p className="mt-3 text-piedra-600">{envio.data?.mensaje}</p>
              <Boton variante="secundario" className="mt-6" onClick={() => envio.reset()}>
                Enviar otro mensaje
              </Boton>
            </div>
          ) : (
            <form onSubmit={alEnviar} noValidate className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <EtiquetaCampo htmlFor="nombre" requerido>
                  Tu nombre
                </EtiquetaCampo>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  required
                  autoComplete="name"
                  className={claseCampo('nombre')}
                  placeholder="Cómo te llamamos"
                  aria-invalid={Boolean(errores.nombre)}
                  aria-describedby={errores.nombre ? 'error-nombre' : undefined}
                />
                <ErrorCampo id="error-nombre" mensaje={errores.nombre?.[0]} />
              </div>

              <div>
                <EtiquetaCampo htmlFor="email">Correo electrónico</EtiquetaCampo>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={claseCampo('email')}
                  placeholder="tu@email.com"
                  aria-invalid={Boolean(errores.email)}
                  aria-describedby={errores.email ? 'error-email' : undefined}
                />
                <ErrorCampo id="error-email" mensaje={errores.email?.[0]} />
              </div>

              <div>
                <EtiquetaCampo htmlFor="motivo" requerido>
                  ¿Cuál es el motivo?
                </EtiquetaCampo>
                <select
                  id="motivo"
                  name="motivo"
                  required
                  defaultValue=""
                  className={claseCampo('motivo')}
                  aria-invalid={Boolean(errores.motivo)}
                >
                  <option value="" disabled>
                    Elegí una opción
                  </option>
                  {motivos.map((motivo) => (
                    <option key={motivo.valor} value={motivo.valor}>
                      {motivo.etiqueta}
                    </option>
                  ))}
                </select>
                <ErrorCampo id="error-motivo" mensaje={errores.motivo?.[0]} />
              </div>

              <div>
                <EtiquetaCampo htmlFor="telefono">WhatsApp / Teléfono</EtiquetaCampo>
                <input
                  id="telefono"
                  name="telefono"
                  type="tel"
                  autoComplete="tel"
                  className={claseCampo('telefono')}
                  placeholder="+54 9 ..."
                  aria-invalid={Boolean(errores.telefono)}
                />
                <ErrorCampo id="error-telefono" mensaje={errores.telefono?.[0]} />
              </div>

              <div className="sm:col-span-2">
                <EtiquetaCampo htmlFor="mensaje" requerido>
                  Detalles del pedido o consulta
                </EtiquetaCampo>
                <textarea
                  id="mensaje"
                  name="mensaje"
                  required
                  rows={6}
                  className={`${claseCampo('mensaje')} resize-y`}
                  placeholder="Contanos qué pieza tenés en mente, colores, tamaño, fecha…"
                  aria-invalid={Boolean(errores.mensaje)}
                  aria-describedby={errores.mensaje ? 'error-mensaje' : undefined}
                />
                <ErrorCampo id="error-mensaje" mensaje={errores.mensaje?.[0]} />
              </div>

              {/* Honeypot: invisible para personas, tentador para bots */}
              <div className="hidden" aria-hidden>
                <label htmlFor="sitio_web">Sitio web</label>
                <input id="sitio_web" name="sitio_web" type="text" tabIndex={-1} autoComplete="off" />
              </div>

              {errorGeneral ? (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:col-span-2">
                  {errorGeneral}
                </p>
              ) : null}

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={envio.isPending}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-tinta px-8 py-4 text-base font-semibold tracking-wide text-hueso shadow-sm transition-all duration-200 ease-out hover:bg-tinta-suave hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {envio.isPending ? 'Enviando…' : 'Enviar mensaje al taller'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Canales directos */}
        <aside className="flex flex-col gap-8">
          <h2 className="text-2xl">Canales directos</h2>

          <ul className="flex flex-col gap-6">
            <li className="rounded-2xl bg-white p-6 ring-1 ring-piedra-300/60">
              <h3 className="text-base font-semibold">WhatsApp de Atención</h3>
              <a
                href={contacto.whatsapp.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block font-display text-xl text-ambar-600 transition-colors hover:text-ambar-700"
              >
                {contacto.whatsapp.number}
              </a>
              <p className="mt-2 text-sm text-piedra-500">{contacto.whatsapp.hours}</p>
            </li>

            <li className="rounded-2xl bg-white p-6 ring-1 ring-piedra-300/60">
              <h3 className="text-base font-semibold">Email Corporativo / Soporte</h3>
              <a
                href={`mailto:${contacto.email.address}`}
                className="mt-2 block font-display text-xl text-ambar-600 transition-colors hover:text-ambar-700"
              >
                {contacto.email.address}
              </a>
              {contacto.email.note ? <p className="mt-2 text-sm text-piedra-500">{contacto.email.note}</p> : null}
            </li>

            <li className="rounded-2xl bg-white p-6 ring-1 ring-piedra-300/60">
              <h3 className="text-base font-semibold">Nuestra Matriz Creativa</h3>
              <p className="mt-2 font-display text-xl">
                {contacto.location.city} — {contacto.location.country}
              </p>
              {contacto.location.note ? <p className="mt-2 text-sm text-piedra-500">{contacto.location.note}</p> : null}
            </li>
          </ul>

          <div className="rounded-2xl bg-tinta p-7 text-hueso">
            <h3 className="font-display text-xl">Compromiso Rotura Cero</h3>
            <p className="mt-3 text-sm leading-relaxed text-piedra-300">
              ¿Miedo al envío? Si tu pieza sufre algún daño físico en el trayecto, te enviamos una
              pieza idéntica completamente nueva sin cargo o te devolvemos el 100% de tu dinero de
              forma inmediata.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}
