import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';

import Etiqueta from '../components/ui/Etiqueta';
import { sitio } from '../data/sitio';
import { useContacto, useContenido } from '../lib/contenido';
import { registrar } from '../lib/analitica';
import { ErrorApi, cotizarEnvio, crearPedido, formatearPrecio } from '../lib/api';
import { useCarrito, useCarritoListo } from '../lib/carrito';

export const meta = () => [
  { title: `Finalizar compra | ${sitio.nombre}` },
  { name: 'robots', content: 'noindex' },
];

const campoBase =
  'w-full rounded-xl border bg-white px-4 py-3 text-tinta placeholder:text-piedra-400 transition-colors focus:outline-none';

function Campo({ id, label, error, requerido, className, ...props }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-piedra-600">
        {label}
        {requerido ? <span className="ml-1 text-ambar-600">*</span> : null}
      </label>
      <input
        id={id}
        name={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={clsx(campoBase, error ? 'border-red-400 focus:border-red-600' : 'border-piedra-300 focus:border-ambar-600')}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function Checkout() {
  const contacto = useContacto();
  const { payments, shipping } = useContenido();
  const modoPago = payments?.mode ?? 'produccion';
  const zonas = shipping?.zones ?? [];
  const cobertura = zonas.length > 1 ? `${zonas.slice(0, -1).join(', ')} y ${zonas.at(-1)}` : (zonas[0] ?? 'Rosario y alrededores');
  const listo = useCarritoListo();
  const items = useCarrito((s) => s.items);
  const vaciar = useCarrito((s) => s.vaciar);
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);

  const [cp, setCp] = useState('');
  const [metodoEnvio, setMetodoEnvio] = useState(null);
  const [problemasCarrito, setProblemasCarrito] = useState([]);
  const [faltaEnvio, setFaltaEnvio] = useState(false);
  const campoCp = useRef(null);

  const cotizacion = useMutation({
    mutationFn: async (codigoPostal) => ({ ...(await cotizarEnvio(codigoPostal, items)), codigoPostalIngresado: codigoPostal }),
    onSuccess: (r) => setMetodoEnvio(r.opciones.find((o) => o.method === 'domicilio')?.method ?? r.opciones[0]?.method ?? null),
    onError: () => setMetodoEnvio(null),
  });

  // "Empezó el checkout": una vez por visita a esta página, con o sin carrito.
  useEffect(() => {
    registrar('checkout_start');
  }, []);

  const pedido = useMutation({
    mutationFn: crearPedido,
    onSuccess: ({ id, paymentUrl }) => {
      registrar('order', { pedido_numero: String(id) });
      vaciar();
      window.location.assign(paymentUrl);
    },
    onError: (e) => {
      if (e instanceof ErrorApi && e.status === 409) setProblemasCarrito(e.cuerpo?.items ?? []);
    },
  });

  const errores = pedido.error instanceof ErrorApi ? pedido.error.errores : {};
  const err = (campo) => errores[campo]?.[0];
  const errorCp = cotizacion.error instanceof ErrorApi ? cotizacion.error.errores?.codigo_postal?.[0] : err('codigo_postal');

  const opciones = cotizacion.data?.opciones ?? [];
  const envioElegido = opciones.find((o) => o.method === metodoEnvio) ?? null;
  const total = subtotal + (envioElegido?.cost ?? 0);

  // Cotiza solo, apenas el CP tiene 4 dígitos: no hay que salir del campo ni
  // apretar nada. Se espera medio segundo para no cotizar en cada tecla.
  const cotizar = cotizacion.mutate;
  const cpValido = /\d{4}/.test(cp);
  useEffect(() => {
    if (!cpValido) return undefined;
    const t = setTimeout(() => cotizar(cp.trim()), 500);
    return () => clearTimeout(t);
  }, [cp, cpValido, cotizar]);

  function alEnviar(e) {
    e.preventDefault();
    if (!envioElegido) {
      // Sin cotización no hay total: se explica y se lleva al CP en vez de
      // dejar el botón mudo.
      setFaltaEnvio(true);
      campoCp.current?.focus();
      if (cpValido && !cotizacion.isPending) cotizar(cp.trim());
      return;
    }
    setFaltaEnvio(false);
    const datos = Object.fromEntries(new FormData(e.currentTarget));
    pedido.mutate({
      ...datos,
      metodo_envio: metodoEnvio,
      items: items.map((i) => ({ producto_id: i.productId, cantidad: i.qty })),
    });
  }

  if (!listo) return <div className="contenedor py-24" aria-busy="true" />;

  if (items.length === 0 && !pedido.isSuccess) {
    return (
      <div className="contenedor max-w-xl py-24 text-center">
        <h1 className="text-display-sm">No hay nada para comprar</h1>
        <p className="mt-4 text-piedra-600">Agregá alguna pieza desde la galería y volvé.</p>
        <Link to="/galeria" className="mt-8 inline-block font-semibold text-ambar-600">Ir a la galería →</Link>
      </div>
    );
  }

  return (
    <div className="contenedor py-14 lg:py-20">
      <Etiqueta>Finalizar compra</Etiqueta>
      <h1 className="mt-4 text-display-sm lg:text-display-md">Contanos adónde va la pieza</h1>

      <form onSubmit={alEnviar} noValidate className="mt-12 grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <div className="flex flex-col gap-10">
          {/* Contacto */}
          <section>
            <h2 className="text-xl">Tus datos</h2>
            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <Campo id="nombre" label="Nombre y apellido" requerido autoComplete="name" error={err('nombre')} className="sm:col-span-2" />
              <Campo id="email" label="Email" type="email" requerido autoComplete="email" error={err('email')} placeholder="Te mandamos ahí la confirmación" />
              <Campo id="telefono" label="WhatsApp / Teléfono" type="tel" requerido autoComplete="tel" error={err('telefono')} placeholder="+54 9 341 ..." />
              <Campo id="dni" label="DNI" inputMode="numeric" error={err('dni')} placeholder="Lo pide el correo para entregar" />
            </div>
          </section>

          {/* Dirección */}
          <section>
            <h2 className="text-xl">Dirección de entrega</h2>
            <p className="mt-1 text-sm text-piedra-500">Por ahora enviamos a {cobertura}.</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-6">
              <Campo
                id="codigo_postal"
                label="Código postal"
                requerido
                inputMode="numeric"
                autoComplete="postal-code"
                ref={campoCp}
                value={cp}
                onChange={(e) => { setCp(e.target.value); setFaltaEnvio(false); }}
                error={errorCp ?? (faltaEnvio && !cpValido ? 'Ingresá el código postal para cotizar el envío.' : undefined)}
                placeholder="2000"
                className="sm:col-span-2"
              />
              <Campo id="localidad" label="Localidad" requerido autoComplete="address-level2" error={err('localidad')} defaultValue="Rosario" className="sm:col-span-2" />
              <Campo id="provincia" label="Provincia" requerido autoComplete="address-level1" error={err('provincia')} defaultValue="Santa Fe" className="sm:col-span-2" />
              <Campo id="calle" label="Calle" requerido autoComplete="address-line1" error={err('calle')} className="sm:col-span-4" />
              <Campo id="numero" label="Número" requerido error={err('numero')} className="sm:col-span-2" />
              <Campo id="piso" label="Piso" error={err('piso')} className="sm:col-span-2" />
              <Campo id="departamento" label="Depto" error={err('departamento')} className="sm:col-span-2" />
              <Campo id="referencia" label="Referencia" error={err('referencia')} placeholder="Portón negro, timbre 2…" className="sm:col-span-2" />
            </div>
          </section>

          {/* Envío */}
          <section>
            <h2 className="text-xl">Envío</h2>
            {cotizacion.isPending ? (
              <p className="mt-4 text-sm text-piedra-500" aria-live="polite">Cotizando…</p>
            ) : opciones.length === 0 ? (
              <p className="mt-4 text-sm text-piedra-500">Ingresá el código postal para ver las opciones.</p>
            ) : (
              <ul className="mt-5 flex flex-col gap-3" role="radiogroup" aria-label="Método de envío">
                {opciones.map((opcion) => {
                  const activa = opcion.method === metodoEnvio;
                  return (
                    <li key={opcion.method}>
                      <label
                        className={clsx(
                          'flex cursor-pointer items-center justify-between gap-4 rounded-2xl border bg-white p-5 transition-all',
                          activa ? 'border-tinta ring-1 ring-tinta' : 'border-piedra-300 hover:border-piedra-400',
                        )}
                      >
                        <span className="flex items-center gap-4">
                          <input
                            type="radio"
                            name="metodo_envio_ui"
                            checked={activa}
                            onChange={() => setMetodoEnvio(opcion.method)}
                            className="h-4 w-4 accent-tinta"
                          />
                          <span>
                            <span className="block font-semibold">{opcion.name}</span>
                            <span className="block text-sm text-piedra-500">
                              {[opcion.detail, opcion.eta].filter(Boolean).join(' · ')}
                            </span>
                          </span>
                        </span>
                        <span className="font-display text-lg tabular-nums">
                          {opcion.cost === 0 ? 'Gratis' : formatearPrecio(opcion.cost)}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            {err('metodo_envio') ? <p role="alert" className="mt-2 text-sm text-red-700">{err('metodo_envio')}</p> : null}
            {cotizacion.isError && !errorCp ? (
              <p role="alert" className="mt-3 text-sm text-red-700">No pudimos cotizar el envío. Revisá el código postal e intentá de nuevo.</p>
            ) : null}
          </section>

          <section>
            <label htmlFor="notas" className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.15em] text-piedra-600">
              Algo que debamos saber
            </label>
            <textarea id="notas" name="notas" rows={3} className={`${campoBase} resize-y border-piedra-300 focus:border-ambar-600`} placeholder="Horarios de entrega, es un regalo, etc." />
          </section>

          <div className="hidden" aria-hidden>
            <label htmlFor="sitio_web">Sitio web</label>
            <input id="sitio_web" name="sitio_web" type="text" tabIndex={-1} autoComplete="off" />
          </div>
        </div>

        {/* Resumen */}
        <aside className="h-fit rounded-3xl bg-white p-8 ring-1 ring-piedra-300/60 lg:sticky lg:top-28">
          <h2 className="text-xl">Tu pedido</h2>
          <ul className="mt-5 divide-y divide-piedra-300/60 text-sm" role="list">
            {items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-4 py-3">
                <span>
                  <span className="font-semibold">{item.qty}×</span> {item.name}
                </span>
                <span className="tabular-nums">{formatearPrecio(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>

          <dl className="mt-5 flex flex-col gap-2 border-t border-piedra-300/60 pt-5 text-sm">
            <div className="flex justify-between">
              <dt className="text-piedra-600">Subtotal</dt>
              <dd className="tabular-nums">{formatearPrecio(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-piedra-600">Envío</dt>
              <dd className="tabular-nums">{envioElegido ? (envioElegido.cost === 0 ? 'Gratis' : formatearPrecio(envioElegido.cost)) : '—'}</dd>
            </div>
          </dl>
          <div className="mt-5 flex justify-between border-t border-piedra-300/60 pt-5">
            <span className="font-semibold">Total</span>
            <span className="font-display text-2xl tabular-nums">{formatearPrecio(total)}</span>
          </div>

          {problemasCarrito.length > 0 ? (
            <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-semibold">El carrito cambió:</p>
              <ul className="mt-2 list-disc pl-5">
                {problemasCarrito.map((p, i) => <li key={i}>{p.motivo}</li>)}
              </ul>
              <Link to="/carrito" className="mt-3 inline-block font-semibold underline">Revisar el carrito</Link>
            </div>
          ) : pedido.isError && !(pedido.error instanceof ErrorApi && pedido.error.status === 422) ? (
            <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              No pudimos crear el pedido. Probá de nuevo o escribinos por{' '}
              <a href={contacto.whatsapp.link} className="font-semibold underline">WhatsApp</a>.
            </p>
          ) : pedido.isError ? (
            <p role="alert" className="mt-6 text-sm text-red-700">Revisá los campos marcados.</p>
          ) : null}

          <button
            type="submit"
            disabled={pedido.isPending || pedido.isSuccess}
            className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-ambar-600 px-8 py-4 text-base font-semibold tracking-wide text-white shadow-sm transition-all hover:bg-ambar-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pedido.isPending || pedido.isSuccess ? 'Redirigiendo a MercadoPago…' : 'Pagar con MercadoPago'}
          </button>
          {!envioElegido ? (
            <p role={faltaEnvio ? 'alert' : undefined} className={clsx('mt-3 text-center text-sm', faltaEnvio ? 'text-red-700' : 'text-piedra-500')}>
              {cotizacion.isPending
                ? 'Cotizando el envío…'
                : errorCp
                  ? 'No podemos enviar a ese código postal.'
                  : 'Falta el código postal para cotizar el envío.'}
            </p>
          ) : null}
          <p className="mt-4 text-center text-xs text-piedra-500">
            Te llevamos a MercadoPago para pagar con tarjeta, dinero en cuenta o efectivo. Volvés al sitio al terminar.
          </p>
          {modoPago !== 'produccion' ? (
            <p role="status" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-center text-xs font-semibold text-amber-900">
              {modoPago === 'test'
                ? 'Modo de prueba: los pagos no son reales. Usá las tarjetas de prueba de MercadoPago.'
                : 'Pagos simulados: no se cobra nada. El taller todavía no cargó las credenciales de MercadoPago.'}
            </p>
          ) : null}
        </aside>
      </form>
    </div>
  );
}
