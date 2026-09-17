<?php

namespace Tests\Feature;

use App\Models\ModeloReferencia;
use App\Models\User;
use Database\Seeders\ModelosReferenciaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Tienda online → Modelos y fotos: la foto de cada modelo que usa la comparativa pública. */
class ModelosFotosAdminTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ModelosReferenciaSeeder::class);
        Storage::fake('public');
    }

    private function admin(): User
    {
        return User::factory()->create(['rol' => 'admin']);
    }

    private function foto(int $ancho = 1200, int $alto = 1440, string $nombre = 'dorso.png'): UploadedFile
    {
        return UploadedFile::fake()->image($nombre, $ancho, $alto);
    }

    private function modelo(string $slug = 'iphone-14-plus'): ModeloReferencia
    {
        return ModeloReferencia::where('slug', $slug)->firstOrFail();
    }

    public function test_el_listado_muestra_los_modelos_y_el_estado_de_su_foto(): void
    {
        $this->actingAs($this->admin())->get('/admin/modelos')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Modelos/Index')
                ->has('modelos', ModeloReferencia::count())
                ->where('modelos', fn ($modelos) => collect($modelos)->every(fn ($m) => $m['foto'] === null && $m['visual'] !== null))
                ->where('comparativas.0.url', route('store.compare.modelos', ['familia' => 'iphone']))
                ->where('comparativas.1.nombre', 'Mac')
                ->where('comparativas.1.url', route('store.compare.modelos', ['familia' => 'mac'])));
    }

    public function test_solo_un_admin_entra(): void
    {
        $this->get('/admin/modelos')->assertRedirect('/login');

        $vendedor = User::factory()->create(['rol' => 'vendedor']);
        $this->actingAs($vendedor)->get('/admin/modelos')->assertForbidden();
        $this->actingAs($vendedor)->post('/admin/modelos/iphone-14-plus/foto', ['foto' => $this->foto()])->assertForbidden();
        $this->assertNull($this->modelo()->foto_card);
    }

    public function test_sube_la_foto_y_la_comparativa_la_usa(): void
    {
        $this->actingAs($this->admin())
            ->post('/admin/modelos/iphone-14-plus/foto', ['foto' => $this->foto()])
            ->assertRedirect()
            ->assertSessionHas('success');

        $modelo = $this->modelo();
        Storage::disk('public')->assertExists([$modelo->foto_original, $modelo->foto_card, $modelo->foto_detalle]);
        $this->assertStringStartsWith('modelos/iphone-14-plus/card/', $modelo->foto_card);
        $this->assertSame(1200, $modelo->foto_meta['width']);
        $this->assertSame('dorso.png', $modelo->foto_meta['nombre']);
        $this->assertNotNull($modelo->foto_actualizada_at);

        $this->get('/comparar/iphone?modelos=iphone-14-plus')
            ->assertInertia(fn (Assert $page) => $page->where('seleccion.0.imagen', $modelo->urlFoto('card')));
    }

    public function test_cambiar_la_foto_borra_la_anterior_y_quitarla_vuelve_a_la_ilustracion(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->post('/admin/modelos/iphone-14-plus/foto', ['foto' => $this->foto()]);
        $anterior = $this->modelo();

        $this->actingAs($admin)->post('/admin/modelos/iphone-14-plus/foto', ['foto' => $this->foto(1000, 1200, 'otra.jpg')]);
        $nueva = $this->modelo();
        $this->assertNotSame($anterior->foto_card, $nueva->foto_card);
        Storage::disk('public')->assertMissing([$anterior->foto_original, $anterior->foto_card, $anterior->foto_detalle]);
        Storage::disk('public')->assertExists($nueva->foto_card);

        $this->actingAs($admin)->delete('/admin/modelos/iphone-14-plus/foto')->assertSessionHas('success');
        $this->assertNull($this->modelo()->foto_card);
        Storage::disk('public')->assertMissing([$nueva->foto_original, $nueva->foto_card, $nueva->foto_detalle]);

        $this->get('/comparar/iphone?modelos=iphone-14-plus')
            ->assertInertia(fn (Assert $page) => $page->where('seleccion.0.imagen', null)->where('seleccion.0.visual.alto_mm', 160.8));
    }

    public function test_rechaza_archivos_que_no_son_foto_o_muy_chicos(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->post('/admin/modelos/iphone-14-plus/foto', ['foto' => UploadedFile::fake()->create('ficha.pdf', 100, 'application/pdf')])
            ->assertSessionHasErrors(['foto' => 'La foto debe ser JPG, PNG o WebP.']);
        $this->actingAs($admin)->post('/admin/modelos/iphone-14-plus/foto', ['foto' => $this->foto(500, 600)])
            ->assertSessionHasErrors(['foto' => 'La foto es muy chica: necesita al menos 600 px de ancho y de alto.']);
        $this->actingAs($admin)->post('/admin/modelos/iphone-14-plus/foto', [])
            ->assertSessionHasErrors(['foto' => 'Elige una foto.']);

        $this->assertNull($this->modelo()->foto_card);
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_volver_a_cargar_la_base_no_borra_las_fotos(): void
    {
        $this->actingAs($this->admin())->post('/admin/modelos/iphone-14-plus/foto', ['foto' => $this->foto()]);
        $foto = $this->modelo()->foto_card;

        $this->seed(ModelosReferenciaSeeder::class);

        $this->assertSame($foto, $this->modelo()->foto_card);
    }

    public function test_la_pantalla_del_modelo_propone_el_siguiente_sin_foto(): void
    {
        $admin = $this->admin();
        $this->actingAs($admin)->post('/admin/modelos/iphone-14-pro/foto', ['foto' => $this->foto()]);

        $this->actingAs($admin)->get('/admin/modelos/iphone-14-plus')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Modelos/Show')
                ->where('modelo.nombre', 'iPhone 14 Plus')
                ->where('modelo.foto', null)
                ->where('navegacion.total', ModeloReferencia::count())
                ->where('navegacion.sin_foto', ModeloReferencia::count() - 1)
                ->where('navegacion.siguiente', 'iphone-14-pro')
                ->where('navegacion.siguiente_sin_foto.slug', 'iphone-14-pro-max')   // el 14 Pro ya tiene foto
                ->where('comparativa', route('store.compare.modelos', ['familia' => 'iphone', 'modelos' => 'iphone-14-plus'])));
    }
}
