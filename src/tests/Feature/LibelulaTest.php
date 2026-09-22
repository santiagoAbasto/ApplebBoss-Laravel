<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\Pedido;
use App\Models\User;
use App\Support\Checkout\CreadorDePedido;
use App\Support\Pagos\Libelula;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Libélula.
 *
 * El aviso de pago llega por GET sin firma ni secreto (manual v2.145, pág. 15), y el
 * cliente ve su `transaction_id` en el navegador. Estas pruebas existen sobre todo para
 * una cosa: que recibir el aviso NUNCA alcance para dar un pedido por pagado.
 */
class LibelulaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config([
            'pagos.libelula.habilitado' => true,
            'pagos.libelula.appkey'     => 'appkey-de-prueba',
            'pagos.libelula.base_url'   => 'https://api.libelula.bo/rest/',
        ]);
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
            'telefono_cliente' => '70011223', 'tipo_entrega' => 'retiro', 'metodo_pago' => 'libelula',
        ]);
    }

    private function avisar(Pedido $p, string $id = 'tx-1')
    {
        return $this->get("/pedido/{$p->codigo}/libelula/aviso?t={$p->token_seguimiento}&transaction_id={$id}");
    }

    /* ─── Disponibilidad ──────────────────────────────────────────────────── */

    public function test_sin_appkey_libelula_no_se_ofrece(): void
    {
        config(['pagos.libelula.appkey' => null]);

        $this->assertFalse(Libelula::disponible());
    }

    /* ─── Registro de la deuda ───────────────────────────────────────────── */

    public function test_registra_la_deuda_con_el_detalle_y_devuelve_la_url(): void
    {
        Http::fake(['*deuda/registrar' => Http::response([
            'error' => 0, 'url_pasarela_pagos' => 'https://libelula.bo/pagar/abc', 'id_transaccion' => 'tx-1',
        ])]);

        $pedido = $this->pedido();
        $r = Libelula::registrarDeuda($pedido->load('items'));

        $this->assertSame('https://libelula.bo/pagar/abc', $r['url']);
        $this->assertSame('tx-1', $r['id_transaccion']);

        Http::assertSent(function ($req) use ($pedido) {
            $d = $req->data();

            return $d['appkey'] === 'appkey-de-prueba'
                && $d['identificador'] === $pedido->codigo
                && $d['nombre_cliente'] === 'Ana'
                && $d['apellido_cliente'] === 'Quispe'
                && $d['lineas_detalle_deuda'][0]['costo_unitario'] === 6500.0;
        });
    }

    public function test_si_libelula_responde_error_no_se_inventa_una_url(): void
    {
        Http::fake(['*deuda/registrar' => Http::response(['error' => 1, 'mensaje' => 'appkey inválido'])]);

        $this->assertNull(Libelula::registrarDeuda($this->pedido()->load('items')));
    }

    /* ─── LO CRÍTICO: el aviso no es un comprobante ──────────────────────── */

    public function test_recibir_el_aviso_no_alcanza_para_dar_el_pedido_por_pagado(): void
    {
        // Libélula dice que NO hay ningún pago con ese id
        Http::fake(['*consultar_pagos' => Http::response(['error' => 0, 'datos' => []])]);

        $pedido = $this->pedido();
        $this->avisar($pedido)->assertRedirect();

        $this->assertFalse($pedido->fresh()->pagoConfirmado(), 'un GET sin firma no puede pagar un iPhone');
        $this->assertSame(Pedido::PENDIENTE_PAGO, $pedido->fresh()->estado);
    }

    public function test_no_confirma_si_pago_menos_de_lo_que_debia(): void
    {
        $pedido = $this->pedido();

        Http::fake(['*consultar_pagos' => Http::response(['error' => 0, 'datos' => [
            ['id_transaccion' => 'tx-1', 'monto_pagado' => 1],   // Bs 1 por un equipo de Bs 6.500
        ]])]);

        $this->avisar($pedido);

        $this->assertFalse($pedido->fresh()->pagoConfirmado());
    }

    public function test_confirma_cuando_libelula_reporta_el_pago_completo(): void
    {
        $pedido = $this->pedido();

        Http::fake(['*consultar_pagos' => Http::response(['error' => 0, 'datos' => [
            ['id_transaccion' => 'tx-1', 'monto_pagado' => (float) $pedido->total],
        ]])]);

        $this->avisar($pedido)->assertRedirect();

        $pedido->refresh();
        $this->assertTrue($pedido->pagoConfirmado());
        $this->assertSame('tx-1', $pedido->pago_referencia);
        // Y el equipo salió de la tienda
        $this->assertSame('vendido', Celular::find($pedido->items->first()->producto_id)->estado);
    }

    public function test_el_aviso_sin_el_token_del_pedido_no_se_atiende(): void
    {
        Http::fake(['*consultar_pagos' => Http::response(['error' => 0, 'datos' => [
            ['id_transaccion' => 'tx-1', 'monto_pagado' => 99999],
        ]])]);

        $pedido = $this->pedido();

        $this->get("/pedido/{$pedido->codigo}/libelula/aviso?t=token-inventado&transaction_id=tx-1")
            ->assertNotFound();

        $this->assertFalse($pedido->fresh()->pagoConfirmado());
    }

    public function test_avisar_dos_veces_no_vende_dos_veces(): void
    {
        $pedido = $this->pedido();

        Http::fake(['*consultar_pagos' => Http::response(['error' => 0, 'datos' => [
            ['id_transaccion' => 'tx-1', 'monto_pagado' => (float) $pedido->total],
        ]])]);

        $this->avisar($pedido);
        $eventos = $pedido->fresh()->eventos()->count();

        $this->avisar($pedido);

        $this->assertSame($eventos, $pedido->fresh()->eventos()->count());
    }
}
