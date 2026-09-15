/**
 * Alta y edición de una pieza. Una sola pantalla para las dos cosas.
 *
 * Las imágenes se suben **después** de guardar: necesitan el id del producto.
 * Al crear, el formulario guarda y vuelve a la lista (el taller lo pidió así);
 * las imágenes se cargan entrando a la pieza recién creada. Nos ahorra un
 * flujo de "borrador temporal" con archivos huérfanos.
 */
import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Alert from "@mui/material/Alert";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import EntityHeader from "../../../components/EntityHeader/EntityHeader";
import Button from "../../../components/Button/Button";
import InputField from "../../../components/Form/InputField/InputField";
import SelectField from "../../../components/Form/SelectField/SelectField";
import StatusBadge from "../../../components/StatusBadge/StatusBadge";
import { useToast } from "../../../components/Toast/ToastContext";
import { ApiError } from "../../../lib/apiClient";

import {
  actualizarImagen, actualizarProducto, claves, crearProducto, eliminarImagen,
  listarCategorias, obtenerProducto, subirImagen,
} from "../api/petruApi";
import { ESTADOS_PRODUCTO } from "../lib/estados";
import RecortadorImagen, { TAMANO_PRODUCTO } from "../imagenes/RecortadorImagen";

const VACIO = {
  nombre: "", slug: "", sku: "", categoria_id: "",
  precio: "", precio_comparacion: "", costo: "",
  stock: 0, estado: "Borrador", destacado: false,
  resumen: "", descripcion: "",
  peso_kg: "", alto_cm: "", ancho_cm: "", largo_cm: "", alto_pieza_cm: "",
  orden: 0,
};

/** La API habla camelCase; el formulario, snake_case como las columnas. */
const desdeApi = (p) => ({
  nombre: p.name, slug: p.slug, sku: p.sku, categoria_id: p.categoryId ?? "",
  precio: p.price, precio_comparacion: p.compareAtPrice ?? "", costo: p.cost ?? "",
  stock: p.stock, estado: p.status, destacado: p.featured,
  resumen: p.summary ?? "", descripcion: p.description ?? "",
  peso_kg: p.package.weightKg ?? "", alto_cm: p.package.heightCm ?? "", ancho_cm: p.package.widthCm ?? "", largo_cm: p.package.lengthCm ?? "",
  alto_pieza_cm: p.pieceHeightCm ?? "", orden: p.order ?? 0,
});

const limpiar = (f) =>
  Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v === "" ? null : v]));

const SITIO = import.meta.env.VITE_SITIO_URL ?? "http://localhost:5173";
const absoluta = (url) => (url.startsWith("http") ? url : `${SITIO}${url}`);

