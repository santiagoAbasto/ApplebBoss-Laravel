<?php

namespace Tests\Feature;

use App\Models\CatalogoImagen;
use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\Integracion;
use App\Models\IntegracionSolicitud;
use App\Models\Pedido;
use App\Models\ProductoGeneral;
use App\Models\Reserva;
use App\Models\ReservaItem;
use App\Support\Integracion\InventarioIntegracion;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * API de integración v1 (solo lectura): token, permisos, datos reales del inventario y nada interno.
 */
class IntegracionApiTest extends TestCase
{
    use RefreshDatabase;

    private const IMEI = '358051325422989';
    private const SERIE = 'F2LXK1ABCD';
    private const PROCEDENCIA = 'IMPORTADORA SECRETA';
    private const COSTO = '6123.45';

    protected function setUp(): void
    {
        parent::setUp();
        config(['app.url' => 'https://appleboss.com.bo']);
        Http::preventStrayRequests();
    }

    // ─── Ayudas ──────────────────────────────────────────────────────────────

    private function integracion(?array $scopes = null, bool $activa = true): array
    {
        $i = Integracion::create(['nombre' => 'APPLE BOSS AI', 'scopes' => $scopes ?? array_keys(Integracion::SCOPES), 'activa' => $activa]);

        return [$i, $i->emitirToken('prueba')];
    }

    private function api(?string $token, string $ruta, array $query = [])
    {
        // Cada pedido resuelve el token de nuevo, como en producción
        $this->app['auth']->forgetGuards();
        $pedido = $token ? $this->withToken($token) : $this->withHeaders([]);

        return $pedido->getJson('/api/v1/integration' . $ruta . ($query ? '?' . http_build_query($query) : ''));
    }

    private int $unidades = 0;

    /** IMEI y serie son únicos: el primero lleva los de las constantes (para buscarlos en las respuestas). */
    private function celular(array $datos = []): Celular
    {
        $n = $this->unidades++;

        return Celular::create(array_merge([
            'modelo' => 'IPHONE 15 PRO', 'capacidad' => '256 GB', 'color' => 'NEGRO', 'bateria' => '90',
            'imei_1' => $n ? (string) (358051325400000 + $n) : self::IMEI, 'imei_2' => (string) (358051325500000 + $n),
            'numero_serie' => $n ? self::SERIE . $n : self::SERIE, 'estado_imei' => 'registrado',
            'procedencia' => self::PROCEDENCIA, 'precio_costo' => self::COSTO, 'precio_venta' => 9500.5,
            'estado' => 'disponible', 'condicion' => 'Seminuevo',
        ], $datos));
    }

    private function accesorio(array $datos = []): ProductoGeneral
    {
        $n = $this->unidades++;

        return ProductoGeneral::create(array_merge([
            'codigo' => 'VIDRIO:' . ($n + 1), 'tipo' => 'vidrio_templado', 'nombre' => 'Vidrio Templado iPhone 15', 'procedencia' => self::PROCEDENCIA,
            'precio_costo' => 9, 'precio_venta' => 45, 'estado' => 'disponible', 'condicion' => 'Nuevo',
        ], $datos));
    }

    private function publicar(string $tipo, int $id, array $datos = []): CatalogoPublicacion
    {
        return CatalogoPublicacion::create(array_merge([
            'producto_tipo' => $tipo, 'producto_id' => $id, 'storefront' => 'APPLE_BOSS', 'publicado' => true,
            'titulo' => 'iPhone 15 Pro 256 GB Negro', 'slug' => "pub-{$tipo}-{$id}", 'resumen' => 'Equipo revisado.',
            'condicion' => 'Seminuevo', 'categoria' => 'celulares', 'atributos' => ['chip' => 'A17 Pro', 'imei' => self::IMEI, 'proveedor' => 'X'],
        ], $datos));
    }

