# Pëtru — Modelo de dominio: Producto y Pedido

> Documento de referencia para las tres piezas del proyecto (`API/`, `Sitio_web/`,
> `panel-dashboard/`). Se consulta **antes** de escribir migraciones, endpoints o
> pantallas nuevas.
>
> **Estado (2026-09-11):** implementado de punta a punta — catálogo, consultas, sesión, panel, cotización de envío (respaldo por zona + Andreani preparado), pedidos con reserva de stock, MercadoPago Checkout Pro (webhook + sincronización), seguimiento público, emails transaccionales por cola, páginas legales y botón de arrepentimiento. Pendiente: revisión de textos legales por el taller, credenciales reales de MercadoPago/Andreani/SMTP, deploy.

---

## 0. La regla que ordena todo

El panel **ya tiene** un modelo de Producto y Pedido implementado y funcionando
(`panel-dashboard/src/modules/productos/` y `.../pedidos/`), con máquina de estados,
Logística, Inventario y Facturación construidos encima.

> **La API no define un modelo nuevo: sirve el que el panel ya consume.**

Si Laravel devuelve entidades con otra forma, el panel deja de funcionar y hay que
reescribir nueve módulos. Por eso este documento parte de los mocks existentes y los
**poda** a lo que Pëtru necesita hoy, en vez de diseñar desde cero.

### 0.1 Convención de nombres

| Capa | Convención | Ejemplo |
|---|---|---|
| Tablas y columnas (MySQL) | `snake_case` español | `costo_envio`, `estado_pago` |
| Modelos Eloquent | `PascalCase` español | `Pedido`, `PedidoItem` |
| **JSON de la API** | **`camelCase` inglés** | `shippingCost`, `paymentStatus` |

La tercera fila no es negociable: es la forma que el panel ya consume. Los API
Resources de Laravel hacen la traducción en un solo lugar.

```php
// app/Http/Resources/PedidoResource.php
return [
    'id'             => $this->numero,
    'customerName'   => $this->nombre_cliente,
    'paymentStatus'  => $this->estado_pago,
    'shippingCost'   => $this->costo_envio,
    'createdAt'      => $this->created_at->toIso8601String(),
];
```

### 0.2 Decisiones tomadas (2026-09-10)

| Tema | Decisión | Consecuencia en el modelo |
|---|---|---|
| Facturación | **No emite comprobante fiscal por ahora** | Sin entidad `Comprobante`, sin `taxRate`. `precio` es el precio final al público. |
| Envíos | **Cotización en vivo contra la API de Andreani** | Cada producto necesita **peso y dimensiones del paquete embalado**. Dirección estructurada, no string. |
| Cuentas | **Checkout como invitado** | Sin `User` para clientes. El pedido se sigue con un `token` público. |
| Custom Lab | **Fuera del sistema por ahora** | Sin `Presupuesto`. El sitio solo abre WhatsApp. |

---

## 1. Mapa de entidades

```
Categoria ──< Producto ──< ProductoImagen
                 │
                 └──< PedidoItem >── Pedido ──── Envio

Consulta          (formulario de contacto, sin relación con Pedido)
Usuario           (solo el equipo del taller: login del panel)
```

Siete tablas para la primera versión. Todo lo demás (Inventario multi-depósito,
CRM, Marketing, Facturación) son módulos del panel que se activan más adelante,
sin tocar estas tablas.

---

## 2. Producto

Derivado de `productos/data/catalog.mock.js`, con tres cambios: se elimina `brandId`
(Pëtru es la única marca), se elimina `taxRate` (no factura) y se **agregan peso y
dimensiones** (obligatorios por la cotización de Andreani).

### 2.1 Tabla `productos`

