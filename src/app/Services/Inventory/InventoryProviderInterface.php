<?php

namespace App\Services\Inventory;

/**
 * Contrato para proveedores de inventario externos.
 *
 * Implementaciones concretas:
 *   - NullInventoryProvider  → para local / tests (nunca producción)
 *   - ExternalInventoryProvider → conecta al proveedor real cuando esté disponible
 *
 * NUNCA exponer datos de este contrato directamente al frontend público.
 */
interface InventoryProviderInterface
{
    /**
     * Obtiene el stock disponible para un external_id dado.
     * Retorna null si el proveedor no tiene el dato.
     */
    public function getStock(string $externalId): ?int;

    /**
     * Obtiene el precio de venta desde el proveedor.
     * BACKEND ES AUTORIDAD. Frontend nunca envía precio.
     */
    public function getPrice(string $externalId): ?float;

    /**
     * Sincroniza todos los productos disponibles en el proveedor.
     * Retorna un resumen de la sincronización.
     */
    public function syncAll(): SyncResult;

    /**
     * Indica si este proveedor está habilitado y configurado.
     */
    public function isEnabled(): bool;
}