    private function imagen(CatalogoPublicacion $pub, int $orden, bool $principal): CatalogoImagen
    {
        return CatalogoImagen::create([
            'publicacion_id' => $pub->id, 'nombre_original' => "foto{$orden}.jpg", 'ruta_original' => "catalogo/{$pub->id}/original/{$orden}.jpg",
            'ruta_thumb' => "catalogo/{$pub->id}/thumb/{$orden}.webp", 'ruta_card' => "catalogo/{$pub->id}/card/{$orden}.webp",
            'ruta_medium' => "catalogo/{$pub->id}/medium/{$orden}.webp", 'ruta_detail' => "catalogo/{$pub->id}/detail/{$orden}.webp",
            'orden' => $orden, 'es_principal' => $principal,
        ]);
    }

    // ─── Autenticación y permisos ────────────────────────────────────────────

    public function test_sin_token_o_con_uno_falso_responde_401_con_el_formato_de_error(): void
    {
        $this->api(null, '/health')->assertStatus(401)->assertJsonPath('error.code', 'unauthenticated');
        $this->api('1|abi_inventado', '/products')->assertStatus(401)->assertJsonPath('error.code', 'unauthenticated');
        $this->api('basura', '/products')->assertStatus(401);
    }

    public function test_con_token_valido_responde_y_dice_sus_permisos_sin_datos_internos(): void
    {
        [, $token] = $this->integracion(['integration.products.read']);
        $this->assertStringStartsWith('abi_', explode('|', $token)[1]);

        $r = $this->api($token, '/health')->assertOk()
            ->assertJsonPath('data.status', 'ok')
            ->assertJsonPath('data.api_version', 'v1')
            ->assertJsonPath('data.scopes', ['integration.products.read']);

        $json = $r->getContent();
        foreach (['DB_', 'APP_KEY', 'password', '/var/www', 'laravel'] as $interno) {
            $this->assertStringNotContainsStringIgnoringCase($interno, $json);
        }
    }

    public function test_token_revocado_integracion_desactivada_y_permiso_que_falta(): void
    {
        [$integracion, $token] = $this->integracion(['integration.products.read']);
        $this->celular();

        // Permiso que falta: 403 con el permiso pedido
        $this->api($token, '/categories')->assertStatus(403)->assertJsonPath('error.code', 'insufficient_scope')
            ->assertJsonPath('error.details.required_scope', 'integration.categories.read');
        $this->api($token, '/products/celular-1/price')->assertStatus(403);
        $this->api($token, '/products', ['sort' => 'price_asc'])->assertStatus(403);
        $this->api($token, '/products', ['availability' => 'sold'])->assertStatus(403);

        // Sin pricing/inventory/media, esos bloques van en null
        $p = $this->api($token, '/products/celular-1')->assertOk()->json('data');
        $this->assertNull($p['pricing']);
        $this->assertNull($p['availability']);
        $this->assertNull($p['images']);

        $integracion->update(['activa' => false]);
        $this->api($token, '/health')->assertStatus(401);

        $integracion->update(['activa' => true]);
        $this->api($token, '/health')->assertOk();
        $integracion->tokens()->delete();
        $this->api($token, '/health')->assertStatus(401);
    }

    public function test_una_sesion_del_panel_no_reemplaza_al_token_ni_el_token_abre_el_panel(): void
    {
        $admin = \App\Models\User::factory()->create(['rol' => 'admin']);
        [, $token] = $this->integracion();

        // El token de integración no abre el panel (sin ninguna sesión previa en esta prueba): 404, como a cualquier visitante
        $this->withToken($token)->get(route('admin.integraciones.index'))->assertNotFound();
        $this->withToken($token)->post(route('admin.integraciones.store'), ['nombre' => 'X', 'scopes' => ['integration.products.read']])->assertNotFound();
        $this->assertSame(1, Integracion::count());

        // Sesión web del administrador, sin token: la API no la acepta
        $this->flushHeaders();
        $this->app['auth']->forgetGuards();
        $this->actingAs($admin)->getJson('/api/v1/integration/health')->assertStatus(401);
        // Aunque el guard de tokens tuviera un usuario del panel, no es una integración
        $this->app['auth']->forgetGuards();
        $this->actingAs($admin, 'sanctum')->getJson('/api/v1/integration/products')->assertStatus(401)->assertJsonPath('error.code', 'unauthenticated');

    }

