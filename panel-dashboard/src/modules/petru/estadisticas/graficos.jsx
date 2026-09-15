/**
 * Gráficos en SVG propio para las estadísticas del sitio: una serie temporal
 * y una lista de barras horizontales. Sin librería, como el resto del panel.
 */
import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

const W = 1000;
const H = 240;
const PAD = { top: 12, right: 12, bottom: 24, left: 8 };

/**
 * Serie temporal con hasta dos líneas. `lineas`: [{ clave, nombre, color }].
 * `puntos`: [{ label, [clave]: number }].
 */
export const Serie = ({ puntos, lineas, formato = (v) => v }) => {
  const [hover, setHover] = useState(null);

  if (puntos.length < 2) {
    return <Typography variant="body2" color="text.secondary" sx={{ py: 6, textAlign: "center" }}>Todavía no hay suficientes días para dibujar la serie.</Typography>;
  }

  const max = Math.max(1, ...puntos.flatMap((p) => lineas.map((l) => p[l.clave] ?? 0)));
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i) => PAD.left + (i / (puntos.length - 1)) * innerW;
  const y = (v) => PAD.top + innerH - (v / max) * innerH;
  const camino = (clave) => puntos.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p[clave] ?? 0).toFixed(1)}`).join(" ");

  const alMover = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((rel - PAD.left) / innerW) * (puntos.length - 1));
    setHover(Math.max(0, Math.min(puntos.length - 1, i)));
  };

  return (
    <Box>
      <Box sx={{ display: "flex", gap: 2, mb: 1, flexWrap: "wrap" }}>
        {lineas.map((l) => (
          <Typography key={l.clave} variant="caption" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
            <Box component="span" sx={{ width: 10, height: 10, borderRadius: "50%", bgcolor: l.color, display: "inline-block" }} />
            {l.nombre}{hover != null ? `: ${formato(puntos[hover][l.clave] ?? 0)}` : ""}
          </Typography>
        ))}
        {hover != null && <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>{puntos[hover].label}</Typography>}
      </Box>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block", cursor: "crosshair" }} onMouseMove={alMover} onMouseLeave={() => setHover(null)} role="img" aria-label="Serie temporal">
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1={PAD.left} x2={W - PAD.right} y1={y(max * f)} y2={y(max * f)} stroke="var(--border-subtle)" strokeWidth="1" />
        ))}
        {lineas.map((l) => (
          <g key={l.clave}>
            <path d={`${camino(l.clave)} L${x(puntos.length - 1).toFixed(1)},${y(0)} L${x(0)},${y(0)} Z`} fill={l.color} opacity="0.08" />
            <path d={camino(l.clave)} fill="none" stroke={l.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
          </g>
        ))}
        {hover != null && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="var(--text-tertiary)" strokeDasharray="4 4" />
            {lineas.map((l) => (
              <circle key={l.clave} cx={x(hover)} cy={y(puntos[hover][l.clave] ?? 0)} r="5" fill={l.color} stroke="var(--bg-surface)" strokeWidth="2" />
            ))}
          </g>
        )}
        <text x={PAD.left} y={H - 6} fontSize="12" fill="var(--text-tertiary)">{puntos[0].label}</text>
        <text x={W - PAD.right} y={H - 6} fontSize="12" fill="var(--text-tertiary)" textAnchor="end">{puntos.at(-1).label}</text>
      </svg>
    </Box>
  );
};

/** Barras horizontales: [{ etiqueta, valor, extra? }], escaladas al mayor. */
export const Barras = ({ filas, formato = (v) => v, vacio = "Sin datos en este período." }) => {
  if (!filas.length) return <Typography variant="body2" color="text.secondary">{vacio}</Typography>;
  const max = Math.max(1, ...filas.map((f) => f.valor));
  return (
    <Box sx={{ display: "grid", gap: 1.25 }}>
      {filas.map((f) => (
        <Box key={f.etiqueta}>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, mb: 0.25 }}>
            <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>{f.etiqueta}</Typography>
            <Typography variant="body2" sx={{ whiteSpace: "nowrap" }}>
              <strong>{formato(f.valor)}</strong>{f.extra ? <Typography component="span" variant="caption" color="text.secondary"> · {f.extra}</Typography> : null}
            </Typography>
          </Box>
          <Box sx={{ height: 6, borderRadius: 3, bgcolor: "var(--bg-sunken)", overflow: "hidden" }}>
            <Box sx={{ height: "100%", width: `${(f.valor / max) * 100}%`, bgcolor: f.color ?? "var(--accent)", borderRadius: 3 }} />
          </Box>
        </Box>
      ))}
    </Box>
  );
};

/** Embudo: cada paso muestra su porcentaje respecto del anterior y del primero. */
export const Embudo = ({ pasos }) => {
  const primero = pasos[0]?.value || 0;
  return (
    <Box sx={{ display: "grid", gap: 1.5 }}>
      {pasos.map((p, i) => {
        const anterior = pasos[i - 1]?.value || 0;
        const delAnterior = i === 0 ? null : anterior ? Math.round((p.value / anterior) * 100) : 0;
        const delTotal = primero ? Math.round((p.value / primero) * 100) : 0;
        return (
          <Box key={p.key}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.25 }}>
              <Typography variant="body2">{p.label}</Typography>
              <Typography variant="body2"><strong>{p.value.toLocaleString("es-AR")}</strong>{delAnterior != null && <Typography component="span" variant="caption" color="text.secondary"> · {delAnterior}% del paso anterior</Typography>}</Typography>
            </Box>
            <Box sx={{ height: 10, borderRadius: 5, bgcolor: "var(--bg-sunken)", overflow: "hidden" }}>
              <Box sx={{ height: "100%", width: `${Math.max(delTotal, p.value ? 2 : 0)}%`, bgcolor: "var(--accent)", opacity: 1 - i * 0.15, borderRadius: 5 }} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};
