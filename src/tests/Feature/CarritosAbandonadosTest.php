<?php

namespace Tests\Feature;

use App\Mail\CarritoAbandonado;
use App\Models\Carrito;
use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\Pedido;
use App\Models\Role;
use App\Models\User;
use App\Support\Checkout\CreadorDePedido;
use App\Support\Checkout\StockDePedidos;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Carritos abandonados: captura con sesión, recordatorios a tiempo (y nunca de más), enlace que rearma el carrito y panel. */
class CarritosAbandonadosTest extends TestCase
{
    use RefreshDatabase;

    private function publicado(string $titulo = 'iPhone 15 128 GB Azul'): CatalogoPublicacion
    {
        $c = Celular::create([
            'modelo' => 'iPhone 15', 'capacidad' => '128 GB', 'color' => 'Azul',
            'imei_1' => fake()->unique()->numerify('###############'),
            'imei_2' => fake()->unique()->numerify('###############'),
            'numero_serie' => fake()->unique()->bothify('SER#####'),
            'estado_imei' => 'libre', 'procedencia' => 'EEUU',
            'precio_costo' => 5000, 'precio_venta' => 6500,
            'estado' => 'disponible', 'condicion' => 'Nuevo',
        ]);

        return CatalogoPublicacion::create([
            'producto_tipo' => 'celular', 'producto_id' => $c->id, 'storefront' => 'APPLE_BOSS', 'publicado' => true,
            'titulo' => $titulo, 'slug' => fake()->unique()->slug(3), 'resumen' => 'Disponible.', 'condicion' => 'Nuevo', 'categoria' => 'celulares',
        ]);
    }

    private function cliente(): User
    {
        return User::factory()->create(['rol' => 'cliente', 'name' => 'Ana Quispe', 'telefono' => '70011223']);
    }

    private function sincronizar(User $u, array $pubs): \Illuminate\Testing\TestResponse
    {
        return $this->actingAs($u)->postJson('/api/carrito/sync', [
            'items' => array_map(fn ($p) => ['key' => "{$p->producto_tipo}:{$p->producto_id}", 'quantity' => 1], $pubs),
        ]);
    }

    private function pedidoDe(User $u, CatalogoPublicacion $pub): Pedido
    {
        $this->actingAs($u);

        return CreadorDePedido::crear(["celular:{$pub->producto_id}"], [
            'nombre_cliente' => 'Ana Quispe', 'email_cliente' => $u->email, 'telefono_cliente' => '70011223',
            'tipo_entrega' => 'retiro', 'metodo_pago' => 'transferencia',
        ]);
    }

    public function test_el_carrito_de_quien_tiene_sesion_se_guarda_y_el_mismo_carrito_no_reinicia_el_reloj(): void
    {
        $pub = $this->publicado();
        $ana = $this->cliente();

        $this->postJson('/api/carrito/sync', ['items' => [['key' => "celular:{$pub->producto_id}", 'quantity' => 1]]])->assertOk();
        $this->assertSame(0, Carrito::count(), 'sin sesión no hay a quién recordar');

        $this->travelTo('2026-10-12 10:00:00');
        $this->sincronizar($ana, [$pub])->assertOk();
        $carrito = Carrito::sole();
        $this->assertSame([$ana->id, 1, 'carrito', 0], [$carrito->user_id, count($carrito->items), $carrito->origen, $carrito->recordatorios]);
        $this->assertSame('iPhone 15 128 GB Azul', $carrito->items[0]['nombre']);
        $this->assertEquals(6500.0, (float) $carrito->total);

        $this->travelTo('2026-10-12 10:30:00');
        $this->sincronizar($ana, [$pub]);
        $this->assertSame('2026-10-12 10:00:00', $carrito->fresh()->actualizado_en->format('Y-m-d H:i:s'));

        $this->sincronizar($ana, []);
        $this->assertSame(0, Carrito::count(), 'si lo vació, no hay nada que recordar');
    }

    public function test_un_pedido_vencido_sin_pago_vuelve_como_carrito_y_comprar_despues_del_aviso_cuenta_como_recuperado(): void
    {
        Mail::fake();
        $pub = $this->publicado();
        $ana = $this->cliente();

        $pedido = $this->pedidoDe($ana, $pub);
        $this->assertSame(Pedido::PENDIENTE_PAGO, $pedido->estado);
        $this->assertSame(0, Carrito::count(), 'hacer el pedido no es abandonar');

        $this->travel(3)->hours();
        $this->assertSame(1, StockDePedidos::liberarVencidos());
        $carrito = Carrito::sole();
        $this->assertSame(['pedido', $pedido->id, "celular:{$pub->producto_id}"], [$carrito->origen, $carrito->pedido_id, $carrito->items[0]['key']]);

        $this->travel(2)->hours();
        $this->artisan('carritos:recordar')->assertSuccessful();
        Mail::assertQueued(CarritoAbandonado::class, 1);

        $nuevo = $this->pedidoDe($ana, $pub);
        $this->assertSame($nuevo->id, $carrito->fresh()->recuperado_pedido_id);
        $this->assertSame('recuperado', $carrito->fresh()->estado());
    }

