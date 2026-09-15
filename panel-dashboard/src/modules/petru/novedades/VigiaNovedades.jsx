/**
 * El vigía: no dibuja nada, mira las novedades y avisa cuando aparece una que
 * antes no estaba.
 *
 * Avisa por tres canales, del más discreto al más ruidoso:
 *   · el título de la pestaña ("(3) Pëtru · Panel"), que se ve desde otra pestaña
 *   · un toast dentro del panel, con acción para ir directo al pedido o consulta
 *   · una notificación del navegador, solo si el taller la habilitó
 *
 * La primera respuesta después de entrar no avisa: lo que ya estaba pendiente
 * se ve en la campana y en el menú, no hace falta gritarlo.
 */
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useToast } from "../../../components/Toast/ToastContext";
import { rutaDeEvento, useNovedades } from "./useNovedades";

const TITULO_BASE = "Pëtru · Panel";

const notificarEnNavegador = (evento, alClic) => {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    const n = new Notification(evento.title, { body: evento.detail, tag: evento.key, icon: "/favicon.svg" });
    n.onclick = () => { window.focus(); alClic(); n.close(); };
  } catch {
    // Algunos navegadores móviles tiran al construir; el toast ya avisó.
  }
};

const VigiaNovedades = () => {
  const { events, total, cargando } = useNovedades();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const vistos = useRef(null); // null = todavía no llegó la primera respuesta

  useEffect(() => {
    document.title = total > 0 ? `(${total}) ${TITULO_BASE}` : TITULO_BASE;
    return () => { document.title = TITULO_BASE; };
  }, [total]);

  useEffect(() => {
    if (cargando) return;

    if (vistos.current === null) {
      vistos.current = new Set(events.map((e) => e.key));
      return;
    }

    const nuevos = events.filter((e) => !vistos.current.has(e.key));
    // Lo que se atendió sale de la lista; lo que sigue, se recuerda. Así, si un
    // pedido se despacha y por algún motivo vuelve, se vuelve a avisar.
    vistos.current = new Set(events.map((e) => e.key));

    nuevos.forEach((evento) => {
      const ir = () => navigate(rutaDeEvento(evento));
      showToast(`${evento.title} — ${evento.detail}`, evento.urgent ? "warning" : "info", {
        action: { label: "Ver", onClick: ir },
      });
      notificarEnNavegador(evento, ir);
    });
  }, [events, cargando, navigate, showToast]);

  return null;
};

export default VigiaNovedades;
