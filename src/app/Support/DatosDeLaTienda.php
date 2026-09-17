<?php

namespace App\Support;

use App\Models\ConfiguracionTienda;
use App\Models\StoreLocation;

/**
 * El nombre, el teléfono y la dirección que van al pie de los PDF.
 *
 * Salen del panel: el nombre de Tienda online → Configuración y el contacto del local principal de
 * Tienda online → Ubicaciones. Antes estaban escritos a mano en cada plantilla.
 */
class DatosDeLaTienda
{
    public static function paraPdf(): array
    {
        $local    = StoreLocation::principal();
        $whatsapp = ConfiguracionTienda::waEnabled() ? ConfiguracionTienda::waNumber() : null;
        $telefono = $local?->phone ?: ($local?->whatsapp ?: $whatsapp);

        $direccion = collect([$local?->address, $local?->city])->filter()->unique()->implode(', ');

        return [
            'nombre'    => ConfiguracionTienda::nombre(),
            'telefono'  => $telefono ? '+' . ltrim(preg_replace('/[^0-9]/', '', $telefono), '+') : null,
            'direccion' => $direccion ?: null,
        ];
    }
}