    public function test_recuerda_a_la_hora_y_al_dia_siguiente_y_nunca_mas_de_dos_veces(): void
    {
        Mail::fake();
        $pub = $this->publicado();
        $ana = $this->cliente();
        $this->travelTo('2026-10-12 10:00:00');
        $this->sincronizar($ana, [$pub]);

        $this->travelTo('2026-10-12 10:59:00');
        $this->artisan('carritos:recordar');
        Mail::assertNotQueued(CarritoAbandonado::class);

        $this->travelTo('2026-10-12 11:00:00');
        $this->artisan('carritos:recordar');
        Mail::assertQueued(CarritoAbandonado::class, fn ($m) => $m->numero === 1
            && $m->carrito->user->email === $ana->email
            && $m->items[0]['nombre'] === 'iPhone 15 128 GB Azul'
            && $m->envelope()->subject === 'Te guardamos tu carrito, Ana');
        $this->assertSame(1, Carrito::sole()->recordatorios);

        $this->travelTo('2026-10-13 10:59:00');
        $this->artisan('carritos:recordar');
        Mail::assertQueued(CarritoAbandonado::class, 1);

        $this->travelTo('2026-10-13 11:00:00');
        $this->artisan('carritos:recordar');
        Mail::assertQueued(CarritoAbandonado::class, 2);
        Mail::assertQueued(CarritoAbandonado::class, fn ($m) => $m->numero === 2 && str_starts_with($m->envelope()->subject, 'Última llamada'));

        $this->travelTo('2026-10-20 11:00:00');
        $this->artisan('carritos:recordar');
        Mail::assertQueued(CarritoAbandonado::class, 2);
        $this->assertSame('sin_respuesta', Carrito::sole()->estado());
    }

    public function test_el_enlace_rearma_el_carrito_con_lo_disponible_y_la_baja_corta_los_recordatorios(): void
    {
        Mail::fake();
        $pub = $this->publicado();
        $vendido = $this->publicado('iPhone 14 128 GB Negro');
        $ana = $this->cliente();
        $this->sincronizar($ana, [$pub, $vendido]);
        $carrito = Carrito::sole();
        Celular::find($vendido->producto_id)->update(['estado' => 'vendido']);

        $this->get(route('carrito.recuperar', $carrito->token))->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('Store/CarritoRecuperado')
                ->where('nombre', 'Ana')
                ->has('items', 1)
                ->where('items.0.key', "celular:{$pub->producto_id}")
                ->where('agotados.0', 'iPhone 14 128 GB Negro')
                ->where('baja', false));
        $this->get('/carrito/recuperar/no-existe')->assertNotFound();
        $this->assertStringContainsString('noindex', $this->get(route('carrito.recuperar', $carrito->token))->getContent());

        $this->get(route('carrito.sin-recordatorios', $carrito->token))->assertOk()
            ->assertInertia(fn (Assert $p) => $p->where('baja', true));
        $this->assertTrue((bool) $ana->fresh()->sin_recordatorios);
        $this->travel(2)->hours();
        $this->artisan('carritos:recordar');
        Mail::assertNotQueued(CarritoAbandonado::class);

        // Si ya no queda nada disponible, el recordatorio no sale y el carrito se descarta
        $ana->forceFill(['sin_recordatorios' => false])->save();
        Celular::find($pub->producto_id)->update(['estado' => 'vendido']);
        $this->artisan('carritos:recordar');
        Mail::assertNotQueued(CarritoAbandonado::class);
        $this->assertSame(0, Carrito::count());
    }

    public function test_el_panel_lista_los_carritos_con_su_whatsapp_y_manda_el_recordatorio_a_mano(): void
    {
        Mail::fake();
        Cache::flush();
        $pub = $this->publicado();
        $ana = $this->cliente();
        $this->sincronizar($ana, [$pub]);
        $carrito = Carrito::sole();

        Role::create(['clave' => 'encargado', 'nombre' => 'Encargado', 'permisos' => ['pedidos'], 'activo' => true]);
        $this->actingAs(User::factory()->create(['rol' => 'encargado']))->get(route('admin.carritos.index'))->assertForbidden();

        $admin = User::factory()->create(['rol' => 'admin']);
        $this->actingAs($admin)->get(route('admin.carritos.index'))->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('Admin/Carritos/Index')
                ->where('resumen.abiertos', 1)
                ->where('filas.0.estado', 'esperando')
                ->where('filas.0.cliente.email', $ana->email)
                ->where('filas.0.whatsapp', fn ($w) => str_starts_with($w, 'https://wa.me/59170011223?text=')));

        $this->actingAs($admin)->post(route('admin.carritos.recordar', $carrito))->assertRedirect()->assertSessionHas('success');
        Mail::assertQueued(CarritoAbandonado::class, 1);
        $this->assertSame(1, $carrito->fresh()->recordatorios);
    }
}