| Columna | Tipo | Nulo | Notas |
|---|---|:--:|---|
| `id` | `bigint` PK | | |
| `nombre` | `string(160)` | | |
| `slug` | `string(180)` unique | | URL de la ficha: `/producto/{slug}` |
| `sku` | `string(40)` unique | | Ej. `BUD-ARB-01` |
| `categoria_id` | FK → `categorias` | ✓ | |
| `precio` | `decimal(12,2)` | | **Precio final al público, en ARS** |
| `precio_comparacion` | `decimal(12,2)` | ✓ | Precio tachado. `null` = sin oferta |
| `costo` | `decimal(12,2)` | ✓ | **Nunca sale en la API pública** |
| `stock` | `unsignedInteger` | | Unidades disponibles |
| `estado` | `enum` | | `Activo` · `Agotado` · `Borrador` |
| `resumen` | `string(280)` | ✓ | Texto de la tarjeta en la galería |
| `descripcion` | `text` | ✓ | Ficha completa |
| `destacado` | `boolean` | | Badge "Destacada" |
| `peso_kg` | `decimal(6,3)` | | **Del paquete embalado**, no de la pieza |
| `alto_cm` | `unsignedSmallInteger` | | Ídem: caja embalada |
| `ancho_cm` | `unsignedSmallInteger` | | |
| `largo_cm` | `unsignedSmallInteger` | | |
| `alto_pieza_cm` | `unsignedSmallInteger` | ✓ | Dato de venta: "Alto 28 cm" |
| `unidades_vendidas` | `unsignedInteger` | | Denormalizado, lo actualiza el pedido |
| `orden` | `unsignedInteger` | | Orden manual en la galería |
| `created_at` / `updated_at` | `timestamp` | | |

### 2.2 Por qué el peso y las dimensiones son obligatorios

Elegiste cotización en vivo contra Andreani. Eso significa que **el checkout no puede
calcular el envío si al producto le falta el peso o alguna dimensión**: la llamada a
la API falla o devuelve una tarifa incorrecta.

Tres consecuencias prácticas:

1. Los cuatro campos son `NOT NULL`. Un producto sin ellos no puede pasar a `Activo`
   — hay que validarlo en el Form Request del panel.
2. Se cargan **del paquete embalado**, no de la estatuilla. Con el "embalaje blindado"
   que promete el sitio, la caja pesa y mide bastante más que la pieza. Cargar el peso
   de la pieza desnuda hace que Andreani cotice de menos y Pëtru pierda plata en cada
   envío.
3. Hay que definir un **plan B**: si la API de Andreani no responde durante el
   checkout, el pedido no puede quedar bloqueado. Ver §6.3.

### 2.3 Sin variantes

Un producto = un SKU. No hay talles ni colores como variantes: cada combinación de
color es una pieza distinta con su propio producto. Encaja con "no hay dos pinceladas
iguales" y evita la tabla de variantes, que es de lejos la parte más cara de un
catálogo.

Si más adelante aparece "el mismo Buda en tres paletas", se resuelve con tres
productos hermanos y un campo `familia_id`. No hace falta anticiparlo ahora.

### 2.4 Stock

Dijiste que el stock no se maneja finamente: cuando no quedan más piezas de un modelo,
se marca como sin stock. El modelo lo soporta con un entero simple:

- `stock > 0` y `estado = Activo` → se puede comprar
- `stock = 0` → la API fuerza `estado = Agotado`; la ficha se sigue viendo e indexando,
  con el botón deshabilitado (así no se pierde el SEO ganado)
- `estado = Borrador` → no sale en la API pública, ni siquiera por slug

**No** se construye el módulo Inventario del panel (depósitos, movimientos, ajustes,
conteos). El campo `stock` queda listo para que ese módulo se enchufe después sin
migración.

### 2.5 Tablas satélite

**`categorias`** — `id`, `nombre`, `slug` unique, `descripcion`, `orden`, `imagen_url`.
Arrancan las cuatro que el footer del sitio ya enlaza: Mitología, Pop Art, Miniaturas, Tarjetas de Regalo. (Custom Lab no es una categoría de producto: es un servicio, y quedó fuera del alcance.)

**`producto_imagenes`** — `id`, `producto_id`, `url`, `alt`, `orden`, `principal` (bool).
La ficha necesita galería, no una sola foto. `alt` es obligatorio: es texto que Google
lee y que necesitan los lectores de pantalla.

> El panel usa `mediaColor` (un color sólido de placeholder) porque nunca tuvo imágenes
> reales. La API devuelve `images[]`; el panel puede seguir cayendo a `mediaColor`
> cuando el array viene vacío.

---

## 3. Pedido

Derivado de `pedidos/data/orders.mock.js`. Se respetan **los nombres y los valores de
estado tal cual**, porque `pedidosApi.js` ya tiene las transiciones codificadas contra
esos strings exactos.

### 3.1 Tabla `pedidos`

