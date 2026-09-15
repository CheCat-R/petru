# Pëtru — API

Backend de Pëtru: API REST/JSON en Laravel 12. Sin vistas. La consumen el sitio
público (`Sitio_web/`) y el panel de administración (`panel-dashboard/`).

El modelo de datos está definido en [`../docs/MODELO-DOMINIO.md`](../docs/MODELO-DOMINIO.md).
Leerlo antes de tocar migraciones, modelos o Resources.

## Requisitos

- PHP 8.2+ (Laravel 13 pide 8.3; por eso esto es Laravel 12)
- MySQL 8 / MariaDB 10.4+
- Composer 2

## Arranque local

```bash
composer install
cp .env.example .env
php artisan key:generate
# crear la base `petru` en MySQL, ajustar DB_* en .env
php artisan migrate --seed
php artisan serve          # http://localhost:8000
```

El seed crea las 4 categorías, 6 productos de desarrollo y el usuario del panel
`admin@petru.com.ar` / `petru-dev-2026` (solo local).

## Convenciones

| Capa | Convención |
|---|---|
| Tablas y columnas | `snake_case` en español (`costo_envio`) |
| Modelos | `PascalCase` en español (`PedidoItem`) |
| **JSON de la API** | **`camelCase` en inglés** (`shippingCost`) — es lo que el panel ya consume |

La traducción vive **solo** en `app/Http/Resources/`. Los controllers no arman
arrays a mano.

Las reglas de negocio (transiciones de estado del pedido, coherencia stock/estado
del producto) viven en los modelos, no en los controllers.

## Endpoints

### Públicos

| Método | Ruta | Notas |
|---|---|---|
| `GET` | `/api/categorias` | Con `productCount` (solo publicados) |
| `GET` | `/api/productos` | Paginado. `?categoria=slug` `?destacado=1` `?orden=manual\|recientes\|precio-asc\|precio-desc\|vendidos` `?por_pagina=24` |
| `GET` | `/api/productos/{slug}` | 404 si es borrador |
| `POST` | `/api/consultas` | Formulario de contacto. Throttle 5/hora por IP. Honeypot en `sitio_web` |

### Sesión y privados (`auth:sanctum`, prefijo `/api/admin`)

`POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/usuario` (Sanctum en modo cookie).
CRUD de productos, imágenes (`POST/PATCH/DELETE /productos/{id}/imagenes`), categorías,
consultas, y pedidos con transiciones explícitas (`/pedidos/{numero}/confirmar-pago`,
`/despachar`, `/reembolsar`, …). `php artisan route:list --path=api` para la lista completa.

### Checkout (públicos)

| Método | Ruta | Notas |
|---|---|---|
| `POST` | `/api/envios/cotizar` | `{ codigo_postal, items[] }` → opciones (retiro en taller + domicilio). 422 fuera de cobertura |
| `POST` | `/api/pedidos` | Crea el pedido, **reserva stock** y devuelve `paymentUrl`. Solo ids y cantidades: el precio lo pone el servidor. 409 si el carrito cambió |
| `GET` | `/api/pedidos/{token}` | Seguimiento sin login. Si sigue pendiente, sincroniza con MercadoPago (máx. 6/min) |
| `POST` | `/api/pedidos/{token}/simular-pago` | **Solo con la pasarela simulada** (sin access token) |
| `POST` | `/api/webhooks/mercadopago` | Notificaciones de MercadoPago. Valida `x-signature` con `MERCADOPAGO_WEBHOOK_SECRET` |

## Pagos: MercadoPago Checkout Pro

Las credenciales se cargan desde el panel (**Integraciones → MercadoPago**), en
dos juegos —prueba (`TEST-…`) y producción (`APP_USR-…`)— con un interruptor
que dice cuál usa el checkout. Se guardan cifradas con `APP_KEY` en la tabla
`integraciones` (`App\Integraciones\MercadoPagoConfig`); las variables
`MERCADOPAGO_*` del `.env` siguen valiendo como respaldo cuando no hay nada
cargado. El panel tiene "Probar conexión" (`GET /users/me` con el token) y
muestra alertas: modo prueba, sin credenciales, prueba fallida, último error
de la API, sin clave de webhook en producción.

Sin credenciales en el modo activo la API usa una **pasarela simulada**: el
checkout funciona completo y el pago se aprueba o rechaza desde la página de
seguimiento. Con credenciales, se crea una preferencia real y el cliente paga
en MercadoPago; en modo prueba el checkout del sitio lo avisa.

El resultado llega por dos caminos: el **webhook** y la **sincronización al
volver** (`GET /pedidos/{token}` busca el pago por `external_reference`). Si el
webhook se demora o el hosting lo pierde, el pedido igual se confirma.

Para probar el webhook en local hace falta una URL pública (ngrok o similar):
MercadoPago no puede llegar a `localhost`. En producción, cargar en el panel de
MercadoPago la URL `https://api.petru.com.ar/api/webhooks/mercadopago` (el
panel la muestra con botón de copiar) y pegar la clave secreta en el panel.

