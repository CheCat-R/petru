/**
 * Recorte de imágenes antes de subirlas.
 *
 * Todas las fotos de producto salen de acá con el mismo formato (cuadradas,
 * 1200×1200), así la galería y la ficha se ven parejas sin importar con qué
 * celular se sacó la foto. El recorte se hace en el navegador y a la API llega
 * el archivo ya listo: el hosting no tiene GD y no puede procesar imágenes.
 *
 * Con varios archivos se recortan de a uno, en orden.
 */
import { useCallback, useEffect, useState } from "react";
import Cropper from "react-easy-crop";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import Slider from "@mui/material/Slider";
import Typography from "@mui/material/Typography";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";

import Button from "../../../components/Button/Button";

export const TAMANO_PRODUCTO = 1200;

/**
 * Dibuja el área recortada en un canvas de `lado`×`lado` y la exporta.
 * WebP si el navegador sabe generarlo (Chrome, Edge, Firefox); si no, PNG,
 * que también conserva la transparencia. `fondo` pinta detrás (para fotos
 * con fondo transparente o con aire alrededor).
 */
const exportar = async (img, area, lado, fondo) => {
  const canvas = document.createElement("canvas");
  canvas.width = lado;
  canvas.height = lado;
  const ctx = canvas.getContext("2d");
  if (fondo !== "transparente") {
    ctx.fillStyle = fondo;
    ctx.fillRect(0, 0, lado, lado);
  }
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, lado, lado);

  const blob = await new Promise((r) => canvas.toBlob(r, "image/webp", 0.88));
  if (blob && blob.type === "image/webp") return blob;
  return new Promise((r) => canvas.toBlob(r, "image/png"));
};

/** Un archivo: encuadre, zoom, fondo. Se monta con `key` por archivo, así arranca limpio. */
const PasoRecorte = ({ archivo, titulo, lado, aspecto, onUsar, onSaltar, onCancelar, puedeSaltar }) => {
  const [fuente, setFuente] = useState(null); // { img, url }
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState(null);
  const [fondo, setFondo] = useState("transparente");
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => setFuente({ img, url });
    img.onerror = () => setError("No se pudo leer la imagen. ¿Es JPG, PNG o WebP?");
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  const alCompletar = useCallback((_, pixeles) => setArea(pixeles), []);

  const usar = async () => {
    if (!fuente || !area) return;
    setProcesando(true);
    try {
      const blob = await exportar(fuente.img, area, lado, fondo);
      const extension = blob.type === "image/webp" ? "webp" : "png";
      const nombre = archivo.name.replace(/\.[^.]+$/, "") + `.${extension}`;
      await onUsar(new File([blob], nombre, { type: blob.type }));
    } catch (e) {
      setError(e.message);
      setProcesando(false);
    }
  };

  return (
    <>
      <DialogTitle>
        {titulo}
        <Typography variant="body2" color="text.secondary" component="div">
          Sale cuadrada de {lado}×{lado} px. Arrastrá para encuadrar; la rueda o el control de abajo hacen zoom.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            position: "relative", width: "100%", aspectRatio: "1", borderRadius: 2, overflow: "hidden",
            bgcolor: fondo === "transparente" ? "transparent" : fondo,
            backgroundImage: fondo === "transparente" ? "repeating-conic-gradient(#e5e7eb 0 25%, #fafafa 0 50%)" : "none",
            backgroundSize: "20px 20px",
          }}
        >
          {fuente ? (
            <Cropper
              image={fuente.url}
              crop={crop}
              zoom={zoom}
              aspect={aspecto}
              minZoom={0.5}
              maxZoom={4}
              restrictPosition={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={alCompletar}
              showGrid={false}
              style={{ containerStyle: { background: "transparent" } }}
            />
          ) : (
            <Box sx={{ display: "grid", placeItems: "center", height: "100%" }}>
              <Typography variant="body2" color={error ? "error" : "text.secondary"}>{error ?? "Cargando…"}</Typography>
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 40 }}>Zoom</Typography>
          <Slider size="small" min={0.5} max={4} step={0.01} value={zoom} onChange={(_, v) => setZoom(v)} disabled={!fuente} />
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1, flexWrap: "wrap" }}>
          <Typography variant="caption" color="text.secondary">Fondo</Typography>
          <ToggleButtonGroup size="small" exclusive value={fondo} onChange={(_, v) => v && setFondo(v)}>
            <ToggleButton value="transparente">Transparente</ToggleButton>
            <ToggleButton value="#ffffff">Blanco</ToggleButton>
            <ToggleButton value="#f4f1ec">Hueso (como el sitio)</ToggleButton>
          </ToggleButtonGroup>
        </Box>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          Con zoom menor a 1 la foto queda con aire alrededor, útil si la pieza llega al borde. El fondo solo se nota si la imagen tiene transparencia o si dejaste aire.
        </Typography>
        {error && fuente && <Typography variant="body2" color="error" sx={{ mt: 1 }}>{error}</Typography>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button variant="ghost" onClick={onCancelar} disabled={procesando}>Cancelar</Button>
        {puedeSaltar && <Button variant="secondary" onClick={onSaltar} disabled={procesando}>Saltar esta</Button>}
        <Button variant="primary" onClick={usar} disabled={!fuente || !area || procesando}>
          {procesando ? "Subiendo…" : "Recortar y subir"}
        </Button>
      </DialogActions>
    </>
  );
};

const RecortadorImagen = ({ archivos, onListo, onCancelar, lado = TAMANO_PRODUCTO, aspecto = 1 }) => {
  const [indice, setIndice] = useState(0);
  const archivo = archivos[indice];

  const siguiente = () => {
    if (indice + 1 < archivos.length) setIndice((i) => i + 1);
    else onCancelar();
  };

  return (
    <Dialog open onClose={onCancelar} maxWidth="sm" fullWidth>
      {archivo && (
        <PasoRecorte
          key={indice}
          archivo={archivo}
          titulo={`Recortar imagen${archivos.length > 1 ? ` (${indice + 1} de ${archivos.length})` : ""}`}
          lado={lado}
          aspecto={aspecto}
          puedeSaltar={archivos.length > 1}
          onUsar={async (listo) => { await onListo(listo); siguiente(); }}
          onSaltar={siguiente}
          onCancelar={onCancelar}
        />
      )}
    </Dialog>
  );
};

export default RecortadorImagen;
