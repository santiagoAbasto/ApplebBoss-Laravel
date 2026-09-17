<?php

namespace App\Http\Controllers\Api\V1;

/**
 * @OA\Info(
 *     title="Apple Boss — API Pública v1",
 *     version="1.2.0",
 *     description="API pública de catálogo de productos Apple Boss Bolivia.
 *
 * **Reglas de seguridad:**
 * - Nunca se expone: precio de costo, ganancia, IMEI (ni su estado), procedencia o proveedor, notas internas ni datos financieros.
 * - El número de serie de celulares y computadoras sí se muestra en el detalle del producto.
 * - El precio devuelto es siempre el precio de venta público vigente (determinado por el backend).
 * - No se acepta precio enviado desde el frontend como autoridad.
 *
 * **Condición:** Nuevo o Seminuevo se elige al cargar el producto al inventario; si cambia allí, la API la devuelve actualizada.",
 *     @OA\Contact(
 *         email="info@appleboss.bo",
 *         name="Apple Boss Bolivia"
 *     )
 * )
 *
 * @OA\Server(
 *     url="/api/v1",
 *     description="API Pública v1"
 * )
 *
 * @OA\PathItem(path="/api/v1")
 *
 * @OA\Schema(
 *     schema="ProductoListItem",
 *     type="object",
 *     @OA\Property(property="id",                  type="integer",     example=42,            description="ID interno de la publicación"),
 *     @OA\Property(property="slug",                type="string",      example="iphone-15-pro-256gb-negro",  description="Slug único para la URL"),
 *     @OA\Property(property="titulo",              type="string",      example="iPhone 15 Pro 256GB",        description="Nombre comercial del producto"),
 *     @OA\Property(property="subtitulo",           type="string",      nullable=true,         description="Subtítulo o variante"),
 *     @OA\Property(property="resumen",             type="string",      nullable=true,         description="Descripción corta para listados"),
 *     @OA\Property(property="condicion",           type="string",      enum={"Nuevo","Seminuevo","Open Box","Reacondicionado"}, example="Seminuevo", description="Condición comercial explícita. Nuevo o Seminuevo vienen del inventario y se actualizan solos; Open Box y Reacondicionado se eligen en la publicación. Nunca se infiere."),
 *     @OA\Property(property="categoria",           type="string",      example="iphone",      description="Categoría principal"),
 *     @OA\Property(property="subcategoria",        type="string",      nullable=true,         description="Subcategoría"),
 *     @OA\Property(property="tags",                type="array",       @OA\Items(type="string")),
 *     @OA\Property(property="atributos",           type="object",      description="Atributos técnicos (color, capacidad, chip, etc.)"),
 *     @OA\Property(property="garantia",            type="string",      nullable=true,         example="12 meses",   description="Descripción de la garantía"),
 *     @OA\Property(property="badge",               type="string",      nullable=true,         example="Nuevo ingreso"),
 *     @OA\Property(property="destacado",           type="boolean",     example=true),
 *     @OA\Property(property="disponible",          type="boolean",     example=true,          description="Disponibilidad según inventario"),
 *     @OA\Property(property="precio",              type="number",      format="float",        nullable=true, example=4999.00, description="Precio de venta público en BOB — establecido por el backend, nunca por frontend"),
 *     @OA\Property(property="precio_promocional",  type="number",      format="float",        nullable=true, example=4299.00, description="Precio promocional vigente (null si no hay promoción activa)"),
 *     @OA\Property(property="imagen_principal",    type="object",      nullable=true,
 *         @OA\Property(property="url", type="string", example="/storage/productos/iphone15pro.jpg"),
 *         @OA\Property(property="alt", type="string", example="iPhone 15 Pro 256GB Negro")
 *     ),
 *     @OA\Property(property="seo_title",           type="string",      nullable=true),
 *     @OA\Property(property="seo_description",     type="string",      nullable=true)
 * )
 *
 * @OA\Schema(
 *     schema="ProductoDetalle",
 *     allOf={
 *         @OA\Schema(ref="#/components/schemas/ProductoListItem")
 *     },
 *     @OA\Property(property="descripcion",         type="string",      nullable=true,         description="Descripción completa del producto"),
 *     @OA\Property(property="que_incluye",         type="string",      nullable=true,         description="Contenido incluido en el paquete"),
 *     @OA\Property(property="observaciones",       type="string",      nullable=true,         description="Observaciones públicas"),
 *     @OA\Property(property="numero_serie",        type="string",      nullable=true,         example="C02XYZ123ABC", description="Número de serie del equipo (solo celulares y computadoras). Nunca es un IMEI."),
 *     @OA\Property(property="imagenes",            type="array",
 *         @OA\Items(
 *             @OA\Property(property="url",          type="string"),
 *             @OA\Property(property="alt",          type="string"),
 *             @OA\Property(property="es_principal", type="boolean")
 *         )
 *     ),
 *     @OA\Property(property="compatibilidades",    type="array",
 *         @OA\Items(
 *             @OA\Property(property="nombre", type="string", example="iPhone 15 Pro"),
 *             @OA\Property(property="slug",   type="string", nullable=true)
 *         )
 *     )
 * )
 *
 * @OA\Schema(
 *     schema="PaginaMeta",
 *     type="object",
 *     @OA\Property(property="current_page", type="integer", example=1),
 *     @OA\Property(property="last_page",    type="integer", example=5),
 *     @OA\Property(property="per_page",     type="integer", example=24),
 *     @OA\Property(property="total",        type="integer", example=118)
 * )
 *
 * @OA\Schema(
 *     schema="Error404",
 *     type="object",
 *     @OA\Property(property="message", type="string", example="No query results for model")
 * )
 */
class SwaggerDefinitions {}
