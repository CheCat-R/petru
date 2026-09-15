/** La regla de contraseña del panel, tal como la valida la API (Password::min(12)->letters()->numbers()). */

export const AYUDA_PASSWORD = "Mínimo 12 caracteres, con letras y números. Una frase corta con un número es fácil de recordar y difícil de adivinar.";

export const cumpleRegla = (p) => p.length >= 12 && /[a-zA-Z]/.test(p) && /\d/.test(p);

/** Para el medidor: null sin texto; si no, { valor 0-100, etiqueta, color MUI }. */
export const nivelDe = (p) => {
  if (!p) return null;
  if (!cumpleRegla(p)) return { valor: 25, etiqueta: "Todavía no cumple la regla", color: "error" };
  const variedad = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z0-9]/].filter((r) => r.test(p)).length;
  if (p.length >= 16 && variedad >= 3) return { valor: 100, etiqueta: "Muy buena", color: "success" };
  if (p.length >= 14 || variedad >= 3) return { valor: 75, etiqueta: "Buena", color: "success" };
  return { valor: 50, etiqueta: "Cumple lo mínimo", color: "warning" };
};
