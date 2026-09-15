/**
 * Mi perfil: datos de la cuenta, contraseña y sesiones.
 *
 * Cambiar el email o la contraseña pide la contraseña actual (lo exige la
 * API). Al cambiar la contraseña se cierran las demás sesiones: la vieja no
 * puede seguir abierta en otro dispositivo.
 */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";

import PageHeader from "../../../components/PageHeader/PageHeader";
import Button from "../../../components/Button/Button";
import InputField from "../../../components/Form/InputField/InputField";
import { useToast } from "../../../components/Toast/ToastContext";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/apiClient";
import { actualizarPerfil, cambiarPassword, cerrarOtrasSesiones } from "../api/petruApi";
import CampoPassword from "./CampoPassword";
import { AYUDA_PASSWORD } from "./reglas";

const iniciales = (nombre = "") => nombre.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

const Perfil = () => {
  const { user, actualizarUsuario } = useAuth();
  const { showToast } = useToast();

  const [datos, setDatos] = useState({ name: user?.name ?? "", email: user?.email ?? "", password: "" });
  const [clave, setClave] = useState({ password_actual: "", password: "", password_confirmation: "" });
  const [sesiones, setSesiones] = useState({ password: "" });
  const [errores, setErrores] = useState({});

  const cambiaEmail = datos.email.trim().toLowerCase() !== (user?.email ?? "").toLowerCase();
  const err = (c) => errores[c]?.[0];
  const set = (setter) => (campo) => (e) => {
    setter((f) => ({ ...f, [campo]: e.target.value }));
    if (errores[campo]) setErrores((er) => ({ ...er, [campo]: undefined }));
  };
  const alFallar = (e) => {
    if (e instanceof ApiError && e.status === 422) {
      setErrores(e.errors);
      showToast("Revisá los campos marcados", "warning");
    } else {
      showToast(e.message, "error");
    }
  };

  const guardarDatos = useMutation({
    mutationFn: () => actualizarPerfil({ name: datos.name, email: datos.email, password: cambiaEmail ? datos.password : undefined }),
    onSuccess: (u) => {
      actualizarUsuario(u);
      setDatos({ name: u.name, email: u.email, password: "" });
      setErrores({});
      showToast("Datos guardados", "success");
    },
    onError: alFallar,
  });

  const guardarClave = useMutation({
    mutationFn: () => cambiarPassword(clave),
    onSuccess: (r) => {
      setClave({ password_actual: "", password: "", password_confirmation: "" });
      setErrores({});
      showToast(r.message, "success");
    },
    onError: alFallar,
  });

  const cerrarSesiones = useMutation({
    mutationFn: () => cerrarOtrasSesiones(sesiones.password),
    onSuccess: (r) => { setSesiones({ password: "" }); setErrores({}); showToast(r.message, "success"); },
    onError: alFallar,
  });

  const setD = set(setDatos);
  const setC = set(setClave);

  return (
    <Box>
      <PageHeader title="Mi perfil" subtitle="Tu cuenta del panel." />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper className="surface" elevation={0} sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: "var(--accent)", fontWeight: 700 }}>{iniciales(user?.name)}</Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight={700}>{user?.name}</Typography>
                <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
                <Chip size="small" variant="outlined" label={user?.role ?? "Administrador"} sx={{ mt: 0.5 }} />
              </Box>
            </Box>

            <Box component="form" noValidate onSubmit={(e) => { e.preventDefault(); guardarDatos.mutate(); }} sx={{ display: "grid", gap: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>Datos</Typography>
              <InputField label="Nombre" value={datos.name} onChange={setD("name")} required error={!!err("name")} helperText={err("name")} autoComplete="name" />
              <InputField label="Email" type="email" value={datos.email} onChange={setD("email")} required error={!!err("email")} helperText={err("email") ?? "Es con el que ingresás al panel"} autoComplete="email" />
              {cambiaEmail && (
                <CampoPassword label="Tu contraseña actual" value={datos.password} onChange={setD("password")} error={err("password")} ayuda="Para cambiar el email hace falta confirmar que sos vos" autoComplete="current-password" />
              )}
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button variant="primary" type="submit" disabled={guardarDatos.isPending}>
                  {guardarDatos.isPending ? "Guardando…" : "Guardar datos"}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper className="surface" elevation={0} sx={{ p: 3, mb: 3 }}>
            <Box component="form" noValidate onSubmit={(e) => { e.preventDefault(); guardarClave.mutate(); }} sx={{ display: "grid", gap: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>Cambiar contraseña</Typography>
              <CampoPassword label="Contraseña actual" value={clave.password_actual} onChange={setC("password_actual")} error={err("password_actual")} autoComplete="current-password" />
              <CampoPassword label="Contraseña nueva" value={clave.password} onChange={setC("password")} error={err("password")} ayuda={AYUDA_PASSWORD} autoComplete="new-password" medidor />
              <CampoPassword label="Repetir la nueva" value={clave.password_confirmation} onChange={setC("password_confirmation")} error={err("password_confirmation")} autoComplete="new-password" />
              <Alert severity="info">Al cambiarla se cierran las sesiones abiertas en otros dispositivos; esta sigue.</Alert>
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button variant="primary" type="submit" disabled={guardarClave.isPending}>
                  {guardarClave.isPending ? "Cambiando…" : "Cambiar contraseña"}
                </Button>
              </Box>
            </Box>
          </Paper>

          <Paper className="surface" elevation={0} sx={{ p: 3 }}>
            <Box component="form" noValidate onSubmit={(e) => { e.preventDefault(); cerrarSesiones.mutate(); }} sx={{ display: "grid", gap: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>Otras sesiones</Typography>
              <Typography variant="body2" color="text.secondary">
                ¿Dejaste el panel abierto en otra computadora o en el celular? Cerrá todas las sesiones menos esta.
              </Typography>
              <CampoPassword label="Tu contraseña" value={sesiones.password} onChange={(e) => { setSesiones({ password: e.target.value }); if (errores.password) setErrores((er) => ({ ...er, password: undefined })); }} error={!cambiaEmail ? err("password") : undefined} autoComplete="current-password" />
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button variant="secondary" type="submit" disabled={cerrarSesiones.isPending || !sesiones.password}>
                  {cerrarSesiones.isPending ? "Cerrando…" : "Cerrar las otras sesiones"}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Perfil;
