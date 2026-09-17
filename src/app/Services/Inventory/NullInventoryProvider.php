<?php

namespace App\Services\Inventory;

/**
 * Proveedor nulo — para entornos locales y tests.
 * NUNCA registrar este proveedor en producción.
 */
class NullInventoryProvider implements InventoryProviderInterface
{
    public function getStock(string $externalId): ?int
    {
        return null;
    }

    public function getPrice(string $externalId): ?float
    {
        return null;
    }

    public function syncAll(): SyncResult
    {
        return new SyncResult();
    }

    public function isEnabled(): bool
    {
        return false;
    }
}
