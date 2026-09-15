/**
 * Cartel del dashboard con las alertas de integraciones (MercadoPago): modo
 * prueba, sin credenciales, prueba fallida, error reciente. Vienen de
 * useNovedades(), así que se actualizan solas.
 */
import { useNavigate } from "react-router-dom";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";

import { useNovedades } from "./useNovedades";

const AlertasIntegraciones = () => {
  const { alerts } = useNovedades();
  const navigate = useNavigate();
  if (!alerts?.length) return null;

  return alerts.map((a) => (
    <Alert
      key={a.key}
      severity={a.level === "error" ? "error" : a.level === "warning" ? "warning" : "info"}
      sx={{ mb: 2 }}
      action={<Button color="inherit" size="small" onClick={() => navigate(a.source === "envios" ? "/integraciones/envios" : "/integraciones/mercadopago")}>Revisar</Button>}
    >
      {a.message}
    </Alert>
  ));
};

export default AlertasIntegraciones;