    public function test_rotar_no_revive_tokens_vencidos_ni_revocados(): void
    {
        [$integracion, $vencido] = $this->integracion();
        $integracion->tokens()->update(['expires_at' => now()->subHour()]);
        $revocado = $integracion->emitirToken('revocado');
        $integracion->tokens()->where('name', 'revocado')->delete();
        $vigente = $integracion->emitirToken('vigente');

        $admin = \App\Models\User::factory()->create(['rol' => 'admin']);
        $this->actingAs($admin)->post(route('admin.integraciones.token', $integracion), ['vencer_anteriores' => true])->assertRedirect();
        $this->assertTrue($integracion->tokens()->where('name', 'prueba')->first()->expires_at->isPast());

        $this->api($vencido, '/health')->assertStatus(401);
        $this->api($revocado, '/health')->assertStatus(401);
        $this->api($vigente, '/health')->assertOk();

        $this->travel(Integracion::HORAS_DE_GRACIA + 1)->hours();
        $this->api($vigente, '/health')->assertStatus(401);
    }

    public function test_cada_scope_abre_solo_lo_suyo_y_no_se_mezclan_integraciones(): void
    {
        $cel = $this->celular();
        $pub = $this->publicar('celular', $cel->id);
        $this->imagen($pub, 1, true);

        $rutas = [
            '/products'                              => 'integration.products.read',
            "/products/celular-{$cel->id}"           => 'integration.products.read',
            "/products/celular-{$cel->id}/images"    => 'integration.media.read',
            "/products/celular-{$cel->id}/price"     => 'integration.pricing.read',
            "/products/celular-{$cel->id}/availability" => 'integration.inventory.read',
            '/categories'                            => 'integration.categories.read',
            '/exchange-rates'                        => 'integration.exchange_rates.read',
            '/changes?since=2000-01-01'              => 'integration.products.read',
        ];
        Http::fake(['*' => Http::response(['data' => ['blue' => ['buy' => 9.5]]])]);

        foreach (Integracion::SCOPES as $scope => $_) {
            [, $token] = $this->integracion([$scope]);
            foreach ($rutas as $ruta => $pide) {
                $base = in_array($pide, ['integration.media.read', 'integration.pricing.read', 'integration.inventory.read'], true);
                $tiene = $scope === $pide && ! $base;   // los subrecursos piden además products.read
                $this->api($token, $ruta)->assertStatus($tiene ? 200 : 403);
            }
        }

        // Dos integraciones, una tras otra: cada respuesta lleva solo lo que su token permite
        [, $completa] = $this->integracion();
        [, $soloProductos] = $this->integracion(['integration.products.read', 'integration.categories.read']);
        $this->assertNotNull($this->api($completa, "/products/celular-{$cel->id}")->json('data.pricing'));
        $p = $this->api($soloProductos, "/products/celular-{$cel->id}")->json('data');
        $this->assertNull($p['pricing']);
        $this->assertNull($p['availability']);
        $this->assertNull($p['images']);
        $this->assertNull(collect($this->api($soloProductos, '/categories')->json('data'))->first()['available_items']);
        $cambio = $this->api($soloProductos, '/changes', ['since' => '2000-01-01'])->json('data.0.product');
        $this->assertNull($cambio['pricing']);
        $this->assertNotNull($this->api($completa, "/products/celular-{$cel->id}")->json('data.availability'));
    }

