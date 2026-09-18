<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\Pedido;
use App\Support\Checkout\ConfirmadorDePago;
use App\Support\Checkout\CreadorDePedido;
use App\Support\Checkout\Entrega;
use App\Support\Pagos\MetodosDePago;
use App\Support\Checkout\StockDePedidos;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * El checkout de la tienda: el servidor manda en el precio y en la disponibilidad,
 * y los datos del equipo (IMEI, serie) salen recién con el pago confirmado.
 */
class CheckoutTiendaTest extends TestCase
{
    use RefreshDatabase;

    private function celular(array $datos = []): Celular
    {
        return Celular::create(array_merge([
            'modelo' => 'iPhone 15', 'capacidad' => '128 GB', 'color' => 'Azul',
            'imei_1' => fake()->unique()->numerify('###############'),
            'imei_2' => fake()->unique()->numerify('###############'),
            'numero_serie' => fake()->unique()->bothify('SER#####'),
            'estado_imei' => 'libre', 'procedencia' => 'EEUU',
            'precio_costo' => 5000, 'precio_venta' => 6500,
            'estado' => 'disponible', 'condicion' => 'Nuevo',
        ], $datos));
    }

    private function publicar(Celular $c, array $datos = []): CatalogoPublicacion
    {
        return CatalogoPublicacion::create(array_merge([
            'producto_tipo' => 'celular',
            'producto_id'   => $c->id,
            'storefront'    => 'APPLE_BOSS',
            'publicado'     => true,
            'titulo'        => 'iPhone 15 128 GB Azul',
            'slug'          => fake()->unique()->slug(3),
            'resumen'       => 'Disponible.',
            'condicion'     => 'Nuevo',
            'categoria'     => 'celulares',
        ], $datos));
    }

    private function datosCliente(array $extra = []): array
    {
        return array_merge([
            'nombre_cliente'   => 'Ana Quispe',
            'email_cliente'    => 'ana@example.com',
            'telefono_cliente' => '70011223',
            'tipo_entrega'     => 'retiro',
        ], $extra);
    }

    /* ─── Lo que promete la tienda tiene que coincidir con lo que hace ───── */

    public function test_la_pregunta_de_envios_nombra_todos_los_departamentos_reales(): void
    {
        // Si mañana se agrega o se saca un departamento de config/envios.php, esta prueba avisa
        // que la respuesta al cliente quedó desactualizada.
        $respuesta = \App\Models\Faq::where('question', '¿Hacen envíos a otras ciudades?')->value('answer');
        $this->assertNotNull($respuesta, 'debería existir la pregunta sobre envíos');

        foreach (Entrega::destinos() as $destino) {
            $this->assertStringContainsString(
                $destino['departamento'],
                $respuesta,
                "la respuesta sobre envíos no menciona {$destino['departamento']}, al que sí se envía"
            );
        }
    }

    public function test_ninguna_respuesta_promete_algo_que_la_tienda_no_hace(): void
    {
        $respuestas = \App\Models\Faq::pluck('answer')->implode(' ');

        // Afirmaciones que no podemos sostener (no somos distribuidor oficial ni damos plazos que no cumplimos)
        foreach (['Apple Authorized', 'distribuidor oficial', 'garantía oficial de Apple', 'envío gratis a todo el país'] as $prohibida) {
            $this->assertStringNotContainsString($prohibida, $respuestas, "no se puede afirmar «{$prohibida}»");
        }
    }

    /* ─── El envío tiene que poder cobrarse ──────────────────────────────── */

    public function test_sin_forma_de_pagar_a_distancia_no_se_ofrece_envio(): void
    {
        // Producción hoy: sin cuenta bancaria cargada y con el QR del BNB apagado,
        // lo único que queda es pagar al retirar. Un envío así no se puede cobrar.
        config([
            'pagos.transferencia.cuenta' => null,
            'pagos.bnb.habilitado'       => false,
            'pagos.efectivo_en_tienda.habilitado' => true,
            'envios.envio.habilitado'    => true,
        ]);

        $this->assertFalse(MetodosDePago::hayPagoADistancia());
        $this->assertSame(['retiro'], array_column(Entrega::opciones(), 'valor'));
    }

