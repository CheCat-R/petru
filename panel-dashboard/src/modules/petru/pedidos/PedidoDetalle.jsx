/**
 * Detalle de un pedido con sus transiciones.
 *
 * Qué botones se ofrecen lo decide `accionesDePedido` (espejo de las reglas del
 * modelo en Laravel). Si algo se desincroniza, la API responde 409 con el motivo
 * y acá se muestra tal cual: la regla vive en un solo lugar, el servidor.
 */
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";

import EntityHeader from "../../../components/EntityHeader/EntityHeader";
import Button from "../../../components/Button/Button";
import StatusBadge from "../../../components/StatusBadge/StatusBadge";
import Modal from "../../../components/Modal/Modal";
import InputField from "../../../components/Form/InputField/InputField";
import SelectField from "../../../components/Form/SelectField/SelectField";
import { useToast } from "../../../components/Toast/ToastContext";

import { claves, formatearFecha, formatearPrecio, guardarNotasPedido, obtenerPedido, transicionarPedido } from "../api/petruApi";
import { TRANSPORTISTAS, accionesDePedido } from "../lib/estados";

const Dato = ({ etiqueta, children }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" display="block">{etiqueta}</Typography>
    <Typography variant="body2">{children ?? "—"}</Typography>
  </Box>
);

