import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

import { onUnauthorized } from "../lib/apiClient";
import * as petruApi from "../modules/petru/api/petruApi";

/**
 * La sesión del panel, contra Laravel.
 *
 * Sanctum en modo cookie: el navegador guarda una cookie httpOnly que este
 * código nunca ve. Al arrancar, el contexto pregunta `GET /api/auth/usuario`;
 * si responde 401 no hay sesión y se muestra el login. Si cualquier request
 * posterior devuelve 401 (venció, o se cerró desde otro lado), `apiClient`
 * avisa por `onUnauthorized` y el panel vuelve al login diciendo por qué.
 *
 * ── Compatibilidad con los módulos del ERP ─────────────────────────────
 *
 * Los módulos del ERP (hoy ocultos, ver `app/navigation.jsx`) leen `check`,
 * `session`, `stepUp` y `sessionStatus` de acá, cableados a su catálogo de
 * permisos simulado. Pëtru tiene un solo rol, Administrador, así que esas
 * funciones responden "permitido" para que ese código siga compilando y
 * funcionando si se activa el flag. Cuando existan roles reales, el permiso lo
 * decide la API y acá solo se refleja.
 */

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser utilizado dentro de un AuthProvider");
  }
  return context;
};

const PERMITIDO = { allowed: true, ok: true, reason: null, grade: "libre" };

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [expiredReason, setExpiredReason] = useState(null);

  // Al arrancar: ¿hay una cookie de sesión viva?
  useEffect(() => {
    let activo = true;
    petruApi
      .usuarioActual()
      .then((u) => activo && setUser(u))
      .catch(() => activo && setUser(null))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, []);

  // Cualquier 401 posterior cierra la sesión del lado del panel
  useEffect(() => {
    onUnauthorized(() => {
      setUser((actual) => {
        if (actual) setExpiredReason("Tu sesión venció o se cerró. Volvé a ingresar.");
        return null;
      });
    });
    return () => onUnauthorized(null);
  }, []);

  const login = useCallback(async (email, password) => {
    // Login.jsx espera una excepción con `message` legible
    const u = await petruApi.login(email, password);
    setExpiredReason(null);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async () => {
    throw new Error("El alta de usuarios se hace desde la API: php artisan petru:usuario");
  }, []);

  /** Después de editar el perfil: la navbar y el menú muestran lo nuevo sin recargar. */
  const actualizarUsuario = useCallback((u) => setUser(u), []);

  const logout = useCallback(async () => {
    try {
      await petruApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      cargando,
      isAuthenticated: Boolean(user),
      expiredReason,
      login,
      register,
      logout,
      actualizarUsuario,

      // Compatibilidad con el ERP (un solo rol por ahora): todo permitido.
      session: user ? { user, startedAt: null, expiresAt: null } : null,
      can: () => Boolean(user),
      check: () => (user ? PERMITIDO : { ...PERMITIDO, allowed: false, ok: false, reason: "Sin sesión" }),
      stepUp: () => ({ ok: true }),
      sessionStatus: () => ({ state: user ? "activa" : "cerrada", reason: null }),
      describeRemaining: () => "",
    }),
    [user, cargando, expiredReason, login, register, logout, actualizarUsuario],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