    public function test_con_cuenta_cargada_el_envio_vuelve_a_ofrecerse(): void
    {
        config([
            'pagos.transferencia.habilitado' => true,
            'pagos.transferencia.cuenta'     => '1234567890',
            'envios.envio.habilitado'        => true,
        ]);

        $this->assertTrue(MetodosDePago::hayPagoADistancia());
        $this->assertSame(['retiro', 'envio'], array_column(Entrega::opciones(), 'valor'));
    }

    public function test_pagar_al_retirar_no_vale_para_un_envio_a_domicilio(): void
    {
        config(['pagos.transferencia.habilitado' => true, 'pagos.transferencia.cuenta' => '1234567890']);

        $celular = $this->celular();
        $this->publicar($celular);

        $this->post('/checkout', $this->datosCliente([
            'claves'             => ["celular:{$celular->id}"],
            'tipo_entrega'       => 'envio',
            'envio_departamento' => 'Santa Cruz',
            'envio_ciudad'       => 'Santa Cruz de la Sierra',
            'envio_direccion'    => 'Av. Siempre Viva 123',
            'metodo_pago'        => 'efectivo_tienda',
        ]))->assertSessionHasErrors('metodo_pago');

        // Y el equipo no queda apartado por un pedido que no se puede cobrar
        $this->assertDatabaseCount('pedidos', 0);
    }

    public function test_el_precio_lo_pone_el_servidor_no_el_navegador(): void
    {
        $celular = $this->celular(['precio_venta' => 6500]);
        $this->publicar($celular);

        $pedido = CreadorDePedido::crear(["celular:{$celular->id}"], $this->datosCliente());

        // Aunque el navegador quisiera otro precio, manda el inventario
        $this->assertSame(6500.0, (float) $pedido->subtotal);
        $this->assertSame(6500.0, (float) $pedido->total);
        $this->assertSame(6500.0, (float) $pedido->items->first()->precio_unitario);
    }

    public function test_no_se_puede_comprar_algo_que_no_esta_publicado_o_vendido(): void
    {
        $vendido = $this->celular(['estado' => 'vendido']);
        $this->publicar($vendido);

        $this->expectException(\Illuminate\Validation\ValidationException::class);
        CreadorDePedido::crear(["celular:{$vendido->id}"], $this->datosCliente());
    }

    public function test_un_pedido_sin_pagar_aparta_el_equipo(): void
    {
        $celular = $this->celular();
        $pub = $this->publicar($celular);

        CreadorDePedido::crear(["celular:{$celular->id}"], $this->datosCliente());

        // Queda apartado: ya no figura como disponible para otra persona
        $this->assertTrue(StockDePedidos::estaRetenido('celular', $celular->id));
        $this->assertFalse($pub->fresh()->productoDisponible());
    }

    public function test_antes_del_pago_el_seguimiento_no_muestra_imei_ni_serie(): void
    {
        $celular = $this->celular();
        $this->publicar($celular);

        $pedido = CreadorDePedido::crear(["celular:{$celular->id}"], $this->datosCliente());
        $vista = $pedido->paraElCliente();

        $this->assertFalse($vista['pago_confirmado']);
        $this->assertArrayNotHasKey('imei_1', $vista['items'][0]);
        $this->assertArrayNotHasKey('numero_serie', $vista['items'][0]);
        $this->assertStringNotContainsString($celular->imei_1, json_encode($vista));
    }

