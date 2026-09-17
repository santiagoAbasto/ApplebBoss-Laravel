#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Demo en vivo del hallazgo H1 (límites por IP burlables con X-Forwarded-For).
# Muestra ANTES (confiando en todos los proxies, como estaba) y DESPUÉS (el fix).
# Es seguro: hace una copia de tu .env, lo restaura al final y limpia la config.
# Solo lee/prueba contra el Docker local (127.0.0.1:8010). No usa credenciales.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

BASE="http://127.0.0.1:8010"
APP_DIR="$(cd "$(dirname "$0")/../../.." && pwd)/src"   # …/ApplebBoss-Laravel/src
ENV="$APP_DIR/.env"
CONTENEDOR="appleboss-app"

echo "== Carpeta de la app: $APP_DIR"
[ -f "$ENV" ] || { echo "No encuentro $ENV"; exit 1; }

respaldo="$ENV.bak-demo-$$"
cp "$ENV" "$respaldo"
restaurar() { cp "$respaldo" "$ENV"; rm -f "$respaldo"; docker exec "$CONTENEDOR" php artisan config:clear >/dev/null 2>&1 || true; echo "== .env restaurado."; }
trap restaurar EXIT

fijar_proxies() {   # $1 = valor de TRUSTED_PROXIES
  # quita cualquier línea TRUSTED_PROXIES y agrega la nueva
  grep -v '^TRUSTED_PROXIES=' "$ENV" > "$ENV.tmp" || true
  echo "TRUSTED_PROXIES=$1" >> "$ENV.tmp"
  mv "$ENV.tmp" "$ENV"
  docker exec "$CONTENEDOR" php artisan config:clear >/dev/null 2>&1 || true
}

rafaga_xff() {      # 65 pedidos con X-Forwarded-For rotando; imprime el primer 429
  local primero=""
  for i in $(seq 1 65); do
    code=$(curl -s -o /dev/null -w '%{http_code}' -H 'Accept: application/json' \
      -H "X-Forwarded-For: 45.77.$i.9" "$BASE/api/buscar?q=demo")
    if [ "$code" = "429" ] && [ -z "$primero" ]; then primero=$i; fi
    sleep 0.02
  done
  echo "${primero:-ninguno}"
}

echo
echo "############ ANTES DEL FIX (TRUSTED_PROXIES=*  → confiar en todos) ############"
echo "   Esperar ~60 s para que se limpie la ventana del límite…"; sleep 62
fijar_proxies '*'
echo "   Lanzando 65 pedidos con X-Forwarded-For rotando…"
antes=$(rafaga_xff)
echo "   → primer 429: $antes   (si es 'ninguno' = el límite se BURLA ❌)"

echo
echo "############ DESPUÉS DEL FIX (TRUSTED_PROXIES vacío → no confiar en nadie) ####"
echo "   Esperar ~60 s para que se limpie la ventana del límite…"; sleep 62
fijar_proxies ''
echo "   Lanzando 65 pedidos con X-Forwarded-For rotando…"
despues=$(rafaga_xff)
echo "   → primer 429: $despues   (un número ~61 = el límite SE RESPETA ✔)"

echo
echo "############ RESUMEN ############"
echo "   ANTES  (confiar en *):   primer 429 = $antes"
echo "   DESPUÉS (no confiar):    primer 429 = $despues"
echo "   Conclusión: con el fix, falsear X-Forwarded-For ya no reparte los pedidos"
echo "   en IPs distintas, así que el límite (y el bloqueo de login) vuelve a valer."