## Envíos

Se configura desde el panel (**Integraciones → Envíos**): retiro en el taller,
zonas de cobertura (nombre, códigos postales, costo, plazo), bulto por defecto y
credenciales de Andreani. Se guarda cifrado en `integraciones`
(`App\Integraciones\EnviosConfig`); `config/petru.php` → `envios` y las
variables `ANDREANI_*` son los valores de arranque.

Con Andreani configurado, el envío a domicilio se cotiza en vivo
(`AndreaniClient`; el panel tiene "Probar conexión", que hace login y una
cotización real a Rosario); si falla o no está configurado, se cobra el costo de
la zona, y el fallo queda como alerta en el panel. Cada pedido congela la
cotización que usó en `cotizacion_envio` (con `origen`: `andreani` o
`respaldo`). Un código postal fuera de las zonas no puede comprar con envío.

## Emails transaccionales

Eventos de dominio (`app/Events/`) → listeners en cola (`app/Listeners/`) → mailables
markdown (`app/Mail/`, vistas en `resources/views/mail/`, tema `petru`):

| Evento | A quién | Mail |
|---|---|---|
| `PedidoCreado` | cliente | Recibimos tu pedido (con el link de seguimiento) |
| `PedidoPagado` | cliente + taller | ¡Pago confirmado! · Nuevo pedido pagado |
| `PagoRechazado` | cliente | No pudimos procesar el pago (con link para reintentar) |
| `PedidoDespachado` | cliente | Tu pedido está en camino (transportista + tracking) |
| `ConsultaRecibida` | taller | Consulta desde el sitio (`Reply-To` = la persona) |

Los eventos se despachan **después del commit** (`ShouldDispatchAfterCommit`) y los
listeners corren en cola (`QUEUE_CONNECTION=database`): el webhook de MercadoPago
nunca espera al SMTP. En hosting compartido la cola la drena el cron
(`queue:work --stop-when-empty` cada minuto), así que un mail tarda hasta un minuto.

En local, `MAIL_MAILER=log` escribe los mails en `storage/logs/laravel.log`. Para
verlos renderizados: `(new AppMailPagoConfirmado($pedido))->render()`.

## Reserva de stock

Al crear el pedido se descuenta el stock (con lock por fila) y se guarda
`reservado_hasta`. El cron `petru:liberar-reservas` cancela los pedidos
pendientes o rechazados cuya reserva venció y devuelve las piezas al catálogo.

## Comandos propios

```bash
php artisan petru:usuario email@dominio --nombre="Nombre"   # alta de usuario del panel
php artisan petru:liberar-reservas                           # libera stock de pedidos vencidos
```

## Cron en producción

No hay worker persistente en hosting compartido. En el hPanel, un cron cada minuto:

```
* * * * * cd /ruta/a/api && php artisan schedule:run >> /dev/null 2>&1
```

Corre `petru:liberar-reservas` y `queue:work --stop-when-empty` cada minuto. Ver `routes/console.php`.

## Variables de entorno propias

```
CORS_ALLOWED_ORIGINS=https://petru.com.ar,https://panel.petru.com.ar
FRONTEND_URL=https://petru.com.ar
SANCTUM_STATEFUL_DOMAINS=panel.petru.com.ar      # SOLO el panel (el sitio no usa sesión)
SESSION_DOMAIN=.petru.com.ar
MERCADOPAGO_ACCESS_TOKEN= / MERCADOPAGO_PUBLIC_KEY= / MERCADOPAGO_WEBHOOK_SECRET=   # opcional: se cargan desde el panel
ANDREANI_USUARIO= / ANDREANI_PASSWORD= / ANDREANI_CLIENTE= / ANDREANI_CONTRATO= / ANDREANI_CP_ORIGEN=2000
PEDIDO_RESERVA_MINUTOS=30
PANEL_URL=https://panel.petru.com.ar
PETRU_EMAIL_TALLER=taller@petru.art
MAIL_MAILER=smtp / MAIL_HOST=smtp.hostinger.com / MAIL_PORT=465 / MAIL_SCHEME=smtps / MAIL_USERNAME=hola@petru.art / MAIL_PASSWORD=...
```

## Deploy en hosting compartido (Hostinger)

1. Si no hay Composer por SSH: `composer install --no-dev --optimize-autoloader`
   en local y subir `vendor/` completo.
2. Document root del subdominio `api.petru.com.ar` → carpeta `public/`. **Nunca**
   la raíz del proyecto: el `.env` quedaría expuesto.
3. `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://api.petru.com.ar`.
4. Permisos de escritura en `storage/` y `bootstrap/cache/`.
5. `php artisan migrate --force` y `php artisan config:cache`.
6. Crear el usuario del panel con `petru:usuario` (no correr el seeder en producción).
7. Configurar el cron de arriba.
