<?php

namespace Tests\Feature;

use App\Mail\Bienvenida;
use App\Mail\PedirResena;
use App\Models\Pedido;
use App\Models\Resena;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/** Bienvenida al crear la cuenta y pedido de reseña una semana después de la entrega. */
class BienvenidaYResenaTest extends TestCase
{
    use RefreshDatabase;

    private function entregado(array $extra = []): Pedido
    {
        return Pedido::create(array_merge([
            'codigo' => Pedido::nuevoCodigo(), 'token_seguimiento' => Pedido::nuevoToken(),
            'nombre_cliente' => 'Ana Quispe', 'email_cliente' => 'ana@example.com', 'telefono_cliente' => '70011223',
            'estado' => Pedido::ENTREGADO, 'entregado_en' => now()->subDays(7), 'total' => 6500,
        ], $extra));
    }

    public function test_un_cliente_nuevo_recibe_la_bienvenida_y_el_equipo_no(): void
    {
        Mail::fake();

        $this->post(route('cuenta.registrar'), [
            'name' => 'Ana Quispe', 'email' => 'ana@gmail.com', 'telefono' => '70011223',
            'password' => 'una-clave-larga-y-rara-2026', 'password_confirmation' => 'una-clave-larga-y-rara-2026',
        ])->assertRedirect();
        Mail::assertQueued(Bienvenida::class, fn ($m) => $m->user->email === 'ana@gmail.com'
            && $m->envelope()->subject === 'Tu cuenta en Apple Boss está lista, Ana'
            && $m->envelope()->replyTo[0]->address === 'info@appleboss.com.bo');

        User::factory()->create(['rol' => 'admin']);
        User::factory()->create(['rol' => 'vendedor']);
        Mail::assertQueued(Bienvenida::class, 1);
    }

    public function test_el_marco_de_marca_lleva_logo_whatsapp_redes_y_legales(): void
    {
        config(['seo.negocio.redes' => ['instagram' => 'https://instagram.com/appleboss', 'tiktok' => 'https://tiktok.com/@appleboss'], 'seo.public_url' => 'https://appleboss.com.bo']);
        \App\Models\StoreLocation::create(['name' => 'Apple Boss Cochabamba', 'address' => 'Av. Melchor Urquidi', 'city' => 'Cochabamba', 'country' => 'Bolivia', 'whatsapp' => '59175904313', 'active' => true, 'sort_order' => 0]);

        $html = (new Bienvenida(User::factory()->make(['name' => 'Ana Quispe', 'email' => 'ana@gmail.com'])))->render();

        foreach (['images/correo/logo-animado.gif', 'images/correo/whatsapp.png', 'https://wa.me/59175904313', 'images/correo/instagram.png', 'https://tiktok.com/@appleboss', 'Av. Melchor Urquidi', '/paginas/privacidad'] as $pieza) {
            $this->assertStringContainsString($pieza, $html);
        }
        $this->assertStringNotContainsString('images/correo/facebook.png', $html, 'sin perfil de Facebook no hay icono');
    }

    public function test_pide_la_resena_una_semana_despues_de_la_entrega_y_solo_una_vez(): void
    {
        Mail::fake();
        $pedido = $this->entregado();
        $this->entregado(['entregado_en' => now()->subDays(3)]);                                   // todavía no
        $conResena = $this->entregado(['email_cliente' => 'b@example.com']);
        Resena::create(['nombre' => 'B', 'calificacion' => 5, 'aspectos' => ['producto' => 5, 'atencion' => 5], 'texto' => 'Todo excelente, gracias.',
            'fuente' => 'web', 'producto' => 'iPhone', 'fecha' => now()->toDateString(), 'pedido_id' => $conResena->id, 'publicada' => false]);
        $sinCorreos = User::factory()->create(['rol' => 'cliente', 'sin_recordatorios' => true]);
        $this->entregado(['email_cliente' => $sinCorreos->email, 'user_id' => $sinCorreos->id]);   // pidió no recibir

        $this->artisan('resenas:pedir')->expectsOutputToContain('1')->assertSuccessful();
        Mail::assertQueued(PedirResena::class, 1);
        Mail::assertQueued(PedirResena::class, fn ($m) => $m->pedido->is($pedido)
            && str_contains($m->envelope()->subject, '¿Cómo te fue con tu')
            && $m->envelope()->replyTo[0]->address === 'pedidos@appleboss.com.bo');
        $this->assertNotNull($pedido->fresh()->resena_pedida_en);

        $this->artisan('resenas:pedir');
        Mail::assertQueued(PedirResena::class, 1);

        $this->assertTrue(collect(app(\Illuminate\Console\Scheduling\Schedule::class)->events())
            ->contains(fn ($e) => str_contains($e->command, 'resenas:pedir')));
    }
}
