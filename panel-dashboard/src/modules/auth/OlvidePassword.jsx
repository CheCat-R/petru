/**
 * "Olvidé mi contraseña": pide el email y la API manda un link al panel.
 * La respuesta es la misma exista o no la cuenta (así nadie averigua qué
 * emails tienen acceso), y se muestra tal cual.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";

import InputField from "../../components/Form/InputField/InputField";
import Button from "../../components/Button/Button";
import { ApiError } from "../../lib/apiClient";
import { olvidePassword } from "../petru/api/petruApi";

import "./Login.css";

const OlvidePassword = () => {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);

  const alEnviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const r = await olvidePassword(email);
      setMensaje(r.message);
    } catch (err) {
      setError(err instanceof ApiError && err.status === 429
        ? "Demasiados intentos seguidos. Esperá un minuto y probá de nuevo."
        : err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Box className="auth-page-wrapper">
      <Box className="auth-card">
        <Box className="auth-header">
          <Box className="auth-logo-badge">P</Box>
          <Typography variant="h5" className="auth-title">Olvidé mi contraseña</Typography>
          <Typography variant="body2" className="auth-subtitle">
            Te mandamos un link por email para elegir una nueva.
          </Typography>
        </Box>

        {mensaje ? (
          <Alert severity="success" sx={{ mb: 2 }}>{mensaje}</Alert>
        ) : (
          <form onSubmit={alEnviar} className="auth-form">
            <InputField label="Correo Electrónico" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@petru.com.ar" required autoFocus autoComplete="email" />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="primary" disabled={enviando || !email} fullWidth sx={{ mt: 1 }}>
              {enviando ? "Enviando…" : "Enviarme el link"}
            </Button>
          </form>
        )}

        <Box className="auth-footer-links">
          <Link to="/login" className="auth-link">Volver a ingresar</Link>
        </Box>
      </Box>
    </Box>
  );
};

export default OlvidePassword;
