<?php

namespace Tests\Feature;

use App\Mail\CarritoAbandonado;
use App\Mail\EstadoDePedido;
use App\Mail\NewsletterCampaignMail;
use App\Models\Carrito;
use App\Models\NewsletterCampaign;
use App\Models\Page;
use App\Models\Pedido;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/** Cada correo y cada página usan la casilla de su área; security.txt dice a quién avisar de una falla. */
class CorreosPorAreaTest extends TestCase
{
    use RefreshDatabase;

    public function test_las_paginas_muestran_la_casilla_de_su_area(): void
    {
        $texto = fn (string $slug) => (string) Page::where('slug', $slug)->value('content');

        $this->assertStringContainsString('mailto:privacidad@appleboss.com.bo', $texto('privacidad'));
        $this->assertStringContainsString('info@appleboss.com.bo', $texto('privacidad'));
        $this->assertStringContainsString('soporte@appleboss.com.bo', $texto('garantia'));
        $this->assertStringContainsString('info@appleboss.com.bo', $texto('terminos'));
        $this->assertStringContainsString('info@appleboss.com.bo', $texto('nosotros'));
        foreach (['privacidad', 'terminos', 'garantia', 'nosotros', 'cookies'] as $slug) {
            $this->assertStringNotContainsString('ventas@', $texto($slug), "$slug sigue con ventas@");
        }
    }

    public function test_los_correos_automaticos_se_responden_a_la_casilla_que_corresponde(): void
    {
        $pedido = new Pedido(['estado' => Pedido::PENDIENTE_PAGO, 'email_cliente' => 'ana@example.com', 'codigo' => 'AB-1']);
        $this->assertSame('pedidos@appleboss.com.bo', (new EstadoDePedido($pedido))->envelope()->replyTo[0]->address);

        $carrito = new Carrito(['items' => [['key' => 'celular:1', 'nombre' => 'iPhone']]]);
        $carrito->setRelation('user', new User(['name' => 'Ana Quispe', 'email' => 'ana@example.com']));
        $this->assertSame('pedidos@appleboss.com.bo', (new CarritoAbandonado($carrito, [['nombre' => 'iPhone']], 1))->envelope()->replyTo[0]->address);

        $boletin = (new NewsletterCampaignMail(new NewsletterCampaign(['asunto' => 'Novedades']), [], 'https://appleboss.com.bo/newsletter/baja/x'))->envelope();
        $this->assertSame('novedades@appleboss.com.bo', $boletin->from->address);
        $this->assertSame('info@appleboss.com.bo', $boletin->replyTo[0]->address);
    }

    public function test_security_txt_dice_a_quien_avisar(): void
    {
        $r = $this->get('/.well-known/security.txt')->assertOk()->assertHeader('Content-Type', 'text/plain; charset=UTF-8');
        $r->assertSee('Contact: mailto:seguridad@appleboss.com.bo', false)->assertSee('Expires: ', false)->assertSee('Canonical: ', false);
        $this->get('/security.txt')->assertStatus(301);
    }
}