| Columna | Tipo | Nulo | Notas |
|---|---|:--:|---|
| `id` | `bigint` PK | | Interno |
| `numero` | `string(12)` unique | | Visible: `10254`. Es el `id` que ve el panel |
| `token` | `uuid` unique | | Seguimiento público: `/pedido/{token}` |
| `nombre_cliente` | `string(120)` | | |
| `email_cliente` | `string(160)` | | |
| `telefono_cliente` | `string(40)` | ✓ | |
| `dni_cliente` | `string(20)` | ✓ | Andreani lo pide para algunos servicios |
| **Dirección de envío** | | | Ver §3.2 |
| `calle` | `string(120)` | | |
| `numero_calle` | `string(20)` | | |
| `piso` | `string(10)` | ✓ | |
| `departamento` | `string(10)` | ✓ | |
| `localidad` | `string(80)` | | |
| `provincia` | `string(60)` | | |
| `codigo_postal` | `string(10)` | | Clave para cotizar |
| `referencia_direccion` | `string(200)` | ✓ | "Portón negro, timbre 2" |
| **Importes** | | | Todos `decimal(12,2)` |
| `subtotal` | | | Suma de los ítems |
| `costo_envio` | | | Lo que devolvió Andreani |
| `descuento` | | | Default `0` |
| `total` | | | `subtotal + costo_envio - descuento` |
| `cupon_codigo` | `string(40)` | ✓ | |
| **Estados** | | | |
| `estado_pago` | `enum` | | Ver §3.3 |
| `estado_envio` | `enum` | | Ver §3.3 |
| **Pago** | | | |
| `metodo_pago` | `string(80)` | ✓ | `MercadoPago (Visa •••• 4242)` |
| `referencia_pago` | `string(60)` | ✓ | ID del pago en MP |
| `mp_preference_id` | `string(80)` | ✓ | |
| `mp_payment_id` | `string(60)` | ✓ | |
| **Envío** | | | |
| `transportista` | `string(40)` | ✓ | `Andreani` · `Correo Argentino` |
| `tracking` | `string(60)` | ✓ | |
| `cotizacion_envio` | `json` | ✓ | Respuesta cruda de Andreani, congelada |
| **Fechas de ciclo de vida** | `timestamp` nulo | | |
| `pagado_en`, `rechazado_en`, `despachado_en`, `entregado_en`, `devuelto_en`, `reembolsado_en` | | ✓ | |
| `motivo_rechazo` | `string(200)` | ✓ | |
| `notas` | `text` | ✓ | Notas internas del taller |
| `created_at` / `updated_at` | | | |

### 3.2 La dirección tiene que ser estructurada

El panel guarda hoy la dirección como **un solo string**:

```js
address: "Av. Corrientes 1234, Piso 5, C1043AAZ, CABA, Argentina · Tel: +54 9 11 1234-5678"
```

Eso alcanzaba con datos simulados, pero **no sirve para cotizar contra Andreani**: la
API necesita código postal, localidad y provincia como campos separados. Por eso la
tabla los guarda desagregados.

Para no romper el panel, el Resource expone **las dos formas**:

```php
'address' => $this->direccionFormateada(),   // string armado, lo que el panel ya lee
'shippingAddress' => [                       // estructurado, para pantallas nuevas
    'street' => $this->calle,
    'number' => $this->numero_calle,
    'city'   => $this->localidad,
    'state'  => $this->provincia,
    'zip'    => $this->codigo_postal,
],
```

Es la única divergencia real entre lo que el panel asume y lo que la API necesita, y
se resuelve sin tocar el panel.

### 3.3 Máquina de estados

Dos ejes independientes, exactamente los que `pedidosApi.js` ya implementa.

**`estado_pago`**

```
                    ┌──────────────┐
                    │  Pendiente   │ ← nace acá
                    └──────┬───────┘
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    ┌──────────┐    ┌────────────┐   ┌────────────┐
    │  Pagado  │    │ Rechazado  │   │ Cancelado  │
    └────┬─────┘    └─────┬──────┘   └────────────┘
         │                │ reintento
         │                └──────────► Pendiente
         ▼
  ┌──────────────────┐      ┌──────────────┐
  │ Reembolso        │─────►│ Reembolsado  │
  │ pendiente        │      └──────────────┘
  └──────────────────┘
```

**`estado_envio`**

```
Sin despachar ──► Despachado ──► Entregado ──► Devuelto
      │                                            │
      └──────────────► Cancelado ◄─────────────────┘
```

**Reglas que ya están codificadas en el panel y la API debe respetar:**

| Regla | Dónde está hoy |
|---|---|
| Solo se confirma el pago de un pedido `Pendiente` | `pedidosApi.js:92` |
| Solo se reembolsa un pedido `Pagado` | `pedidosApi.js:215` |
| No se reembolsa si ya se despachó (primero va devolución) | `pedidosApi.js:216` |
| El descuento se aplica **antes** de confirmar el pago | `pedidosApi.js:166` |
| Solo se cancela desde `Pendiente` o `Rechazado` | `pedidosApi.js:185` |
| `estado_envio` solo avanza desde `estado_pago = Pagado` | `pedidosApi.js:236` |

