<?php

namespace Tests\Feature;

use App\Support\Pagos\TipoDeCambio;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * El tipo de cambio con el que se cobra en cripto.
 *
 * Se usa el dólar PARALELO. Cobrar al oficial (~Bs 11 cuando el paralelo va por 12) sería
 * regalar plata en cada venta, así que estas pruebas cuidan sobre todo que nunca se caiga
 * al oficial ni se invente un número.
 */
class TipoDeCambioTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        config(['pagos.binance.tasa_bob' => null]);
    }

    private function fuenteResponde(array $data): void
    {
        Http::fake(['*dolarbluebolivia*' => Http::response(['data' => $data])]);
    }

    public function test_toma_el_paralelo_y_no_el_oficial(): void
    {
        $this->fuenteResponde([
            'blue'     => ['buy' => 12.12, 'sell' => 12.18],
            'official' => ['buy' => 11.0, 'sell' => 11.0],
        ]);

        $this->assertSame(12.12, TipoDeCambio::bobPorUsdt(), 'debe usar el blue, nunca el oficial');
    }

    public function test_usa_el_lado_compra_que_es_el_que_le_toca_a_la_tienda(): void
    {
        // La tienda recibe USDT y después los vende: le pagan el lado «compra».
        // Además, al ser el número menor, le pide más USDT al cliente.
        $this->fuenteResponde(['blue' => ['buy' => 12.00, 'sell' => 12.50]]);

        $this->assertSame(12.00, TipoDeCambio::bobPorUsdt());
        $this->assertSame(541.67, TipoDeCambio::aUsdt(6500));
    }

    public function test_un_valor_absurdo_se_descarta(): void
    {
        // Si la fuente devuelve el oficial disfrazado, un cero o una barbaridad,
        // es mejor no cobrar que cobrar mal
        foreach ([0, 1.5, 250] as $absurdo) {
            Cache::flush();
            $this->fuenteResponde(['blue' => ['buy' => $absurdo]]);

            $this->assertSame(0.0, TipoDeCambio::bobPorUsdt(), "{$absurdo} no puede aceptarse");
        }
    }

    public function test_si_la_fuente_se_cae_usa_el_ultimo_valor_bueno(): void
    {
        // Responde una vez y después deja de responder
        Http::fake(['*dolarbluebolivia*' => Http::sequence()->push(['data' => ['blue' => ['buy' => 12.30]]])->push([], 503)]);
        $this->assertSame(12.30, TipoDeCambio::bobPorUsdt());

        // Pasan 10 minutos sin lecturas
        $this->travel(10)->minutes();

        $this->assertSame(12.30, TipoDeCambio::bobPorUsdt(), 'el último bueno vale más que quedarse sin cobrar');
        $this->assertSame('last_known', TipoDeCambio::detalle()['origen']);
    }

    public function test_el_programador_la_renueva_y_la_visita_no_espera_a_la_fuente(): void
    {
        Http::fake(['*dolarbluebolivia*' => Http::sequence()
            ->push(['data' => ['blue' => ['buy' => 12.00], 'fetched_at' => now()->subSeconds(40)->toIso8601String()]])
            ->push(['data' => ['blue' => ['buy' => 12.40]]])]);

        $this->artisan('tipo-cambio:actualizar')->assertSuccessful();
        $this->assertSame(12.00, TipoDeCambio::bobPorUsdt());
        $this->assertSame('live', TipoDeCambio::detalle()['origen']);
        $this->assertSame(now()->subSeconds(40)->toIso8601String(), TipoDeCambio::detalle()['momento'], 'la hora es la de la medición de la fuente');
        Http::assertSentCount(1); // las visitas leen lo guardado

        // A los 30 s, la siguiente lectura cambia el precio en USDT de toda la tienda
        $this->travel(30)->seconds();
        $this->artisan('tipo-cambio:actualizar')->assertSuccessful();
        $this->assertSame(12.40, TipoDeCambio::bobPorUsdt());
        $this->getJson('/tipo-cambio')->assertOk()->assertJsonPath('data.bob_por_usdt', 12.4);

        $programadas = collect(app(\Illuminate\Console\Scheduling\Schedule::class)->events())
            ->filter(fn ($e) => str_contains($e->command, 'tipo-cambio:actualizar'));
        $this->assertSame('* * * * *', $programadas->sole()->expression);
        $this->assertSame(30, $programadas->sole()->repeatSeconds, 'cada 30 segundos');
    }

    public function test_con_la_fuente_caida_no_se_reintenta_en_cada_visita(): void
    {
        Http::fake(['*dolarbluebolivia*' => Http::response([], 503)]);
        config(['pagos.binance.tasa_bob' => 13.5]);

        foreach (range(1, 5) as $visita) {
            $this->assertSame(13.5, TipoDeCambio::bobPorUsdt());
        }
        Http::assertSentCount(1); // a lo sumo una vez por minuto: una fuente caída no frena la tienda

        $this->travel(61)->seconds();
        TipoDeCambio::bobPorUsdt();
        Http::assertSentCount(2);
    }

    public function test_sin_fuente_ni_respaldo_no_se_cobra_en_cripto(): void
    {
        Http::fake(['*dolarbluebolivia*' => Http::response([], 500)]);

        $this->assertSame(0.0, TipoDeCambio::bobPorUsdt());
        $this->assertFalse(TipoDeCambio::disponible());
        $this->assertNull(TipoDeCambio::paraLaVista(), 'la tienda no debe mostrar una conversión inventada');
    }

    public function test_la_tasa_manual_sirve_de_ultimo_recurso(): void
    {
        config(['pagos.binance.tasa_bob' => 13.5]);
        Http::fake(['*dolarbluebolivia*' => Http::response([], 500)]);

        $this->assertSame(13.5, TipoDeCambio::bobPorUsdt());
    }
}