const ProductoForm = () => {
  const { id } = useParams();
  const esNuevo = !id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const inputArchivo = useRef(null);

  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [aRecortar, setARecortar] = useState(null); // archivos elegidos, pendientes de recorte

  const producto = useQuery({
    queryKey: claves.producto(id),
    queryFn: () => obtenerProducto(id),
    enabled: !esNuevo,
  });
  const categorias = useQuery({ queryKey: claves.categorias, queryFn: listarCategorias });

  // Cargar el formulario cuando llega el producto (edición). Se ajusta durante el
  // render, no en un efecto (regla react-hooks/set-state-in-effect del panel).
  const [cargadoId, setCargadoId] = useState(null);
  if (producto.data && cargadoId !== producto.data.id) {
    setCargadoId(producto.data.id);
    setForm(desdeApi(producto.data));
  }

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ["petru", "productos"] });
    queryClient.invalidateQueries({ queryKey: claves.categorias });
    if (id) queryClient.invalidateQueries({ queryKey: claves.producto(id) });
  };

  const guardar = useMutation({
    mutationFn: (datos) => (esNuevo ? crearProducto(datos) : actualizarProducto(id, datos)),
    onSuccess: (p) => {
      setErrores({});
      invalidar();
      if (esNuevo) {
        showToast("Producto creado", "success", {
          action: { label: "Cargar imágenes", onClick: () => navigate(`/productos/${p.id}`) },
        });
        navigate("/productos", { replace: true });
      } else {
        showToast("Cambios guardados", "success");
      }
    },
    onError: (e) => {
      if (e instanceof ApiError && e.status === 422) {
        setErrores(e.errors);
        showToast("Revisá los campos marcados", "warning");
      } else {
        showToast(e.message, "error");
      }
    },
  });

  const subir = useMutation({
    mutationFn: (archivo) => subirImagen(id, archivo),
    onSuccess: () => { invalidar(); showToast("Imagen subida", "success"); },
    onError: (e) => showToast(e instanceof ApiError ? (e.fieldError("imagen") ?? e.message) : e.message, "error"),
  });
  // El recortador espera a que termine la subida antes de pasar a la siguiente;
  // si la API rechaza el archivo, el toast ya avisó y se sigue con la próxima.
  const subirRecortada = (archivo) => subir.mutateAsync(archivo).catch(() => {});

  const principal = useMutation({
    mutationFn: (imagenId) => actualizarImagen(id, imagenId, { principal: true }),
    onSuccess: invalidar,
    onError: (e) => showToast(e.message, "error"),
  });

  const borrarImagen = useMutation({
    mutationFn: (imagenId) => eliminarImagen(id, imagenId),
    onSuccess: () => { invalidar(); showToast("Imagen eliminada", "info"); },
    onError: (e) => showToast(e.message, "error"),
  });

  const set = (campo) => (e) => {
    const valor = e?.target?.type === "checkbox" ? e.target.checked : e?.target?.value ?? e;
    setForm((f) => ({ ...f, [campo]: valor }));
    if (errores[campo]) setErrores((er) => ({ ...er, [campo]: undefined }));
  };

  const err = (campo) => errores[campo]?.[0];

  const alGuardar = (e) => {
    e.preventDefault();
    guardar.mutate(limpiar(form));
  };

  const alElegirArchivos = (e) => {
    const archivos = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (archivos.length) setARecortar(archivos);
  };

  const imagenes = producto.data?.images ?? [];
  const opcionesCategoria = [
    { label: "Sin categoría", value: "" },
    ...(categorias.data ?? []).map((c) => ({ label: c.name, value: c.id })),
  ];

  return (
    <Box component="form" onSubmit={alGuardar} noValidate>
      <EntityHeader
        onBack={() => navigate("/productos")}
        backLabel="Productos"
        title={esNuevo ? "Nueva pieza" : form.nombre || "Producto"}
        eyebrow={!esNuevo && form.sku ? <span className="mono">{form.sku}</span> : null}
        badges={!esNuevo && producto.data ? <StatusBadge status={producto.data.status} /> : null}
        actions={
          <>
            {!esNuevo && producto.data?.status !== "Borrador" && (
              <Button
                variant="ghost"
                startIcon={<OpenInNewIcon />}
                onClick={() => window.open(`${SITIO}/producto/${producto.data.slug}`, "_blank", "noopener")}
              >
                Ver en el sitio
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate("/productos")}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={guardar.isPending}>
              {guardar.isPending ? "Guardando…" : esNuevo ? "Crear producto" : "Guardar cambios"}
            </Button>
          </>
        }
      />

      <Grid container spacing={3}>
        {/* Columna principal */}
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper className="surface" elevation={0} sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Identidad</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <InputField label="Nombre" value={form.nombre} onChange={set("nombre")} required error={!!err("nombre")} helperText={err("nombre")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <InputField label="SKU" value={form.sku} onChange={set("sku")} required error={!!err("sku")} helperText={err("sku") ?? "Ej. MIT-BUD-ARB-01"} slotProps={{ input: { className: "mono" } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <InputField label="Slug (URL)" value={form.slug} onChange={set("slug")} error={!!err("slug")} helperText={err("slug") ?? "Vacío = se genera del nombre"} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <SelectField label="Categoría" value={form.categoria_id} onChange={set("categoria_id")} options={opcionesCategoria} error={!!err("categoria_id")} helperText={err("categoria_id")} />
              </Grid>
              <Grid size={12}>
                <InputField label="Resumen (tarjeta de la galería)" value={form.resumen} onChange={set("resumen")} error={!!err("resumen")} helperText={err("resumen") ?? `${form.resumen.length}/280`} slotProps={{ htmlInput: { maxLength: 280 } }} />
              </Grid>
              <Grid size={12}>
                <InputField label="Descripción (ficha completa)" value={form.descripcion} onChange={set("descripcion")} multiline minRows={5} error={!!err("descripcion")} helperText={err("descripcion") ?? "Separá párrafos con una línea en blanco"} />
              </Grid>
            </Grid>
          </Paper>

          <Paper className="surface" elevation={0} sx={{ p: 3, mb: 3 }}>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>Precio y stock</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <InputField label="Precio de venta" type="number" value={form.precio} onChange={set("precio")} required error={!!err("precio")} helperText={err("precio") ?? "ARS, precio final"} slotProps={{ htmlInput: { min: 0, step: 1 } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <InputField label="Precio tachado" type="number" value={form.precio_comparacion} onChange={set("precio_comparacion")} error={!!err("precio_comparacion")} helperText={err("precio_comparacion") ?? "Opcional, para mostrar oferta"} slotProps={{ htmlInput: { min: 0, step: 1 } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <InputField label="Costo" type="number" value={form.costo} onChange={set("costo")} error={!!err("costo")} helperText={err("costo") ?? "Interno, nunca se publica"} slotProps={{ htmlInput: { min: 0, step: 1 } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <InputField label="Stock" type="number" value={form.stock} onChange={set("stock")} required error={!!err("stock")} helperText={err("stock") ?? "0 = Agotado automáticamente"} slotProps={{ htmlInput: { min: 0, step: 1 } }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <SelectField label="Estado" value={form.estado} onChange={set("estado")} options={ESTADOS_PRODUCTO} error={!!err("estado")} helperText={err("estado") ?? "Borrador = no se publica"} />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }} sx={{ display: "flex", alignItems: "center" }}>
                <FormControlLabel control={<Switch checked={!!form.destacado} onChange={set("destacado")} />} label="Destacada en el home" />
              </Grid>
            </Grid>
          </Paper>

          <Paper className="surface" elevation={0} sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={700}>Paquete embalado</Typography>
            <Alert severity="info" sx={{ my: 2 }}>
              Opcional. Medidas y peso <strong>de la caja lista para enviar</strong>, no de la pieza. Con esto cotiza Andreani;
              si quedan vacías se cotiza con un bulto estándar de 3 kg y 30 cm de lado.
            </Alert>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <InputField label="Peso (kg)" type="number" value={form.peso_kg} onChange={set("peso_kg")} error={!!err("peso_kg")} helperText={err("peso_kg")} slotProps={{ htmlInput: { min: 0.01, step: 0.01 } }} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <InputField label="Alto (cm)" type="number" value={form.alto_cm} onChange={set("alto_cm")} error={!!err("alto_cm")} helperText={err("alto_cm")} slotProps={{ htmlInput: { min: 1, step: 1 } }} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <InputField label="Ancho (cm)" type="number" value={form.ancho_cm} onChange={set("ancho_cm")} error={!!err("ancho_cm")} helperText={err("ancho_cm")} slotProps={{ htmlInput: { min: 1, step: 1 } }} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <InputField label="Largo (cm)" type="number" value={form.largo_cm} onChange={set("largo_cm")} error={!!err("largo_cm")} helperText={err("largo_cm")} slotProps={{ htmlInput: { min: 1, step: 1 } }} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <InputField label="Alto de la pieza (cm)" type="number" value={form.alto_pieza_cm} onChange={set("alto_pieza_cm")} error={!!err("alto_pieza_cm")} helperText={err("alto_pieza_cm") ?? "Dato de venta"} slotProps={{ htmlInput: { min: 1, step: 1 } }} />
              </Grid>
              <Grid size={{ xs: 6, sm: 3 }}>
                <InputField label="Orden en la galería" type="number" value={form.orden} onChange={set("orden")} error={!!err("orden")} helperText={err("orden") ?? "Menor = primero"} slotProps={{ htmlInput: { min: 0, step: 1 } }} />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Imágenes */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper className="surface" elevation={0} sx={{ p: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700}>Imágenes</Typography>
              {!esNuevo && (
                <Button variant="secondary" startIcon={<AddPhotoAlternateOutlinedIcon />} disabled={subir.isPending} onClick={() => inputArchivo.current?.click()}>
                  {subir.isPending ? "Subiendo…" : "Subir"}
                </Button>
              )}
            </Box>
            <input ref={inputArchivo} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={alElegirArchivos} />

            {!esNuevo && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Cuadradas, {TAMANO_PRODUCTO}×{TAMANO_PRODUCTO} px: al subir se recortan y se ajustan solas, así todas las piezas se ven parejas en la galería.
                Conviene la pieza centrada, con aire alrededor y fondo liso o transparente. JPG, PNG o WebP, hasta 4 MB.
              </Typography>
            )}
            {esNuevo ? (
              <Typography variant="body2" color="text.secondary">
                Primero creá el producto; después entrás a la pieza desde la lista y cargás las fotos acá.
              </Typography>
            ) : imagenes.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Sin imágenes. En el sitio se muestra la inicial del nombre.
              </Typography>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 1.5 }}>
                {imagenes.map((img) => (
                  <Box key={img.id} sx={{ position: "relative", borderRadius: 2, overflow: "hidden", border: "1px solid var(--border-default)", bgcolor: "var(--bg-sunken)" }}>
                    <Box component="img" src={absoluta(img.url)} alt={img.alt} sx={{ width: "100%", aspectRatio: "1", objectFit: "contain", display: "block" }} />
                    <Box sx={{ position: "absolute", top: 4, right: 4, display: "flex", gap: 0.5, bgcolor: "rgba(255,255,255,.85)", borderRadius: 1 }}>
                      <Tooltip title={img.isPrimary ? "Imagen principal" : "Hacer principal"}>
                        <span>
                          <IconButton size="small" disabled={img.isPrimary || principal.isPending} onClick={() => principal.mutate(img.id)}>
                            {img.isPrimary ? <StarIcon fontSize="small" color="warning" /> : <StarBorderIcon fontSize="small" />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Eliminar">
                        <IconButton size="small" disabled={borrarImagen.isPending} onClick={() => borrarImagen.mutate(img.id)}>
                          <DeleteOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {aRecortar && (
        <RecortadorImagen archivos={aRecortar} onListo={subirRecortada} onCancelar={() => setARecortar(null)} />
      )}
    </Box>
  );
};

export default ProductoForm;