Van como métodos del modelo `Pedido` en Laravel, no dispersas en los controllers.

### 3.4 Tabla `pedido_items`

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `bigint` PK | |
| `pedido_id` | FK | |
| `producto_id` | FK, **nullable** | `null` si el producto se borró |
| `nombre` | `string(160)` | **Copia** del nombre al comprar |
| `sku` | `string(40)` | **Copia** |
| `precio_unitario` | `decimal(12,2)` | **Copia** del precio al comprar |
| `cantidad` | `unsignedSmallInteger` | |
| `subtotal` | `decimal(12,2)` | `precio_unitario × cantidad` |
| `imagen_url` | `string` nullable | **Copia**, para que el pedido viejo se siga viendo |

> **Los ítems son una foto, no un enlace.** Si mañana el Buda sube de $48.000 a
> $55.000, el pedido de la semana pasada tiene que seguir diciendo $48.000. Nunca
> hacer `join` con `productos` para mostrar precio o nombre de un pedido.

### 3.5 Tabla `envios`

El panel tiene Logística como módulo aparte, con `Envio` separado de `Pedido`
(`logistica/data/shipments.mock.js`). Se replica esa separación desde el día uno,
aunque al principio sea casi 1:1:

`id`, `pedido_id`, `transportista`, `tracking`, `estado`, `peso_kg`, `costo`,
`etiqueta_url`, `despachado_en`, `entregado_en`, `eventos_tracking` (json).

Justificación: un pedido puede terminar en dos paquetes, y el historial de tracking es
una lista que crece. Meterlo en `pedidos` obliga a migrar después.

---

## 4. Consulta (formulario de contacto)

El Custom Lab queda fuera, pero la página de contacto ya existe y hoy no guarda nada.

`consultas`: `id`, `nombre`, `email`, `telefono`, `motivo`
(`custom` · `pedido` · `otro`), `mensaje`, `estado` (`nueva` · `leída` · `respondida`),
`ip`, `created_at`.

Endpoint público con **rate limiting** (§6.4). Sin esto, el formulario del sitio es
decorativo.

---

## 4b. Contenido del sitio (lo que el taller edita sin código)

Tabla `contenido_sitio` (`seccion` PK, `contenido` JSON). Una fila por sección;
lo que no está guardado sale de `AppSitioContenidoSitio::porDefecto()`, que es
el sitio tal como se lanzó. "Restaurar" = borrar la fila.

| Sección | Qué contiene |
|---|---|
| `general` | lema (título de la portada) y descripción (Google, footer) |
| `announcement` | barra de aviso arriba de todo: on/off, texto, enlace |
| `contact` | WhatsApp (el link `wa.me` se deriva), email, horario, ubicación, redes, encabezado de /contacto |
| `home` | portada (textos, botones, imagen), 4 diferenciales (ícono de una lista fija), título de destacadas, Custom Lab (apagable) |
| `about` | encabezado, manifiesto (cita + hasta 4 párrafos), equipo (hasta 4 personas con foto) |
| `legal` | razón social, CUIT, domicilio → se insertan en privacidad y términos |

**Lo que no se edita a propósito**: qué secciones existen, la cantidad de
diferenciales, los textos de las páginas legales (son borradores para revisión
de un abogado; se editan en `Sitio_web/app/data/legales.js`), los plazos de envío
(`config/petru.php`), navegación y columnas del footer.

El sitio lo trae en el `loader` del root (queda prerenderizado) y lo vuelve a
pedir al montar, así un cambio del panel se ve sin rebuild. El HTML estático
que ven los buscadores se actualiza en el próximo `npm run build`.

Imágenes: `POST /admin/sitio/imagenes` guarda en `storage/app/public/sitio/` y
devuelve la URL; la sección guarda esa URL. No hay limpieza de huérfanas.

## 5. Endpoints

### 5.1 Públicos — los consume `Sitio_web/`

