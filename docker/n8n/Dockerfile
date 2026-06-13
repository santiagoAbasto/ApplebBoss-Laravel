FROM postgres:15-alpine AS pg-client

RUN set -eu; \
    mkdir -p /pg-client/bin /pg-client/lib; \
    for bin in pg_dump pg_restore psql; do \
        cp "/usr/local/bin/${bin}" "/pg-client/bin/${bin}"; \
        ldd "/usr/local/bin/${bin}" \
            | awk '{ for (i = 1; i <= NF; i++) if ($i ~ /^\//) print $i }' \
            | sort -u \
            | while read -r lib; do cp "$lib" /pg-client/lib/; done; \
    done

FROM n8nio/n8n:latest

USER root
COPY --from=pg-client /pg-client/bin/ /usr/local/bin/
COPY --from=pg-client /pg-client/lib/ /opt/pg-client/lib/
ENV LD_LIBRARY_PATH=/opt/pg-client/lib

USER node
