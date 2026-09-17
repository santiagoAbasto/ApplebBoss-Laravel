<?php

namespace Tests\Feature;

use App\Models\ConfiguracionTienda;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConfiguracionTiendaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        ConfiguracionTienda::clearAllCache();
    }

    // ─── Modelo: get / set / cache ──────────────────────────────────────────────

    public function test_get_returns_default_when_key_not_found(): void
    {
        $this->assertSame('default', ConfiguracionTienda::get('clave_inexistente', 'default'));
    }

    public function test_set_persists_and_get_reads_back(): void
    {
        ConfiguracionTienda::updateOrCreate(
            ['clave' => 'test_clave'],
            ['valor' => 'original', 'tipo' => 'texto', 'grupo' => 'test', 'etiqueta' => 'Test']
        );

        ConfiguracionTienda::set('test_clave', 'valor_nuevo');
        $this->assertSame('valor_nuevo', ConfiguracionTienda::get('test_clave'));
    }

    public function test_cache_is_invalidated_after_set(): void
    {
        ConfiguracionTienda::updateOrCreate(
            ['clave' => 'cache_test'],
            ['valor' => 'primero', 'tipo' => 'texto', 'grupo' => 'test', 'etiqueta' => 'Cache test']
        );

        $this->assertSame('primero', ConfiguracionTienda::get('cache_test'));

        ConfiguracionTienda::set('cache_test', 'segundo');
        $this->assertSame('segundo', ConfiguracionTienda::get('cache_test'));
    }

    // ─── WhatsApp helpers ─────────────────────────────────────────────────────

    public function test_wa_number_normalizes_to_digits_only(): void
    {
        ConfiguracionTienda::updateOrCreate(
            ['clave' => 'whatsapp_numero'],
            ['valor' => '+591 78-000-000', 'tipo' => 'texto', 'grupo' => 'contacto', 'etiqueta' => 'WA']
        );
        ConfiguracionTienda::clearAllCache();
        $this->assertSame('59178000000', ConfiguracionTienda::waNumber());
    }

    public function test_wa_number_returns_null_when_empty(): void
    {
        ConfiguracionTienda::where('clave', 'whatsapp_numero')->delete();
        ConfiguracionTienda::clearAllCache();
        $this->assertNull(ConfiguracionTienda::waNumber());
    }

    public function test_wa_enabled_returns_bool(): void
    {
        ConfiguracionTienda::updateOrCreate(
            ['clave' => 'whatsapp_enabled'],
            ['valor' => '1', 'tipo' => 'bool', 'grupo' => 'contacto', 'etiqueta' => 'WA enabled']
        );
        ConfiguracionTienda::clearAllCache();
        $this->assertTrue(ConfiguracionTienda::waEnabled());
    }

    // ─── Whitelist de seguridad ────────────────────────────────────────────────

    public function test_home_page_does_not_expose_internal_keys_in_html(): void
    {
        $response = $this->get('/');
        $response->assertStatus(200);
        $content = $response->getContent();

        // Claves internas nunca deben aparecer en el HTML renderizado
        $this->assertStringNotContainsStringIgnoringCase('smtp_password', $content);
        $this->assertStringNotContainsStringIgnoringCase('api_key',       $content);
        $this->assertStringNotContainsStringIgnoringCase('analytics_secret', $content);
    }

    public function test_tienda_prop_exposes_expected_public_keys_via_inertia(): void
    {
        $response = $this->withHeader('X-Inertia', 'true')->get('/');
        $response->assertStatus(200);

        $tienda = $response->json('props.tienda');
        $this->assertIsArray($tienda);

        foreach (['whatsapp_enabled', 'whatsapp_numero', 'tienda_nombre', 'tienda_ciudad'] as $key) {
            $this->assertArrayHasKey($key, $tienda, "tienda prop missing key: {$key}");
        }
    }

    public function test_whatsapp_numero_is_null_in_prop_when_disabled(): void
    {
        ConfiguracionTienda::updateOrCreate(
            ['clave' => 'whatsapp_enabled'],
            ['valor' => '0', 'tipo' => 'bool', 'grupo' => 'contacto', 'etiqueta' => 'WA enabled']
        );
        ConfiguracionTienda::updateOrCreate(
            ['clave' => 'whatsapp_numero'],
            ['valor' => '59178000000', 'tipo' => 'texto', 'grupo' => 'contacto', 'etiqueta' => 'WA numero']
        );
        ConfiguracionTienda::clearAllCache();

        $response = $this->withHeader('X-Inertia', 'true')->get('/');
        $response->assertStatus(200);

        $tienda = $response->json('props.tienda');
        $this->assertNull($tienda['whatsapp_numero'], 'WA number must be null when disabled');
    }

    public function test_wa_url_is_not_generated_when_disabled(): void
    {
        ConfiguracionTienda::updateOrCreate(
            ['clave' => 'whatsapp_enabled'],
            ['valor' => '0', 'tipo' => 'bool', 'grupo' => 'contacto', 'etiqueta' => 'WA enabled']
        );
        ConfiguracionTienda::clearAllCache();

        $response = $this->get('/');
        $response->assertStatus(200);

        // wa.me links must not appear when WA is disabled
        $this->assertStringNotContainsString('wa.me', $response->getContent());
    }
}
