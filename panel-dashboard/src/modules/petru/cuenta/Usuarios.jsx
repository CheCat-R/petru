/**
 * Cuentas del panel. Todas administran (un solo rol), así que esto es una
 * lista con alta, edición, nueva contraseña y baja. Nadie se borra a sí
 * mismo y siempre queda al menos una cuenta: lo garantiza la API.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Alert from "@mui/material/Alert";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

import PageHeader from "../../../components/PageHeader/PageHeader";
import Button from "../../../components/Button/Button";
import InputField from "../../../components/Form/InputField/InputField";
import { useToast } from "../../../components/Toast/ToastContext";
import { useAuth } from "../../../context/AuthContext";
import { ApiError } from "../../../lib/apiClient";
import {
  actualizarUsuario, claves, crearUsuario, eliminarUsuario, listarUsuarios, restablecerPasswordUsuario,
} from "../api/petruApi";
import CampoPassword from "./CampoPassword";
import { AYUDA_PASSWORD } from "./reglas";

const iniciales = (nombre = "") => nombre.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

/** Un diálogo para las tres operaciones con formulario: crear, editar, nueva contraseña. */
const DialogoUsuario = ({ modo, usuario, onCerrar, onGuardar, pendiente, errores, limpiarError }) => {
  const [form, setForm] = useState({ name: usuario?.name ?? "", email: usuario?.email ?? "", password: "", password_confirmation: "" });
  const set = (campo) => (e) => { setForm((f) => ({ ...f, [campo]: e.target.value })); limpiarError(campo); };
  const err = (c) => errores[c]?.[0];

  const titulo = { crear: "Nueva cuenta", editar: `Editar a ${usuario?.name}`, password: `Nueva contraseña para ${usuario?.name}` }[modo];
  const conDatos = modo !== "password";
  const conPassword = modo !== "editar";

  return (
    <Dialog open onClose={pendiente ? undefined : onCerrar} maxWidth="xs" fullWidth>
      <Box component="form" noValidate onSubmit={(e) => { e.preventDefault(); onGuardar(form); }}>
        <DialogTitle>{titulo}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: "8px !important" }}>
          {conDatos && (
            <>
              <InputField label="Nombre" value={form.name} onChange={set("name")} required error={!!err("name")} helperText={err("name")} autoFocus />
              <InputField label="Email" type="email" value={form.email} onChange={set("email")} required error={!!err("email")} helperText={err("email") ?? "Con este email ingresa al panel"} />
            </>
          )}
          {conPassword && (
            <>
              <CampoPassword label={modo === "crear" ? "Contraseña" : "Contraseña nueva"} value={form.password} onChange={set("password")} error={err("password")} ayuda={AYUDA_PASSWORD} autoComplete="new-password" medidor autoFocus={modo === "password"} />
              <CampoPassword label="Repetir contraseña" value={form.password_confirmation} onChange={set("password_confirmation")} error={err("password_confirmation")} autoComplete="new-password" />
              {modo === "password" && <Alert severity="info">Pasásela en persona o por un canal seguro. Después conviene que la cambie desde su perfil.</Alert>}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button variant="ghost" onClick={onCerrar} disabled={pendiente}>Cancelar</Button>
          <Button variant="primary" type="submit" disabled={pendiente}>{pendiente ? "Guardando…" : "Guardar"}</Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

const Usuarios = () => {
  const { user: yo } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const usuarios = useQuery({ queryKey: claves.usuarios, queryFn: listarUsuarios });

  const [dialogo, setDialogo] = useState(null); // { modo, usuario }
  const [aEliminar, setAEliminar] = useState(null);
  const [errores, setErrores] = useState({});
  const limpiarError = (campo) => { if (errores[campo]) setErrores((e) => ({ ...e, [campo]: undefined })); };

  const invalidar = () => queryClient.invalidateQueries({ queryKey: claves.usuarios });
  const cerrar = () => { setDialogo(null); setErrores({}); };
  const alFallar = (e) => {
    if (e instanceof ApiError && e.status === 422) {
      setErrores(e.errors);
      showToast("Revisá los campos marcados", "warning");
    } else {
      showToast(e.message, "error");
    }
  };

  const guardar = useMutation({
    mutationFn: ({ modo, usuario, form }) => {
      if (modo === "crear") return crearUsuario(form);
      if (modo === "editar") return actualizarUsuario(usuario.id, { name: form.name, email: form.email });
      return restablecerPasswordUsuario(usuario.id, { password: form.password, password_confirmation: form.password_confirmation });
    },
    onSuccess: (r, { modo }) => {
      invalidar();
      cerrar();
      showToast(modo === "crear" ? "Cuenta creada" : modo === "editar" ? "Cuenta actualizada" : r.message, "success");
    },
    onError: alFallar,
  });

  const eliminar = useMutation({
    mutationFn: (u) => eliminarUsuario(u.id),
    onSuccess: (r) => { invalidar(); setAEliminar(null); showToast(r.message, "info"); },
    onError: (e) => { setAEliminar(null); showToast(e.message, "error"); },
  });

  const lista = usuarios.data ?? [];

  return (
    <Box>
      <PageHeader
        title="Usuarios del panel"
        subtitle="Quiénes pueden entrar. Todas las cuentas administran todo."
        actions={
          <Button variant="primary" startIcon={<PersonAddAltOutlinedIcon />} onClick={() => setDialogo({ modo: "crear" })}>
            Nueva cuenta
          </Button>
        }
      />

      <Paper className="surface" elevation={0}>
        {usuarios.isError && <Alert severity="error" sx={{ m: 2 }}>No pudimos cargar las cuentas. {usuarios.error.message}</Alert>}
        <List disablePadding>
          {lista.map((u, i) => {
            const soyYo = u.id === yo?.id;
            return (
              <ListItem
                key={u.id}
                divider={i < lista.length - 1}
                sx={{ py: 1.5, px: 3 }}
                secondaryAction={
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <Tooltip title="Editar nombre y email">
                      <IconButton size="small" onClick={() => setDialogo({ modo: "editar", usuario: u })} aria-label="Editar"><EditOutlinedIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title={soyYo ? "La tuya se cambia desde Mi perfil" : "Nueva contraseña"}>
                      <span>
                        <IconButton size="small" disabled={soyYo} onClick={() => setDialogo({ modo: "password", usuario: u })} aria-label="Nueva contraseña"><KeyOutlinedIcon fontSize="small" /></IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={soyYo ? "No podés borrar tu propia cuenta" : lista.length <= 1 ? "Es la única cuenta" : "Eliminar cuenta"}>
                      <span>
                        <IconButton size="small" disabled={soyYo || lista.length <= 1 || eliminar.isPending} onClick={() => setAEliminar(u)} aria-label="Eliminar"><DeleteOutlinedIcon fontSize="small" /></IconButton>
                      </span>
                    </Tooltip>
                  </Box>
                }
              >
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: soyYo ? "var(--accent)" : "var(--bg-sunken)", color: soyYo ? "#fff" : "var(--text-secondary)", fontWeight: 700 }}>{iniciales(u.name)}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}><Typography fontWeight={600}>{u.name}</Typography>{soyYo && <Chip size="small" label="Vos" variant="outlined" />}</Box>}
                  secondary={u.email}
                />
              </ListItem>
            );
          })}
          {!usuarios.isPending && lista.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ p: 3 }}>No hay cuentas.</Typography>
          )}
        </List>
      </Paper>

      {aEliminar && (
        <Dialog open onClose={eliminar.isPending ? undefined : () => setAEliminar(null)} maxWidth="xs" fullWidth>
          <DialogTitle>¿Eliminar la cuenta de {aEliminar.name}?</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary">
              {aEliminar.email} deja de poder entrar al panel de inmediato. Esto no se puede deshacer; si vuelve a necesitar acceso, se crea una cuenta nueva.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button variant="ghost" onClick={() => setAEliminar(null)} disabled={eliminar.isPending}>Cancelar</Button>
            <Button variant="danger-solid" onClick={() => eliminar.mutate(aEliminar)} disabled={eliminar.isPending}>
              {eliminar.isPending ? "Eliminando…" : "Eliminar cuenta"}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {dialogo && (
        <DialogoUsuario
          key={`${dialogo.modo}-${dialogo.usuario?.id ?? "nuevo"}`}
          modo={dialogo.modo}
          usuario={dialogo.usuario}
          onCerrar={cerrar}
          onGuardar={(form) => guardar.mutate({ ...dialogo, form })}
          pendiente={guardar.isPending}
          errores={errores}
          limpiarError={limpiarError}
        />
      )}
    </Box>
  );
};

export default Usuarios;
