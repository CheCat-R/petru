/**
 * Integraciones → Envíos.
 *
 * Lo que cobra el checkout por llevar la pieza: retiro en el taller, zonas de
 * cobertura con su tarifa (la que se cobra si Andreani no está o no responde),
 * el bulto que se asume cuando una pieza no tiene medidas, y las credenciales
 * de Andreani para cotizar en vivo.
 *
 * Todo se guarda junto con un solo "Guardar": las zonas se validan entre sí
 * (un código postal no puede estar en dos).
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Chip from "@mui/material/Chip";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import InputAdornment from "@mui/material/InputAdornment";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlineOutlinedIcon from "@mui/icons-material/ErrorOutlineOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import PageHeader from "../../../components/PageHeader/PageHeader";
import Button from "../../../components/Button/Button";
import InputField from "../../../components/Form/InputField/InputField";
import { useToast } from "../../../components/Toast/ToastContext";
import { ApiError } from "../../../lib/apiClient";
import {
  borrarAndreani, claves, formatearFecha, formatearPrecio, guardarEnvios, limpiarErrorEnvios, obtenerEnvios, probarAndreani,
} from "../api/petruApi";
import { escribir, leer } from "../sitio/rutas";

/** La API devuelve camelCase; el formulario usa las claves que la API espera al guardar. */
const desdeApi = (d) => ({
  retiro: { ...d.pickup },
  zonas: d.zones.map((z) => ({ ...z, cps: z.codigos_postales.join(" ") })),
  transportista_por_defecto: d.defaultCarrier,
  bulto_por_defecto: { ...d.defaultPackage },
  andreani: { usuario: d.andreani.usuario ?? "", password: "", cliente: d.andreani.cliente ?? "", contrato: d.andreani.contrato ?? "", cp_origen: d.andreani.cp_origen ?? "2000" },
});

/** "2000, 2132 2134" → ["2000","2132","2134"] */
const parsearCps = (texto) => (texto.match(/\d{4}/g) ?? []);

const haciaApi = (f) => ({
  ...f,
  zonas: f.zonas.map(({ cps, ...z }) => ({ nombre: z.nombre, codigos_postales: parsearCps(cps), costo: Number(z.costo), plazo: z.plazo ?? "" })),
});

const ZONA_VACIA = { nombre: "", cps: "", costo: "", plazo: "" };