const PedidoDetalle = () => {
  const { numero } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [pendiente, setPendiente] = useState(null); // acción a confirmar
  const [datosAccion, setDatosAccion] = useState({});
  const [notas, setNotas] = useState(null);

  const { data: pedido, isLoading } = useQuery({ queryKey: claves.pedido(numero), queryFn: () => obtenerPedido(numero) });

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: claves.pedido(numero) });
    queryClient.invalidateQueries({ queryKey: ["petru", "pedidos"] });
    queryClient.invalidateQueries({ queryKey: ["petru", "productos"] });
  };

  const transicion = useMutation({
    mutationFn: ({ accion, datos }) => transicionarPedido(numero, accion, datos),
    onSuccess: (_, { etiqueta }) => { invalidar(); showToast(`${etiqueta}: listo`, "success"); },
    onError: (e) => showToast(e.message, "error"),
    onSettled: () => { setPendiente(null); setDatosAccion({}); },
  });

  const guardarNotas = useMutation({
    mutationFn: (texto) => guardarNotasPedido(numero, texto),
    onSuccess: () => { invalidar(); setNotas(null); showToast("Notas guardadas", "success"); },
    onError: (e) => showToast(e.message, "error"),
  });

  if (isLoading || !pedido) return <div className="route-loading" aria-busy="true" />;

  const acciones = accionesDePedido(pedido);
  const ejecutar = (a) => {
    if (a.pideReferencia || a.pideMotivo || a.pideEnvio || a.confirmar) {
      setPendiente(a);
      setDatosAccion(a.pideEnvio ? { transportista: TRANSPORTISTAS[0], tracking: "" } : {});
    } else {
      transicion.mutate({ accion: a.accion, etiqueta: a.etiqueta, datos: {} });
    }
  };

  const direccion = pedido.shippingAddress;

  return (
    <Box>
      <EntityHeader
        onBack={() => navigate("/pedidos")}
        backLabel="Pedidos"
        title={`Pedido #${pedido.id}`}
        subtitle={`${formatearFecha(pedido.createdAt)} · ${pedido.customerName}`}
        badges={
          <>
            <StatusBadge status={pedido.paymentStatus} />
            <StatusBadge status={pedido.fulfillmentStatus} />
          </>
        }
        actions={acciones.map((a) => (
          <Button key={a.accion} variant={a.variante} disabled={transicion.isPending} onClick={() => ejecutar(a)}>
            {a.etiqueta}
          </Button>
        ))}
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper className="surface" elevation={0} sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Piezas</Typography>
            <Stack divider={<Divider />} spacing={1.5}>
              {pedido.items.map((item) => (
                <Box key={item.id} sx={{ display: "flex", alignItems: "center", gap: 2, py: 0.5 }}>
                  <Avatar variant="rounded" src={item.imageUrl ?? undefined} sx={{ width: 44, height: 44, bgcolor: "var(--bg-sunken)", color: "var(--text-secondary)" }}>
                    {item.name.charAt(0)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>{item.name}</Typography>
                    <Typography variant="caption" color="text.secondary" className="mono">{item.sku}</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ minWidth: 60, textAlign: "right" }}>{item.qty} × {formatearPrecio(item.unitPrice)}</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ minWidth: 90, textAlign: "right" }}>{formatearPrecio(item.subtotal)}</Typography>
                </Box>
              ))}
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Stack spacing={0.5} sx={{ ml: "auto", maxWidth: 280 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}><span>Subtotal</span><span>{formatearPrecio(pedido.subtotal)}</span></Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}><span>Envío</span><span>{formatearPrecio(pedido.shippingCost)}</span></Box>
              {pedido.discount > 0 && <Box sx={{ display: "flex", justifyContent: "space-between" }}><span>Descuento{pedido.couponCode ? ` (${pedido.couponCode})` : ""}</span><span>−{formatearPrecio(pedido.discount)}</span></Box>}
              <Box sx={{ display: "flex", justifyContent: "space-between", fontWeight: 700, fontSize: "1.05em" }}><span>Total</span><span>{formatearPrecio(pedido.total)}</span></Box>
            </Stack>
          </Paper>

          <Paper className="surface" elevation={0} sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={700}>Notas del taller</Typography>
              {notas === null ? (
                <Button variant="ghost" onClick={() => setNotas(pedido.notes ?? "")}>Editar</Button>
              ) : (
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button variant="ghost" onClick={() => setNotas(null)}>Cancelar</Button>
                  <Button variant="primary" disabled={guardarNotas.isPending} onClick={() => guardarNotas.mutate(notas)}>Guardar</Button>
                </Box>
              )}
            </Box>
            {notas === null ? (
              <Typography variant="body2" color={pedido.notes ? "text.primary" : "text.secondary"} sx={{ whiteSpace: "pre-wrap" }}>
                {pedido.notes || "Sin notas. Solo las ve el taller."}
              </Typography>
            ) : (
              <InputField label="Notas internas" value={notas} onChange={(e) => setNotas(e.target.value)} multiline minRows={3} autoFocus />
            )}
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper className="surface" elevation={0} sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Cliente</Typography>
            <Stack spacing={1.5}>
              <Dato etiqueta="Nombre">{pedido.customerName}</Dato>
              <Dato etiqueta="Email">{pedido.customerEmail}</Dato>
              <Dato etiqueta="Teléfono">{pedido.customerPhone}</Dato>
              <Dato etiqueta="DNI">{pedido.customerDni}</Dato>
            </Stack>
          </Paper>

          <Paper className="surface" elevation={0} sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Envío</Typography>
            <Stack spacing={1.5}>
              <Dato etiqueta="Dirección">
                {direccion.street} {direccion.number}{direccion.floor ? `, piso ${direccion.floor}` : ""}{direccion.apartment ? ` depto ${direccion.apartment}` : ""}
                <br />{direccion.zip} {direccion.city}, {direccion.state}
              </Dato>
              {direccion.reference && <Dato etiqueta="Referencia">{direccion.reference}</Dato>}
              <Dato etiqueta="Transportista">{pedido.shippingCarrier}</Dato>
              <Dato etiqueta="Tracking">{pedido.trackingCode ? <span className="mono">{pedido.trackingCode}</span> : null}</Dato>
            </Stack>
          </Paper>

          <Paper className="surface" elevation={0} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Pago y línea de tiempo</Typography>
            <Stack spacing={1.5}>
              <Dato etiqueta="Método">{pedido.paymentMethod}</Dato>
              <Dato etiqueta="Referencia">{pedido.paymentRef ? <span className="mono">{pedido.paymentRef}</span> : null}</Dato>
              <Divider />
              <Dato etiqueta="Creado">{formatearFecha(pedido.createdAt)}</Dato>
              {pedido.paidAt && <Dato etiqueta="Pagado">{formatearFecha(pedido.paidAt)}</Dato>}
              {pedido.rejectedAt && <Dato etiqueta="Rechazado">{formatearFecha(pedido.rejectedAt)} — {pedido.rejectionReason}</Dato>}
              {pedido.dispatchedAt && <Dato etiqueta="Despachado">{formatearFecha(pedido.dispatchedAt)}</Dato>}
              {pedido.deliveredAt && <Dato etiqueta="Entregado">{formatearFecha(pedido.deliveredAt)}</Dato>}
              {pedido.returnedAt && <Dato etiqueta="Devuelto">{formatearFecha(pedido.returnedAt)}</Dato>}
              {pedido.refundedAt && <Dato etiqueta="Reembolsado">{formatearFecha(pedido.refundedAt)}</Dato>}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Confirmación / datos de la acción */}
      <Modal
        open={Boolean(pendiente)}
        onClose={() => setPendiente(null)}
        title={pendiente?.etiqueta}
        subtitle={`Pedido #${pedido.id}`}
        actions={
          <>
            <Button variant="ghost" onClick={() => setPendiente(null)}>Cancelar</Button>
            <Button
              variant={pendiente?.variante === "danger" ? "danger-solid" : "primary"}
              disabled={transicion.isPending}
              onClick={() => transicion.mutate({ accion: pendiente.accion, etiqueta: pendiente.etiqueta, datos: datosAccion })}
            >
              {transicion.isPending ? "Aplicando…" : "Confirmar"}
            </Button>
          </>
        }
      >
        {pendiente && (
          <Stack spacing={2} sx={{ pt: 1 }}>
            {pendiente.pideReferencia && (
              <InputField label="Referencia del pago" value={datosAccion.referencia ?? ""} onChange={(e) => setDatosAccion((d) => ({ ...d, referencia: e.target.value }))} helperText="Ej. ID de la operación en MercadoPago, o «transferencia»" autoFocus />
            )}
            {pendiente.pideMotivo && (
              <InputField label="Motivo" value={datosAccion.motivo ?? ""} onChange={(e) => setDatosAccion((d) => ({ ...d, motivo: e.target.value }))} autoFocus />
            )}
            {pendiente.pideEnvio && (
              <>
                <SelectField label="Transportista" value={datosAccion.transportista} onChange={(e) => setDatosAccion((d) => ({ ...d, transportista: e.target.value }))} options={TRANSPORTISTAS} />
                <InputField label="Código de seguimiento" value={datosAccion.tracking ?? ""} onChange={(e) => setDatosAccion((d) => ({ ...d, tracking: e.target.value }))} helperText="Opcional; se le informa al cliente" />
              </>
            )}
            {pendiente.confirmar && !pendiente.pideEnvio && (
              <Typography variant="body2">
                {pendiente.accion === "reembolsar" && "Se devuelve el stock al catálogo y el pedido queda cancelado. El reembolso en MercadoPago se hace desde su panel."}
                {pendiente.accion === "devolucion" && "El pedido pasa a Devuelto y el pago a Reembolso pendiente."}
                {pendiente.accion === "confirmar-reembolso" && "Confirmás que el dinero ya fue devuelto al cliente."}
              </Typography>
            )}
          </Stack>
        )}
      </Modal>
    </Box>
  );
};

export default PedidoDetalle;
