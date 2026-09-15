import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { Link, useParams, useSearchParams } from 'react-router';

import Boton from '../components/ui/Boton';
import Etiqueta from '../components/ui/Etiqueta';
import { sitio } from '../data/sitio';
import { useContacto } from '../lib/contenido';
import { ErrorApi, formatearPrecio, obtenerPedido, simularPago } from '../lib/api';

export const meta = () => [
  { title: `Tu pedido | ${sitio.nombre}` },
  { name: 'robots', content: 'noindex' },
];

/** Qué le decimos a la persona según el estado del pago y del envío. */
function describir(pedido) {
  const { paymentStatus: pago, fulfillmentStatus: envio } = pedido;

  if (pago === 'Pendiente') {
    return {
      tono: 'espera',
      titulo: 'Estamos confirmando tu pago',
      detalle: 'MercadoPago nos avisa apenas se acredita. Si pagaste en efectivo, puede demorar hasta 48 hs hábiles. Podés cerrar esta página: te escribimos por email.',
    };
  }
  if (pago === 'Rechazado') {
    return {
      tono: 'error',
      titulo: 'El pago no se pudo procesar',
      detalle: `${pedido.rejectionReason ?? 'MercadoPago rechazó el pago.'} Tus piezas quedan reservadas un rato más: podés intentar de nuevo o escribirnos.`,
    };
  }
  if (pago === 'Cancelado') {
    return { tono: 'error', titulo: 'Este pedido se canceló', detalle: 'Si fue un error, armá el carrito de nuevo y te lo reservamos otra vez.' };
  }
  if (pago === 'Reembolso pendiente' || pago === 'Reembolsado') {
    return { tono: 'neutro', titulo: pago === 'Reembolsado' ? 'Reembolso realizado' : 'Reembolso en curso', detalle: 'Cualquier duda, escribinos por WhatsApp.' };
  }
  if (envio === 'Entregado') {
    return { tono: 'ok', titulo: '¡Llegó!', detalle: 'Esperamos que la pieza encuentre su lugar. Si algo no está bien, aplica nuestro compromiso Rotura Cero.' };
  }
  if (envio === 'Despachado') {
    return {
      tono: 'ok',
      titulo: 'Tu pedido está en camino',
      detalle: pedido.trackingCode ? `Viaja por ${pedido.shippingCarrier}. Seguimiento: ${pedido.trackingCode}` : `Viaja por ${pedido.shippingCarrier ?? 'correo'}.`,
    };
  }
  return {
    tono: 'ok',
    titulo: '¡Pago confirmado!',
    detalle: pedido.shippingCarrier
      ? 'Estamos embalando tu pieza con el cuidado que merece. Te avisamos cuando salga del taller.'
      : 'Te escribimos por WhatsApp para coordinar el retiro en el taller.',
  };
}

const tonos = {
  espera: 'bg-ambar-50 text-ambar-700 ring-ambar-100',
  ok: 'bg-emerald-50 text-emerald-800 ring-emerald-100',
  error: 'bg-red-50 text-red-800 ring-red-100',
  neutro: 'bg-hueso-oscuro text-piedra-700 ring-piedra-300/60',
};

