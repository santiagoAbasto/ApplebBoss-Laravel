<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CatalogoAdminTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['rol' => 'admin']);
    }

    private function publicacion(array $datos = []): CatalogoPublicacion
    {
        $celular = Celular::create([
            'modelo' => 'iPhone 15', 'capacidad' => '128 GB', 'color' => 'Azul', 'imei_1' => fake()->unique()->numerify('###############'),
            'estado_imei' => 'libre', 'procedencia' => 'EEUU', 'precio_costo' => 5000, 'precio_venta' => 6500,
            'estado' => 'disponible', 'condicion' => 'Nuevo',
        ]);

        return CatalogoPublicacion::create(array_merge([
            'producto_tipo' => 'celular',
            'producto_id'   => $celular->id,
            'storefront'    => 'APPLE_BOSS',
            'publicado'     => true,
            'titulo'        => 'iPhone 15 128 GB Azul',
            'slug'          => fake()->unique()->slug(3),
            'resumen'       => 'Equipo disponible.',
            'condicion'     => 'Nuevo',
            'categoria'     => 'celulares',
        ], $datos));
    }

    private function payload(CatalogoPublicacion $pub, array $cambios = []): array
    {
        return array_merge([
            'storefront' => $pub->storefront,
            'titulo'     => $pub->titulo,
            'slug'       => $pub->slug,
            'resumen'    => $pub->resumen,
            'categoria'  => $pub->categoria,
            'condicion'  => $pub->condicion,
            'publicado'  => true,
            'destacado'  => false,
            'orden'      => 0,
        ], $cambios);
    }

    public function test_el_listado_acepta_filas_por_pagina_validas(): void
    {
        foreach (range(1, 3) as $i) {
            $this->publicacion();
        }

        $this->actingAs($this->admin())
            ->get(route('admin.catalogo.index', ['per_page' => 60]))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Catalogo/Index')
                ->where('filters.per_page', 60)
                ->where('publicaciones.per_page', 60)
                ->where('counts.publicados', 3));

        // Un valor fuera de la lista vuelve a 30
        $this->actingAs($this->admin())
            ->get(route('admin.catalogo.index', ['per_page' => 5000]))
            ->assertInertia(fn (Assert $page) => $page->where('filters.per_page', 30));
    }

    public function test_myskin_fuera_de_fundas_vuelve_como_error_del_formulario(): void
    {
        $pub = $this->publicacion();

        $this->actingAs($this->admin())
            ->from(route('admin.catalogo.edit', $pub))
            ->patch(route('admin.catalogo.update', $pub), $this->payload($pub, ['storefront' => 'MYSKIN']))
            ->assertRedirect(route('admin.catalogo.edit', $pub))
            ->assertSessionHasErrors(['storefront' => 'MYSKIN es solo para la categoría Fundas.']);

        $this->assertSame('APPLE_BOSS', $pub->fresh()->storefront);
    }

    public function test_no_se_publica_si_falta_informacion_y_se_explica_que(): void
    {
        $pub = $this->publicacion(['publicado' => false]);

        $this->actingAs($this->admin())
            ->from(route('admin.catalogo.edit', $pub))
            ->patch(route('admin.catalogo.update', $pub), $this->payload($pub, ['resumen' => '', 'condicion' => null]))
            ->assertSessionHasErrors('resumen');

        $this->actingAs($this->admin())
            ->from(route('admin.catalogo.edit', $pub))
            ->patch(route('admin.catalogo.update', $pub), $this->payload($pub, ['condicion' => null]))
            ->assertSessionHasErrors(['publicado' => 'Para mostrarlo en la tienda falta: condición (nuevo, seminuevo…).']);

        $this->assertFalse($pub->fresh()->publicado);
    }

    public function test_la_promocion_debe_ser_menor_al_precio_y_las_fechas_se_guardan(): void
    {
        $pub = $this->publicacion();

        $this->actingAs($this->admin())
            ->from(route('admin.catalogo.edit', $pub))
            ->patch(route('admin.catalogo.update', $pub), $this->payload($pub, ['precio_promocional' => 7000]))
            ->assertSessionHasErrors('precio_promocional');

        $this->actingAs($this->admin())
            ->from(route('admin.catalogo.edit', $pub))
            ->patch(route('admin.catalogo.update', $pub), $this->payload($pub, [
                'precio_promocional' => 5990,
                'promocion_desde'    => '2026-09-14T09:00',
                'promocion_hasta'    => '2026-09-30T20:00',
                'badge'              => 'OFERTA',
            ]))
            ->assertSessionHasNoErrors();

        $pub->refresh();
        $this->assertSame(5990.0, $pub->precio_promocional);
        $this->assertSame('2026-09-30 20:00', $pub->promocion_hasta->format('Y-m-d H:i'));
    }

    public function test_las_fotos_de_una_publicacion_se_guardan_con_sus_variantes(): void
    {
        Storage::fake('public');
        $pub = $this->publicacion();

        $this->actingAs($this->admin())
            ->post(route('admin.catalogo.imagenes.upload', $pub), ['imagen' => UploadedFile::fake()->image('frente.jpg', 1600, 1200)])
            ->assertCreated()
            ->assertJsonPath('es_principal', true);

        $imagen = $pub->imagenes()->firstOrFail();
        Storage::disk('public')->assertExists([$imagen->ruta_original, $imagen->ruta_thumb, $imagen->ruta_card, $imagen->ruta_medium, $imagen->ruta_detail]);
        // La variante cabe en 600 × 600 sin deformarse
        $this->assertSame([600, 450], array_slice(getimagesize(Storage::disk('public')->path($imagen->ruta_card)), 0, 2));
    }
}