    public function test_al_rotar_el_token_anterior_sirve_hasta_que_vence(): void
    {
        [$integracion, $viejo] = $this->integracion();
        $integracion->tokens()->update(['expires_at' => now()->addHours(Integracion::HORAS_DE_GRACIA)]);
        $nuevo = $integracion->emitirToken('rotado');

        $this->api($viejo, '/health')->assertOk();
        $this->api($nuevo, '/health')->assertOk();

        $this->travel(Integracion::HORAS_DE_GRACIA + 1)->hours();
        $this->api($viejo, '/health')->assertStatus(401);
        $this->api($nuevo, '/health')->assertOk();
    }

    public function test_limite_de_pedidos_por_integracion(): void
    {
        [, $token] = $this->integracion();

        for ($i = 0; $i < Integracion::LIMITE_POR_MINUTO; $i++) {
            $this->api($token, '/health')->assertOk();
        }
        $this->api($token, '/health')->assertStatus(429)->assertJsonPath('error.code', 'rate_limited')->assertHeader('Retry-After');
    }

    public function test_es_solo_lectura_y_rechaza_filtros_que_no_existen(): void
    {
        [, $token] = $this->integracion();
        $this->celular();

        foreach (['postJson', 'putJson', 'patchJson', 'deleteJson'] as $metodo) {
            $this->app['auth']->forgetGuards();
            $this->withToken($token)->{$metodo}('/api/v1/integration/products/celular-1', ['precio_venta' => 1])
                ->assertStatus(405)->assertJsonPath('error.code', 'method_not_allowed');
        }
        $this->assertEquals(9500.5, Celular::first()->precio_venta);

        $this->api($token, '/products', ['brand' => 'Apple'])->assertStatus(422)->assertJsonPath('error.code', 'invalid_parameters');
        $this->api($token, '/products', ['currency' => 'USD'])->assertStatus(422);
        $this->api($token, '/products', ['per_page' => 500])->assertStatus(422);
        $this->api($token, '/products/../../etc')->assertStatus(404);
    }

    // ─── Productos ───────────────────────────────────────────────────────────

    public function test_detalle_de_un_equipo_con_su_publicacion_fotos_precio_y_procedencia(): void
    {
        [, $token] = $this->integracion();
        $cel = $this->celular();
        $pub = $this->publicar('celular', $cel->id, ['precio_promocional' => 9000, 'promocion_desde' => now()->subDay(), 'promocion_hasta' => now()->addDay()]);
        $this->imagen($pub, 2, false);
        $this->imagen($pub, 1, true);

        $p = $this->api($token, "/products/celular-{$cel->id}")->assertOk()->json('data');

        $this->assertSame("celular-{$cel->id}", $p['id']);
        $this->assertSame('unit', $p['kind']);
        $this->assertSame('IPHONE 15 PRO', $p['name']);
        $this->assertSame('iPhone 15 Pro 256 GB Negro', $p['display_name']);
        $this->assertSame(['id' => 'celulares', 'name' => 'iPhone'], $p['category']);
        $this->assertSame(['value' => 'used', 'label' => 'Seminuevo'], $p['condition']);
        $this->assertSame(['raw' => '90', 'health_percent' => 90, 'cycles' => null, 'sealed' => false], $p['attributes']['battery']);
        $this->assertSame(['currency' => 'BOB', 'amount' => '9500.50', 'price_type' => 'list_price', 'promotional_amount' => '9000.00'],
            array_intersect_key($p['pricing'], array_flip(['currency', 'amount', 'price_type', 'promotional_amount'])));
        $this->assertSame('available', $p['availability']['status']);
        $this->assertSame(1, $p['availability']['quantity']);
        $this->assertSame('published', $p['publication']['status']);
        $this->assertSame("https://appleboss.com.bo/productos/{$pub->slug}", $p['publication']['url']);
        $this->assertSame('A17 Pro', $p['publication']['attributes']['chip']);
        $this->assertSame('Equipo revisado.', $p['publication']['summary']);
        $this->assertSame(['system' => 'appleboss', 'source_type' => 'internal_inventory', 'record_id' => "celular-{$cel->id}"],
            array_intersect_key($p['source'], array_flip(['system', 'source_type', 'record_id'])));

        // La principal primero, luego por orden, con direcciones HTTPS absolutas
        $this->assertCount(2, $p['images']);
        $this->assertTrue($p['images'][0]['is_primary']);
        $this->assertSame("https://appleboss.com.bo/storage/catalogo/{$pub->id}/detail/1.webp", $p['images'][0]['url']);
        $this->assertStringStartsWith('https://appleboss.com.bo/storage/', $p['images'][1]['sizes']['thumb']);

        $this->api($token, "/products/celular-{$cel->id}/images")->assertOk()->assertJsonCount(2, 'data');
        $this->api($token, "/products/celular-{$cel->id}/price")->assertOk()->assertJsonPath('data.amount', '9500.50')->assertJsonPath('data.currency', 'BOB');
        $this->api($token, "/products/celular-{$cel->id}/availability")->assertOk()->assertJsonPath('data.status', 'available');
    }