export default function Pedido() {
  const contacto = useContacto();
  const { token } = useParams();
  const [parametros] = useSearchParams();
  const queryClient = useQueryClient();
  const simular = parametros.get('simular') === '1';

  const consulta = useQuery({
    queryKey: ['pedido', token],
    queryFn: () => obtenerPedido(token),
    retry: (n, e) => !(e instanceof ErrorApi && e.status === 404) && n < 2,
    // Mientras el pago esté pendiente, volvemos a preguntar cada 6 s (hasta 3 min).
    refetchInterval: (q) => {
      const p = q.state.data;
      if (!p || p.paymentStatus !== 'Pendiente') return false;
      return q.state.dataUpdateCount < 30 ? 6000 : false;
    },
  });

  const simulacion = useMutation({
    mutationFn: (resultado) => simularPago(token, resultado),
    onSuccess: (p) => queryClient.setQueryData(['pedido', token], p),
  });

  if (consulta.isLoading) return <div className="contenedor py-24 text-center text-piedra-500" aria-busy="true">Buscando tu pedido…</div>;

  if (consulta.isError) {
    return (
      <div className="contenedor max-w-xl py-24 text-center">
        <h1 className="text-display-sm">No encontramos ese pedido</h1>
        <p className="mt-4 text-piedra-600">Revisá el link que te mandamos por email o escribinos por WhatsApp.</p>
        <div className="mt-8"><Boton href={contacto.whatsapp.link} variante="ambar">WhatsApp del taller</Boton></div>
      </div>
    );
  }

  const pedido = consulta.data;
  const estado = describir(pedido);
  const d = pedido.shippingAddress;

  return (
    <div className="contenedor max-w-3xl py-14 lg:py-20">
      <Etiqueta>Pedido #{pedido.id}</Etiqueta>
      <h1 className="mt-4 text-display-sm lg:text-display-md">{estado.titulo}</h1>
      <p className={clsx('mt-6 rounded-2xl p-5 text-base leading-relaxed ring-1', tonos[estado.tono])} aria-live="polite">
        {estado.detalle}
      </p>

      {/* Solo en desarrollo, con la pasarela simulada */}
      {simular && pedido.paymentStatus === 'Pendiente' ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-ambar-400 bg-ambar-50 p-5">
          <p className="text-sm font-semibold text-ambar-700">Modo desarrollo: acá iría MercadoPago</p>
          <p className="mt-1 text-sm text-piedra-600">Sin credenciales cargadas, el pago se simula.</p>
          <div className="mt-4 flex gap-3">
            <Boton variante="ambar" onClick={() => simulacion.mutate('aprobado')} disabled={simulacion.isPending}>Simular pago aprobado</Boton>
            <Boton variante="secundario" onClick={() => simulacion.mutate('rechazado')} disabled={simulacion.isPending}>Simular rechazo</Boton>
          </div>
        </div>
      ) : null}

      <div className="mt-10 grid gap-8 sm:grid-cols-2">
        <section className="rounded-3xl bg-white p-6 ring-1 ring-piedra-300/60">
          <h2 className="text-lg">Piezas</h2>
          <ul className="mt-4 divide-y divide-piedra-300/60 text-sm" role="list">
            {pedido.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 py-3">
                <span><span className="font-semibold">{item.qty}×</span> {item.name}</span>
                <span className="tabular-nums">{formatearPrecio(item.subtotal)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 flex flex-col gap-1.5 border-t border-piedra-300/60 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-piedra-600">Envío</dt><dd className="tabular-nums">{pedido.shippingCost === 0 ? 'Retiro en taller' : formatearPrecio(pedido.shippingCost)}</dd></div>
            <div className="flex justify-between text-base font-semibold"><dt>Total</dt><dd className="font-display text-xl tabular-nums">{formatearPrecio(pedido.total)}</dd></div>
          </dl>
        </section>

        <section className="rounded-3xl bg-white p-6 ring-1 ring-piedra-300/60">
          <h2 className="text-lg">Entrega</h2>
          <p className="mt-4 text-sm leading-relaxed text-piedra-600">
            <span className="font-semibold text-tinta">{pedido.customerName}</span>
            <br />{d.street} {d.number}{d.floor ? `, piso ${d.floor}` : ''}{d.apartment ? ` depto ${d.apartment}` : ''}
            <br />{d.zip} {d.city}, {d.state}
            {d.reference ? <><br /><span className="text-piedra-500">{d.reference}</span></> : null}
          </p>
          <p className="mt-4 text-sm text-piedra-600">
            Te escribimos a <span className="font-semibold text-tinta">{pedido.customerEmail}</span>
            {pedido.customerPhone ? <> y al <span className="font-semibold text-tinta">{pedido.customerPhone}</span></> : null}.
          </p>
        </section>
      </div>

      <div className="mt-10 flex flex-wrap gap-4">
        <Boton to="/galeria" variante="secundario">Volver a la galería</Boton>
        <Boton href={contacto.whatsapp.link} variante="fantasma">Consultar por WhatsApp</Boton>
      </div>

      <p className="mt-8 text-xs text-piedra-500">
        Guardá este link para seguir tu pedido: <Link to={`/pedido/${token}`} className="underline">{sitio.dominio}/pedido/{token.slice(0, 8)}…</Link>
      </p>
    </div>
  );
}
