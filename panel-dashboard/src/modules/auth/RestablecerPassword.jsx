/**
 * Destino del link del mail: /restablecer?token=…&email=…
 * Elige la contraseña nueva y manda al login.
 */
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";

import Button from "../../components/Button/Button";
import { useToast } from "../../components/Toast/ToastContext";
import { ApiError } from "../../lib/apiClient";
import { restablecerPassword } from "../petru/api/petruApi";
import CampoPassword from "../petru/cuenta/CampoPassword";
import { AYUDA_PASSWORD } from "../petru/cuenta/reglas";

import "./Login.css";

const RestablecerPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [form, setForm] = useState({ password: "", password_confirmation: "" });
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const err = (c) => errores[c]?.[0];
  const set = (c) => (e) => { setForm((f) => ({ ...f, [c]: e.target.value })); if (errores[c]) setErrores((er) => ({ ...er, [c]: undefined })); };

  const alEnviar = async (e) => {
    e.preventDefault();
    setEnviando(true);
    try {
      const r = await restablecerPassword({ token, email, ...form });
      showToast(r.message, "success");
      navigate("/login", { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.status === 422) setErrores(error.errors);
      else showToast(error.message, "error");
    } finally {
      setEnviando(false);
    }
  };

  const linkInvalido = !token || !email;

  return (
    <Box className="auth-page-wrapper">
      <Box className="auth-card">
        <Box className="auth-header">
          <Box className="auth-logo-badge">P</Box>
          <Typography variant="h5" className="auth-title">Elegí una contraseña nueva</Typography>
          <Typography variant="body2" className="auth-subtitle">{email ? `Para la cuenta ${email}.` : ""}</Typography>
        </Box>

        {linkInvalido ? (
          <Alert severity="error" sx={{ mb: 2 }}>El link está incompleto. Abrilo desde el mail o pedí uno nuevo.</Alert>
        ) : (
          <form onSubmit={alEnviar} className="auth-form">
            {err("email") && <Alert severity="error">{err("email")}</Alert>}
            <CampoPassword label="Contraseña nueva" value={form.password} onChange={set("password")} error={err("password")} ayuda={AYUDA_PASSWORD} autoComplete="new-password" medidor autoFocus />
            <CampoPassword label="Repetir contraseña" value={form.password_confirmation} onChange={set("password_confirmation")} error={err("password_confirmation")} autoComplete="new-password" />
            <Button type="submit" variant="primary" disabled={enviando} fullWidth sx={{ mt: 1 }}>
              {enviando ? "Guardando…" : "Guardar e ingresar"}
            </Button>
          </form>
        )}

        <Box className="auth-footer-links">
          <Link to="/olvide" className="auth-link">Pedir un link nuevo</Link>
          {" · "}
          <Link to="/login" className="auth-link">Volver a ingresar</Link>
        </Box>
      </Box>
    </Box>
  );
};

export default RestablecerPassword;
