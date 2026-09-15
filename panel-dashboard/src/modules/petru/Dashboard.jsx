/**
 * Inicio del panel de Pëtru: lo que hay que mirar hoy, con datos reales.
 * Todo sale de los mismos endpoints que usan las pantallas de cada módulo.
 */
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import PageHeader from "../../components/PageHeader/PageHeader";
import StatCard from "../../components/Cards/StatCard/StatCard";
import Button from "../../components/Button/Button";
import StatusBadge from "../../components/StatusBadge/StatusBadge";
import { useAuth } from "../../context/AuthContext";

import { claves, formatearFecha, formatearPrecio, listarConsultas, listarPedidos, listarProductos } from "./api/petruApi";
import AvisoNotificaciones from "./novedades/AvisoNotificaciones";
import AlertasIntegraciones from "./novedades/AlertasIntegraciones";

const SITIO = import.meta.env.VITE_SITIO_URL ?? "http://localhost:5173";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const productos = useQuery({ queryKey: claves.productos({ por_pagina: 100 }), queryFn: () => listarProductos({ por_pagina: 100 }) });
  const pendientes = useQuery({ queryKey: claves.pedidos({ estado_pago: "Pendiente", por_pagina: 5 }), queryFn: () => listarPedidos({ estado_pago: "Pendiente", por_pagina: 5 }) });
  const aDespachar = useQuery({ queryKey: claves.pedidos({ estado_pago: "Pagado", estado_envio: "Sin despachar", por_pagina: 5 }), queryFn: () => listarPedidos({ estado_pago: "Pagado", estado_envio: "Sin despachar", por_pagina: 5 }) });
  const consultas = useQuery({ queryKey: claves.consultas({ estado: "nueva", por_pagina: 5 }), queryFn: () => listarConsultas({ estado: "nueva", por_pagina: 5 }) });

  const lista = productos.data?.data ?? [];
  const activos = lista.filter((p) => p.status === "Activo").length;
  const agotados = lista.filter((p) => p.status === "Agotado").length;
  const borradores = lista.filter((p) => p.status === "Borrador").length;
  const ultimaUnidad = lista.filter((p) => p.status === "Activo" && p.stock === 1);

  const hora = new Date().getHours();
  const saludo = hora < 12 ? "Buen día" : hora < 20 ? "Buenas tardes" : "Buenas noches";

  return (
    <Box>
      <PageHeader
        title={`${saludo}, ${user?.name?.split(" ")[0] ?? ""}`}
        subtitle="Lo que hay que mirar en el taller hoy"
        actions={
          <Button variant="secondary" startIcon={<OpenInNewIcon />} onClick={() => window.open(SITIO, "_blank", "noopener")}>
            Ver el sitio
          </Button>
        }
      />

      <AvisoNotificaciones />
      <AlertasIntegraciones />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Piezas publicadas" value={activos} hint={`${agotados} agotadas · ${borradores} en borrador`} icon={<Inventory2OutlinedIcon />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Pagos pendientes" value={pendientes.data?.meta?.total ?? "—"} hint="Esperando MercadoPago" icon={<ShoppingBagOutlinedIcon />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Para despachar" value={aDespachar.data?.meta?.total ?? "—"} hint="Pagados, sin despachar" icon={<ShoppingBagOutlinedIcon />} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard title="Consultas nuevas" value={consultas.data?.meta?.total ?? "—"} hint="Sin leer" icon={<ForumOutlinedIcon />} />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper className="surface" elevation={0} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>Pedidos para despachar</Typography>
              <Button variant="ghost" onClick={() => navigate("/pedidos")}>Ver todos</Button>
            </Box>
            <Lista
              filas={aDespachar.data?.data ?? []}
              vacio="Nada para despachar. Todo al día."
              render={(p) => (
                <Fila key={p.id} onClick={() => navigate(`/pedidos/${p.id}`)}>
                  <span className="mono">#{p.id}</span>
                  <Typography variant="body2" sx={{ flex: 1 }}>{p.customerName}</Typography>
                  <Typography variant="body2" color="text.secondary">{formatearFecha(p.paidAt)}</Typography>
                  <Typography variant="body2" fontWeight={600}>{formatearPrecio(p.total)}</Typography>
                </Fila>
              )}
            />
          </Paper>

          <Paper className="surface" elevation={0} sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>Consultas sin leer</Typography>
              <Button variant="ghost" onClick={() => navigate("/consultas")}>Ver todas</Button>
            </Box>
            <Lista
              filas={consultas.data?.data ?? []}
              vacio="Bandeja limpia."
              render={(c) => (
                <Fila key={c.id} onClick={() => navigate("/consultas")}>
                  <Typography variant="body2" fontWeight={600} sx={{ minWidth: 140 }}>{c.name}</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.message}</Typography>
                  <Typography variant="caption" color="text.secondary">{formatearFecha(c.createdAt)}</Typography>
                </Fila>
              )}
            />
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper className="surface" elevation={0} sx={{ p: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
              <WarningAmberOutlinedIcon fontSize="small" color="warning" />
              <Typography variant="subtitle1" fontWeight={700}>Última unidad</Typography>
            </Box>
            <Lista
              filas={ultimaUnidad}
              vacio="Ninguna pieza está por agotarse."
              render={(p) => (
                <Fila key={p.id} onClick={() => navigate(`/productos/${p.id}`)}>
                  <Typography variant="body2" fontWeight={600} sx={{ flex: 1 }}>{p.name}</Typography>
                  <StatusBadge status="1 en stock" tone="warning" showDot={false} />
                </Fila>
              )}
            />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const Lista = ({ filas, vacio, render }) =>
  filas.length === 0 ? (
    <Typography variant="body2" color="text.secondary">{vacio}</Typography>
  ) : (
    <Stack divider={<Divider />} spacing={1}>{filas.map(render)}</Stack>
  );

const Fila = ({ children, onClick }) => (
  <Box
    onClick={onClick}
    sx={{ display: "flex", alignItems: "center", gap: 2, py: 0.75, cursor: "pointer", borderRadius: 1, "&:hover": { bgcolor: "var(--bg-surface-hover)" } }}
  >
    {children}
  </Box>
);

export default Dashboard;