    public function test_nada_interno_sale_en_ninguna_ruta(): void
    {
        [, $token] = $this->integracion();
        $cel = $this->celular();
        $this->publicar('celular', $cel->id);
        $acc = $this->accesorio();
        $this->publicar('producto_general', $acc->id, ['titulo' => 'Vidrio templado', 'slug' => 'vidrio', 'categoria' => 'accesorios']);
        Computadora::create(['nombre' => 'MACBOOK AIR M2', 'procesador' => 'M2', 'ram' => '8', 'almacenamiento' => '256 GB', 'color' => 'PLATA',
            'bateria' => '149 CICLOS', 'numero_serie' => self::SERIE, 'procedencia' => self::PROCEDENCIA, 'precio_costo' => self::COSTO,
            'precio_venta' => 7000, 'estado' => 'disponible']);

        $respuestas = collect(['/products', '/products?availability=all', "/products/celular-{$cel->id}", '/products/computadora-1', '/categories'])
            ->map(fn ($r) => $this->api($token, $r)->assertOk()->getContent())->implode(' ');
        $respuestas .= $this->api($token, '/changes', ['since' => now()->subYear()->toIso8601String()])->assertOk()->getContent();

        foreach ([self::IMEI, self::SERIE, self::PROCEDENCIA, self::COSTO, '6123', 'precio_costo', 'procedencia', 'imei', 'estado_imei', 'VIDRIO:1', 'proveedor'] as $secreto) {
            $this->assertStringNotContainsStringIgnoringCase($secreto, $respuestas, "Salió «{$secreto}»");
        }
    }

