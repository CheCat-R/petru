import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { Link, redirect } from 'react-router';

import Boton from '../components/ui/Boton';
import Etiqueta from '../components/ui/Etiqueta';
import { MOSTRAR_LEGALES_CONSUMIDOR } from '../data/sitio';
import { useContacto } from '../lib/contenido';
import { ErrorApi, enviarConsulta } from '../lib/api';
import { meta as construirMeta } from '../lib/seo';

export const meta = () =>
  construirMeta({
    ruta: '/arrepentimiento',
    titulo: 'Botón de arrepentimiento',
    descripcion: 'Revocá tu compra dentro de los 10 días de recibida, sin dar motivos y sin costo, como establece la Ley 24.240.',
  });

// Mientras el botón esté apagado, la URL vieja lleva a la política de devolución.
export const clientLoader = () => (MOSTRAR_LEGALES_CONSUMIDOR ? null : redirect('/devoluciones'));

const campo =
  'w-full rounded-xl border bg-white px-4 py-3 text-tinta placeholder:text-piedra-400 transition-colors focus:outline-none';

/**
 * Botón de arrepentimiento (Res. 424/2020): la solicitud entra como consulta con
 * motivo `arrepentimiento`, avisa al taller por mail y queda en el panel.
 */
export default function Arrepentimiento() {
  const contacto = useContacto();
  const envio = useMutation({ mutationFn: enviarConsulta });
  const errores = envio.error instanceof ErrorApi ? envio.error.errores : {};
  const err = (c) => errores[c]?.[0];

  function alEnviar(e) {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.currentTarget));
    envio.mutate({
      nombre: d.nombre,
      email: d.email,
      telefono: d.telefono,
      motivo: 'arrepentimiento',
      mensaje: `Solicito revocar la compra del pedido #${d.pedido || '(sin número)'}.\nFecha de recepción: ${d.recibido || '(no indicada)'}.\n${d.comentario || ''}`.trim(),
    });
  }

  const clase = (c) => clsx(campo, err(c) ? 'border-red-400 focus:border-red-600' : 'border-piedra-300 focus:border-ambar-600');

  return (
    <div className="contenedor py-14 lg:py-20">
      <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">
        <div className="max-w-xl">
          <Etiqueta>Botón de arrepentimiento</Etiqueta>
          <h1 className="mt-4 text-display-sm lg:text-display-md">¿Cambiaste de idea?</h1>
          <p className="mt-6 text-lg leading-relaxed text-piedra-600">
            Podés revocar la compra dentro de los <strong className="text-tinta">10 días corridos</strong> desde que
            recibiste la pieza, sin dar motivos y sin costo. Es tu derecho por comprar a distancia
            (art. 34, Ley 24.240) y lo respetamos sin vueltas.
          </p>
          <div className="mt-8 flex flex-col gap-4 leading-relaxed text-piedra-700">
            <p>Completá el formulario y te respondemos dentro de las 24 horas hábiles con las instrucciones para la devolución. El envío de vuelta corre por nuestra cuenta.</p>
            <p>Reintegramos el dinero por el mismo medio de pago dentro de los 10 días hábiles de recibida la pieza en el taller.</p>
            <p className="text-sm text-piedra-500">
              Las piezas a medida del Custom Lab no admiten arrepentimiento una vez iniciada la producción.
              Si tu pieza llegó dañada, corresponde el <Link to="/devoluciones" className="font-semibold text-ambar-600">compromiso Rotura Cero</Link>, que no tiene plazo de 10 días.
            </p>
          </div>
        </div>

        <div>
          {envio.isSuccess ? (
            <div className="rounded-3xl border border-jade/30 bg-jade/5 p-8 text-center">
              <p className="font-display text-2xl">Solicitud recibida</p>
              <p className="mt-3 text-piedra-600">Te escribimos dentro de las 24 horas hábiles con los pasos para la devolución. Número de referencia: #{envio.data?.id}.</p>
            </div>
          ) : (
            <form onSubmit={alEnviar} noValidate className="rounded-3xl bg-white p-8 ring-1 ring-piedra-300/60">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="nombre" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-piedra-600">Nombre y apellido <span className="text-ambar-600">*</span></label>
                  <input id="nombre" name="nombre" required autoComplete="name" className={clase('nombre')} />
                  {err('nombre') ? <p role="alert" className="mt-1.5 text-sm text-red-700">{err('nombre')}</p> : null}
                </div>
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-piedra-600">Email <span className="text-ambar-600">*</span></label>
                  <input id="email" name="email" type="email" required autoComplete="email" className={clase('email')} placeholder="El de la compra" />
                  {err('email') ? <p role="alert" className="mt-1.5 text-sm text-red-700">{err('email')}</p> : null}
                </div>
                <div>
                  <label htmlFor="telefono" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-piedra-600">Teléfono</label>
                  <input id="telefono" name="telefono" type="tel" autoComplete="tel" className={clase('telefono')} />
                </div>
                <div>
                  <label htmlFor="pedido" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-piedra-600">Número de pedido</label>
                  <input id="pedido" name="pedido" inputMode="numeric" className={clase('pedido')} placeholder="Ej. 10003" />
                </div>
                <div>
                  <label htmlFor="recibido" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-piedra-600">Fecha en que lo recibiste</label>
                  <input id="recibido" name="recibido" type="date" className={clase('recibido')} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="comentario" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-piedra-600">Comentario (opcional)</label>
                  <textarea id="comentario" name="comentario" rows={3} className={`${clase('mensaje')} resize-y`} placeholder="No hace falta que expliques el motivo." />
                  {err('mensaje') ? <p role="alert" className="mt-1.5 text-sm text-red-700">{err('mensaje')}</p> : null}
                </div>
              </div>

              {envio.isError && !Object.keys(errores).length ? (
                <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                  No pudimos enviar la solicitud. Escribinos a {contacto.email.address} o por WhatsApp.
                </p>
              ) : null}

              <Boton type="submit" tamano="lg" className="mt-6 w-full" disabled={envio.isPending}>
                {envio.isPending ? 'Enviando…' : 'Solicitar la revocación'}
              </Boton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
