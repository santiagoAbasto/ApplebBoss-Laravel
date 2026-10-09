<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

/**
 * Un sistema externo autorizado a leer la API de integración (por ejemplo «APPLE BOSS AI»).
 * Los permisos (scopes) viven acá y no en cada token: al cambiarlos, rigen al instante para todos sus tokens.
 * Sistema → Integraciones API en el panel.
 */
class Integracion extends Model
{
    use HasApiTokens;

    protected $table = 'integraciones';

    protected $fillable = ['nombre', 'scopes', 'activa', 'creado_por'];

    protected $casts = ['scopes' => 'array', 'activa' => 'boolean'];

    /** Lo que puede leer un token, con la explicación que ve el panel. */
    public const SCOPES = [
        'integration.products.read'       => 'Productos: el inventario con sus datos y su publicación en la tienda',
        'integration.categories.read'     => 'Categorías del inventario',
        'integration.inventory.read'      => 'Disponibilidad: disponible, reservado, vendido y cantidades',
        'integration.pricing.read'        => 'Precios de venta y promociones',
        'integration.media.read'          => 'Fotos de los productos publicados',
        'integration.exchange_rates.read' => 'Tipo de cambio que usa la tienda',
    ];

    /** Pedidos por minuto de cada integración. */
    public const LIMITE_POR_MINUTO = 120;

    /** Cuánto sigue sirviendo un token viejo al generar uno nuevo con «que el anterior venza». */
    public const HORAS_DE_GRACIA = 24;

    public function solicitudes(): HasMany
    {
        return $this->hasMany(IntegracionSolicitud::class);
    }

    public function tieneScope(string $scope): bool
    {
        return in_array($scope, $this->scopes ?? [], true);
    }

    /** Un token nuevo. El texto plano se muestra una sola vez; en la base queda solo su hash. */
    public function emitirToken(string $nombre): string
    {
        return $this->createToken($nombre, ['*'])->plainTextToken;
    }
}
