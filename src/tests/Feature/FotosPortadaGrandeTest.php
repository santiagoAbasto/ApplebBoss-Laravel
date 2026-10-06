<?php

namespace Tests\Feature;

use App\Models\HomeSection;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Portada grande: la foto de cada categoría de la MacBook se cambia desde el panel y la tienda recibe solo las dos
 * direcciones (grande y chica), nunca el original ni el nombre del archivo.
 */
class FotosPortadaGrandeTest extends TestCase
{
    use RefreshDatabase;

    private function hero(): HomeSection
    {
        HomeSection::query()->delete();

        return HomeSection::create(['type' => 'hero', 'label' => 'Portada', 'active' => true, 'orden' => 1, 'settings' => ['titulo' => 'Hola']]);
    }

    private function heroDeLaTienda(): array
    {
        return collect($this->get('/')->assertOk()->viewData('page')['props']['sections'])->firstWhere('type', 'hero');
    }

    public function test_la_foto_cargada_llega_a_la_tienda_y_sobrevive_al_guardar_los_textos(): void
    {
        Storage::fake('public');
        $hero = $this->hero();
        $admin = User::factory()->create(['rol' => 'admin']);

        $this->actingAs($admin)
            ->post(route('admin.home-builder.pantallas.subir', [$hero, 'iphone']), ['foto' => UploadedFile::fake()->image('diseño final.jpg', 1600, 1067)])
            ->assertRedirect()->assertSessionHasNoErrors();

        $p = $hero->fresh()->settings['pantallas']['iphone'];
        Storage::disk('public')->assertExists([$p['original'], $p['grande'], $p['chica']]);
        $this->assertSame('diseño final.jpg', $p['nombre']);

        // La tienda: solo las dos direcciones, y las demás categorías siguen con la foto que trae la tienda
        $tienda = $this->heroDeLaTienda()['settings']['pantallas'];
        $this->assertSame(['iphone' => ['grande' => '/storage/' . $p['grande'], 'chica' => '/storage/' . $p['chica']]], $tienda);
        $this->assertStringNotContainsString('diseño final', json_encode($this->heroDeLaTienda()));
        $this->assertStringNotContainsString('original', json_encode($tienda));

        // Guardar los textos no borra la foto, y un «pantallas» mandado a mano no entra
        $this->patch(route('admin.home-builder.update', $hero), ['settings' => ['titulo' => 'Chau', 'pantallas' => ['mac' => ['grande' => '../../.env', 'chica' => 'x']]]])
            ->assertRedirect();
        $this->assertSame(['iphone'], array_keys($hero->fresh()->settings['pantallas']));
        $this->assertSame('Chau', $hero->fresh()->settings['titulo']);

        // Una nueva reemplaza a la anterior y borra sus archivos
        $this->post(route('admin.home-builder.pantallas.subir', [$hero, 'iphone']), ['foto' => UploadedFile::fake()->image('otra.png', 1500, 1000)])
            ->assertSessionHasNoErrors();
        Storage::disk('public')->assertMissing([$p['original'], $p['grande'], $p['chica']]);
        $nueva = $hero->fresh()->settings['pantallas']['iphone'];

        // Volver a la original borra la cargada y la tienda vuelve a la de la carpeta
        $this->delete(route('admin.home-builder.pantallas.quitar', [$hero, 'iphone']))->assertRedirect();
        Storage::disk('public')->assertMissing([$nueva['original'], $nueva['grande'], $nueva['chica']]);
        $this->assertArrayNotHasKey('pantallas', $hero->fresh()->settings);
        $this->assertSame([], $this->heroDeLaTienda()['settings']['pantallas']);
    }

    public function test_rechaza_fotos_chicas_otras_secciones_y_categorias_que_no_existen(): void
    {
        Storage::fake('public');
        $hero = $this->hero();
        $otra = HomeSection::create(['type' => 'faq', 'label' => 'Preguntas', 'active' => true, 'orden' => 2, 'settings' => []]);
        $admin = User::factory()->create(['rol' => 'admin']);

        $this->actingAs($admin)
            ->post(route('admin.home-builder.pantallas.subir', [$hero, 'mac']), ['foto' => UploadedFile::fake()->image('chica.jpg', 800, 533)])
            ->assertSessionHasErrors('foto');
        $this->post(route('admin.home-builder.pantallas.subir', [$hero, 'mac']), ['foto' => UploadedFile::fake()->create('nota.pdf', 20, 'application/pdf')])
            ->assertSessionHasErrors('foto');
        $this->post(route('admin.home-builder.pantallas.subir', [$hero, 'android']), ['foto' => UploadedFile::fake()->image('a.jpg', 1600, 1067)])
            ->assertNotFound();
        $this->post(route('admin.home-builder.pantallas.subir', [$otra, 'mac']), ['foto' => UploadedFile::fake()->image('a.jpg', 1600, 1067)])
            ->assertNotFound();

        $this->assertArrayNotHasKey('pantallas', $hero->fresh()->settings);
        $this->assertSame([], Storage::disk('public')->allFiles());
    }

    public function test_el_panel_muestra_las_cuatro_fotos_y_un_cliente_no_puede_cambiarlas(): void
    {
        Storage::fake('public');
        $hero = $this->hero();

        $cliente = User::factory()->create(['rol' => 'cliente']);
        $this->actingAs($cliente)
            ->post(route('admin.home-builder.pantallas.subir', [$hero, 'mac']), ['foto' => UploadedFile::fake()->image('a.jpg', 1600, 1067)]);
        $this->assertArrayNotHasKey('pantallas', $hero->fresh()->settings);

        $admin = User::factory()->create(['rol' => 'admin']);
        $secciones = $this->actingAs($admin)->get(route('admin.home-builder.index'))->assertOk()->viewData('page')['props']['sections'];
        $pantallas = collect($secciones)->firstWhere('type', 'hero')['pantallas'];

        $this->assertSame(['iphone', 'mac', 'apple', 'myskin'], array_column($pantallas, 'clave'));
        $this->assertSame('/images/hero-mac-1/pantalla-mac.webp', $pantallas[1]['url']);
        $this->assertFalse($pantallas[1]['propia']);
    }
}
