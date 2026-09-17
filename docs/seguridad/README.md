# Seguridad — Apple Boss

Auditoría de seguridad de extremo a extremo (16-sep-2026). Método: skill `security-audit` de Cloudflare (reconocimiento + registro de cobertura de 32 unidades) + revisión de código (caja blanca) + pruebas contra el Docker local (caja negra) + carga con k6. Todo en `127.0.0.1`; nunca contra el dominio público ni el túnel.

> **Estado: los 6 hallazgos están corregidos y verificados**, más 2 controles nuevos a pedido (blindaje público H7, horario del vendedor H8) y el token de n8n con alcance separado + rotación (H5). **575 pruebas en verde.** Detalle en el reporte (§8) y en la guía.

## Empezá por acá
- **[REPORTE-SEGURIDAD.md](REPORTE-SEGURIDAD.md)** — el reporte completo: resumen ejecutivo, los hallazgos con evidencia, **estado de remediación**, blindaje de la parte pública (H7), positivos, endurecimiento y resultados de las pruebas.
- **[GUIA-TRIBUNAL.md](GUIA-TRIBUNAL.md)** — el **paso a paso, comando por comando**, para regenerar caja negra + caja blanca + carga (k6) en vivo, con guion de defensa.
- **[hallazgos.json](hallazgos.json)** — los hallazgos (con estado) en formato leíble por máquina.

## Diagramas (HTML interactivo, tema claro/oscuro, exportable)
- **[diagramas/arquitectura-confianza.html](diagramas/arquitectura-confianza.html)** — arquitectura y límites de confianza.
- **[diagramas/hallazgos-seguridad.html](diagramas/hallazgos-seguridad.html)** — los 6 hallazgos mapeados del actor al recurso, con severidad por color.

## Resumen de hallazgos
| # | Sev | Hallazgo | Estado |
|---|-----|----------|--------|
| H1 | 🔴 Alta | Límites por IP burlables con `X-Forwarded-For` (login incluido) | ✅ Corregido |
| H2 | 🔴 Alta | El vendedor ve costo, procedencia e IMEI en crear/editar venta y reservas activas | ✅ Corregido |
| H3 | 🟠 Media | SSRF ciego en el PDF de cotización (dompdf `enable_remote`) | ✅ Corregido |
| H4 | 🟠 Media | OAuth de Google Drive sin `state` | ✅ Corregido |
| H5 | 🟠 Media | El token de n8n abre el reporte de ganancia de toda la tienda | ✅ Corregido |
| H6 | 🟡 Baja | «Olvidé mi contraseña» enumera correos | ✅ Corregido |
| H7 | 🛡️ Refuerzo | Blindaje público: bots, inyección y cookies | ✅ Reforzado |
| H8 | ⏰ Control | Horario laboral: el vendedor no inicia sesión fuera de 09–13 / 14–19 | ✅ Nuevo |

## Pruebas
- `pruebas/k6/` · `pruebas/resultados/` — scripts y resultados de k6 (humo, carga, pico, límites) y caja negra (83 comprobaciones).
- `pruebas/registro-cobertura.json` — las 32 unidades de cobertura.
- `pruebas/caja-negra-sondeo.py` — el sondeo de caja negra.
- `arquitectura-resumen.md` — resumen de arquitectura del reconocimiento.

> Nota: la skill lanza 12 agentes de caza en paralelo; en esta corrida se cortaron por el límite de sesión de la cuenta. El reconocimiento, la cobertura, la caja negra y k6 quedaron completos, y la caza se terminó a mano revisando el código y confirmando cada hallazgo con una prueba local reproducible.
