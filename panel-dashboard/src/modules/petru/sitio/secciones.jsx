/**
 * Una pieza de formulario por sección del sitio. La forma de cada una es la
 * del JSON de la API (ver ContenidoSitio::porDefecto en Laravel): estas
 * pantallas solo deciden cómo se muestra cada campo, no qué campos hay.
 */
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Alert from "@mui/material/Alert";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";

import SelectField from "../../../components/Form/SelectField/SelectField";
import { Agregar, Bloque, Campo, Imagen, Interruptor } from "./campos";
import { leer } from "./rutas";

const NOMBRES_ICONO = {
  brush: "Pincel", cube: "Cubo", shield: "Escudo", pencil: "Lápiz", star: "Estrella",
  heart: "Corazón", truck: "Camión", gift: "Regalo", sparkles: "Destellos", hand: "Mano",
};

const Quitar = ({ onClick, disabled, titulo = "Quitar" }) => (
  <Tooltip title={titulo}>
    <span>
      <IconButton size="small" onClick={onClick} disabled={disabled} aria-label={titulo}>
        <DeleteOutlinedIcon fontSize="small" />
      </IconButton>
    </span>
  </Tooltip>
);

/* ------------------------------------------------------------- General */

export const SeccionGeneral = (p) => (
  <Bloque titulo="Identidad" descripcion="Marca y lo que Google y las redes muestran del sitio.">
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 7 }}>
        <Imagen {...p} ruta="logo" label="Logo (header y pie de página)" quitable={false} alto={140} recortar={false}
          acepta="image/png,image/svg+xml,image/webp"
          ayuda="PNG o SVG con fondo transparente, apaisado, de al menos 300 px de ancho. Se muestra a 48 px de alto." />
      </Grid>
      <Grid size={{ xs: 12, sm: 5 }}>
        <Imagen {...p} ruta="favicon" label="Favicon (ícono de la pestaña)" quitable={false} alto={140} recortar={false}
          acepta="image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.ico"
          ayuda="Cuadrado: SVG, o PNG de 512×512. Los navegadores lo achican solos." />
      </Grid>
      <Grid size={12}>
        <Campo {...p} ruta="tagline" label="Lema" ayuda="Va junto al nombre en la pestaña del navegador y en el título de la portada" maxLength={120} />
      </Grid>
      <Grid size={12}>
        <Campo {...p} ruta="description" label="Descripción del sitio" multiline minRows={2} ayuda="Aparece en Google y en el pie de página" maxLength={200} />
      </Grid>
    </Grid>
  </Bloque>
);

export const SeccionSeguimiento = (p) => (
  <Bloque titulo="Herramientas externas" descripcion="Opcionales. Las estadísticas propias del panel funcionan sin nada de esto; estas son para anuncios y para Google.">
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 4 }}>
        <Campo {...p} ruta="tracking.ga4" label="Google Analytics (ID de medición)" placeholder="G-XXXXXXXXXX" ayuda="Administrar → Flujos de datos → ID de medición" />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Campo {...p} ruta="tracking.metaPixel" label="Píxel de Meta (ID)" placeholder="123456789012345" ayuda="Para medir anuncios de Instagram y Facebook" />
      </Grid>
      <Grid size={{ xs: 12, md: 4 }}>
        <Campo {...p} ruta="tracking.searchConsole" label="Verificación de Search Console" placeholder="valor de content=…" ayuda="Del meta google-site-verification; solo el valor" />
      </Grid>
      <Grid size={12}>
        <Alert severity="info">
          Google Analytics y el píxel usan cookies: si los activás, la política de privacidad del sitio debería mencionarlos.
        </Alert>
      </Grid>
    </Grid>
  </Bloque>
);

/* --------------------------------------------------------------- Aviso */

