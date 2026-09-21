<?php

namespace App\Support;

use Carbon\CarbonInterface;

/**
 * La garantía que le toca a cada producto de una venta, según los plazos de config/documentos.php.
 * La condición (nuevo o seminuevo) nunca se adivina: si el producto no la tiene cargada, no se imprime plazo.
 */
class GarantiaDeVenta
{
    /** @return array{etiqueta: string, meses: int, vence: CarbonInterface}|null */
    public static function cobertura(string $tipo, mixed $producto, ?CarbonInterface $fechaVenta): ?array
    {
        $meses = config('documentos.garantia.meses');

        if (in_array($tipo, ['celular', 'computadora', 'producto_apple'], true)) {
            $clave = match (CondicionInventario::de($producto)) {
                'Nuevo'     => 'equipo_nuevo',
                'Seminuevo' => 'equipo_seminuevo',
                default     => null,
            };
        } else {
            $texto = mb_strtolower(($producto->tipo ?? '') . ' ' . ($producto->nombre ?? ''));
            $clave = preg_match('/cargador|cubo|adaptador de corriente/u', $texto)
                ? (str_contains($texto, 'original') ? 'cargador_original' : 'cargador_certificado')
                : null;
        }

        if (! $clave || empty($meses[$clave]) || ! $fechaVenta) {
            return null;
        }

        return [
            'etiqueta' => ['equipo_nuevo' => 'Equipo nuevo', 'equipo_seminuevo' => 'Equipo seminuevo',
                'cargador_original' => 'Cargador original Apple', 'cargador_certificado' => 'Cargador certificado'][$clave],
            'meses'    => (int) $meses[$clave],
            'vence'    => $fechaVenta->copy()->addMonthsNoOverflow((int) $meses[$clave]),
        ];
    }
}
