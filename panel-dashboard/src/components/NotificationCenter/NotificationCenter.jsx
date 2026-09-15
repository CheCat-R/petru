import { useNavigate } from "react-router-dom";
import Popover from "@mui/material/Popover";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningIcon from "@mui/icons-material/Warning";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import ForumOutlinedIcon from "@mui/icons-material/ForumOutlined";

import { useUI } from "../../context/UIContext";
import {
  listNotifications, clearNotifications, relativeTo,
} from "../../modules/automatizaciones/api/automationsApi";
import { rutaDeEvento, useNovedades } from "../../modules/petru/novedades/useNovedades";
import "./NotificationCenter.css";

const MOSTRAR_ERP = import.meta.env.VITE_MOSTRAR_ERP === "true";

/**
 * La campana del panel.
 *
 * Lista lo que el taller tiene que atender (pedidos pagados sin despachar,
 * consultas sin leer), que viene de `useNovedades()`. No hay "marcar leídas":
 * un pedido sale de acá cuando se despacha y una consulta cuando se la marca
 * leída en su pantalla. Eso es lo que evita que el contador mienta.
 *
 * Los avisos de las automatizaciones del ERP se suman solo si el ERP está
 * visible (VITE_MOSTRAR_ERP=true).
 */
const LEVELS = {
  info: { tone: "info", Icon: InfoOutlinedIcon },
  warning: { tone: "warning", Icon: WarningIcon },
  error: { tone: "danger", Icon: ErrorOutlineIcon },
};

const NotificationCenter = () => {
  const { isNotificationsOpen, closeNotifications, notificationAnchorEl } = useUI();
  const navigate = useNavigate();
  const { events, cargando } = useNovedades();

  // Se lee al abrir el popover: no hace falta suscribirse a nada.
  const automatizaciones = MOSTRAR_ERP && isNotificationsOpen ? listNotifications().slice(0, 12) : [];

  const ir = (evento) => {
    closeNotifications();
    navigate(rutaDeEvento(evento));
  };

  return (
    <Popover
      open={isNotificationsOpen}
      anchorEl={notificationAnchorEl}
      onClose={closeNotifications}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      transformOrigin={{ vertical: "top", horizontal: "right" }}
      slotProps={{ paper: { className: "notification-popover" } }}
    >
      <Box className="notification-header">
        <Typography variant="h6">Pendientes</Typography>
        {automatizaciones.length > 0 && (
          <Typography
            variant="body2"
            className="notification-mark-read"
            role="button"
            tabIndex={0}
            onClick={() => { clearNotifications(); closeNotifications(); }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); clearNotifications(); closeNotifications(); }
            }}
          >
            Limpiar avisos del ERP
          </Typography>
        )}
      </Box>

      {events.length === 0 && automatizaciones.length === 0 ? (
        <Box className="notification-empty">
          <Typography variant="body2">
            {cargando ? "Buscando novedades…" : "Nada pendiente. Los pedidos pagados y las consultas nuevas aparecen acá."}
          </Typography>
        </Box>
      ) : (
        <List className="notification-list">
          {events.map((evento) => {
            const esPedido = evento.type === "order";
            const esAlerta = evento.type === "alert";
            const tone = esAlerta ? "danger" : evento.urgent ? "warning" : esPedido ? "info" : "success";
            return (
              <ListItem className="notification-item unread" key={evento.key} disablePadding>
                <ListItemButton onClick={() => ir(evento)} className="notification-item-btn">
                  <ListItemAvatar>
                    <Avatar className={`notification-avatar ${tone}`}>
                      {esAlerta ? <ErrorOutlineIcon fontSize="small" /> : esPedido ? <ShoppingBagOutlinedIcon fontSize="small" /> : <ForumOutlinedIcon fontSize="small" />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={evento.title}
                    secondary={`${evento.detail} · ${relativeTo(evento.at, new Date())}`}
                    slotProps={{
                      primary: { className: "notification-title" },
                      secondary: { className: "notification-time" },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}

          {automatizaciones.map((n) => {
            const level = LEVELS[n.level] || LEVELS.info;
            return (
              <ListItem className="notification-item unread" key={n.id}>
                <ListItemAvatar>
                  <Avatar className={`notification-avatar ${level.tone}`}>
                    <level.Icon fontSize="small" />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={n.message}
                  secondary={`${n.subject?.id || ""} · ${relativeTo(n.at)}`}
                  slotProps={{
                    primary: { className: "notification-title" },
                    secondary: { className: "notification-time" },
                  }}
                />
              </ListItem>
            );
          })}
        </List>
      )}
    </Popover>
  );
};

export default NotificationCenter;