export const SeccionAviso = (p) => (
  <Bloque titulo="Barra de aviso" descripcion="Una línea arriba de todo el sitio: promociones, vacaciones, un plazo especial.">
    <Grid container spacing={2}>
      <Grid size={12}>
        <Interruptor {...p} ruta="enabled" label="Mostrar la barra" />
      </Grid>
      <Grid size={12}>
        <Campo {...p} ruta="text" label="Texto" maxLength={160} />
      </Grid>
      <Grid size={{ xs: 12, sm: 7 }}>
        <Campo {...p} ruta="link" label="Enlace (opcional)" ayuda="Una ruta del sitio, como /envios, o una dirección https://" />
      </Grid>
      <Grid size={{ xs: 12, sm: 5 }}>
        <Campo {...p} ruta="linkLabel" label="Texto del enlace" maxLength={40} />
      </Grid>
    </Grid>
  </Bloque>
);

/* ------------------------------------------------------------ Contacto */

export const SeccionContacto = (p) => (
  <>
    <Bloque titulo="Canales" descripcion="Se usan en la página de contacto, el pie de página, los botones de WhatsApp y los emails.">
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Campo {...p} ruta="whatsapp.number" label="WhatsApp" ayuda="Con código de país: +54 9 341 555-1234. El link se arma solo." />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Campo {...p} ruta="whatsapp.hours" label="Horario de atención" maxLength={120} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Campo {...p} ruta="email.address" label="Email" type="email" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Campo {...p} ruta="email.note" label="Nota del email" ayuda="Opcional, debajo de la dirección" maxLength={120} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Campo {...p} ruta="location.city" label="Ciudad" maxLength={120} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Campo {...p} ruta="location.country" label="País" maxLength={120} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Campo {...p} ruta="location.note" label="Nota de ubicación" ayuda="Opcional" maxLength={120} />
        </Grid>
      </Grid>
    </Bloque>

    <Bloque titulo="Redes sociales" descripcion="Las que tengan dirección aparecen como íconos en el pie de página. Dejá vacías las que no uses.">
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}><Campo {...p} ruta="social.instagram" label="Instagram" placeholder="https://instagram.com/…" /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><Campo {...p} ruta="social.facebook" label="Facebook" placeholder="https://facebook.com/…" /></Grid>
        <Grid size={{ xs: 12, sm: 4 }}><Campo {...p} ruta="social.tiktok" label="TikTok" placeholder="https://tiktok.com/@…" /></Grid>
      </Grid>
    </Bloque>

    <Bloque titulo="Encabezado de la página de contacto">
      <Grid container spacing={2}>
        <Grid size={12}><Campo {...p} ruta="page.label" label="Etiqueta" maxLength={120} /></Grid>
        <Grid size={12}><Campo {...p} ruta="page.title" label="Título" multiline minRows={2} ayuda="Enter = salto de línea" maxLength={160} /></Grid>
        <Grid size={12}><Campo {...p} ruta="page.intro" label="Texto" multiline minRows={2} maxLength={300} /></Grid>
      </Grid>
    </Bloque>
  </>
);

/* -------------------------------------------------------------- Inicio */