const Envios = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const estado = useQuery({ queryKey: claves.envios, queryFn: obtenerEnvios });

  const [form, setForm] = useState(null);
  const [cargadoEn, setCargadoEn] = useState(null);
  const [errores, setErrores] = useState({});
  const [verPass, setVerPass] = useState(false);
  const [prueba, setPrueba] = useState(null);

  if (estado.data && cargadoEn !== estado.dataUpdatedAt) {
    setCargadoEn(estado.dataUpdatedAt);
    setForm(desdeApi(estado.data));
    setErrores({});
  }

  const set = (ruta, valor) => {
    setForm((f) => escribir(f, ruta, valor));
    if (errores[ruta]) setErrores((e) => ({ ...e, [ruta]: undefined }));
  };
  const err = (ruta) => errores[ruta]?.[0];
  const campo = (ruta, props = {}) => ({
    value: leer(form, ruta) ?? "",
    onChange: (e) => set(ruta, e.target.value),
    error: !!err(ruta),
    helperText: err(ruta) ?? props.ayuda,
    ...props,
    ayuda: undefined,
  });

  const refrescar = (data) => {
    queryClient.setQueryData(claves.envios, data);
    queryClient.invalidateQueries({ queryKey: claves.novedades });
  };
  const alFallar = (e) => {
    if (e instanceof ApiError && e.status === 422) {
      // Laravel devuelve "zonas.0.codigos_postales.1"; el campo del formulario es "zonas.0.cps".
      const mapeados = Object.fromEntries(Object.entries(e.errors).map(([k, v]) => [k.replace(/\.codigos_postales(\.\d+)?$/, ".cps"), v]));
      setErrores(mapeados);
      showToast(mapeados.zonas?.[0] ?? "Revisá los campos marcados", "warning");
    } else {
      showToast(e.message, "error");
    }
  };

  const guardar = useMutation({
    mutationFn: () => guardarEnvios(haciaApi(form)),
    onSuccess: (data) => { refrescar(data); showToast("Envíos guardados. Ya rige en el checkout.", "success"); },
    onError: alFallar,
  });

  const probar = useMutation({
    mutationFn: () => probarAndreani({ ...form.andreani, password: form.andreani.password || undefined }),
    onSuccess: ({ data, summary }) => { setPrueba(data); refrescar(summary); showToast(data.ok ? "Andreani respondió" : "La prueba falló", data.ok ? "success" : "error"); },
    onError: alFallar,
  });

  const borrar = useMutation({
    mutationFn: borrarAndreani,
    onSuccess: (data) => { refrescar(data); setPrueba(null); showToast("Credenciales de Andreani borradas", "info"); },
    onError: alFallar,
  });

  const limpiar = useMutation({ mutationFn: limpiarErrorEnvios, onSuccess: refrescar, onError: alFallar });

  const d = estado.data;
  const sinCambios = form && d && JSON.stringify(form) === JSON.stringify(desdeApi(d));
  const resultadoPrueba = prueba ?? d?.status.lastTest;

  return (
    <Box>
      <PageHeader title="Envíos" subtitle="Qué se cobra por llevar la pieza, y a dónde." />

      {estado.isError && <Alert severity="error" sx={{ mb: 3 }}>No pudimos leer la configuración. {estado.error.message}</Alert>}

      {form && d && (
        <Box component="form" noValidate onSubmit={(e) => { e.preventDefault(); guardar.mutate(); }}>
          {/* Estado */}
          <Paper className="surface" elevation={0} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", mb: d.alerts.length ? 2 : 0 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mr: 1 }}>Estado</Typography>
              <Chip size="small" label={`Cotiza: ${d.quoteSource}`} color={d.andreani.configured ? "success" : "default"} />
              <Chip size="small" variant="outlined" label={`${d.zones.length} zona${d.zones.length === 1 ? "" : "s"} · ${d.zones.reduce((n, z) => n + z.codigos_postales.length, 0)} códigos postales`} />
            </Box>
            {d.alerts.map((a) => (
              <Alert key={a.key} severity={a.level} sx={{ mb: 1 }} action={a.key.startsWith("andreani-error-") ? <Button variant="ghost" onClick={() => limpiar.mutate()}>Marcar resuelto</Button> : null}>
                {a.message}
              </Alert>
            ))}
          </Paper>

          {/* Retiro */}
          <Paper className="surface" elevation={0} sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700}>Retiro en el taller</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Siempre es gratis. Se ofrece en todas las zonas.</Typography>
            <Grid container spacing={2}>
              <Grid size={12}>
                <FormControlLabel control={<Switch checked={!!form.retiro.habilitado} onChange={(e) => set("retiro.habilitado", e.target.checked)} />} label="Ofrecer retiro en el taller" />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}><InputField label="Nombre" {...campo("retiro.nombre")} /></Grid>
              <Grid size={{ xs: 12, sm: 5 }}><InputField label="Detalle" {...campo("retiro.detalle", { ayuda: "Ej. Rosario, con cita previa por WhatsApp" })} /></Grid>
              <Grid size={{ xs: 12, sm: 3 }}><InputField label="Plazo" {...campo("retiro.plazo", { ayuda: "Ej. A coordinar" })} /></Grid>
            </Grid>
          </Paper>

          {/* Zonas */}
          <Paper className="surface" elevation={0} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 2 }}>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>Zonas de cobertura y tarifa</Typography>
                <Typography variant="body2" color="text.secondary">
                  Un código postal fuera de estas zonas no puede comprar con envío. El costo es lo que se cobra cuando no hay Andreani o no responde:
                  aunque cotices en vivo, tiene que estar cargado.
                </Typography>
              </Box>
              <Button variant="secondary" startIcon={<AddOutlinedIcon />} onClick={() => set("zonas", [...form.zonas, { ...ZONA_VACIA }])}>Agregar zona</Button>
            </Box>
            {err("zonas") && <Alert severity="error" sx={{ mb: 2 }}>{err("zonas")}</Alert>}
            <Box sx={{ display: "grid", gap: 2 }}>
              {form.zonas.map((z, i) => (
                <Box key={i} sx={{ p: 2, borderRadius: 2, border: "1px solid var(--border-default)" }}>
                  <Grid container spacing={2} alignItems="flex-start">
                    <Grid size={{ xs: 12, md: 3 }}><InputField label="Zona" {...campo(`zonas.${i}.nombre`, { ayuda: "Ej. Rosario" })} /></Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <InputField label="Códigos postales" {...campo(`zonas.${i}.cps`, { ayuda: `${parsearCps(z.cps).length} cargados · separados por espacio o coma` })} multiline minRows={1} slotProps={{ input: { className: "mono" } }} />
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                      <InputField label="Costo" type="number" {...campo(`zonas.${i}.costo`)} slotProps={{ input: { startAdornment: <InputAdornment position="start">$</InputAdornment> }, htmlInput: { min: 0, step: 50 } }} />
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}><InputField label="Plazo" {...campo(`zonas.${i}.plazo`, { ayuda: "Ej. 24 a 48 hs hábiles" })} /></Grid>
                    <Grid size={{ xs: 12, md: 1 }} sx={{ display: "flex", justifyContent: "flex-end" }}>
                      <Tooltip title={form.zonas.length <= 1 ? "Tiene que quedar al menos una zona" : "Quitar zona"}>
                        <span>
                          <IconButton size="small" disabled={form.zonas.length <= 1} onClick={() => set("zonas", form.zonas.filter((_, j) => j !== i))} aria-label="Quitar zona"><DeleteOutlinedIcon fontSize="small" /></IconButton>
                        </span>
                      </Tooltip>
                    </Grid>
                  </Grid>
                </Box>
              ))}
            </Box>
            <Box sx={{ mt: 2 }}>
              <InputField label="Transportista que se informa al despachar" {...campo("transportista_por_defecto", { ayuda: "Cuando la cotización fue de tabla. Ej. Andreani, Correo Argentino" })} sx={{ maxWidth: 420 }} />
            </Box>
          </Paper>

          {/* Bulto por defecto */}
          <Paper className="surface" elevation={0} sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700}>Bulto por defecto</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Lo que se asume para cotizar en Andreani cuando una pieza no tiene medidas cargadas. Conviene que sea generoso: cotizar de más molesta, de menos cuesta plata.
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}><InputField label="Peso (kg)" type="number" {...campo("bulto_por_defecto.peso_kg")} slotProps={{ htmlInput: { min: 0.1, step: 0.1 } }} /></Grid>
              <Grid size={{ xs: 6, sm: 3 }}><InputField label="Alto (cm)" type="number" {...campo("bulto_por_defecto.alto_cm")} slotProps={{ htmlInput: { min: 1, step: 1 } }} /></Grid>
              <Grid size={{ xs: 6, sm: 3 }}><InputField label="Ancho (cm)" type="number" {...campo("bulto_por_defecto.ancho_cm")} slotProps={{ htmlInput: { min: 1, step: 1 } }} /></Grid>
              <Grid size={{ xs: 6, sm: 3 }}><InputField label="Largo (cm)" type="number" {...campo("bulto_por_defecto.largo_cm")} slotProps={{ htmlInput: { min: 1, step: 1 } }} /></Grid>
            </Grid>
          </Paper>

          {/* Andreani */}
          <Paper className="surface" elevation={0} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
              <Typography variant="subtitle1" fontWeight={700}>Andreani (cotización en vivo)</Typography>
              <Chip size="small" label={d.andreani.configured ? "Configurado" : "Sin configurar"} color={d.andreani.configured ? "success" : "default"} variant="outlined" />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Con estos datos el checkout cotiza cada envío con Andreani según peso y medidas. Los da Andreani al firmar el contrato de e-commerce; la contraseña es la de la API, no la del portal.
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}><InputField label="Usuario" {...campo("andreani.usuario")} autoComplete="off" /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InputField
                  label="Contraseña"
                  type={verPass ? "text" : "password"}
                  {...campo("andreani.password", { ayuda: d.andreani.password ? `Guardada: ${d.andreani.password} · vacío = se conserva` : undefined })}
                  autoComplete="off"
                  slotProps={{ input: { endAdornment: <InputAdornment position="end"><IconButton size="small" onClick={() => setVerPass((v) => !v)}>{verPass ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}</IconButton></InputAdornment> } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}><InputField label="Nº de cliente" {...campo("andreani.cliente")} slotProps={{ input: { className: "mono" } }} /></Grid>
              <Grid size={{ xs: 12, sm: 4 }}><InputField label="Nº de contrato" {...campo("andreani.contrato")} slotProps={{ input: { className: "mono" } }} /></Grid>
              <Grid size={{ xs: 12, sm: 4 }}><InputField label="CP de origen" {...campo("andreani.cp_origen", { ayuda: "Desde dónde sale el paquete" })} slotProps={{ input: { className: "mono" } }} /></Grid>
            </Grid>
            <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
              <Button variant="secondary" disabled={probar.isPending} onClick={() => probar.mutate()}>{probar.isPending ? "Probando…" : "Probar conexión"}</Button>
              {d.andreani.configured && <Button variant="ghost" startIcon={<DeleteOutlinedIcon />} disabled={borrar.isPending} onClick={() => borrar.mutate()}>Borrar credenciales</Button>}
            </Box>
            {resultadoPrueba && (
              <Alert severity={resultadoPrueba.ok ? "success" : "error"} icon={resultadoPrueba.ok ? <CheckCircleOutlinedIcon /> : <ErrorOutlineOutlinedIcon />} sx={{ mt: 2 }}>
                <AlertTitle>{resultadoPrueba.ok ? "Andreani responde" : "La prueba falló"}</AlertTitle>
                {resultadoPrueba.mensaje}
                {resultadoPrueba.cotizacion && <Typography variant="caption" display="block">Cotización de prueba: {formatearPrecio(resultadoPrueba.cotizacion.costo)}</Typography>}
                {resultadoPrueba.en && <Typography variant="caption" display="block" color="text.secondary">Probado {formatearFecha(resultadoPrueba.en)}</Typography>}
              </Alert>
            )}
          </Paper>

          <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
            <Button variant="primary" type="submit" disabled={guardar.isPending || sinCambios}>
              {guardar.isPending ? "Guardando…" : "Guardar"}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Envios;
