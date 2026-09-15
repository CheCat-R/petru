/**
 * Integraciones → MercadoPago.
 *
 * Dos juegos de credenciales (prueba y producción) y un interruptor que dice
 * cuál usa el checkout. El flujo esperado: cargar las de prueba, "Probar
 * conexión", hacer una compra con tarjeta de prueba, y recién ahí cargar las
 * de producción y pasar el interruptor.
 *
 * Los secretos nunca vuelven completos de la API: se ven enmascarados y un
 * campo vacío al guardar conserva lo que ya estaba.
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
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Tooltip from "@mui/material/Tooltip";
import Divider from "@mui/material/Divider";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import PageHeader from "../../../components/PageHeader/PageHeader";
import Button from "../../../components/Button/Button";
import InputField from "../../../components/Form/InputField/InputField";
import { useToast } from "../../../components/Toast/ToastContext";
import { ApiError } from "../../../lib/apiClient";
import {
  borrarMercadoPago, claves, formatearFecha, guardarMercadoPago, limpiarErrorMercadoPago,
  obtenerMercadoPago, probarMercadoPago,
} from "../api/petruApi";

const VACIO = {
  modo: "test",
  test: { access_token: "", public_key: "" },
  produccion: { access_token: "", public_key: "", client_id: "", client_secret: "" },
  webhook_secret: "",
  descriptor: "",
};

const NIVEL = { error: "error", warning: "warning", info: "info" };

/** Campo de secreto: muestra la máscara del guardado como placeholder y permite ver lo tipeado. */
const Secreto = ({ label, value, onChange, guardado, error, ayuda }) => {
  const [ver, setVer] = useState(false);
  return (
    <InputField
      label={label}
      value={value}
      onChange={onChange}
      type={ver ? "text" : "password"}
      placeholder={guardado ? `Guardado: ${guardado}` : "Pegá la credencial acá"}
      error={!!error}
      helperText={error ?? (guardado && !value ? `${ayuda ? `${ayuda} · ` : ""}Vacío = se conserva el guardado` : ayuda)}
      autoComplete="off"
      slotProps={{
        input: {
          className: "mono",
          endAdornment: (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => setVer((v) => !v)} aria-label={ver ? "Ocultar" : "Mostrar"}>
                {ver ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
    />
  );
};

const ResultadoPrueba = ({ resultado }) => {
  if (!resultado) return null;
  return (
    <Alert severity={resultado.ok ? "success" : "error"} icon={resultado.ok ? <CheckCircleOutlineIcon /> : <ErrorOutlineIcon />} sx={{ mt: 2 }}>
      <AlertTitle>{resultado.ok ? "Conexión correcta" : "La prueba falló"}</AlertTitle>
      {resultado.mensaje}
      {resultado.cuenta?.email && (
        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
          Cuenta: {resultado.cuenta.nickname} · {resultado.cuenta.email} · {resultado.cuenta.siteId}
        </Typography>
      )}
      {resultado.en && <Typography variant="caption" display="block" color="text.secondary">Probado {formatearFecha(resultado.en)}</Typography>}
    </Alert>
  );
};

const MercadoPago = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const estado = useQuery({ queryKey: claves.mercadopago, queryFn: obtenerMercadoPago });

  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [pruebas, setPruebas] = useState({}); // resultado por modo, de esta sesión
  const [cargadoEn, setCargadoEn] = useState(null);

  // Modo y descriptor vienen de la API; los secretos arrancan vacíos siempre.
  if (estado.data && cargadoEn !== estado.dataUpdatedAt) {
    setCargadoEn(estado.dataUpdatedAt);
    setForm((f) => ({ ...f, modo: estado.data.mode, descriptor: estado.data.descriptor ?? "" }));
  }

  const set = (ruta, valor) => {
    setForm((f) => {
      const [a, b] = ruta.split(".");
      return b ? { ...f, [a]: { ...f[a], [b]: valor } } : { ...f, [a]: valor };
    });
    if (errores[ruta]) setErrores((e) => ({ ...e, [ruta]: undefined }));
  };
  const err = (ruta) => errores[ruta]?.[0];

  const refrescar = (data) => {
    queryClient.setQueryData(claves.mercadopago, data);
    queryClient.invalidateQueries({ queryKey: claves.novedades });
  };
  const alFallar = (e) => {
    if (e instanceof ApiError && e.status === 422) {
      setErrores(e.errors);
      showToast("Revisá los campos marcados", "warning");
    } else {
      showToast(e.message, "error");
    }
  };

  const guardar = useMutation({
    mutationFn: guardarMercadoPago,
    onSuccess: (data) => {
      refrescar(data);
      setForm((f) => ({ ...VACIO, modo: f.modo, descriptor: f.descriptor }));
      setErrores({});
      showToast(data.live ? "Guardado. El checkout cobra en serio desde ahora." : "Guardado", data.live ? "warning" : "success");
    },
    onError: alFallar,
  });

  const probar = useMutation({
    mutationFn: probarMercadoPago,
    onSuccess: ({ data, summary }, { modo }) => {
      setPruebas((p) => ({ ...p, [modo]: data }));
      refrescar(summary);
      showToast(data.ok ? "MercadoPago respondió bien" : "La prueba falló", data.ok ? "success" : "error");
    },
    onError: alFallar,
  });

  const borrar = useMutation({
    mutationFn: borrarMercadoPago,
    onSuccess: (data) => { refrescar(data); showToast("Credenciales borradas", "info"); },
    onError: alFallar,
  });

  const limpiar = useMutation({ mutationFn: limpiarErrorMercadoPago, onSuccess: refrescar, onError: alFallar });

  const copiar = async (texto) => {
    try {
      await navigator.clipboard.writeText(texto);
      showToast("Copiado", "success");
    } catch {
      showToast("No se pudo copiar; seleccionalo a mano", "warning");
    }
  };

  const d = estado.data;
  const pasaAProduccion = d && form.modo === "produccion" && d.mode !== "produccion";

  const bloqueCredenciales = (modo, etiqueta, juego, prefijo) => (
    <Paper className="surface" elevation={0} sx={{ p: 3, height: "100%" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
        <Typography variant="subtitle1" fontWeight={700}>{etiqueta}</Typography>
        <Chip size="small" label={juego.configured ? "Cargadas" : "Sin cargar"} color={juego.configured ? "success" : "default"} variant="outlined" />
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Empiezan con <span className="mono">{prefijo}</span>. Están en MercadoPago → Tus integraciones → tu aplicación → Credenciales de {modo === "test" ? "prueba" : "producción"}.
      </Typography>
      <Box sx={{ display: "grid", gap: 2 }}>
        <Secreto label="Access token" value={form[modo].access_token} onChange={(e) => set(`${modo}.access_token`, e.target.value)} guardado={juego.accessToken} error={err(`${modo}.access_token`)} />
        <Secreto label="Public key" value={form[modo].public_key} onChange={(e) => set(`${modo}.public_key`, e.target.value)} guardado={juego.publicKey} error={err(`${modo}.public_key`)} ayuda="Opcional por ahora (Checkout Pro no la usa)" />
        {modo === "produccion" && (
          <>
            <Divider sx={{ my: 0.5 }}>
              <Typography variant="caption" color="text.secondary">Opcionales · OAuth, no los usa el checkout</Typography>
            </Divider>
            <InputField label="Client ID" value={form.produccion.client_id} onChange={(e) => set("produccion.client_id", e.target.value)} placeholder={juego.clientId ? `Guardado: ${juego.clientId}` : "Número"} error={!!err("produccion.client_id")} helperText={err("produccion.client_id") ?? (juego.clientId ? "Vacío = se conserva el guardado" : undefined)} autoComplete="off" slotProps={{ input: { className: "mono" } }} />
            <Secreto label="Client Secret" value={form.produccion.client_secret} onChange={(e) => set("produccion.client_secret", e.target.value)} guardado={juego.clientSecret} error={err("produccion.client_secret")} />
          </>
        )}
      </Box>
      <Box sx={{ display: "flex", gap: 1, mt: 2, flexWrap: "wrap" }}>
        <Button
          variant="secondary"
          disabled={probar.isPending || (!form[modo].access_token && !juego.configured)}
          onClick={() => probar.mutate({ modo, access_token: form[modo].access_token || undefined, public_key: form[modo].public_key || undefined })}
        >
          {probar.isPending && probar.variables?.modo === modo ? "Probando…" : "Probar conexión"}
        </Button>
        {juego.configured && (
          <Button variant="ghost" startIcon={<DeleteOutlinedIcon />} disabled={borrar.isPending} onClick={() => borrar.mutate(modo)}>
            Borrar guardadas
          </Button>
        )}
      </Box>
      <ResultadoPrueba resultado={pruebas[modo] ?? (d.status.lastTest?.modo === modo ? d.status.lastTest : null)} />
    </Paper>
  );

  return (
    <Box>
      <PageHeader
        title="MercadoPago"
        subtitle="Credenciales del cobro online. Primero probá con las de prueba; cuando una compra de prueba salga bien, pasá a producción."
        actions={
          <Button variant="secondary" startIcon={<OpenInNewIcon />} onClick={() => window.open("https://www.mercadopago.com.ar/developers/panel/app", "_blank", "noopener")}>
            Panel de MercadoPago
          </Button>
        }
      />

      {estado.isError && <Alert severity="error" sx={{ mb: 3 }}>No pudimos leer la configuración. {estado.error.message}</Alert>}

      {d && (
        <Box component="form" noValidate onSubmit={(e) => { e.preventDefault(); guardar.mutate(form); }}>
          {/* Estado y alertas */}
          <Paper className="surface" elevation={0} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", mb: d.alerts.length ? 2 : 0 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mr: 1 }}>Estado</Typography>
              <Chip size="small" label={`Pasarela: ${d.gateway}`} color={d.live ? "success" : d.gateway === "Simulada" ? "default" : "warning"} />
              {d.status.lastWebhookAt && <Chip size="small" variant="outlined" label={`Último webhook ${formatearFecha(d.status.lastWebhookAt)}`} />}
              {d.status.lastTest && (
                <Chip size="small" variant="outlined" color={d.status.lastTest.ok ? "success" : "error"} label={`Última prueba (${d.status.lastTest.modo}): ${d.status.lastTest.ok ? "OK" : "falló"}`} />
              )}
            </Box>
            {d.alerts.map((a) => (
              <Alert
                key={a.key}
                severity={NIVEL[a.level] ?? "info"}
                sx={{ mb: 1 }}
                action={a.key.startsWith("mp-error-") ? <Button variant="ghost" onClick={() => limpiar.mutate()}>Marcar resuelto</Button> : null}
              >
                {a.message}
              </Alert>
            ))}
          </Paper>

          {/* Modo */}
          <Paper className="surface" elevation={0} sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700}>Qué credenciales usa el checkout</Typography>
            <RadioGroup row value={form.modo} onChange={(e) => set("modo", e.target.value)} sx={{ mt: 1 }}>
              <FormControlLabel value="test" control={<Radio />} label="Prueba (los pagos no son reales)" />
              <FormControlLabel value="produccion" control={<Radio />} label="Producción (cobra de verdad)" disabled={!d.production.configured && !form.produccion.access_token} />
            </RadioGroup>
            {pasaAProduccion && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Al guardar, el sitio empieza a cobrar con la cuenta real. Asegurate de haber hecho una compra completa en modo prueba antes.
              </Alert>
            )}
          </Paper>

          {/* Credenciales */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, lg: 6 }}>{bloqueCredenciales("test", "Credenciales de prueba", d.test, "TEST-")}</Grid>
            <Grid size={{ xs: 12, lg: 6 }}>{bloqueCredenciales("produccion", "Credenciales de producción", d.production, "APP_USR-")}</Grid>
          </Grid>

          {/* Webhook y descriptor */}
          <Paper className="surface" elevation={0} sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700}>Notificaciones (webhook)</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Así MercadoPago avisa cuando un pago se acredita, aunque el cliente cierre la pestaña. En MercadoPago → tu aplicación → Webhooks,
              cargá esta URL para el evento <strong>Pagos</strong> y pegá acá la clave secreta que te da. Tiene que ser una dirección pública: en localhost no llega.
            </Typography>
            <InputField
              label="URL del webhook"
              value={d.webhookUrl}
              slotProps={{
                input: {
                  readOnly: true,
                  className: "mono",
                  endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="Copiar">
                        <IconButton size="small" onClick={() => copiar(d.webhookUrl)}><ContentCopyOutlinedIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Box sx={{ mt: 2, display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "2fr 1fr" } }}>
              <Secreto label="Clave secreta del webhook" value={form.webhook_secret} onChange={(e) => set("webhook_secret", e.target.value)} guardado={d.webhookSecret} error={err("webhook_secret")} ayuda="Con ella se verifica que el aviso venga de MercadoPago" />
              <InputField
                label="Descriptor en la tarjeta"
                value={form.descriptor}
                onChange={(e) => set("descriptor", e.target.value)}
                error={!!err("descriptor")}
                helperText={err("descriptor") ?? "Lo que ve el cliente en el resumen. Máx. 22 caracteres."}
                slotProps={{ htmlInput: { maxLength: 22 } }}
              />
            </Box>
            {d.webhookConfigured && (
              <Button variant="ghost" startIcon={<DeleteOutlinedIcon />} sx={{ mt: 1 }} disabled={borrar.isPending} onClick={() => borrar.mutate("webhook")}>
                Borrar clave guardada
              </Button>
            )}
          </Paper>

          <Divider sx={{ mb: 3 }} />
          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Button variant={pasaAProduccion ? "danger-solid" : "primary"} type="submit" disabled={guardar.isPending}>
              {guardar.isPending ? "Guardando…" : pasaAProduccion ? "Guardar y pasar a producción" : "Guardar"}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default MercadoPago;
