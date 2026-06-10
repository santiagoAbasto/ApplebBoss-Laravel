<?php

namespace App\Services;

use App\Models\Secuencia;
use Illuminate\Support\Facades\DB;

class GeneradorCodigos
{
    public static function siguienteVenta(): string
    {
        return self::previsualizar('ventas', 'AT-V', 3);
    }

    public static function siguienteServicioTecnico(): string
    {
        return self::previsualizar('servicio_tecnico', 'AT-ST', 3);
    }

    public static function siguienteReserva(): string
    {
        return self::previsualizar('reservas', 'AT-R', 3);
    }

    public static function crearVentaConCodigo(callable $callback): mixed
    {
        return self::crearConCodigo('ventas', 'AT-V', 3, $callback);
    }

    public static function crearServicioTecnicoConCodigo(callable $callback): mixed
    {
        return self::crearConCodigo('servicio_tecnico', 'AT-ST', 3, $callback);
    }

    public static function crearReservaConCodigo(callable $callback): mixed
    {
        return self::crearConCodigo('reservas', 'AT-R', 3, $callback);
    }

    public static function sincronizarSecuencia(string $clave, int $numero): void
    {
        if ($numero <= 0) {
            return;
        }

        DB::transaction(function () use ($clave, $numero) {
            $seq = Secuencia::where('clave', $clave)->lockForUpdate()->first();

            if (! $seq) {
                Secuencia::create([
                    'clave' => $clave,
                    'ultimo_numero' => $numero,
                ]);

                return;
            }

            if ((int) $seq->ultimo_numero < $numero) {
                $seq->ultimo_numero = $numero;
                $seq->save();
            }
        });
    }

    private static function previsualizar(string $clave, string $prefijo, int $pad): string
    {
        $ultimoNumero = (int) Secuencia::where('clave', $clave)->value('ultimo_numero');

        return $prefijo . str_pad((string) ($ultimoNumero + 1), $pad, '0', STR_PAD_LEFT);
    }

    private static function crearConCodigo(string $clave, string $prefijo, int $pad, callable $callback): mixed
    {
        return DB::transaction(function () use ($clave, $prefijo, $pad, $callback) {

            // Lock row (no duplica aunque 10 vendan al mismo tiempo)
            $seq = Secuencia::where('clave', $clave)->lockForUpdate()->first();

            if (!$seq) {
                $seq = Secuencia::create(['clave' => $clave, 'ultimo_numero' => 0]);
                $seq->refresh();
            }

            $seq->ultimo_numero = $seq->ultimo_numero + 1;
            $seq->save();

            $codigo = $prefijo . str_pad((string) $seq->ultimo_numero, $pad, '0', STR_PAD_LEFT);

            return $callback($codigo);
        });
    }
}
