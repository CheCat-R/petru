/**
 * Piezas de formulario para editar el contenido del sitio.
 *
 * Todas trabajan sobre el objeto del formulario por ruta ("hero.title"),
 * ver rutas.js.
 */
import { useRef, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Paper from "@mui/material/Paper";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import AddPhotoAlternateOutlinedIcon from "@mui/icons-material/AddPhotoAlternateOutlined";

import InputField from "../../../components/Form/InputField/InputField";
import Button from "../../../components/Button/Button";
import { leer } from "./rutas";
import RecortadorImagen from "../imagenes/RecortadorImagen";

/* -------------------------------------------------------------- campos */

/** Bloque con título dentro de una sección. */
export const Bloque = ({ titulo, descripcion, children, accion }) => (
  <Paper className="surface" elevation={0} sx={{ p: 3, mb: 3 }}>
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 2, mb: 2 }}>
      <Box>
        <Typography variant="subtitle1" fontWeight={700}>{titulo}</Typography>
        {descripcion && <Typography variant="body2" color="text.secondary">{descripcion}</Typography>}
      </Box>
      {accion}
    </Box>
    {children}
  </Paper>
);

/** Texto de una línea o párrafo. `ayuda` se muestra si no hay error. */
export const Campo = ({ form, ruta, set, err, label, ayuda, multiline = false, minRows = 3, maxLength, ...props }) => {
  const valor = leer(form, ruta) ?? "";
  const error = err(ruta);
  return (
    <InputField
      label={label}
      value={valor}
      onChange={(e) => set(ruta, e.target.value)}
      error={!!error}
      helperText={error ?? (maxLength ? `${ayuda ? `${ayuda} · ` : ""}${valor.length}/${maxLength}` : ayuda)}
      multiline={multiline}
      minRows={multiline ? minRows : undefined}
      slotProps={maxLength ? { htmlInput: { maxLength } } : undefined}
      {...props}
    />
  );
};

export const Interruptor = ({ form, ruta, set, label }) => (
  <FormControlLabel
    control={<Switch checked={!!leer(form, ruta)} onChange={(e) => set(ruta, e.target.checked)} />}
    label={label}
  />
);

/**
 * Selector de imagen: muestra la actual, sube una nueva (la API devuelve la URL)
 * o la quita. `absoluta` arma la vista previa cuando la URL es relativa al sitio.
 * Antes de subir pasa por el recortador, cuadrada de `lado` px: el sitio
 * dibuja estas imágenes en cajas cuadradas, así nunca se deforman.
 */
export const Imagen = ({ form, ruta, set, err, label, subir, subiendo, absoluta, ayuda, quitable = true, alto = 160, lado = 1200, recortar = true, acepta = "image/jpeg,image/png,image/webp" }) => {
  const input = useRef(null);
  const [aRecortar, setARecortar] = useState(null);
  const url = leer(form, ruta) ?? "";
  const error = err(ruta);

  const alElegir = (e) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;
    // Logos y favicons van tal cual: no son cuadrados o son vectoriales.
    if (recortar) setARecortar([archivo]);
    else subirRecortada(archivo);
  };

  const subirRecortada = async (archivo) => {
    try {
      const { url: nueva } = await subir(archivo);
      set(ruta, nueva);
    } catch {
      // El toast de error ya lo mostró la mutación.
    }
  };

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>{label}</Typography>
      <Box
        sx={{
          position: "relative", borderRadius: 2, overflow: "hidden",
          border: `1px solid ${error ? "var(--danger-border)" : "var(--border-default)"}`,
          bgcolor: "var(--bg-sunken)", height: alto,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >
        {url ? (
          <Box component="img" src={absoluta(url)} alt="" sx={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        ) : (
          <Typography variant="body2" color="text.secondary">Sin imagen</Typography>
        )}
        <Box sx={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 0.5, bgcolor: "rgba(255,255,255,.9)", borderRadius: 1 }}>
          <Tooltip title="Subir imagen">
            <span>
              <IconButton size="small" disabled={subiendo} onClick={() => input.current?.click()}>
                <AddPhotoAlternateOutlinedIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
          {quitable && url && (
            <Tooltip title="Quitar">
              <IconButton size="small" onClick={() => set(ruta, "")}>
                <DeleteOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
      <input ref={input} type="file" accept={acepta} hidden onChange={alElegir} />
      <Typography variant="caption" color={error ? "error" : "text.secondary"} display="block" sx={{ mt: 0.5 }}>
        {error ?? ayuda ?? "JPG, PNG o WebP, hasta 4 MB."}{recortar ? ` Se recorta cuadrada de ${lado}×${lado} px al subir.` : ""}
      </Typography>
      {aRecortar && (
        <RecortadorImagen archivos={aRecortar} lado={lado} onListo={subirRecortada} onCancelar={() => setARecortar(null)} />
      )}
    </Box>
  );
};

/** Botón "agregar" para listas con tope. */
export const Agregar = ({ onClick, disabled, children }) => (
  <Button variant="secondary" onClick={onClick} disabled={disabled} sx={{ mt: 1 }}>{children}</Button>
);
