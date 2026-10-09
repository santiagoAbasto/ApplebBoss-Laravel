# Fuentes de información comercial de Apple Boss

> Documento clave para cualquier sistema que combine datos de Apple Boss (por ejemplo, la futura plataforma de IA).
> Última revisión: 09-10-2026.

## La regla que no se rompe

**La API de integración de appleboss.com.bo es una fuente entre varias. No es el catálogo comercial completo de la empresa.**

Que un producto no aparezca en la API **no** quiere decir que Apple Boss no lo venda. Puede estar en el catálogo
comercial de Google Drive, conseguirse a pedido o venir de un proveedor. Un asistente nunca debe responder «no lo
vendemos» solo porque la API no lo tiene. La respuesta correcta es del estilo: «No tengo disponibilidad confirmada en
el inventario registrado; podemos consultar opciones a pedido».

## Las fuentes

| Fuente | Qué tiene | Quién manda | Cómo se lee | Estado |
|---|---|---|---|---|
| **A. Sistema Apple Boss** (appleboss.com.bo) | Inventario registrado unidad por unidad, precios de venta en BOB, disponibilidad, reservas, publicaciones de la tienda con fotos y fichas técnicas | El sistema, sobre sus propios registros | API de integración v1 (`/api/v1/integration`) | Implementada |
| **B. Catálogo comercial externo** (Google Drive) | Equipos nuevos, seminuevos y a pedido que pueden no estar registrados, precios referenciales, configuraciones, porcentajes de batería, accesorios, promociones, modelos de proveedores | El equipo comercial | El segundo proyecto lo procesa por su cuenta | Fuera de este sistema |
| **C. Fuentes futuras** | Listas de proveedores, PDF, hojas de cálculo, fotos, datos cargados a mano, promociones, cotizaciones, políticas, preguntas frecuentes, servicio técnico, pedidos especiales | Cada dueño de la fuente | El segundo proyecto | No implementadas |

El catálogo de Google Drive **no** se importa a Apple Boss y Apple Boss **no** se modifica para parecerse a él.

## Qué garantiza la fuente A

- Cada dato sale de un registro real del sistema. Nada se inventa ni se completa a partir del nombre.
- Cada producto trae `source.system = "appleboss"` y `source.source_type = "internal_inventory"`.
- La disponibilidad (`availability`) es la del momento del pedido. Tiene en cuenta reservas activas y pedidos en línea
  sin cerrar.
- Los precios están en BOB, con dos decimales, tal como se cargaron. No hay conversiones.
- Las fotos son las de la publicación visible en la tienda. Una unidad sin publicación no tiene fotos.

## Qué NO garantiza la fuente A

- Que esté todo lo que la empresa vende: hay productos sin registrar, a pedido y de proveedores.
- Marcas, variantes ni stock por sucursal: el sistema no los registra.
- Que un registro implique existencia física. `status = "available"` dice que el sistema la tiene como disponible.
  Para prometerla a un cliente conviene confirmarla.
- Un historial de borrados: si alguien borra un registro del inventario, `/changes` no lo informa.

## Lo que corresponde a la capa que une las fuentes (segundo proyecto)

Estas reglas se recomiendan para el segundo proyecto. **No** están implementadas en Apple Boss:

1. Guardar la procedencia de cada dato, campo por campo: de qué fuente salió y cuándo.
2. Comparar fechas de actualización antes de preferir un dato.
3. Distinguir el precio publicado (fuente A, `price_type = "list_price"`) de una cotización o precio referencial.
4. Distinguir «existe en el registro» de «está físicamente disponible».
5. Anotar las contradicciones entre fuentes en lugar de resolverlas solas.
6. No elegir automáticamente el precio más bajo ni el más alto.
7. No reemplazar el inventario por un documento desactualizado.
8. No descartar un producto porque la API no lo tenga.
9. Pedir verificación humana ante datos contradictorios.
10. No presentar una estimación como una confirmación.

Modelo de procedencia sugerido. Es un ejemplo conceptual, no un producto real:

```json
{
  "item": "iPhone 16 Pro",
  "sources": [
    { "type": "internal_api", "status": "not_found", "checked_at": "2026-10-09T12:00:00-04:00" },
    { "type": "commercial_catalog", "status": "listed", "document": "catalogo-drive", "price_reference": "a confirmar" }
  ],
  "verified_stock": false,
  "requires_confirmation": true
}
```

Ver también [APPLE_BOSS_AI_HANDOFF.md](APPLE_BOSS_AI_HANDOFF.md) y [APPLE_BOSS_API_CONTRACT.md](APPLE_BOSS_API_CONTRACT.md).