    public function test_lista_paginada_con_busqueda_y_filtros(): void
    {
        [, $token] = $this->integracion();
        $this->celular(['modelo' => 'IPHONE 13', 'capacidad' => '128 GB', 'color' => 'AZUL', 'precio_venta' => 3000, 'condicion' => null]);
        $this->celular(['modelo' => 'IPHONE 15 PRO', 'precio_venta' => 9500]);
        $this->celular(['modelo' => 'IPHONE 15 PRO', 'estado' => 'vendido']);
        $this->accesorio();

        // Por defecto: lo que sigue en stock, sin lo vendido
        $this->api($token, '/products')->assertOk()->assertJsonPath('meta.total', 3)->assertJsonPath('meta.availability', 'in_stock');
        $this->api($token, '/products', ['availability' => 'sold'])->assertJsonPath('meta.total', 1);
        $this->api($token, '/products', ['availability' => 'all'])->assertJsonPath('meta.total', 4);

        $this->api($token, '/products', ['search' => 'iphone azul'])->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.name', 'IPHONE 13');
        // Buscar «iphone» no trae otros celulares por estar en la categoría que la tienda llama «iPhone»
        $this->celular(['modelo' => 'REALME C35', 'capacidad' => '128 GB', 'color' => 'NEGRO', 'estado' => 'vendido']);
        $this->api($token, '/products', ['search' => 'iphone', 'category' => 'celulares', 'availability' => 'all'])->assertJsonPath('meta.total', 3);
        $this->api($token, '/products', ['search' => 'realme', 'availability' => 'all'])->assertJsonPath('meta.total', 1);

                // El vidrio «para iPhone 15» también coincide: todas las palabras, sin tildes ni mayúsculas
        $this->api($token, '/products', ['search' => 'ÍPHONE   15'])->assertJsonPath('meta.total', 2);
        $this->api($token, '/products', ['search' => 'iphone 15 pro negro'])->assertJsonPath('meta.total', 1);
        $this->api($token, '/products', ['category' => 'accesorios'])->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.kind', 'article');
        // La condición vacía en el inventario no se supone: queda como desconocida
        $this->api($token, '/products', ['condition' => 'unknown'])->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.condition', ['value' => null, 'label' => null]);
        $this->api($token, '/products', ['condition' => 'new'])->assertJsonPath('meta.total', 1);
        $this->api($token, '/products', ['condition' => 'used'])->assertJsonPath('meta.total', 1);
        $this->api($token, '/products', ['min_price' => 1000, 'max_price' => 5000])->assertJsonPath('meta.total', 1);
        $this->api($token, '/products', ['sort' => 'price_desc'])->assertJsonPath('data.0.pricing.amount', '9500.00');
        $this->api($token, '/products', ['sort' => 'price_asc'])->assertJsonPath('data.0.pricing.amount', '45.00');

        $p1 = $this->api($token, '/products', ['per_page' => 2, 'sort' => 'name'])->assertJsonPath('meta.last_page', 2)->json('data.*.id');
        $p2 = $this->api($token, '/products', ['per_page' => 2, 'page' => 2, 'sort' => 'name'])->json('data.*.id');
        $this->assertCount(2, $p1);
        $this->assertCount(1, $p2);
        $this->assertEmpty(array_intersect($p1, $p2));

        $this->api($token, '/products/celular-999')->assertStatus(404)->assertJsonPath('error.code', 'not_found');
        $this->api($token, '/products/accesorio-0000000000000000')->assertStatus(404);
    }

    public function test_publicacion_borrador_no_entrega_fotos_ni_direccion(): void
    {
        [, $token] = $this->integracion();
        $cel = $this->celular();
        $pub = $this->publicar('celular', $cel->id, ['publicado' => false]);
        $this->imagen($pub, 1, true);
        $sinPublicar = $this->celular(['modelo' => 'IPHONE 16']);

        $p = $this->api($token, "/products/celular-{$cel->id}")->json('data');
        $this->assertSame('not_published', $p['publication']['status']);
        $this->assertNull($p['publication']['url']);
        $this->assertSame([], $p['images']);

        $this->api($token, "/products/celular-{$sinPublicar->id}")->assertJsonPath('data.publication.status', 'not_listed')->assertJsonPath('data.images', []);
        $this->api($token, "/products/celular-{$sinPublicar->id}/images")->assertOk()->assertJsonPath('data', [])->assertJsonPath('meta.publication_status', 'not_listed');
    }

    // ─── Disponibilidad ──────────────────────────────────────────────────────

