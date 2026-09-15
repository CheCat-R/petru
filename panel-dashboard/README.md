# Pëtru — Panel de administración

Panel del taller, sobre el cascarón del **CheCAT Panel** (React 19 + MUI 9 + Vite).
Habla con la API de Laravel en `../API/`.

## Dos capas en un mismo repo

| | Módulos | Datos | Estado |
|---|---|---|---|
| **Pëtru** | `src/modules/petru/` — Dashboard, Catálogo (productos + categorías + imágenes), Pedidos, Consultas | **Laravel**, vía `src/lib/apiClient.js` + TanStack Query | Lo que el taller usa |
| **ERP CheCAT** | los otros 18 módulos (`inventario/`, `finanzas/`, `marketing/`, …) | mocks síncronos en memoria | Oculto. Se activa con `VITE_MOSTRAR_ERP=true` |

Cuando el ERP está visible, sus pantallas de Dashboard/Productos/Pedidos quedan
tapadas por las de Pëtru (mismo path): esas tres ya tienen reemplazo real.

## Arranque local

```bash
npm install
cp .env.example .env     # VITE_API_URL, VITE_SITIO_URL, VITE_MOSTRAR_ERP
npm run dev              # http://localhost:5174 (el sitio usa 5173)
```

Necesita la API corriendo (`php artisan serve` en `../API/`). Usuario de
desarrollo: el que crea el seeder (`admin@petru.com.ar`).

## Sesión

Sanctum en **modo cookie**: `GET /sanctum/csrf-cookie` → `POST /api/auth/login`
→ cookie httpOnly. El token nunca pasa por JavaScript ni por `localStorage`.
`AuthContext` pregunta `GET /api/auth/usuario` al arrancar; cualquier 401
posterior vuelve al login con el motivo.

En producción: `SANCTUM_STATEFUL_DOMAINS=panel.petru.com.ar` y
`SESSION_DOMAIN=.petru.com.ar` del lado de Laravel, para que la cookie viaje
entre subdominios.

## Convenciones que se conservan del panel

- La UI habla con `api/`, nunca con `data/` — `npm run check:arch` lo verifica
  (encadenado al `build`).
- Primitivas compartidas en `src/components/` (`DataTable`, `EntityHeader`,
  `PageHeader`, `Modal`, `StatusBadge`, `Toolbar`, `Toast`): no se reinventan.
- Sin `setState` dentro de efectos (`react-hooks/set-state-in-effect`).
- Tokens de color del CSS (`var(--bg-surface)`, `var(--text-secondary)`…), nunca hex.

Ver `ARCHITECTURE.md` y `docs/` para el ERP; `../docs/MODELO-DOMINIO.md` para
el modelo de datos de Pëtru.

## Build y deploy

```bash
npm run build            # dist/ (corre check:arch primero)
```

Subir el contenido de `dist/` al document root de `panel.petru.com.ar`, con un
`.htaccess` que caiga a `index.html` para las rutas de la SPA:

```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [L]
```

Antes del build, `.env` con `VITE_API_URL=https://api.petru.com.ar` y
`VITE_SITIO_URL=https://petru.com.ar`.

## Lint

Hay 5 avisos preexistentes de `react-refresh/only-export-components` en los
contextos (`ToastContext`, `UIContext`, `ThemeContext`, `EntityLabelContext`,
`AuthContext`): exportan el hook junto al provider. No afectan al build.
