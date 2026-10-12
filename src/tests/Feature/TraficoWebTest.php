<?php

namespace Tests\Feature;

use App\Models\ConfiguracionTienda;
use App\Models\EventoWeb;
use App\Models\Page;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Tienda online → Tráfico: la medición propia (sin cookies), el panel y los textos legales en borrador. */
class TraficoWebTest extends TestCase
{
    use RefreshDatabase;

    private const NAVEGADOR = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        RateLimiter::clear('eventos:' . hash('sha256', '127.0.0.1'));
    }

    private function evento(array $datos, array $cabeceras = []): \Illuminate\Testing\TestResponse
    {
        return $this->call('POST', '/api/eventos', [], [], [], $this->transformHeadersToServerVars($cabeceras + [
            'User-Agent' => self::NAVEGADOR, 'Accept-Language' => 'es-BO,es;q=0.9', 'CF-IPCountry' => 'BO',
        ]), json_encode($datos));
    }

    public function test_registra_una_pagina_sin_guardar_ip_ni_navegador(): void
    {
        $this->evento(['nombre' => 'pagina', 'ruta' => '/iphone', 'ref' => 'https://www.google.com/search?q=iphone'])->assertNoContent();

        $e = EventoWeb::sole();
        $this->assertSame(['pagina', '/iphone', 'BO', 'movil', 'safari', 'google.com', 'es', false], [$e->nombre, $e->ruta, $e->pais, $e->dispositivo, $e->navegador, $e->referente, $e->idioma, $e->bot]);
        $this->assertMatchesRegularExpression('/^[0-9a-f]{16}$/', $e->visitante);
        $this->assertStringNotContainsString('127.0.0.1', json_encode($e->getAttributes()));
        $this->assertSame(now('America/La_Paz')->toDateString(), $e->dia->toDateString());
    }

    public function test_acorta_rutas_con_codigos_y_filtra_busquedas_con_datos_personales(): void
    {
        $this->evento(['nombre' => 'pagina', 'ruta' => '/pedido/AB-000123/pago'])->assertNoContent();
        $this->evento(['nombre' => 'busqueda', 'ruta' => '/', 'etiqueta' => 'iPhone 15  Pro'])->assertNoContent();
        $this->evento(['nombre' => 'busqueda', 'ruta' => '/', 'etiqueta' => 'mi numero 75904313'])->assertNoContent();
        $this->evento(['nombre' => 'busqueda', 'ruta' => '/', 'etiqueta' => 'ana@correo.com'])->assertNoContent();

        $this->assertSame('/pedido', EventoWeb::where('nombre', 'pagina')->value('ruta'));
        $this->assertSame(['iphone 15 pro', null, null], EventoWeb::where('nombre', 'busqueda')->orderBy('id')->pluck('etiqueta')->all());
    }

    public function test_rechaza_lo_que_no_viene_de_la_tienda_o_no_esta_en_la_lista(): void
    {
        $this->evento(['nombre' => 'pagina', 'ruta' => '/'], ['Origin' => 'https://otro-sitio.com'])->assertForbidden();
        $this->evento(['nombre' => 'pedido_creado', 'ruta' => '/'])->assertStatus(400); // ese lo registra solo el servidor
        $this->evento(['nombre' => 'pagina', 'ruta' => '//otro-sitio.com'])->assertNoContent();
        $this->evento(['nombre' => 'pagina', 'ruta' => str_repeat('a', 3000)])->assertStatus(413);

        $this->assertSame(0, EventoWeb::count(), 'una ruta que no es interna no se guarda');
    }

    public function test_marca_los_bots_y_limita_la_frecuencia(): void
    {
        $this->evento(['nombre' => 'pagina', 'ruta' => '/'], ['User-Agent' => 'Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)'])->assertNoContent();
        $this->assertTrue(EventoWeb::sole()->bot);

        foreach (range(1, 59) as $i) {
            $this->evento(['nombre' => 'pagina', 'ruta' => '/']);
        }
        $this->evento(['nombre' => 'pagina', 'ruta' => '/'])->assertStatus(429);
    }

    public function test_las_visitas_se_borran_solas_a_los_14_meses(): void
    {
        $vieja = EventoWeb::create(['nombre' => 'pagina', 'ruta' => '/', 'bot' => false, 'dia' => '2025-01-01', 'hora' => 9, 'created_at' => now()->subMonths(15)]);
        $nueva = EventoWeb::create(['nombre' => 'pagina', 'ruta' => '/', 'bot' => false, 'dia' => now()->toDateString(), 'hora' => 9]);

        $this->artisan('model:prune', ['--model' => [EventoWeb::class]])->assertSuccessful();

        $this->assertNull($vieja->fresh());
        $this->assertNotNull($nueva->fresh());
        $this->assertTrue(collect(app(\Illuminate\Console\Scheduling\Schedule::class)->events())
            ->contains(fn ($e) => str_contains($e->command, 'model:prune') && str_contains($e->command, 'EventoWeb')));
    }

    public function test_el_panel_cuenta_visitas_visitantes_y_el_embudo(): void
    {
        $admin = User::factory()->create(['rol' => 'admin']);
        $dia = now('America/La_Paz')->toDateString();
        $fila = fn (array $d) => EventoWeb::create($d + ['ruta' => '/', 'visitante' => 'aaaa', 'bot' => false, 'dia' => $dia, 'hora' => 10]);
        $fila(['nombre' => 'pagina', 'referente' => 'google.com']);
        $fila(['nombre' => 'pagina', 'ruta' => '/productos/iphone-15', 'visitante' => 'bbbb']);
        $fila(['nombre' => 'pagina', 'ruta' => '/checkout', 'visitante' => 'bbbb']);
        $fila(['nombre' => 'carrito_agregar', 'etiqueta' => 'iPhone 15']);
        $fila(['nombre' => 'pedido_creado', 'etiqueta' => 'transferencia']);
        $fila(['nombre' => 'pagina', 'bot' => true]);

        $this->actingAs($admin)->get(route('admin.trafico.index', ['dias' => 7]))->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('Admin/Trafico/Index')
                ->where('dias', 7)
                ->where('datos.resumen.visitas', 3)
                ->where('datos.resumen.visitantes', 2)
                ->where('datos.resumen.bots', 1)
                ->where('datos.resumen.pedidos', 1)
                ->has('datos.serie', 7)
                ->where('datos.horas.10', 3)
                ->where('datos.embudo.1.total', 1)
                ->where('datos.embudo.4.total', 1)
                ->where('datos.origenes.0.etiqueta', 'Directo o escrito a mano')
                ->where('datos.agregados.0', ['etiqueta' => 'iPhone 15', 'total' => 1]));
    }

    public function test_es_un_modulo_con_su_permiso_y_guarda_los_codigos_de_medicion(): void
    {
        Cache::flush();
        Role::create(['clave' => 'encargado', 'nombre' => 'Encargado', 'permisos' => ['tienda'], 'activo' => true]);
        $this->actingAs(User::factory()->create(['rol' => 'encargado']))->get(route('admin.trafico.index'))->assertForbidden();

        $admin = User::factory()->create(['rol' => 'admin']);
        $this->actingAs($admin)->patch(route('admin.trafico.medicion'), ['ga4' => ' g-ab12cd34ef ', 'clarity' => 'K8X2ABC9DE'])->assertSessionHasNoErrors();
        $this->assertSame(['G-AB12CD34EF', 'k8x2abc9de'], [ConfiguracionTienda::get('medicion_ga4'), ConfiguracionTienda::get('medicion_clarity')]);

        $this->actingAs($admin)->patch(route('admin.trafico.medicion'), ['ga4' => 'UA-123', 'clarity' => ''])->assertSessionHasErrors('ga4');

        // La tienda recibe los códigos (son públicos) para el aviso de cookies
        $this->get('/catalogo')->assertInertia(fn (Assert $p) => $p->where('tienda.medicion.ga4', 'G-AB12CD34EF'));
    }

    public function test_un_texto_legal_con_un_dato_por_confirmar_no_se_indexa(): void
    {
        $privacidad = Page::where('slug', 'privacidad')->firstOrFail();
        $this->assertStringContainsString('Estadísticas propias', $privacidad->content);
        $this->assertTrue(Page::where('slug', 'cookies')->value('active'));

        $privacidad->update(['content' => $privacidad->content . '<p>[DATO POR CONFIRMAR: algo]</p>']);
        $this->assertTrue($privacidad->fresh()->esBorrador());
        $this->get('/paginas/privacidad')->assertOk()->assertInertia(fn (Assert $p) => $p->where('seo.robots', 'noindex,nofollow'));
        $this->get('/sitemap.xml')->assertDontSee('/paginas/privacidad');
        $this->get('/llms.txt')->assertDontSee('/paginas/privacidad');

        // Completado el dato, se publica
        $privacidad->update(['content' => str_replace('<p>[DATO POR CONFIRMAR: algo]</p>', '', $privacidad->fresh()->content)]);
        $this->get('/paginas/privacidad')->assertInertia(fn (Assert $p) => $p->where('seo.robots', 'index,follow'));
        $this->get('/sitemap.xml')->assertSee('/paginas/privacidad');
    }

    public function test_los_textos_legales_y_la_garantia_quedan_completos_y_se_indexan(): void
    {
        foreach (['privacidad', 'terminos'] as $slug) {
            $texto = Page::where('slug', $slug)->firstOrFail()->content;
            $this->assertStringNotContainsString(Page::MARCA_PENDIENTE, $texto, "$slug sigue con datos por confirmar");
            $this->assertStringContainsString('12555473014', $texto);
            $this->assertStringContainsString('Santiago Alfredo Abasto Ortega', $texto);
        }
        $this->assertStringContainsString('cambio de opinión', Page::where('slug', 'terminos')->value('content'));

        // La página Garantía dice lo mismo que la nota de venta, con los plazos de config/documentos.php
        $garantia = Page::where('slug', 'garantia')->firstOrFail()->content;
        foreach (config('documentos.garantia.meses') as $meses) {
            $this->assertStringContainsString("{$meses} meses", $garantia);
        }
        foreach (['líquidos', 'terceros', 'Ley N.º 453', 'devolvemos el dinero'] as $frase) {
            $this->assertStringContainsString($frase, $garantia);
        }

        $this->get('/sitemap.xml')->assertSee('/paginas/privacidad')->assertSee('/paginas/terminos')->assertSee('/paginas/garantia');
        $this->get('/paginas/garantia')->assertOk()->assertInertia(fn (Assert $p) => $p->where('seo.robots', 'index,follow'));
    }
}