    public function test_vendido_reservado_y_apartado_por_un_pedido(): void
    {
        [, $token] = $this->integracion();
        $vendido = $this->celular(['estado' => 'vendido']);
        $reservado = $this->celular();
        $enPedido = $this->celular();

        $vendedor = \App\Models\User::factory()->create(['rol' => 'vendedor']);
        $reserva = Reserva::create(['nombre_cliente' => 'Cliente', 'telefono_cliente' => '70000123', 'codigo_nota' => 'R-1', 'estado' => 'activa', 'subtotal' => 9500, 'monto_reserva' => 500, 'user_id' => $vendedor->id]);
        ReservaItem::create(['reserva_id' => $reserva->id, 'tipo' => 'celular', 'producto_id' => $reservado->id, 'cantidad' => 1, 'precio_venta' => 9500, 'subtotal' => 9500]);
        $pedido = Pedido::create(['codigo' => Pedido::nuevoCodigo(), 'token_seguimiento' => Pedido::nuevoToken(), 'nombre_cliente' => 'Ana Pérez',
            'email_cliente' => 'ana@example.com', 'telefono_cliente' => '70011223', 'subtotal' => 9500, 'total' => 9500, 'estado' => Pedido::PENDIENTE_PAGO, 'metodo_pago' => 'binance_pay']);
        $pedido->items()->create(['tipo' => 'celular', 'producto_id' => $enPedido->id, 'nombre' => 'iPhone', 'precio_unitario' => 9500, 'subtotal' => 9500]);

        $this->api($token, "/products/celular-{$vendido->id}/availability")->assertOk()->assertJsonPath('data.status', 'sold')->assertJsonPath('data.quantity', 0);
        $this->api($token, "/products/celular-{$reservado->id}/availability")->assertJsonPath('data.status', 'reserved')->assertJsonPath('data.reason', 'reservation');
        $this->api($token, "/products/celular-{$enPedido->id}/availability")->assertJsonPath('data.status', 'reserved')->assertJsonPath('data.reason', 'pending_order');

        // Ni el nombre ni el teléfono de quien reservó o pidió
        $todo = $this->api($token, '/products', ['availability' => 'all'])->getContent();
        foreach (['Ana Pérez', 'ana@example.com', '70011223', '70000123', 'Cliente'] as $dato) {
            $this->assertStringNotContainsString($dato, $todo);
        }
    }

    public function test_un_articulo_de_accesorios_cuenta_sus_unidades_libres(): void
    {
        [, $token] = $this->integracion();
        $a = $this->accesorio();
        $this->accesorio(['nombre' => '  VIDRIO TEMPLADO iphone 15 ']);   // mismo artículo: mismo nombre y precio
        $reservada = $this->accesorio();
        $this->accesorio(['estado' => 'vendido']);
        $this->accesorio(['precio_venta' => 60]);                         // otro precio: otro artículo

        $vendedor = \App\Models\User::factory()->create(['rol' => 'vendedor']);
        $reserva = Reserva::create(['nombre_cliente' => 'C', 'telefono_cliente' => '7', 'codigo_nota' => 'R-2', 'estado' => 'activa', 'subtotal' => 45, 'monto_reserva' => 10, 'user_id' => $vendedor->id]);
        ReservaItem::create(['reserva_id' => $reserva->id, 'tipo' => 'producto_general', 'producto_id' => $reservada->id, 'cantidad' => 1, 'precio_venta' => 45, 'subtotal' => 45]);

        $id = InventarioIntegracion::idArticulo($a->nombre, $a->precio_venta);
        $p = $this->api($token, "/products/{$id}")->assertOk()->json('data');
        $this->assertSame('article', $p['kind']);
        $this->assertSame(['status' => 'available', 'quantity' => 2, 'reserved_quantity' => 1, 'reason' => null],
            array_intersect_key($p['availability'], array_flip(['status', 'quantity', 'reserved_quantity', 'reason'])));
        $this->assertSame('45.00', $p['pricing']['amount']);
        $this->assertSame(['id' => 'vidrio_templado', 'name' => 'Vidrio templado'], $p['attributes']['accessory_type']);
        $this->api($token, '/products', ['category' => 'accesorios'])->assertJsonPath('meta.total', 2);

        // Agotado: sigue respondiendo por su id, como sold_out
        ProductoGeneral::query()->update(['estado' => 'vendido']);
        $this->api($token, "/products/{$id}/availability")->assertJsonPath('data.status', 'sold_out')->assertJsonPath('data.quantity', 0);
    }

    // ─── Categorías y tipo de cambio ─────────────────────────────────────────

