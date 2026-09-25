<?php

namespace Tests\Feature;

use App\Models\Pedido;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Usuarios de la tienda: solo cuentas de clientes, con todo lo que compraron.
 *
 * Una cuenta del equipo nunca aparece ni se abre por acá, y la ficha junta también los pedidos hechos con el mismo
 * correo antes de que existieran las cuentas.
 */
class CuentasTiendaTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['rol' => 'admin']);
    }

    private function pedido(array $datos): Pedido
    {
        return Pedido::create(array_merge([
            'codigo' => Pedido::nuevoCodigo(), 'token_seguimiento' => Pedido::nuevoToken(),
            'nombre_cliente' => 'Cliente', 'email_cliente' => 'cliente@gmail.com', 'telefono_cliente' => '70011223',
            'subtotal' => 1000, 'total' => 1000, 'estado' => Pedido::PENDIENTE_PAGO,
        ], $datos));
    }

    public function test_la_lista_trae_solo_cuentas_de_clientes_con_lo_que_compraron(): void
    {
        $compro = User::factory()->create(['rol' => 'cliente', 'email' => 'compro@gmail.com']);
        User::factory()->create(['rol' => 'cliente', 'email' => 'mira@gmail.com']);
        User::factory()->create(['rol' => 'vendedor']);

        $this->pedido(['user_id' => $compro->id, 'email_cliente' => $compro->email, 'estado' => Pedido::PAGADO, 'total' => 6500]);
        $this->pedido(['user_id' => $compro->id, 'email_cliente' => $compro->email, 'estado' => Pedido::PENDIENTE_PAGO, 'total' => 900]);

        $this->actingAs($this->admin())->get(route('admin.cuentas-tienda.index'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/CuentasTienda/Index')
                ->has('cuentas.data', 2)
                ->where('resumen.cuentas', 2)
                ->where('resumen.compraron', 1));

        // Lo comprado cuenta solo lo pagado, no lo que quedó sin pagar
        $this->actingAs($this->admin())->get(route('admin.cuentas-tienda.index', ['filtro' => 'compraron']))
            ->assertInertia(fn ($page) => $page
                ->has('cuentas.data', 1)
                ->where('cuentas.data.0.pedidos', 2)
                ->where('cuentas.data.0.total_comprado', 6500));
    }

    public function test_la_ficha_junta_sus_pedidos_y_los_de_antes_con_el_mismo_correo(): void
    {
        $cliente = User::factory()->create(['rol' => 'cliente', 'email' => 'ana@gmail.com']);

        $this->pedido(['user_id' => $cliente->id, 'email_cliente' => 'ana@gmail.com', 'estado' => Pedido::ENTREGADO]);
        $this->pedido(['user_id' => null, 'email_cliente' => 'ana@gmail.com', 'estado' => Pedido::PAGADO]);   // de antes de las cuentas
        $this->pedido(['user_id' => null, 'email_cliente' => 'otra@gmail.com']);                              // de otra persona

        $this->actingAs($this->admin())->get(route('admin.cuentas-tienda.show', $cliente))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Admin/CuentasTienda/Show')
                ->has('pedidos', 2)
                ->where('pedidos.0.sin_cuenta', true)
                ->where('resumen.pagados', 2));
    }

    public function test_una_cuenta_del_equipo_no_se_abre_como_cliente(): void
    {
        $vendedor = User::factory()->create(['rol' => 'vendedor']);

        $this->actingAs($this->admin())->get(route('admin.cuentas-tienda.show', $vendedor))->assertNotFound();
    }

    public function test_sin_permiso_de_pedidos_no_entra(): void
    {
        $this->actingAs(User::factory()->create(['rol' => 'vendedor']))
            ->get(route('admin.cuentas-tienda.index'))->assertForbidden();
    }
}
