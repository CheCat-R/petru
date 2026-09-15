/**
 * Invita a habilitar las notificaciones del navegador. Solo se muestra cuando
 * el permiso todavía no se pidió: si ya se aceptó no hace falta, y si se negó
 * insistir es molesto (y el navegador igual no vuelve a preguntar).
 */
import { useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";

const soportado = typeof window !== "undefined" && "Notification" in window;

const AvisoNotificaciones = () => {
  const [permiso, setPermiso] = useState(soportado ? Notification.permission : "denied");
  const [oculto, setOculto] = useState(() => localStorage.getItem("petru:avisos-navegador") === "no");

  if (!soportado || permiso !== "default" || oculto) return null;

  const pedir = async () => {
    const r = await Notification.requestPermission();
    setPermiso(r);
    if (r === "granted") new Notification("Pëtru · Panel", { body: "Listo: te avisamos acá cuando entre un pedido o una consulta.", icon: "/favicon.svg" });
  };

  const despues = () => {
    localStorage.setItem("petru:avisos-navegador", "no");
    setOculto(true);
  };

  return (
    <Alert
      severity="info"
      sx={{ mb: 3 }}
      action={
        <>
          <Button color="inherit" size="small" onClick={despues}>Ahora no</Button>
          <Button color="inherit" size="small" variant="outlined" onClick={pedir} sx={{ ml: 1 }}>Activar</Button>
        </>
      }
    >
      Activá los avisos del navegador para enterarte de pedidos y consultas nuevas aunque el panel esté en otra pestaña.
    </Alert>
  );
};

export default AvisoNotificaciones;
