# Deploy de Pëtru en Hostinger (plan con SSH)

Tres piezas, tres (sub)dominios:

| Qué | Dónde | Carpeta en el servidor |
|---|---|---|
| Sitio público (HTML estático) | `https://petru.com.ar` | `~/domains/petru.com.ar/public_html` |
| Panel del taller (SPA) | `https://panel.petru.com.ar` | `~/domains/panel.petru.com.ar/public_html` |
| API Laravel | `https://api.petru.com.ar` | `~/domains/api.petru.com.ar/laravel` (app) + `public_html` (puente) |

Todo se sube con `deploy/deploy.sh` desde Git Bash. Lo que hay que hacer a mano
en hPanel es una sola vez (paso 1).

## 1. Preparar en hPanel (una vez)

1. **Subdominios**: Dominios → Subdominios → crear `api` y `panel`. Hostinger
   les crea `~/domains/api.petru.com.ar/public_html` y `…/panel.petru.com.ar/public_html`.
2. **SSL**: Seguridad → SSL → activar para el dominio y los dos subdominios
   (Let's Encrypt, gratis). Esperar a que los tres estén "Activo".
3. **PHP**: Avanzado → Configuración PHP → versión **8.2 o superior**. En
   "Extensiones" confirmar `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, `gd`
   (vienen activas por defecto).
4. **Base de datos**: Bases de datos → MySQL → crear base y usuario (quedan con
   prefijo `u123456789_`). Anotar nombre, usuario y contraseña.
5. **Casilla de mail**: Emails → crear `hola@petru.com.ar` (o la que usen). Es
   la que manda las confirmaciones de pedido. Anotar la contraseña.
6. **SSH**: Avanzado → Acceso SSH → activar. Anotar usuario, IP y puerto
   (suele ser 65002). Opcional pero recomendado: cargar ahí tu clave pública
   (`cat ~/.ssh/id_ed25519.pub`) para no tipear la contraseña.

## 2. Completar el .env de producción

```bash
cp deploy/api.env.production.example deploy/api.env.production
```

Abrí `deploy/api.env.production` y completá todo lo que está entre `<>`: base
de datos, casilla de mail, email del taller. Ese archivo está en `.gitignore`.
`APP_KEY` se deja vacío: se genera en el servidor la primera vez.

## 3. Subir

```bash
export PETRU_SSH="u123456789@123.45.67.89" PETRU_PORT=65002
./deploy/deploy.sh env     # sube el .env (solo si el servidor no tiene uno)
./deploy/deploy.sh api     # composer, migraciones, storage:link, cachés
```

Probá `https://api.petru.com.ar/api/categorias`: tiene que devolver JSON.

```bash
./deploy/deploy.sh sitio   # build (prerender contra la API real) + subida
./deploy/deploy.sh panel   # build + subida
```

El sitio se construye **contra la API de producción** (`Sitio_web/.env.production`),
por eso la API va primero y con el catálogo cargado: cada pieza publicada
genera su HTML estático. Cuando se agreguen piezas nuevas, el sitio las muestra
igual (las resuelve en el navegador); el HTML estático y el sitemap se
actualizan en el próximo `./deploy/deploy.sh sitio`.

## 4. Después del primer deploy

### Cuenta del panel
```bash
ssh -p 65002 u123456789@123.45.67.89
cd ~/domains/api.petru.com.ar/laravel
php artisan petru:usuario delfina@petru.com.ar --nombre="Delfina Cherey" --password="una-clave-larga-123"
```
Después, desde el panel (Cuenta → Usuarios) se crean las demás.

### Cron (obligatorio: mails y liberación de reservas)
hPanel → Avanzado → Cron Jobs → agregar, **cada minuto** (`* * * * *`):
```
cd /home/u123456789/domains/api.petru.com.ar/laravel && php artisan schedule:run >> /dev/null 2>&1
```
(Reemplazar `u123456789` por el usuario real; la ruta completa está en `pwd`.)

### Contenido y credenciales, desde el panel
- **Sitio web**: logo, favicon, textos, contacto, **datos legales** (razón social,
  CUIT, domicilio: hasta que estén, las páginas legales lo dicen entre corchetes).
- **Integraciones → MercadoPago**: credenciales de prueba, "Probar conexión",
  una compra de prueba completa, y recién ahí producción. Cargar el **webhook**:
  en MercadoPago → tu aplicación → Webhooks, URL `https://api.petru.com.ar/api/webhooks/mercadopago`,
  evento *Pagos*, y pegar la clave secreta en el panel.
- **Integraciones → Envíos**: confirmar precios de las zonas; Andreani cuando
  tengan las credenciales.

### Verificar
- `https://petru.com.ar` carga, el footer muestra el WhatsApp, el checkout cotiza.
- `https://panel.petru.com.ar` → login → Dashboard. Si el login da 419 o no
  guarda la sesión: revisar `SESSION_DOMAIN=.petru.com.ar` y
  `SANCTUM_STATEFUL_DOMAINS=panel.petru.com.ar` en el `.env`, y que el panel
  entre por `https`.
- Un pedido de prueba (pasarela simulada o MP prueba) → llega el mail al
  cliente y al taller. Si no llega en 2 minutos: el cron no está corriendo
  (`php artisan queue:work --stop-when-empty` a mano lo drena).
- `https://petru.com.ar/sitemap.xml` y `robots.txt` existen. Cargar el sitemap en
  Google Search Console (la verificación se pega en Sitio web → General).

## Actualizaciones

Cada cambio de código: `./deploy/deploy.sh api|sitio|panel` según lo que cambió.
`api` corre las migraciones nuevas y regenera cachés; no toca `.env` ni `storage/`
(las fotos subidas quedan). Si un deploy de la API sale mal, la app sigue con
los archivos anteriores hasta que termine `composer install`; para ponerla en
mantenimiento: `php artisan down` / `php artisan up`.

## Si algo falla

- **500 en la API**: `tail -50 ~/domains/api.petru.com.ar/laravel/storage/logs/laravel-*.log`.
  Con `APP_DEBUG=false` el navegador no muestra el motivo; el log sí.
- **`composer: command not found`**: Hostinger lo tiene en `/usr/local/bin/composer`;
  si no, `curl -sS https://getcomposer.org/installer | php` y usar `php composer.phar`.
- **Imágenes subidas dan 404**: falta el link `public_html/storage` (lo crea
  `deploy.sh api`; a mano: `ln -s ~/domains/api.petru.com.ar/laravel/storage/app/public ~/domains/api.petru.com.ar/public_html/storage`).
- **CORS en el navegador**: el origen que llama tiene que estar en
  `CORS_ALLOWED_ORIGINS`, con `https` y sin barra final.
- **Cambié el .env**: `php artisan config:cache` de nuevo (el deploy lo hace).
