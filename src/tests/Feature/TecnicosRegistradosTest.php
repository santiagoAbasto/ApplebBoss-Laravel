<?php

namespace Tests\Feature;

use App\Models\Diagnostico;
use App\Models\Role;
use App\Models\ServicioTecnico;
use App\Models\Tecnico;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/** Sistema → Técnicos registrados: corregir un nombre lo corrige en todo lo ya registrado. */
class TecnicosRegistradosTest extends TestCase
{
    use RefreshDatabase;

    private function servicio(string $tecnico, int $n): ServicioTecnico
    {
        return ServicioTecnico::create([
            'codigo_nota' => sprintf('AT-ST%03d', $n), 'cliente' => "Cliente {$n}", 'telefono' => '7000000' . $n,
            'equipo' => 'iPhone 13', 'detalle_servicio' => '[]', 'precio_costo' => 100, 'precio_venta' => 250,
            'tecnico' => $tecnico, 'fecha' => '2026-10-10', 'user_id' => User::factory()->create()->id,
        ]);
    }

    public function test_corregir_un_nombre_lo_corrige_en_servicios_y_diagnosticos(): void
    {
        $admin = User::factory()->create(['rol' => 'admin']);
        $miguel = Tecnico::create(['nombre' => 'MIGUEL CHEVEZ', 'especialidad' => 'apple', 'activo' => true]);
        $this->servicio('MIGUEL CHEVEZ', 1);
        $this->servicio('MIGUEL CHEVEZ', 2);
        $otro = $this->servicio('AXEL', 3);
        Diagnostico::create(['fecha' => '2026-10-10', 'cliente_nombre' => 'Ana', 'equipo' => 'iPhone 14', 'falla_reportada' => 'No carga', 'tecnico' => 'MIGUEL CHEVEZ']);

        $this->actingAs($admin)->get(route('admin.tecnicos.index'))->assertOk()
            ->assertInertia(fn (Assert $p) => $p->component('Admin/Tecnicos/Index')
                ->where('tecnicos.0.nombre', 'MIGUEL CHEVEZ')->where('tecnicos.0.servicios', 2)->where('tecnicos.0.diagnosticos', 1));

        $this->actingAs($admin)->patch(route('admin.tecnicos.update', $miguel), [
            'nombre' => '  MIGUEL   CHAVEZ ', 'especialidad' => 'apple', 'activo' => true,
        ])->assertSessionHasNoErrors()->assertSessionHas('success', 'Técnico actualizado. El nombre también se corrigió en 3 registros.');

        $this->assertSame('MIGUEL CHAVEZ', $miguel->fresh()->nombre, 'sin espacios de más');
        $this->assertSame(2, ServicioTecnico::where('tecnico', 'MIGUEL CHAVEZ')->count());
        $this->assertSame(0, ServicioTecnico::where('tecnico', 'MIGUEL CHEVEZ')->count());
        $this->assertSame('MIGUEL CHAVEZ', Diagnostico::first()->tecnico);
        $this->assertSame('AXEL', $otro->fresh()->tecnico, 'los demás técnicos no se tocan');
    }

    public function test_no_se_repite_un_nombre_aunque_cambien_las_mayusculas(): void
    {
        $admin = User::factory()->create(['rol' => 'admin']);
        Tecnico::create(['nombre' => 'AXEL', 'especialidad' => 'ambas', 'activo' => true]);
        $edson = Tecnico::create(['nombre' => 'EDSON', 'especialidad' => 'android', 'activo' => true]);

        $this->actingAs($admin)->post(route('admin.tecnicos.store'), ['nombre' => 'axel', 'especialidad' => 'apple'])
            ->assertSessionHasErrors(['nombre' => 'Ya hay un técnico registrado con ese nombre.']);
        $this->actingAs($admin)->patch(route('admin.tecnicos.update', $edson), ['nombre' => 'Axel', 'especialidad' => 'android', 'activo' => true])
            ->assertSessionHasErrors('nombre');

        $this->actingAs($admin)->post(route('admin.tecnicos.store'), ['nombre' => 'RODRIGO', 'especialidad' => 'android'])->assertSessionHasNoErrors();
        $this->assertTrue(Tecnico::where('nombre', 'RODRIGO')->value('activo'));
    }

    public function test_desactivado_deja_de_aparecer_al_recibir_un_equipo(): void
    {
        $admin = User::factory()->create(['rol' => 'admin']);
        $cancha = Tecnico::create(['nombre' => 'CANCHA', 'especialidad' => 'ambas', 'activo' => true]);

        $this->actingAs($admin)->patch(route('admin.tecnicos.update', $cancha), ['nombre' => 'CANCHA', 'especialidad' => 'ambas', 'activo' => false])
            ->assertSessionHas('success', 'Técnico actualizado.');

        $this->actingAs($admin)->get(route('admin.servicios.create'))->assertOk()
            ->assertInertia(fn (Assert $p) => $p->where('tecnicos', fn ($t) => collect($t)->doesntContain('nombre', 'CANCHA')));
    }

    public function test_es_un_modulo_de_sistema_con_su_propio_permiso(): void
    {
        Cache::flush();
        Role::create(['clave' => 'encargado', 'nombre' => 'Encargado', 'permisos' => ['servicios'], 'activo' => true]);
        $encargado = User::factory()->create(['rol' => 'encargado']);

        $this->actingAs($encargado)->get(route('admin.tecnicos.index'))->assertForbidden();

        Role::where('clave', 'encargado')->update(['permisos' => json_encode(['servicios', 'tecnicos'])]);
        Cache::flush();
        $this->actingAs($encargado)->get(route('admin.tecnicos.index'))->assertOk();
    }
}