    public function test_categorias_con_lo_disponible(): void
    {
        [, $token] = $this->integracion();
        $this->celular();
        $this->accesorio();

        $data = collect($this->api($token, '/categories')->assertOk()->json('data'))->keyBy('id');
        $this->assertSame(['celulares', 'computadoras', 'productos-apple', 'accesorios'], $data->keys()->all());
        $this->assertSame(1, $data['celulares']['available_items']);
        $this->assertSame(0, $data['computadoras']['available_items']);
        $this->assertSame(1, collect($data['accesorios']['subcategories'])->firstWhere('id', 'vidrio_templado')['available_items']);
    }

    public function test_tipo_de_cambio_el_de_la_tienda_o_ninguno(): void
    {
        [, $token] = $this->integracion();

        // Primero responde la fuente; después se cae
        Http::fake(['*' => Http::sequence()->push(['data' => ['blue' => ['buy' => 9.87]]])->push('caído', 500)]);
        $this->api($token, '/exchange-rates')->assertOk()
            ->assertJsonPath('data.0.base', 'USD')->assertJsonPath('data.0.quote', 'BOB')
            ->assertJsonPath('data.0.rate', '9.87')->assertJsonPath('data.0.origin', 'live')->assertJsonPath('meta.available', true);

        // La fuente cae, no hay último valor ni tasa manual: no se inventa
        Cache::flush();
        config(['pagos.binance.tasa_bob' => 0]);
        $this->api($token, '/exchange-rates')->assertOk()->assertJsonPath('data', [])->assertJsonPath('meta.available', false);
    }

    // ─── Cambios incrementales ───────────────────────────────────────────────

    public function test_cambios_desde_una_fecha_con_cursor_y_tombstone_al_venderse(): void
    {
        [, $token] = $this->integracion();
        $this->travelTo(now()->subDays(3));
        $viejo = $this->celular();
        $this->travelBack();

        $desde = now()->subMinute()->toIso8601String();
        $a = $this->celular();
        $b = $this->celular();

        $r = $this->api($token, '/changes', ['since' => $desde, 'limit' => 1])->assertOk();
        $this->assertSame("celular-{$a->id}", $r->json('data.0.id'));
        $this->assertTrue($r->json('meta.has_more'));
        $r2 = $this->api($token, '/changes', ['cursor' => $r->json('meta.next_cursor'), 'limit' => 10])->assertOk();
        $this->assertSame(["celular-{$b->id}"], $r2->json('data.*.id'));
        $this->assertFalse($r2->json('meta.has_more'));

        // Se vende el viejo: aparece como tombstone
        $this->travel(5)->seconds();
        $viejo->update(['estado' => 'vendido']);
        $r3 = $this->api($token, '/changes', ['cursor' => $r2->json('meta.next_cursor')])->assertOk();
        $this->assertSame([['change_type' => 'tombstone', 'id' => "celular-{$viejo->id}"]],
            collect($r3->json('data'))->map(fn ($c) => ['change_type' => $c['change_type'], 'id' => $c['id']])->all());

        $this->api($token, '/changes')->assertStatus(422);
        $this->api($token, '/changes', ['cursor' => 'no-es-un-cursor'])->assertStatus(422)->assertJsonPath('error.code', 'invalid_parameters');
    }

    // ─── Registro ────────────────────────────────────────────────────────────

    public function test_cada_llamada_queda_anotada_sin_el_token(): void
    {
        [$integracion, $token] = $this->integracion();
        $this->api($token, '/health')->assertOk();
        $this->api('1|abi_falso', '/products')->assertStatus(401);

        $filas = IntegracionSolicitud::orderBy('id')->get();
        $this->assertCount(2, $filas);
        $this->assertSame([$integracion->id, 'GET', '/api/v1/integration/health', 200], [$filas[0]->integracion_id, $filas[0]->metodo, $filas[0]->ruta, $filas[0]->estado]);
        $this->assertSame([null, 401], [$filas[1]->integracion_id, $filas[1]->estado]);

        $todo = json_encode(IntegracionSolicitud::all()->toArray()) . json_encode(\DB::table('personal_access_tokens')->get());
        $this->assertStringNotContainsString(explode('|', $token)[1], $todo);
    }
}
