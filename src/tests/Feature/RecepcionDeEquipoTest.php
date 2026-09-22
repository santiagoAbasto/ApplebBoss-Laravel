<?php

namespace Tests\Feature;

use App\Models\ServicioTecnico;
use App\Models\Tecnico;
use App\Models\User;
use App\Support\RecepcionDeEquipo;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecepcionDeEquipoTest extends TestCase
{
    use RefreshDatabase;

    private function datos(array $cambios = []): array
    {
        return array_merge([
            'cliente'          => 'María Rojas',
            'telefono'         => '70000000',
            'equipo'           => 'iPhone 13 Pro',
            'marca'            => ServicioTecnico::MARCA_APPLE,
            'detalle_servicio' => json_encode([['descripcion' => 'Cambio de batería', 'precio' => 250]]),
            'precio_venta'     => 250,
            'fecha'            => '2026-09-22',
        ], $cambios);
    }

    public function test_la_revision_se_guarda_sin_puntos_vacios_ni_repetidos(): void
    {
        $admin = User::factory()->create(['rol' => 'admin']);
        $tecnico = Tecnico::create(['nombre' => 'AXEL', 'especialidad' => Tecnico::APPLE]);

        $this->actingAs($admin)
            ->post(route('admin.servicios.store'), $this->datos([
                'tecnico_id' => $tecnico->id,
                'recepcion'  => [
                    'revision' => [
                        ['etiqueta' => 'Enciende', 'estado' => 'si'],
                        ['etiqueta' => 'enciende', 'estado' => 'no'],   // repetido: se queda el primero
                        ['etiqueta' => 'Carga', 'estado' => ''],        // sin marcar: no se guarda
                        ['etiqueta' => '', 'estado' => 'si'],           // sin nombre: no se guarda
                        ['etiqueta' => 'Pantalla sin fisuras', 'estado' => 'nc'],
                    ],
                    'desbloqueo' => ['modo' => 'deja', 'tipo' => 'pin', 'valor' => '1234'],
                ],
            ]))
            ->assertRedirect(route('admin.servicios.index'));

        $recepcion = ServicioTecnico::latest('id')->first()->recepcion;

        $this->assertSame([
            ['etiqueta' => 'Enciende', 'estado' => 'si'],
            ['etiqueta' => 'Pantalla sin fisuras', 'estado' => 'nc'],
        ], $recepcion['revision']);
        $this->assertSame(['modo' => 'deja', 'tipo' => 'pin', 'valor' => '1234'], $recepcion['desbloqueo']);
    }

    public function test_el_codigo_no_queda_colgado_de_un_no_deja(): void
    {
        $admin = User::factory()->create(['rol' => 'admin']);
        $tecnico = Tecnico::create(['nombre' => 'AXEL', 'especialidad' => Tecnico::AMBAS]);

        $this->actingAs($admin)->post(route('admin.servicios.store'), $this->datos([
            'tecnico_id' => $tecnico->id,
            'recepcion'  => ['desbloqueo' => ['modo' => 'no_deja', 'tipo' => 'pin', 'valor' => '9999']],
        ]));

        $recepcion = ServicioTecnico::latest('id')->first()->recepcion;

        $this->assertSame(['modo' => 'no_deja'], $recepcion['desbloqueo']);
        $this->assertSame('El cliente no deja el código de desbloqueo.', RecepcionDeEquipo::textoDesbloqueo($recepcion['desbloqueo']));
    }

    /** La regla del taller no puede vivir solo en el desplegable. */
    public function test_el_servidor_rechaza_a_un_tecnico_que_no_atiende_esa_marca(): void
    {
        $admin = User::factory()->create(['rol' => 'admin']);
        $soloApple = Tecnico::create(['nombre' => 'AXEL', 'especialidad' => Tecnico::APPLE]);

        $this->actingAs($admin)
            ->post(route('admin.servicios.store'), $this->datos([
                'marca'      => ServicioTecnico::MARCA_ANDROID,
                'tecnico_id' => $soloApple->id,
            ]))
            ->assertSessionHasErrors('tecnico_id');

        $this->assertSame(0, ServicioTecnico::count());

        // «Otro equipo» no lo cubre nadie en particular: cualquiera sirve
        $this->actingAs($admin)
            ->post(route('admin.servicios.store'), $this->datos([
                'marca'      => ServicioTecnico::MARCA_OTRO,
                'tecnico_id' => $soloApple->id,
            ]))
            ->assertSessionHasNoErrors();

        $this->assertSame('AXEL', ServicioTecnico::latest('id')->first()->tecnico);
    }

    public function test_la_nota_imprime_la_revision_y_el_desbloqueo(): void
    {
        $admin = User::factory()->create(['rol' => 'admin']);

        $servicio = ServicioTecnico::create([
            'codigo_nota'      => 'AT-ST900',
            'cliente'          => 'María Rojas',
            'equipo'           => 'iPhone 13 Pro',
            'marca'            => ServicioTecnico::MARCA_APPLE,
            'recepcion'        => [
                'revision'   => [['etiqueta' => 'Enciende', 'estado' => 'si'], ['etiqueta' => 'Carga', 'estado' => 'no']],
                'desbloqueo' => ['modo' => 'deja', 'tipo' => 'pin', 'valor' => '1234'],
            ],
            'detalle_servicio' => json_encode([['descripcion' => 'Cambio de batería', 'precio' => 250]]),
            'precio_venta'     => 250,
            'tecnico'          => 'AXEL',
            'fecha'            => '2026-09-22',
            'user_id'          => $admin->id,
        ]);

        $html = Pdf::loadView('pdf.boleta_servicio', [
            'servicio'          => $servicio,
            'servicios_cliente' => collect([['descripcion' => 'Cambio de batería', 'precio' => 250.0]]),
        ])->getDomPDF()->outputHtml();

        // dompdf devuelve el HTML con entidades: se comparan los textos ya decodificados
        $html = html_entity_decode($html, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        $this->assertStringContainsString('CÓMO ENTRÓ EL EQUIPO', $html);
        $this->assertStringContainsString('PIN 1234', $html);
        $this->assertStringContainsString('Enciende', $html);
        $this->assertStringContainsString('iPhone / Apple', $html);
        // El costo interno del servicio no sale nunca en la nota del cliente
        $this->assertStringNotContainsString('Costo', $html);
    }
}
