#!/usr/bin/env bash
# Respaldo de Apple Boss en el VPS: la base todos los días y los archivos subidos (fotos, PDF, trade-in) una vez
# por semana. Lo corre cron (ver --instalar-cron). Todo queda en ~/respaldos, fuera del repositorio y de los contenedores.
#
#   bash docker/production/respaldo-db.sh                  respaldo de hoy (base; y archivos si es domingo)
#   bash docker/production/respaldo-db.sh --archivos       fuerza también el respaldo de archivos
#   bash docker/production/respaldo-db.sh --instalar-cron  deja programado el respaldo diario a las 03:30 UTC (23:30 en Bolivia)
#
# Restaurar la base (en una ventana de mantenimiento, después de guardar un respaldo del estado actual):
#   docker compose -f docker-compose.production.yml exec -T db sh -c 'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner' < ~/respaldos/base-AAAAMMDD-HHMM.dump
# Restaurar los archivos:
#   docker compose -f docker-compose.production.yml exec -T app tar xzf - -C /var/www/html/storage < ~/respaldos/archivos-AAAAMMDD-HHMM.tgz
set -euo pipefail

PROYECTO=${PROYECTO:-$HOME/apps/appleboss}
COMPOSE=${COMPOSE:-docker-compose.production.yml}
DESTINO=${DESTINO:-$HOME/respaldos}
DIAS=${DIAS:-14}                    # respaldos diarios de la base que se conservan
SEMANAS=${SEMANAS:-4}               # respaldos semanales de archivos que se conservan
MINIMO_TABLAS=${MINIMO_TABLAS:-50}  # producción tiene 62 tablas con datos; menos que esto es un respaldo roto

if [ "${1:-}" = "--instalar-cron" ]; then
  LINEA="30 3 * * * cd $PROYECTO && bash docker/production/respaldo-db.sh >> $DESTINO/respaldo.log 2>&1"
  mkdir -p "$DESTINO"
  ( crontab -l 2>/dev/null | grep -v 'respaldo-db.sh' || true; echo "$LINEA" ) | crontab -
  echo "cron instalado: $LINEA"
  exit 0
fi

cd "$PROYECTO"
mkdir -p "$DESTINO"
DC="docker compose -f $COMPOSE"
FECHA=$(date +%Y%m%d-%H%M)
BASE="$DESTINO/base-$FECHA.dump"

# 1. La base, en el formato propio de PostgreSQL (comprimido; se restaura con pg_restore)
$DC exec -T db sh -c 'pg_dump -Fc -U "$POSTGRES_USER" "$POSTGRES_DB"' > "$BASE"

# 2. Comprobación: pg_restore lee el archivo entero y cuenta las tablas con datos
TABLAS=$($DC exec -T db pg_restore --list < "$BASE" | grep -c 'TABLE DATA' || true)
if [ "$TABLAS" -lt "$MINIMO_TABLAS" ]; then
  mv "$BASE" "$BASE.roto"
  echo "$(date '+%F %T') ERROR: el respaldo tiene $TABLAS tablas con datos (mínimo $MINIMO_TABLAS); quedó como $BASE.roto"
  exit 1
fi
RESUMEN="base $(du -h "$BASE" | cut -f1) · $TABLAS tablas"

# 3. Los archivos subidos (storage/app): los domingos o con --archivos
if [ "$(date +%u)" = 7 ] || [ "${1:-}" = "--archivos" ]; then
  ARCHIVOS="$DESTINO/archivos-$FECHA.tgz"
  $DC exec -T app tar czf - -C /var/www/html/storage app > "$ARCHIVOS"
  gzip -t "$ARCHIVOS"
  RESUMEN="$RESUMEN · archivos $(du -h "$ARCHIVOS" | cut -f1)"
fi

# 4. Rotación: solo respaldos viejos de esta carpeta; el de hoy nunca entra en el filtro
find "$DESTINO" -maxdepth 1 -name 'base-*.dump' -mtime +"$DIAS" -delete
find "$DESTINO" -maxdepth 1 -name 'archivos-*.tgz' -mtime +"$((SEMANAS * 7))" -delete

echo "$(date '+%F %T') OK $RESUMEN · guardados: $(ls "$DESTINO"/base-*.dump | wc -l | tr -d ' ') de base, $(ls "$DESTINO"/archivos-*.tgz 2>/dev/null | wc -l | tr -d ' ') de archivos · libre en disco: $(df -h "$DESTINO" | awk 'NR==2{print $4}')"
