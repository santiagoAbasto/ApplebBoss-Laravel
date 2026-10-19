<?php

namespace Tests\Feature;

use App\Models\ConfiguracionTienda;
use App\Models\Page;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** El lema de la tienda sale de un solo lugar (config seo.negocio.lema) y el genérico de antes no vuelve. */
class LemaDeLaTiendaTest extends TestCase
{
    use RefreshDatabase;

    private const VIEJOS = ['Precios reales · Atención personalizada', 'Stock real · Cochabamba', 'Stock real · Atención en Bolivia'];

    public function test_el_lema_llega_a_la_tienda_los_correos_y_los_datos_para_google(): void
    {
        $lema = \App\Support\Seo::lema();
        $this->assertSame('Garantía real · Compra segura y protegida · Cochabamba, Bolivia', $lema);

        $this->get('/')->assertOk()->assertInertia(fn (Assert $p) => $p
            ->where('tienda.lema.1.texto', 'Compra segura y protegida')
            ->where('tienda.lema.1.escudo', true));
        $this->get('/')->assertSee('"slogan":"' . $lema . '"', false);

        $correo = (new \App\Mail\Bienvenida(new \App\Models\User(['name' => 'Ana Quispe', 'email' => 'ana@example.com'])))->render();
        $this->assertStringContainsString('Compra segura y protegida', $correo);
        $this->assertStringContainsString('images/correo/escudo.png', $correo, 'en el correo el escudo va en PNG: Gmail no muestra SVG');
        $this->assertStringNotContainsString('<svg', $correo);
    }

    public function test_el_lema_generico_no_queda_en_el_codigo(): void
    {
        $restos = [];
        foreach ([app_path(), resource_path('views'), resource_path('js'), config_path()] as $carpeta) {
            foreach (new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($carpeta)) as $f) {
                if ($f->isFile() && preg_match('/\.(php|jsx?|blade\.php)$/', $f->getFilename())) {
                    foreach (self::VIEJOS as $viejo) {
                        if (str_contains(file_get_contents($f->getPathname()), $viejo)) {
                            $restos[] = $f->getFilename() . ' → ' . $viejo;
                        }
                    }
                }
            }
        }
        $this->assertSame([], $restos);
    }

    public function test_la_migracion_cambia_los_textos_de_fabrica_y_respeta_los_editados(): void
    {
        $migracion = include database_path('migrations/2026_10_19_200000_lema_de_la_tienda.php');

        DB::table('configuracion_tienda')->updateOrInsert(['clave' => 'anuncio_barra'], ['valor' => 'Equipos revisados · Stock real · Atención en Bolivia']);
        DB::table('configuracion_tienda')->updateOrInsert(['clave' => 'seo_descripcion_default'], ['valor' => 'Mi descripción escrita a mano']);
        $migracion->up();
        \Illuminate\Support\Facades\Cache::flush();

        $this->assertSame('Garantía real · Compra segura y protegida · Cochabamba, Bolivia', ConfiguracionTienda::get('anuncio_barra'));
        $this->assertSame('Mi descripción escrita a mano', ConfiguracionTienda::get('seo_descripcion_default'), 'lo editado en el panel no se toca');
        $this->assertLessThanOrEqual(90, mb_strlen(ConfiguracionTienda::get('anuncio_barra')), 'la barra de anuncio admite 90 caracteres');

        $nosotros = (string) Page::where('slug', 'nosotros')->value('content');
        $this->assertStringContainsString('<strong>Postventa que responde.</strong>', $nosotros);
        $this->assertStringContainsString('<strong>Asesoría en cada paso.</strong>', $nosotros);

        $migracion->down();
        $this->assertSame('Equipos revisados · Stock real · Atención en Bolivia', DB::table('configuracion_tienda')->where('clave', 'anuncio_barra')->value('valor'));
        $this->assertStringContainsString('<strong>Stock real.</strong>', (string) Page::where('slug', 'nosotros')->value('content'));
    }
}
