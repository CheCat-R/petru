/**
 * Lo pendiente de atender, sondeado cada 20 segundos.
 *
 * No hay WebSockets en el hosting compartido, así que el panel pregunta. La
 * consulta es una sola y liviana (dos COUNT y dos SELECT chicos), y TanStack
 * la comparte entre todos los que la usen: la campana, el menú y el vigía de
 * avisos leen el mismo resultado, no lo piden tres veces.
 */
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "../../../context/AuthContext";
import { claves, obtenerNovedades } from "../api/petruApi";

export const INTERVALO_MS = 20_000;

const VACIO = { ordersToPrepare: 0, newInquiries: 0, alerts: [], events: [] };

export const useNovedades = () => {
  const { user } = useAuth();

  const consulta = useQuery({
    queryKey: claves.novedades,
    queryFn: obtenerNovedades,
    enabled: Boolean(user),
    refetchInterval: INTERVALO_MS,
    refetchIntervalInBackground: true, // la pestaña de atrás también tiene que avisar
    staleTime: INTERVALO_MS / 2,
  });

  const datos = consulta.data ?? VACIO;
  return { ...datos, total: datos.ordersToPrepare + datos.newInquiries, cargando: consulta.isPending };
};

/** Adónde lleva cada evento del listado. */
export const rutaDeEvento = (evento) =>
  evento.type === "order" ? `/pedidos/${evento.id}`
    : evento.type === "alert" ? (evento.title === "Envíos" ? "/integraciones/envios" : "/integraciones/mercadopago")
      : "/consultas";
