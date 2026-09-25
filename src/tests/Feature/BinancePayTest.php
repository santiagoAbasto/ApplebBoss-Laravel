<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\Pedido;
use App\Models\User;
use App\Support\Checkout\CreadorDePedido;
use App\Support\Pagos\BinancePay;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Binance Pay.
 *
 * Dos cosas se vigilan acá: que el tipo de cambio sea el que fijó la tienda (y que sin
 * tasa no se cobre nada), y que recibir el webhook nunca alcance para dar un pedido por
 * pagado — lo único que confirma es preguntarle a Binance.
 */
class BinancePayTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'pagos.binance.habilitado' => true,
            'pagos.binance.api_key'    => 'llave',
            'pagos.binance.api_secret' => 'secreto',
            'pagos.binance.base_url'   => 'https://bpay.binanceapi.com',
            'pagos.binance.moneda'     => 'USDT',
            'pagos.binance.tasa_bob'   => 13.0,   // respaldo si la fuente del paralelo falla
        ]);

        Cache::flush();
    }

    /**
     * El tipo de cambio sale de una API externa, así que en las pruebas también se finge.
     * Sin esto, la suite dependería de que dolarbluebolivia.click esté arriba.
     */
    private function fingir(array $extra = []): void
    {
        Http::fake(array_merge([
            '*dolarbluebolivia*' => Http::response(['data' => ['blue' => ['buy' => 13.0]]]),
        ], $extra));
    }

    private function pedido(): Pedido
    {
        $celular = Celular::create([
            'modelo' => 'iPhone 15', 'capacidad' => '128 GB', 'color' => 'Negro',
            'imei_1' => fake()->unique()->numerify('###############'), 'estado_imei' => 'libre',
            'procedencia' => 'EEUU', 'precio_costo' => 5000, 'precio_venta' => 6500,
            'estado' => 'disponible', 'condicion' => 'Nuevo',
        ]);
        CatalogoPublicacion::create([
            'producto_tipo' => 'celular', 'producto_id' => $celular->id,
            'storefront' => 'APPLE_BOSS', 'publicado' => true,
            'titulo' => 'iPhone 15 128 GB Negro', 'slug' => 'iphone-15-' . $celular->id,
            'resumen' => 'Sellado.', 'condicion' => 'Nuevo', 'categoria' => 'celulares',
        ]);

        $this->actingAs(User::factory()->create(['rol' => 'cliente']));

        return CreadorDePedido::crear(["celular:{$celular->id}"], [
            'nombre_cliente' => 'Ana Quispe', 'email_cliente' => 'ana@gmail.com',
            'telefono_cliente' => '70011223', 'tipo_entrega' => 'retiro', 'metodo_pago' => 'binance_pay',
        ]);
    }

    /* ─── Tipo de cambio ──────────────────────────────────────────────────── */

    public function test_sin_tipo_de_cambio_no_se_ofrece_binance(): void
    {
        config(['pagos.binance.tasa_bob' => null]);
        Http::fake(['*dolarbluebolivia*' => Http::response([], 500)]);

        $this->assertFalse(BinancePay::disponible(), 'sin tipo de cambio no se puede cobrar');
    }

    public function test_convierte_al_dolar_paralelo(): void
    {
        $this->fingir();

        // Bs 6.500 a Bs 13 por USDT = 500 USDT
        $this->assertSame(500.0, BinancePay::enCripto(6500));
    }

    /* ─── Firma ───────────────────────────────────────────────────────────── */

    public function test_la_llamada_va_firmada_como_espera_binance(): void
    {
        $this->fingir(['*binancepay*' => Http::response(['status' => 'SUCCESS', 'data' => [
            'checkoutUrl' => 'https://pay.binance.com/abc', 'prepayId' => 'pp-1',
        ]])]);

        $pedido = $this->pedido();
        $r = BinancePay::crearOrden($pedido->load('items'));

        $this->assertSame('https://pay.binance.com/abc', $r['url']);
        $this->assertSame(500.0, $r['monto_usdt']);

        Http::assertSent(function ($req) {
            $firma = $req->header('BinancePay-Signature')[0] ?? '';

            // Binance rechaza la firma si no va en hexadecimal y en MAYÚSCULAS
            return $firma === strtoupper($firma)
                && preg_match('/^[0-9A-F]{128}$/', $firma) === 1
                && ($req->header('BinancePay-Certificate-SN')[0] ?? '') === 'llave';
        });
    }

    /* ─── LO CRÍTICO: el webhook no es un comprobante ─────────────────────── */

    public function test_recibir_el_webhook_no_alcanza_para_dar_el_pedido_por_pagado(): void
    {
        $pedido = $this->pedido();

        // Binance dice que la orden sigue sin pagarse
        $this->fingir(['*order/query' => Http::response(['status' => 'SUCCESS', 'data' => ['status' => 'INITIAL']])]);

        $this->postJson("/pedido/{$pedido->codigo}/binance/aviso?t={$pedido->token_seguimiento}")
            ->assertOk()->assertJson(['returnCode' => 'SUCCESS']);

        $this->assertFalse($pedido->fresh()->pagoConfirmado());
    }

    public function test_no_confirma_si_pago_menos_usdt_de_lo_que_debia(): void
    {
        $pedido = $this->pedido();

        $this->fingir(['*order/query' => Http::response(['status' => 'SUCCESS', 'data' => [
            'status' => 'PAID', 'orderAmount' => 1,   // 1 USDT por algo que vale 500
        ]])]);

        $this->postJson("/pedido/{$pedido->codigo}/binance/aviso?t={$pedido->token_seguimiento}");

        $this->assertFalse($pedido->fresh()->pagoConfirmado());
    }

    public function test_confirma_cuando_binance_reporta_la_orden_pagada(): void
    {
        $pedido = $this->pedido();

        $this->fingir(['*order/query' => Http::response(['status' => 'SUCCESS', 'data' => [
            'status' => 'PAID', 'orderAmount' => 500,
        ]])]);

        $this->postJson("/pedido/{$pedido->codigo}/binance/aviso?t={$pedido->token_seguimiento}")->assertOk();

        $pedido->refresh();
        $this->assertTrue($pedido->pagoConfirmado());
        $this->assertSame('vendido', Celular::find($pedido->items->first()->producto_id)->estado);
    }

    public function test_el_webhook_sin_el_token_del_pedido_no_se_atiende(): void
    {
        $this->fingir(['*order/query' => Http::response(['status' => 'SUCCESS', 'data' => [
            'status' => 'PAID', 'orderAmount' => 999999,
        ]])]);

        $pedido = $this->pedido();

        $this->postJson("/pedido/{$pedido->codigo}/binance/aviso?t=inventado")->assertNotFound();

        $this->assertFalse($pedido->fresh()->pagoConfirmado());
    }

    /* ─── Modo manual: cuando Binance no atiende al servidor ──────────────── */

    public function test_si_binance_no_atiende_al_servidor_el_cliente_paga_al_pay_id(): void
    {
        config(['pagos.binance.pay_id' => '123456789']);
        // Así contesta Binance a un servidor en EE. UU.
        $this->fingir(['*binancepay*' => Http::response(['code' => 0, 'msg' => 'Service unavailable from a restricted location'], 451)]);

        $pedido = $this->pedido();

        $this->get("/pedido/{$pedido->codigo}/pago?t={$pedido->token_seguimiento}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Store/Pago')
                ->where('binance.pay_id', '123456789')
                ->where('binance.monto_usdt', 500)
                ->where('binance.moneda', 'USDT'));

        $this->assertFalse(BinancePay::automatico(), 'después del 451 no se sigue golpeando la API');
        $this->assertSame(500.0, (float) $pedido->fresh()->pago_monto_usdt);
    }

    public function test_con_la_api_bloqueada_y_sin_pay_id_no_se_ofrece(): void
    {
        $this->fingir(['*binancepay*' => Http::response([], 451)]);
        $pedido = $this->pedido();

        BinancePay::crearOrden($pedido->load('items'));

        // Sin forma de cobrar, mejor no ofrecerlo que dejar al cliente trabado
        $this->assertFalse(BinancePay::disponible());
        $this->assertNotContains('binance_pay', \App\Support\Pagos\MetodosDePago::valores());
    }

    public function test_el_monto_en_usdt_queda_congelado_aunque_se_mueva_el_paralelo(): void
    {
        config(['pagos.binance.pay_id' => '123456789', 'pagos.binance.api_key' => null]);
        // Primera consulta del paralelo: 13; la siguiente: 10
        Http::fake(['*dolarbluebolivia*' => Http::sequence()
            ->push(['data' => ['blue' => ['buy' => 13.0]]])
            ->push(['data' => ['blue' => ['buy' => 10.0]]])]);
        $pedido = $this->pedido();

        $this->assertSame(500.0, BinancePay::cotizar($pedido));

        // El paralelo cambia a 10: el mismo pedido ahora costaría 650 USDT
        Cache::flush();
        $this->assertSame(650.0, BinancePay::enCripto(6500));

        // Pero al cliente se le cobra lo que se le mostró
        $this->assertSame(500.0, BinancePay::cotizar($pedido->fresh()));
    }

    public function test_en_modo_manual_el_webhook_no_confirma_nada(): void
    {
        config(['pagos.binance.pay_id' => '123456789', 'pagos.binance.api_key' => null]);
        $this->fingir(['*order/query' => Http::response(['status' => 'SUCCESS', 'data' => [
            'status' => 'PAID', 'orderAmount' => 999999,
        ]])]);
        $pedido = $this->pedido();

        $this->postJson("/pedido/{$pedido->codigo}/binance/aviso?t={$pedido->token_seguimiento}")->assertOk();

        // En manual lo confirma una persona en el panel, mirando la captura
        $this->assertFalse($pedido->fresh()->pagoConfirmado());
        Http::assertNotSent(fn ($req) => str_contains($req->url(), 'order/query'));
    }
}
