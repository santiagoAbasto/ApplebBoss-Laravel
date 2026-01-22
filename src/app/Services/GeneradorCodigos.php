<?php

namespace App\Services;

use App\Models\Secuencia;
use Illuminate\Support\Facades\DB;

class GeneradorCodigos
{
    public static function siguienteVenta(): string
    {
        return self::siguiente('ventas', 'AT-V', 3);
    }

    public static function siguienteServicioTecnico(): string
    {
        return self::siguiente('servicio_tecnico', 'AT-ST', 3);
    }

    private static function siguiente(string $clave, string $prefijo, int $pad): string
    {
        return DB::transaction(function () use ($clave, $prefijo, $pad) {

            // Lock row (no duplica aunque 10 vendan al mismo tiempo)
            $seq = Secuencia::where('clave', $clave)->lockForUpdate()->first();

            if (!$seq) {
                $seq = Secuencia::create(['clave' => $clave, 'ultimo_numero' => 0]);
                $seq->refresh();
            }

            $seq->ultimo_numero = $seq->ultimo_numero + 1;
            $seq->save();

            return $prefijo . str_pad((string)$seq->ultimo_numero, $pad, '0', STR_PAD_LEFT);
        });
    }
}
