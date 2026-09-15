/**
 * Estadísticas del sitio: cuánta gente entra, de dónde, qué mira y cuánto de
 * eso termina en venta. Analítica propia (sin cookies, sin Google): los datos
 * los manda el sitio a la API y viven en nuestra base.
 */
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import PaidOutlinedIcon from "@mui/icons-material/PaidOutlined";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";

import PageHeader from "../../../components/PageHeader/PageHeader";
import StatCard from "../../../components/Cards/StatCard/StatCard";
import { claves, formatearPrecio, obtenerEstadisticas } from "../api/petruApi";
import { Barras, Embudo, Serie } from "./graficos";

const PERIODOS = [[7, "7 días"], [30, "30 días"], [90, "90 días"], [365, "12 meses"]];

const FUENTES = {
  instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok", whatsapp: "WhatsApp", google: "Google",
  youtube: "YouTube", pinterest: "Pinterest", x: "X (Twitter)", mercadolibre: "MercadoLibre / Pago", bing: "Bing",
  directo: "Directo (escribió la dirección o guardado)", campaña: "Campaña (UTM)", email: "Email", otro: "Otros sitios",
};
const DISPOSITIVOS = { movil: "Celular", tablet: "Tablet", escritorio: "Computadora" };
const PAGINAS = { "/": "Inicio", "/galeria": "Galería", "/nosotros": "Nosotros", "/contacto": "Contacto", "/carrito": "Carrito", "/checkout": "Checkout", "/envios": "Envíos", "/cuidados": "Cuidados", "/devoluciones": "Devoluciones", "/privacidad": "Privacidad", "/terminos": "Términos", "/arrepentimiento": "Arrepentimiento", "/pedido/*": "Seguimiento de pedido" };

const SITIO = import.meta.env.VITE_SITIO_URL ?? "http://localhost:5173";
const absoluta = (url) => (url?.startsWith("http") ? url : `${SITIO}${url}`);
const n = (v) => Number(v ?? 0).toLocaleString("es-AR");

/** Variación contra el período anterior, para las tarjetas. */
const delta = (actual, anterior, mejorAlto = true) => {
  if (!anterior) return null;
  const pct = Math.round(((actual - anterior) / anterior) * 100);
  if (pct === 0) return null;
  return { value: `${Math.abs(pct)}%`, direction: pct > 0 ? "up" : "down", good: mejorAlto ? pct > 0 : pct < 0 };
};

const Tarjeta = ({ titulo, children, sx }) => (
  <Paper className="surface" elevation={0} sx={{ p: 3, height: "100%", ...sx }}>
    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>{titulo}</Typography>
    {children}
  </Paper>
);

