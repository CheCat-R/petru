#!/usr/bin/env bash
# =============================================================================
# Pëtru — deploy a Hostinger por SSH. Correr desde Git Bash en Windows:
#
#   export PETRU_SSH="u123456789@123.45.67.89" PETRU_PORT=65002
#   ./deploy/deploy.sh env      # primera vez: sube el .env completado
#   ./deploy/deploy.sh api
#   ./deploy/deploy.sh sitio
#   ./deploy/deploy.sh panel
#   ./deploy/deploy.sh todo     # api + sitio + panel
#
# Usuario, host y puerto salen de hPanel → Avanzado → Acceso SSH. Conviene
# cargar la clave pública ahí para no tipear la contraseña en cada subida.
#
# Qué hace cada parte:
#   env   : sube deploy/api.env.production como .env, solo si el servidor no tiene uno.
#   api   : sube la app Laravel a ~/domains/petru.com.ar/laravel (fuera de lo
#           público; sin .env, storage/ ni vendor/), el puente a public_html/api,
#           corre composer, migraciones, storage:link y cachea config/rutas.
#   sitio : npm run build (con .env.production → prerender contra la API real)
#           y sube build/client a ~/domains/petru.com.ar/public_html.
#   panel : npm run build y sube dist a ~/domains/petru.com.ar/public_html/panel.
#
# Estructura en Hostinger (subdominios con "carpeta personalizada"):
#   domains/petru.com.ar/laravel            ← app Laravel
#   domains/petru.com.ar/public_html        ← sitio (petru.com.ar)
#   domains/petru.com.ar/public_html/api    ← api.petru.com.ar (puente)
#   domains/petru.com.ar/public_html/panel  ← panel.petru.com.ar
# =============================================================================
set -euo pipefail

: "${PETRU_SSH:?Definí PETRU_SSH=usuario@host (hPanel → Acceso SSH)}"
PORT="${PETRU_PORT:-65002}"
DOMINIO="${PETRU_DOMINIO:-petru.com.ar}"
SSH="ssh -p $PORT $PETRU_SSH"

RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
REMOTO_LARAVEL="domains/$DOMINIO/laravel"
REMOTO_API="domains/$DOMINIO/public_html/api"
REMOTO_SITIO="domains/$DOMINIO/public_html"
REMOTO_PANEL="domains/$DOMINIO/public_html/panel"

subir() { # subir <carpeta local> <carpeta remota> [excludes...]
  local local_dir="$1" remoto="$2"; shift 2
  local excludes=()
  for e in "$@"; do excludes+=(--exclude="$e"); done
  echo "→ $local_dir  ⇒  $PETRU_SSH:$remoto"
  $SSH "mkdir -p '$remoto'"
  tar -C "$local_dir" "${excludes[@]}" -czf - . | $SSH "tar -xzf - -C '$remoto'"
}

deploy_env() {
  local archivo="$RAIZ/deploy/api.env.production"
  if [ ! -f "$archivo" ]; then
    echo "Copiá deploy/api.env.production.example a deploy/api.env.production y completalo."
    exit 1
  fi
  if grep -q "<" "$archivo"; then
    echo "!! Todavía hay valores <sin completar> en $archivo"
    exit 1
  fi
  $SSH "mkdir -p ~/$REMOTO_LARAVEL; if [ -f ~/$REMOTO_LARAVEL/.env ]; then echo 'Ya hay un .env en el servidor: no se pisa.'; cat >/dev/null; else cat > ~/$REMOTO_LARAVEL/.env && echo '.env creado'; fi" < "$archivo"
}

deploy_api() {
  echo "== API =="
  subir "$RAIZ/API" "$REMOTO_LARAVEL" \
    .env '.env.*' .git node_modules vendor 'storage/logs/*' 'storage/framework/cache/data/*' \
    'storage/framework/sessions/*' 'storage/framework/views/*' 'storage/app/public/*' tests .phpunit.result.cache
  subir "$RAIZ/deploy/api-public_html" "$REMOTO_API"

  $SSH bash -s <<EOF
set -e
cd ~/$REMOTO_LARAVEL
rm -f ~/$REMOTO_API/default.php
if [ ! -f .env ]; then
  echo "!! Falta ~/$REMOTO_LARAVEL/.env — corré primero: ./deploy/deploy.sh env"
  exit 1
fi
composer install --no-dev --optimize-autoloader --no-interaction --quiet
# APP_KEY solo la primera vez: regenerarla rompería las sesiones y lo cifrado (credenciales).
if ! grep -Eq '^APP_KEY=base64:' .env; then php artisan key:generate --force --no-interaction; fi
php artisan migrate --force --no-interaction
# El link de storage apunta a public_html/api/storage (el puente usa usePublicPath).
rm -rf ~/$REMOTO_API/storage
ln -s ~/$REMOTO_LARAVEL/storage/app/public ~/$REMOTO_API/storage
php artisan optimize:clear >/dev/null
php artisan config:cache && php artisan route:cache && php artisan event:cache
chmod -R ug+rwX storage bootstrap/cache
echo "API lista: \$(php artisan --version)"
EOF
}

deploy_sitio() {
  echo "== Sitio =="
  (cd "$RAIZ/Sitio_web" && npm run build)
  subir "$RAIZ/Sitio_web/build/client" "$REMOTO_SITIO"
  echo "Sitio subido a https://$DOMINIO"
}

deploy_panel() {
  echo "== Panel =="
  (cd "$RAIZ/panel-dashboard" && npm run build)
  cp "$RAIZ/deploy/panel.htaccess" "$RAIZ/panel-dashboard/dist/.htaccess"
  subir "$RAIZ/panel-dashboard/dist" "$REMOTO_PANEL"
  $SSH "rm -f ~/$REMOTO_PANEL/default.php"
  echo "Panel subido a https://panel.$DOMINIO"
}

case "${1:-}" in
  env)   deploy_env ;;
  api)   deploy_api ;;
  sitio) deploy_sitio ;;
  panel) deploy_panel ;;
  todo)  deploy_api; deploy_sitio; deploy_panel ;;
  *) echo "Uso: $0 env|api|sitio|panel|todo"; exit 1 ;;
esac
