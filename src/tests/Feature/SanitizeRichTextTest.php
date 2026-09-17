<?php

namespace Tests\Feature;

use App\Models\Celular;
use App\Models\CatalogoPublicacion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Verifica que sanitizeRichText() en CatalogoPublicacionController
 * elimina contenido peligroso y preserva el HTML permitido.
 * Los tests van contra el endpoint store/update para probar el
 * comportamiento real de la capa HTTP (no unit test de método privado).
 */
class SanitizeRichTextTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->forceFill(['rol' => 'admin'])->save();
        return $user;
    }

    private function celular(): Celular
    {
        return Celular::create([
            'modelo'      => 'iPhone Test',
            'capacidad'   => '128 GB',
            'color'       => 'Negro',
            'imei_1'      => fake()->unique()->numerify('###############'),
            'estado_imei' => 'libre',
            'procedencia' => 'Tienda',
            'precio_costo' => 100,
            'precio_venta' => 200,
            'estado'       => 'disponible',
        ]);
    }

    private function publicacion(array $overrides = []): CatalogoPublicacion
    {
        static $n = 0; $n++;
        $cel = $this->celular();
        return CatalogoPublicacion::create(array_merge([
            'producto_tipo'  => 'celular',
            'producto_id'    => $cel->id,
            'storefront'     => 'APPLE_BOSS',
            'publicado'      => true,
            'titulo'         => 'Test ' . $n,
            'slug'           => 'test-xss-' . $n,
            'resumen'        => 'Equipo ok.',
            'condicion'      => 'Nuevo',
            'garantia'       => '3 meses',
            'categoria'      => 'celulares',
            'precio_venta'   => 200,
        ], $overrides));
    }

    private function updateDescripcion(CatalogoPublicacion $pub, string $html): CatalogoPublicacion
    {
        // publicado=false evita el check camposFaltantes() que requiere datos completos
        $this->actingAs($this->admin())
            ->patch(route('admin.catalogo.update', $pub), [
                'titulo'      => $pub->titulo,
                'slug'        => $pub->slug,
                'resumen'     => $pub->resumen,
                'categoria'   => $pub->categoria,
                'storefront'  => $pub->storefront,
                'publicado'   => false,
                'destacado'   => false,
                'condicion'   => $pub->condicion,
                'garantia'    => $pub->garantia,
                'descripcion' => $html,
            ])
            ->assertRedirect();

        return $pub->fresh();
    }

    // ─── Contenido peligroso debe eliminarse ──────────────────────────────────

    public function test_script_tag_is_stripped(): void
    {
        $pub = $this->publicacion();
        $updated = $this->updateDescripcion($pub, '<script>alert(1)</script>Hola');
        // El tag <script> debe desaparecer (strip_tags conserva el texto entre tags como texto plano inofensivo)
        $this->assertStringNotContainsString('<script>', $updated->descripcion ?? '');
        $this->assertStringNotContainsString('</script>', $updated->descripcion ?? '');
    }

    public function test_img_with_onerror_is_stripped(): void
    {
        $pub = $this->publicacion();
        $updated = $this->updateDescripcion($pub, '<img src=x onerror="alert(1)">');
        $this->assertStringNotContainsString('onerror', $updated->descripcion ?? '');
        $this->assertStringNotContainsString('<img', $updated->descripcion ?? '');
    }

    public function test_javascript_href_is_blocked(): void
    {
        $pub = $this->publicacion();
        $updated = $this->updateDescripcion($pub, '<a href="javascript:alert(1)">Click</a>');
        $desc = $updated->descripcion ?? '';
        // href debe estar vacío o ausente; javascript: no debe aparecer
        $this->assertStringNotContainsString('javascript:', $desc);
    }

    public function test_onclick_attribute_is_stripped(): void
    {
        $pub = $this->publicacion();
        $updated = $this->updateDescripcion($pub, '<p onclick="alert(1)">Hola</p>');
        $this->assertStringNotContainsString('onclick', $updated->descripcion ?? '');
    }

    public function test_style_attribute_is_stripped(): void
    {
        $pub = $this->publicacion();
        $updated = $this->updateDescripcion($pub, '<p style="color:red">Texto</p>');
        $this->assertStringNotContainsString('style=', $updated->descripcion ?? '');
    }

    public function test_iframe_is_stripped(): void
    {
        $pub = $this->publicacion();
        $updated = $this->updateDescripcion($pub, '<iframe src="https://evil.com"></iframe>');
        $this->assertStringNotContainsString('iframe', $updated->descripcion ?? '');
    }

    public function test_data_uri_href_is_blocked(): void
    {
        $pub = $this->publicacion();
        $updated = $this->updateDescripcion($pub, '<a href="data:text/html,<script>alert(1)</script>">x</a>');
        $this->assertStringNotContainsString('data:', $updated->descripcion ?? '');
    }

    // ─── Contenido permitido debe sobrevivir ──────────────────────────────────

    public function test_basic_formatting_survives(): void
    {
        $pub  = $this->publicacion();
        $html = '<p>Texto <strong>importante</strong>.</p><ul><li>Uno</li><li>Dos</li></ul><h3>Detalle</h3>';
        $updated = $this->updateDescripcion($pub, $html);
        $desc = $updated->descripcion ?? '';

        $this->assertStringContainsString('<p>', $desc);
        $this->assertStringContainsString('<strong>', $desc);
        $this->assertStringContainsString('<ul>', $desc);
        $this->assertStringContainsString('<li>', $desc);
        $this->assertStringContainsString('<h3>', $desc);
        $this->assertStringContainsString('importante', $desc);
    }

    public function test_safe_link_survives(): void
    {
        $pub = $this->publicacion();
        $updated = $this->updateDescripcion($pub, '<a href="/catalogo">Ver catálogo</a>');
        $desc = $updated->descripcion ?? '';
        $this->assertStringContainsString('href=', $desc);
        $this->assertStringContainsString('/catalogo', $desc);
        $this->assertStringContainsString('Ver catálogo', $desc);
    }

    public function test_null_descripcion_is_preserved_as_null(): void
    {
        $pub = $this->publicacion(['descripcion' => null]);
        $this->assertNull($pub->descripcion);
    }
}
