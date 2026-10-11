<?php

namespace Tests\Feature;

use App\Http\Controllers\SitemapController;
use App\Support\Seo\IndexNow;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/** IndexNow: Bing (y con él ChatGPT y Copilot) se entera de lo que cambió en el sitemap, y solo de eso. */
class IndexNowTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        config(['seo.public_url' => 'https://appleboss.com.bo']);
    }

    /** Cada prueba arma su respuesta: Http::fake se acumula y la primera que coincide gana. */
    private function indexNowResponde(int ...$estados): void
    {
        $secuencia = Http::sequence();
        foreach ($estados ?: [202] as $e) {
            $secuencia->push('', $e);
        }
        Http::fake(['api.indexnow.org/*' => $secuencia->whenEmpty(Http::response('', 202))]);
    }

    /** Un sitemap de mentira con las direcciones y fechas que se le pasen. */
    private function sitemap(array $urls): void
    {
        $xml = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
            . collect($urls)->map(fn ($fecha, $url) => "<url><loc>{$url}</loc><lastmod>{$fecha}</lastmod></url>")->implode('')
            . '</urlset>';
        $this->app->instance(SitemapController::class, new class($xml) extends SitemapController {
            public function __construct(private string $xml) {}
            public function index(): \Illuminate\Http\Response { return response($this->xml); }
        });
    }

    public function test_la_clave_se_publica_y_es_estable(): void
    {
        $this->get('/indexnow.txt')->assertOk()->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
            ->assertSeeText(IndexNow::clave());
        $this->assertMatchesRegularExpression('/^[0-9a-f]{32}$/', IndexNow::clave());
        $this->assertSame(IndexNow::clave(), IndexNow::clave());
    }

    public function test_la_primera_vez_avisa_todo_y_despues_solo_lo_que_cambio_o_se_fue(): void
    {
        $this->indexNowResponde();
        $this->sitemap(['https://appleboss.com.bo/' => '2026-10-01', 'https://appleboss.com.bo/productos/a' => '2026-10-01', 'https://appleboss.com.bo/productos/b' => '2026-10-01']);
        $this->artisan('seo:indexnow')->expectsOutput('IndexNow: 3 direcciones avisadas.')->assertSuccessful();

        Http::assertSent(fn (Request $r) => $r['host'] === 'appleboss.com.bo'
            && $r['key'] === IndexNow::clave()
            && $r['keyLocation'] === 'https://appleboss.com.bo/indexnow.txt'
            && count($r['urlList']) === 3);

        // Cambia el precio de «a», se vende «b» y se publica «c»
        $this->sitemap(['https://appleboss.com.bo/' => '2026-10-01', 'https://appleboss.com.bo/productos/a' => '2026-10-11', 'https://appleboss.com.bo/productos/c' => '2026-10-11']);
        $this->assertSame(3, IndexNow::avisarCambios());
        Http::assertSent(fn (Request $r) => $r['urlList'] === ['https://appleboss.com.bo/productos/a', 'https://appleboss.com.bo/productos/c', 'https://appleboss.com.bo/productos/b']);

        // Sin cambios: no se molesta a Bing
        $this->assertSame(0, IndexNow::avisarCambios());
        Http::assertSentCount(2);
    }

    public function test_si_indexnow_falla_se_reintenta_en_la_proxima_vuelta(): void
    {
        $this->sitemap(['https://appleboss.com.bo/' => '2026-10-01']);
        $this->indexNowResponde(500, 200);

        $this->assertNull(IndexNow::avisarCambios());
        $this->assertSame(1, IndexNow::avisarCambios(), 'el estado no avanzó, así que vuelve a mandar lo mismo');
    }

    public function test_en_un_dominio_de_prueba_no_se_avisa_nada(): void
    {
        $this->indexNowResponde();
        config(['seo.public_url' => 'http://localhost']);
        $this->assertNull(IndexNow::avisarCambios());
        Http::assertNothingSent();
    }

    public function test_esta_programado_cada_15_minutos(): void
    {
        $evento = collect(app(\Illuminate\Console\Scheduling\Schedule::class)->events())
            ->first(fn ($e) => str_contains($e->command, 'seo:indexnow'));
        $this->assertSame('*/15 * * * *', $evento?->expression);
    }
}
