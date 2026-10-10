<?php

namespace App\Support\Pagos;

use Illuminate\Support\Carbon;
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
 * El paralelo se mueve minuto a minuto y la fuente lo vuelve a medir cada 1 a 2 minutos. El programador
 * lo lee cada 30 segundos (tipo-cambio:actualizar, en routes/console.php) y las visitas solo leen lo
 * guardado: nadie espera a la fuente. Si el programador se atrasa, la visita la lee ella misma, a lo sumo
 * una vez por minuto, para que una fuente caída no frene la tienda.
 *
 * Si la fuente se cae, se usa el último valor conocido. Si tampoco hay, la tasa manual de
 * `BINANCE_PAY_TASA_BOB`. Y si no hay ninguna, no se cobra en cripto: nunca se inventa un
 * tipo de cambio ni se cae al oficial por descarte.
 */
class TipoDeCambio
{
    private const FUENTE  = 'https://api.dolarbluebolivia.click/v1/officialRate';
    private const VIGENTE = 300;       // una medición de hace más de 5 minutos ya no es «en vivo»
    private const ULTIMO  = 'tc.blue.ultimo';
    private const MOMENTO = 'tc.blue.momento';
    private const INTENTO = 'tc.blue.intento';

    /** Bolivianos por 1 USDT. 0 si no hay forma de saberlo. */
    public static function bobPorUsdt(): float
    {
        return self::detalle()['tasa'] ?? 0.0;
    }

    /**
     * La tasa, de dónde salió y cuándo la midió la fuente: 'live' (hace menos de 5 minutos), 'last_known' (la fuente
     * falló o se quedó atrás y vale el último valor bueno) o 'manual' (BINANCE_PAY_TASA_BOB). null si no hay ninguna.
     */
    public static function detalle(): ?array
    {
        $momento = Cache::get(self::MOMENTO);
        if (! self::reciente($momento) && Cache::add(self::INTENTO, true, 60)) {
            self::actualizar();
            $momento = Cache::get(self::MOMENTO);
        }

        // Si la fuente falló, el último valor bueno sirve más que quedarse sin cobrar
        $tasa = (float) Cache::get(self::ULTIMO, 0);
        if ($tasa > 0) {
            return ['tasa' => $tasa, 'origen' => self::reciente($momento) ? 'live' : 'last_known', 'momento' => $momento];
        }

        $manual = (float) config('pagos.binance.tasa_bob', 0);

        return $manual > 0 ? ['tasa' => $manual, 'origen' => 'manual', 'momento' => null] : null;
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

    /** Lee la fuente y guarda la tasa. null si falló o dio un valor absurdo: en ese caso queda la anterior. */
    public static function actualizar(): ?float
    {
        try {
            $r = Http::timeout(5)->acceptJson()->get(self::FUENTE);
        } catch (\Throwable $e) {
            Log::warning('No se pudo leer el dólar paralelo: ' . $e->getMessage());

            return null;
        }

        if (! $r->successful()) {
            return null;
        }

        $tasa = (float) $r->json('data.blue.buy', 0);

        // Un valor absurdo (o el oficial disfrazado) es peor que no tener ninguno
        if ($tasa < 5 || $tasa > 100) {
            Log::warning("El dólar paralelo devolvió un valor fuera de rango: {$tasa}");

            return null;
        }

        // La hora en que la fuente midió el mercado, no la de esta consulta: si la fuente se queda pegada, se nota
        $momento = rescue(fn () => Carbon::parse($r->json('data.fetched_at'))->setTimezone(config('app.timezone'))->min(now()), now(), false);

        Cache::put(self::ULTIMO, $tasa, now()->addDays(7));
        Cache::put(self::MOMENTO, $momento->toIso8601String(), now()->addDays(7));

        return $tasa;
    }

    private static function reciente(?string $momento): bool
    {
        return $momento !== null && Carbon::parse($momento)->gte(now()->subSeconds(self::VIGENTE));
    }
}
