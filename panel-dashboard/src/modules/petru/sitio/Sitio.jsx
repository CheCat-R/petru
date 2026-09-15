/**
 * Edición del sitio público: textos, contacto, imágenes.
 *
 * Una pestaña por sección y cada sección se guarda por separado, así un error
 * de validación en "Inicio" no frena un cambio en "Contacto". "Restaurar"
 * vuelve la sección a como se lanzó el sitio, con Deshacer en el toast.
 *
 * Lo que el taller NO puede tocar desde acá —qué secciones existen, cuántos
 * diferenciales, la tipografía— es a propósito: es lo que mantiene el sitio
 * entero aunque se edite todos los días.
 */
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Chip from "@mui/material/Chip";
import Alert from "@mui/material/Alert";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import RestoreOutlinedIcon from "@mui/icons-material/RestoreOutlined";

import PageHeader from "../../../components/PageHeader/PageHeader";
import Button from "../../../components/Button/Button";
import { useToast } from "../../../components/Toast/ToastContext";
import { ApiError } from "../../../lib/apiClient";

import { claves, guardarSeccionSitio, obtenerSitio, restaurarSeccionSitio, subirImagenSitio } from "../api/petruApi";
import { escribir } from "./rutas";
import {
  SeccionAviso, SeccionContacto, SeccionGeneral, SeccionInicio, SeccionLegal, SeccionNosotros, SeccionSeguimiento,
} from "./secciones";

const SeccionGeneralCompleta = (p) => (
  <>
    <SeccionGeneral {...p} />
    <SeccionSeguimiento {...p} />
  </>
);

const SECCIONES = [
  { clave: "home", etiqueta: "Inicio", Form: SeccionInicio, ruta: "/" },
  { clave: "contact", etiqueta: "Contacto", Form: SeccionContacto, ruta: "/contacto" },
  { clave: "about", etiqueta: "Nosotros", Form: SeccionNosotros, ruta: "/nosotros" },
  { clave: "announcement", etiqueta: "Aviso", Form: SeccionAviso, ruta: "/" },
  { clave: "legal", etiqueta: "Datos legales", Form: SeccionLegal, ruta: "/privacidad" },
  { clave: "general", etiqueta: "General", Form: SeccionGeneralCompleta, ruta: "/" },
];

const SITIO = import.meta.env.VITE_SITIO_URL ?? "http://localhost:5173";
const absoluta = (url) => (url.startsWith("http") ? url : `${SITIO}${url}`);

const Sitio = () => {
  const [params, setParams] = useSearchParams();
  const seccion = SECCIONES.find((s) => s.clave === params.get("seccion")) ?? SECCIONES[0];
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const sitio = useQuery({ queryKey: claves.sitio, queryFn: obtenerSitio });

  // El formulario de la sección activa. Se carga cuando llega la API o cuando
  // se cambia de pestaña; ajuste en render, no en efecto (regla del panel).
  const [form, setForm] = useState(null);
  const [cargado, setCargado] = useState(null); // `${seccion}:${updatedAt}`
  const [errores, setErrores] = useState({});
  const versionActual = sitio.data ? `${seccion.clave}:${sitio.dataUpdatedAt}` : null;
  if (versionActual && cargado !== versionActual) {
    setCargado(versionActual);
    setForm(sitio.data.data[seccion.clave]);
    setErrores({});
  }

  const set = (ruta, valor) => {
    setForm((f) => escribir(f, ruta, valor));
    if (errores[ruta]) setErrores((e) => ({ ...e, [ruta]: undefined }));
  };
  const err = (ruta) => errores[ruta]?.[0];

  const alGuardar = (respuesta) => {
    queryClient.setQueryData(claves.sitio, respuesta);
    setErrores({});
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
    mutationFn: ({ clave, contenido }) => guardarSeccionSitio(clave, contenido),
    onSuccess: (r) => { alGuardar(r); showToast("Cambios publicados en el sitio", "success"); },
    onError: alFallar,
  });

  const restaurar = useMutation({
    mutationFn: (clave) => restaurarSeccionSitio(clave),
    onSuccess: (r, clave) => {
      const previo = form;
      alGuardar(r);
      showToast("Sección restaurada a los valores originales", "info", {
        action: { label: "Deshacer", onClick: () => guardar.mutate({ clave, contenido: previo }) },
      });
    },
    onError: alFallar,
  });

  const subir = useMutation({
    mutationFn: subirImagenSitio,
    onError: (e) => showToast(e instanceof ApiError ? (e.fieldError("imagen") ?? e.message) : e.message, "error"),
  });

  const personalizada = sitio.data?.customized.includes(seccion.clave);
  const sinCambios = form && JSON.stringify(form) === JSON.stringify(sitio.data?.data[seccion.clave]);

  return (
    <Box>
      <PageHeader
        title="Sitio web"
        subtitle="Textos, contacto e imágenes del sitio. Se publica al guardar."
        actions={
          <Button variant="secondary" startIcon={<OpenInNewIcon />} onClick={() => window.open(`${SITIO}${seccion.ruta}`, "_blank", "noopener")}>
            Ver en el sitio
          </Button>
        }
      />

      <Tabs
        value={seccion.clave}
        onChange={(_, v) => setParams({ seccion: v })}
        variant="scrollable"
        scrollButtons={false}
        sx={{ mb: 3, borderBottom: "1px solid var(--border-default)" }}
      >
        {SECCIONES.map((s) => (
          <Tab key={s.clave} value={s.clave} label={s.etiqueta} />
        ))}
      </Tabs>

      {sitio.isError && <Alert severity="error" sx={{ mb: 3 }}>No pudimos cargar el contenido del sitio. {sitio.error.message}</Alert>}

      {form && (
        <Box
          component="form"
          noValidate
          onSubmit={(e) => { e.preventDefault(); guardar.mutate({ clave: seccion.clave, contenido: form }); }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2, mb: 3, flexWrap: "wrap" }}>
            <Chip
              size="small"
              variant="outlined"
              label={personalizada ? "Personalizada" : "Valores originales"}
              color={personalizada ? "primary" : "default"}
            />
            <Box sx={{ display: "flex", gap: 1 }}>
              {personalizada && (
                <Button variant="ghost" startIcon={<RestoreOutlinedIcon />} disabled={restaurar.isPending} onClick={() => restaurar.mutate(seccion.clave)}>
                  Restaurar originales
                </Button>
              )}
              <Button variant="primary" type="submit" disabled={guardar.isPending || sinCambios}>
                {guardar.isPending ? "Publicando…" : "Guardar y publicar"}
              </Button>
            </Box>
          </Box>

          <seccion.Form
            form={form}
            set={set}
            err={err}
            icons={sitio.data.icons}
            absoluta={absoluta}
            subir={subir.mutateAsync}
            subiendo={subir.isPending}
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
            <Button variant="primary" type="submit" disabled={guardar.isPending || sinCambios}>
              {guardar.isPending ? "Publicando…" : "Guardar y publicar"}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default Sitio;