| Método | Ruta | Devuelve |
|---|---|---|
| `GET` | `/api/productos` | Listado paginado. Filtros: `?categoria=`, `?destacado=`, `?orden=` |
| `GET` | `/api/productos/{slug}` | Ficha completa con imágenes |
| `GET` | `/api/categorias` | Las cuatro categorías |
| `POST` | `/api/envios/cotizar` | `{ codigoPostal, items[] }` → costo y plazo |
| `POST` | `/api/pedidos` | Crea el pedido y devuelve el `init_point` de MercadoPago |
| `GET` | `/api/pedidos/{token}` | Seguimiento público (sin login) |
| `POST` | `/api/consultas` | Formulario de contacto |
| `POST` | `/api/webhooks/mercadopago` | Notificación de pago. **Sin auth, con validación de firma** |

Nunca exponen `costo`, `notas` ni datos de otros pedidos.

### 5.2 Privados — los consume `panel-dashboard/`

Bajo `auth:sanctum`: CRUD de productos y categorías, subida de imágenes, listado y
detalle de pedidos, y las transiciones de estado como acciones explícitas
(`POST /api/admin/pedidos/{id}/confirmar-pago`, `/despachar`, `/reembolsar`, …), que
es como el panel ya las llama.

---

## 6. Los cuatro puntos delicados

### 6.1 Nunca confiar en el precio que manda el cliente

`POST /api/pedidos` recibe `{ productoId, cantidad }[]` y **nada más**. El precio, el
subtotal y el total los calcula el servidor leyendo la base. Si el precio viajara desde
el navegador, cualquiera compra un Buda a $1 editando el request.

### 6.2 Reserva de stock durante el pago

Con MercadoPago Checkout Pro el cliente se va del sitio, paga afuera y vuelve. Entre
que se crea la preferencia y llega el webhook pasan minutos. Con una sola pieza en
stock, dos personas pueden comprarla al mismo tiempo.

**Solución:** al crear el pedido se descuenta el stock y se guarda `reservado_hasta`
(+30 min). Un comando programado libera las reservas vencidas cuyo pedido siga
`Pendiente`. El webhook, al confirmar, convierte la reserva en venta.

En un hosting compartido no hay worker persistente, así que el comando corre por
**cron cada minuto** desde el hPanel:

```bash
php /home/usuario/api/artisan schedule:run
```

### 6.3 Qué pasa si Andreani no responde

La cotización en vivo mete una dependencia externa **en el camino crítico de la
compra**. Si la API de Andreani está caída, sin plan B no se puede comprar.

Propuesta:
1. Timeout corto (3 s) y un reintento.
2. Si falla, caer a una **tabla de tarifas de respaldo** por zona, cargada a mano en el
   panel, y marcar el pedido con `cotizacion_envio.origen = "respaldo"`.
3. Cachear las cotizaciones por `(codigo_postal, peso)` unos minutos: el mismo carrito
   se cotiza varias veces mientras el cliente completa el formulario.

Esa tabla de respaldo es exactamente la opción "tarifa fija por zona" que descartamos.
Sugiero cargarla igual: cuesta poco y es el seguro de la venta.

### 6.4 Rate limiting

`POST /api/consultas` y `POST /api/pedidos` abiertos sin límite son un imán para spam
y para pedidos basura que consumen reservas de stock. Throttle nativo de Laravel:
consultas 5/hora por IP, pedidos 10/hora.

---

## 7. Qué falta definir

No bloquean el arranque, pero hay que resolverlos antes del checkout:

1. **Zona de cobertura.** ¿Se envía a todo el país o hay provincias excluidas?
2. **Retiro en el taller** (Rosario) como opción de envío con costo cero.
3. **Umbral de envío gratis**, si va a existir.
4. **Emails transaccionales.** Confirmación de compra y aviso de despacho: ¿desde
   Laravel con SMTP del hosting, o con un servicio externo?
5. **Credenciales de Andreani.** La cotización en vivo requiere contrato y cuenta de
   API — conviene confirmar que ya están antes de construir contra esa integración.

---

## 8. Orden de implementación sugerido

| # | Qué | Desbloquea |
|---|---|---|
| 1 | Migraciones + modelos + seeders | Todo lo demás |
| 2 | Endpoints públicos de catálogo | Reemplazar el mock de la galería |
| 3 | Ficha de producto en el sitio | Prerender de las fichas |
| 4 | CRUD de productos en el panel | Que el cliente cargue el catálogo real |
| 5 | Carrito (estado en el cliente) | Checkout |
| 6 | Cotización de envío + respaldo | Checkout |
| 7 | Pedidos + MercadoPago + webhook | Vender |
| 8 | Pantalla de pedidos del panel | Operar |

Los pasos 2 a 4 ya dan valor sin necesidad de tener el checkout terminado.