export const SeccionInicio = (p) => {
  const { form, set, icons } = p;
  const opcionesIcono = icons.map((i) => ({ label: NOMBRES_ICONO[i] ?? i, value: i }));

  return (
    <>
      <Bloque titulo="Portada" descripcion="Lo primero que se ve al entrar.">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Grid container spacing={2}>
              <Grid size={12}><Campo {...p} ruta="hero.label" label="Etiqueta" maxLength={120} /></Grid>
              <Grid size={12}>
                <Campo {...p} ruta="hero.title" label="Título" multiline minRows={2} maxLength={160}
                  ayuda="Enter = salto de línea. Entre guiones bajos va en cursiva ámbar: _El alma_" />
              </Grid>
              <Grid size={12}><Campo {...p} ruta="hero.intro" label="Texto" multiline minRows={3} maxLength={300} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Campo {...p} ruta="hero.primaryButton.text" label="Botón principal" maxLength={40} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Campo {...p} ruta="hero.primaryButton.href" label="Destino del botón principal" ayuda="/galeria, /contacto o https://…" /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Campo {...p} ruta="hero.secondaryButton.text" label="Botón secundario" maxLength={40} /></Grid>
              <Grid size={{ xs: 12, sm: 6 }}><Campo {...p} ruta="hero.secondaryButton.href" label="Destino del botón secundario" /></Grid>
            </Grid>
          </Grid>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Imagen {...p} ruta="hero.image.url" label="Imagen de portada" quitable={false} alto={220} lado={1200}
              ayuda="La pieza recortada, con fondo transparente (PNG o WebP), queda mejor: el sitio le pone un halo detrás." />
            <Box sx={{ mt: 2 }}>
              <Campo {...p} ruta="hero.image.alt" label="Descripción de la imagen" ayuda="Para lectores de pantalla y Google" maxLength={200} />
            </Box>
          </Grid>
        </Grid>
      </Bloque>

      <Bloque titulo="Diferenciales" descripcion="La franja de cuatro debajo de la portada. Son cuatro fijos: es lo que entra en la grilla.">
        <Grid container spacing={2}>
          {(form.highlights ?? []).map((_, i) => (
            <Grid key={i} size={{ xs: 12, md: 6 }}>
              <Box sx={{ p: 2, borderRadius: 2, border: "1px solid var(--border-default)", display: "grid", gap: 1.5 }}>
                <SelectField label={`Ícono ${i + 1}`} value={leer(form, `highlights.${i}.icon`) ?? ""} onChange={(e) => set(`highlights.${i}.icon`, e.target.value)} options={opcionesIcono} />
                <Campo {...p} ruta={`highlights.${i}.title`} label="Título" maxLength={40} />
                <Campo {...p} ruta={`highlights.${i}.detail`} label="Detalle" maxLength={80} />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Bloque>

      <Bloque titulo="Piezas destacadas" descripcion="El título de la sección. Qué piezas salen se marca en cada producto (“Destacada en el home”).">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}><Campo {...p} ruta="featured.label" label="Etiqueta" maxLength={120} /></Grid>
          <Grid size={{ xs: 12, sm: 8 }}><Campo {...p} ruta="featured.title" label="Título" maxLength={120} /></Grid>
          <Grid size={12}><Campo {...p} ruta="featured.intro" label="Bajada" ayuda="Opcional" maxLength={120} /></Grid>
        </Grid>
      </Bloque>

      <Bloque titulo="Custom Lab" descripcion="El bloque oscuro del final, con el botón de WhatsApp. Se puede apagar.">
        <Grid container spacing={2}>
          <Grid size={12}><Interruptor {...p} ruta="customLab.enabled" label="Mostrar este bloque" /></Grid>
          <Grid size={12}><Campo {...p} ruta="customLab.label" label="Etiqueta" maxLength={120} /></Grid>
          <Grid size={12}><Campo {...p} ruta="customLab.title" label="Título" multiline minRows={2} maxLength={160} /></Grid>
          <Grid size={12}><Campo {...p} ruta="customLab.text" label="Texto" multiline minRows={3} maxLength={300} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><Campo {...p} ruta="customLab.buttonText" label="Texto del botón" maxLength={40} /></Grid>
          <Grid size={{ xs: 12, sm: 6 }}><Campo {...p} ruta="customLab.note" label="Nota al pie" ayuda="Opcional, por ejemplo el plazo" maxLength={120} /></Grid>
        </Grid>
      </Bloque>
    </>
  );
};

/* ------------------------------------------------------------ Nosotros */

const PERSONA_VACIA = { name: "", role: "", bio: "", photo: "" };

export const SeccionNosotros = (p) => {
  const { form, set } = p;
  const parrafos = form.manifesto?.paragraphs ?? [];
  const personas = form.team?.people ?? [];

  return (
    <>
      <Bloque titulo="Encabezado">
        <Grid container spacing={2}>
          <Grid size={12}><Campo {...p} ruta="header.label" label="Etiqueta" maxLength={120} /></Grid>
          <Grid size={12}><Campo {...p} ruta="header.title" label="Título" maxLength={160} /></Grid>
          <Grid size={12}><Campo {...p} ruta="header.intro" label="Texto" multiline minRows={3} maxLength={1200} /></Grid>
        </Grid>
      </Bloque>

      <Bloque titulo="Manifiesto" descripcion="La cita grande a la izquierda y los párrafos a la derecha (hasta cuatro).">
        <Grid container spacing={2}>
          <Grid size={12}><Campo {...p} ruta="manifesto.label" label="Etiqueta" maxLength={120} /></Grid>
          <Grid size={12}><Campo {...p} ruta="manifesto.quote" label="Cita" multiline minRows={2} ayuda="Sin comillas: se agregan solas" maxLength={400} /></Grid>
          {parrafos.map((_, i) => (
            <Grid key={i} size={12} sx={{ display: "flex", gap: 1, alignItems: "flex-start" }}>
              <Box sx={{ flex: 1 }}>
                <Campo {...p} ruta={`manifesto.paragraphs.${i}`} label={`Párrafo ${i + 1}`} multiline minRows={2} maxLength={800} />
              </Box>
              <Quitar disabled={parrafos.length <= 1} onClick={() => set("manifesto.paragraphs", parrafos.filter((_, j) => j !== i))} />
            </Grid>
          ))}
          <Grid size={12}>
            <Agregar disabled={parrafos.length >= 4} onClick={() => set("manifesto.paragraphs", [...parrafos, ""])}>Agregar párrafo</Agregar>
          </Grid>
        </Grid>
      </Bloque>

      <Bloque titulo="Equipo" descripcion="Hasta cuatro personas. Sin foto se muestran las iniciales.">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}><Campo {...p} ruta="team.label" label="Etiqueta" maxLength={120} /></Grid>
          <Grid size={{ xs: 12, sm: 8 }}><Campo {...p} ruta="team.title" label="Título" maxLength={120} /></Grid>
          <Grid size={12}><Campo {...p} ruta="team.intro" label="Bajada" maxLength={300} /></Grid>
          {personas.map((_, i) => (
            <Grid key={i} size={{ xs: 12, md: 6 }}>
              <Box sx={{ p: 2, borderRadius: 2, border: "1px solid var(--border-default)", display: "grid", gap: 1.5 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="subtitle2">Persona {i + 1}</Typography>
                  <Quitar disabled={personas.length <= 1} onClick={() => set("team.people", personas.filter((_, j) => j !== i))} />
                </Box>
                <Imagen {...p} ruta={`team.people.${i}.photo`} label="Foto" alto={120} lado={600} ayuda="Se muestra redonda: dejá la cara en el centro." />
                <Campo {...p} ruta={`team.people.${i}.name`} label="Nombre" maxLength={80} />
                <Campo {...p} ruta={`team.people.${i}.role`} label="Rol" maxLength={80} />
                <Campo {...p} ruta={`team.people.${i}.bio`} label="Bio" multiline minRows={2} maxLength={400} />
              </Box>
            </Grid>
          ))}
          <Grid size={12}>
            <Agregar disabled={personas.length >= 4} onClick={() => set("team.people", [...personas, PERSONA_VACIA])}>Agregar persona</Agregar>
          </Grid>
        </Grid>
      </Bloque>
    </>
  );
};

/* --------------------------------------------------------------- Legal */

export const SeccionLegal = (p) => {
  const incompleto = !leer(p.form, "businessName") || !leer(p.form, "taxId");
  return (
    <Bloque titulo="Datos del responsable" descripcion="Aparecen en la política de privacidad y en los términos y condiciones, como exige la ley.">
      {incompleto && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Mientras falten la razón social o el CUIT, las páginas legales muestran un texto entre corchetes pidiendo completarlos.
        </Alert>
      )}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 7 }}><Campo {...p} ruta="businessName" label="Razón social o nombre y apellido" maxLength={160} /></Grid>
        <Grid size={{ xs: 12, sm: 5 }}><Campo {...p} ruta="taxId" label="CUIT" placeholder="20-12345678-9" /></Grid>
        <Grid size={12}><Campo {...p} ruta="address" label="Domicilio" maxLength={200} /></Grid>
      </Grid>
    </Bloque>
  );
};