const Estadisticas = () => {
  const [dias, setDias] = useState(30);
  const stats = useQuery({ queryKey: claves.estadisticas(dias), queryFn: () => obtenerEstadisticas(dias), placeholderData: (prev) => prev });
  const d = stats.data;
  const s = d?.summary;
  const p = d?.previous;

  return (
    <Box>
      <PageHeader
        title="Estadísticas"
        subtitle="Quién entra al sitio, desde dónde y qué hace. Sin cookies ni datos personales."
        actions={
          <ToggleButtonGroup size="small" exclusive value={dias} onChange={(_, v) => v && setDias(v)}>
            {PERIODOS.map(([v, label]) => <ToggleButton key={v} value={v}>{label}</ToggleButton>)}
          </ToggleButtonGroup>
        }
      />

      {stats.isError && <Alert severity="error" sx={{ mb: 3 }}>No pudimos cargar las estadísticas. {stats.error.message}</Alert>}
      {d && !d.hasData && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Todavía no hay visitas registradas. El sitio empieza a contar apenas alguien entra; volvé en un rato.
        </Alert>
      )}

      {s && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, lg: 2 }}><StatCard title="Visitantes" value={n(s.visitors)} icon={<PeopleAltOutlinedIcon fontSize="small" />} delta={delta(s.visitors, p.visitors)} hint="personas distintas" /></Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 2 }}><StatCard title="Páginas vistas" value={n(s.pageviews)} icon={<VisibilityOutlinedIcon fontSize="small" />} delta={delta(s.pageviews, p.pageviews)} hint={s.visitors ? `${(s.pageviews / s.visitors).toFixed(1)} por visitante` : ""} /></Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 2 }}><StatCard title="Miraron una pieza" value={n(s.productViewers)} icon={<Inventory2OutlinedIcon fontSize="small" />} delta={delta(s.productViewers, p.productViewers)} hint={`${n(s.productViews)} vistas de piezas`} /></Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 2 }}><StatCard title="Pedidos pagados" value={n(s.orders)} icon={<ShoppingBagOutlinedIcon fontSize="small" />} delta={delta(s.orders, p.orders)} hint={s.orders ? `ticket promedio ${formatearPrecio(s.averageOrder)}` : ""} /></Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 2 }}><StatCard title="Ingresos" value={formatearPrecio(s.revenue)} icon={<PaidOutlinedIcon fontSize="small" />} delta={delta(s.revenue, p.revenue)} hint="pedidos pagados" /></Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 2 }}><StatCard title="Conversión" value={`${s.conversion}%`} icon={<PercentOutlinedIcon fontSize="small" />} delta={delta(s.conversion, p.conversion)} hint="visitantes que compran" /></Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, lg: 8 }}>
              <Tarjeta titulo="Visitas por día">
                <Serie
                  puntos={d.series}
                  lineas={[{ clave: "visitors", nombre: "Visitantes", color: "var(--accent)" }, { clave: "productViews", nombre: "Vistas de piezas", color: "#d97706" }]}
                  formato={n}
                />
              </Tarjeta>
            </Grid>
            <Grid size={{ xs: 12, lg: 4 }}>
              <Tarjeta titulo="Del ingreso a la compra">
                <Embudo pasos={d.funnel} />
              </Tarjeta>
            </Grid>

            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <Tarjeta titulo="De dónde vienen">
                <Barras
                  filas={d.sources.map((f) => ({ etiqueta: FUENTES[f.source] ?? f.source, valor: f.visitors, extra: f.orders ? `${f.orders} pedido${f.orders === 1 ? "" : "s"}` : null }))}
                  formato={n}
                />
              </Tarjeta>
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <Tarjeta titulo="Sitios que enlazan">
                <Barras filas={d.referrers.map((r) => ({ etiqueta: r.host, valor: r.visitors }))} formato={n} vacio="Nadie llegó desde otro sitio todavía. Los de redes sociales aparecen acá cuando la app manda el origen." />
              </Tarjeta>
            </Grid>
            <Grid size={{ xs: 12, md: 6, lg: 4 }}>
              <Tarjeta titulo="Dispositivos">
                <Barras filas={d.devices.map((x) => ({ etiqueta: DISPOSITIVOS[x.device] ?? x.device, valor: x.visitors }))} formato={n} />
              </Tarjeta>
              {d.campaigns.length > 0 && (
                <Paper className="surface" elevation={0} sx={{ p: 3, mt: 3 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>Campañas (UTM)</Typography>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>Links con ?utm_campaign=… en los posteos o anuncios.</Typography>
                  <Barras filas={d.campaigns.map((c) => ({ etiqueta: `${c.campaign} · ${c.source}`, valor: c.visitors, extra: c.orders ? `${c.orders} pedidos` : null }))} formato={n} />
                </Paper>
              )}
            </Grid>

            <Grid size={{ xs: 12, lg: 7 }}>
              <Tarjeta titulo="Piezas más vistas" sx={{ p: 0, pt: 3 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Pieza</TableCell>
                      <TableCell align="right">Vistas</TableCell>
                      <TableCell align="right">Personas</TableCell>
                      <TableCell align="right">Al carrito</TableCell>
                      <TableCell align="right">Vendidas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {d.products.length === 0 && <TableRow><TableCell colSpan={5}><Typography variant="body2" color="text.secondary">Nadie miró una pieza en este período.</Typography></TableCell></TableRow>}
                    {d.products.map((pr) => (
                      <TableRow key={pr.id} hover>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar variant="rounded" src={pr.imageUrl ? absoluta(pr.imageUrl) : undefined} sx={{ width: 32, height: 32, bgcolor: "var(--bg-sunken)", color: "var(--text-secondary)", fontSize: 13 }}>{pr.name[0]}</Avatar>
                            <Typography variant="body2" fontWeight={600}>{pr.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell align="right">{n(pr.views)}</TableCell>
                        <TableCell align="right">{n(pr.viewers)}</TableCell>
                        <TableCell align="right">{n(pr.addToCart)}</TableCell>
                        <TableCell align="right"><strong>{n(pr.sold)}</strong></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Tarjeta>
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <Tarjeta titulo="Páginas más vistas">
                <Barras filas={d.pages.map((pg) => ({ etiqueta: PAGINAS[pg.path] ?? (pg.path.startsWith("/producto/") ? `Pieza: ${pg.path.slice(10)}` : pg.path), valor: pg.views, extra: `${n(pg.visitors)} personas` }))} formato={n} />
              </Tarjeta>
            </Grid>
          </Grid>

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 3 }}>
            "Visitantes" cuenta personas distintas por día (un hash que cambia cada día, sin cookie): la misma persona en dos días cuenta dos. Las compras se atribuyen a la fuente por la que entró en esa visita.
            Comparación contra los {dias} días anteriores.
          </Typography>
        </>
      )}
    </Box>
  );
};

export default Estadisticas;
