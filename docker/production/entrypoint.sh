#!/bin/sh
set -eu

mkdir -p \
    bootstrap/cache \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs

chown -R www-data:www-data bootstrap/cache storage

if [ "${1:-}" = "php" ]; then
    exec gosu www-data "$@"
fi

exec docker-php-entrypoint "$@"
