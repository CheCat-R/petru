/**
 * Campo de contraseña con ojito y, opcionalmente, un medidor que refleja la
 * regla de la API: mínimo 12 caracteres, con letras y números.
 */
import { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";

import InputField from "../../../components/Form/InputField/InputField";
import { nivelDe } from "./reglas";

const CampoPassword = ({ label, value, onChange, error, ayuda, medidor = false, ...props }) => {
  const [ver, setVer] = useState(false);
  const nivel = medidor ? nivelDe(value) : null;

  return (
    <Box>
      <InputField
        label={label}
        type={ver ? "text" : "password"}
        value={value}
        onChange={onChange}
        error={!!error}
        helperText={error ?? ayuda}
        required
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setVer((v) => !v)} aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"} tabIndex={-1}>
                  {ver ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
        {...props}
      />
      {nivel && (
        <Box sx={{ mt: 0.5, display: "flex", alignItems: "center", gap: 1.5 }}>
          <LinearProgress variant="determinate" value={nivel.valor} color={nivel.color} sx={{ flex: 1, height: 4, borderRadius: 2 }} />
          <Typography variant="caption" color={`${nivel.color}.main`} sx={{ minWidth: 150 }}>{nivel.etiqueta}</Typography>
        </Box>
      )}
    </Box>
  );
};

export default CampoPassword;