    public function test_confirmar_el_pago_vende_despublica_y_revela_los_datos(): void
    {
        $celular = $this->celular();
        $pub = $this->publicar($celular);
        $pedido = CreadorDePedido::crear(["celular:{$celular->id}"], $this->datosCliente());

        ConfirmadorDePago::confirmar($pedido, referencia: 'QR-123');
        $pedido->refresh()->load('items', 'eventos');

        // 1) el pedido queda pagado
        $this->assertSame(Pedido::PAGADO, $pedido->estado);
        // 2) el equipo se marca vendido y se despublica solo
        $this->assertSame('vendido', $celular->fresh()->estado);
        $this->assertFalse($pub->fresh()->publicado);
        // 3) recién ahora el comprador ve su IMEI y su serie
        $vista = $pedido->paraElCliente();
        $this->assertTrue($vista['pago_confirmado']);
        $this->assertSame($celular->imei_1, $vista['items'][0]['imei_1']);
        $this->assertSame($celular->numero_serie, $vista['items'][0]['numero_serie']);
    }

    public function test_confirmar_dos_veces_no_duplica_nada(): void
    {
        $celular = $this->celular();
        $this->publicar($celular);
        $pedido = CreadorDePedido::crear(["celular:{$celular->id}"], $this->datosCliente());

        ConfirmadorDePago::confirmar($pedido, referencia: 'QR-1');
        $eventos = $pedido->fresh()->eventos()->count();
        ConfirmadorDePago::confirmar($pedido->fresh(), referencia: 'QR-2');

        $this->assertSame($eventos, $pedido->fresh()->eventos()->count());
        $this->assertSame('QR-1', $pedido->fresh()->pago_referencia);
    }

    public function test_el_envio_suma_su_costo_calculado_en_el_servidor(): void
    {
        config(['envios.envio.destinos' => ['La Paz' => ['costo' => 35, 'plazo' => '2 días']]]);
        $celular = $this->celular(['precio_venta' => 6500]);
        $this->publicar($celular);

        $pedido = CreadorDePedido::crear(["celular:{$celular->id}"], $this->datosCliente([
            'tipo_entrega'       => 'envio',
            'envio_departamento' => 'La Paz',
            'envio_ciudad'       => 'La Paz',
            'envio_direccion'    => 'Av. Siempre Viva 123',
        ]));

        $this->assertSame(35.0, (float) $pedido->costo_envio);
        $this->assertSame(6535.0, (float) $pedido->total);
    }

    public function test_no_se_envia_a_un_departamento_no_habilitado(): void
    {
        config(['envios.envio.destinos' => ['La Paz' => ['costo' => 35, 'plazo' => '2 días']]]);
        $celular = $this->celular();
        $this->publicar($celular);

        $this->expectException(\Illuminate\Validation\ValidationException::class);
        CreadorDePedido::crear(["celular:{$celular->id}"], $this->datosCliente([
            'tipo_entrega'       => 'envio',
            'envio_departamento' => 'Pando',
        ]));
    }

    public function test_un_pedido_vencido_libera_el_equipo(): void
    {
        $celular = $this->celular();
        $pub = $this->publicar($celular);
        $pedido = CreadorDePedido::crear(["celular:{$celular->id}"], $this->datosCliente());

        $pedido->forceFill(['expira_en' => now()->subMinute()])->save();
        StockDePedidos::liberarVencidos();

        $this->assertSame(Pedido::CANCELADO, $pedido->fresh()->estado);
        $this->assertTrue($pub->fresh()->productoDisponible());
        $this->assertSame('disponible', $celular->fresh()->estado);
    }

    public function test_cancelado_no_se_puede_confirmar(): void
    {
        $celular = $this->celular();
        $this->publicar($celular);
        $pedido = CreadorDePedido::crear(["celular:{$celular->id}"], $this->datosCliente());
        ConfirmadorDePago::cancelar($pedido, 'Se arrepintió');

        $this->expectException(\Illuminate\Validation\ValidationException::class);
        ConfirmadorDePago::confirmar($pedido->fresh());
    }
}
