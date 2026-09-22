<?php

namespace App\Support\Pagos;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cuántos bolivianos vale 1 USDT, al dólar paralelo (blue).
 *
 * Se usa el paralelo y NO el oficial del banco: con el oficial (~Bs 11) se cobraría de
 * menos en cada venta, porque nadie consigue dólares a ese precio.
 *
 * De los dos lados del blue se toma `buy`, el más bajo. Razón: la tienda recibe USDT y
 * después los vende por bolivianos, y al venderlos le pagan el lado «compra». Además, al
 * ser el número menor, le pide MÁS USDT al cliente — el error, si lo hay, cae a favor de
 * la tienda y no en contra.
 *
 * Si la fuente se cae, se usa el último valor conocido. Si tampoco hay, la tasa manual de
 * `BINANCE_PAY_TASA_BOB`. Y si no hay ninguna, no se cobra en cripto: nunca se inventa un
 * tipo de cambio ni se cae al oficial por descarte.
 */
class TipoDeCambio
{
    private const FUENTE  = 'https://api.dolarbluebolivia.click/v1/officialRate';
    private const FRESCO  = 1800;      // media hora
    private const ULTIMO  = 'tc.blue.ultimo';

    /** Bolivianos por 1 USDT. 0 si no hay forma de saberlo. */
    public static function bobPorUsdt(): float
    {
        $tasa = Cache::remember('tc.blue', self::FRESCO, fn () => self::consultar());

        if ($tasa > 0) {
            return $tasa;
        }

        // La fuente falló: el último valor bueno sirve más que quedarse sin cobrar
        $ultimo = (float) Cache::get(self::ULTIMO, 0);

        return $ultimo > 0 ? $ultimo : (float) config('pagos.binance.tasa_bob', 0);
    }

    /** Lo que hay que cobrar en USDT por un precio en bolivianos. */
    public static function aUsdt(float $bolivianos): float
    {
        $tasa = self::bobPorUsdt();

        return $tasa > 0 ? round($bolivianos / $tasa, 2) : 0.0;
    }

    public static function disponible(): bool
    {
        return self::bobPorUsdt() > 0;
    }

    /** Para mostrar en la tienda de dónde sale el número. */
    public static function paraLaVista(): ?array
    {
        $tasa = self::bobPorUsdt();

        return $tasa > 0
            ? ['bob_por_usdt' => $tasa, 'fuente' => 'Dólar paralelo · dolarbluebolivia.click']
            : null;
    }

    private static function consultar(): float
    {
        try {
            $r = Http::timeout(8)->acceptJson()->get(self::FUENTE);
        } catch (\Throwable $e) {
            Log::warning('No se pudo leer el dólar paralelo: ' . $e->getMessage());

            return 0.0;
        }

        if (! $r->successful()) {
            return 0.0;
        }

        $tasa = (float) $r->json('data.blue.buy', 0);

        // Un valor absurdo (o el oficial disfrazado) es peor que no tener ninguno
        if ($tasa < 5 || $tasa > 100) {
            Log::warning("El dólar paralelo devolvió un valor fuera de rango: {$tasa}");

            return 0.0;
        }

        Cache::put(self::ULTIMO, $tasa, now()->addDays(7));

        return $tasa;
    }
}
