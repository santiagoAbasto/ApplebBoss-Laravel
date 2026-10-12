<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * «Nosotros» y «Envíos y entrega» eran dos párrafos del seeder. Pasan a contar lo que la tienda hace de verdad:
 * las tres entregas y la reserva salen de config/envios.php, la garantía de config/documentos.php. Solo se
 * reemplaza el texto corto del inicio: una página ya trabajada en el panel no se toca.
 */
return new class extends Migration
{
    private const DIRECCION = 'Av. Melchor Urquidi, entre C. Fidel Anze y Av. Julio Rodríguez, Cochabamba';
    private const HORARIO = 'lunes a sábado, de 9:00 a 13:00 y de 14:00 a 19:00';
    private const MAPA = 'https://maps.google.com/?cid=9984482128729594095';

    public function up(): void
    {
        $paginas = [
            'nosotros' => [
                'title' => 'Nosotros',
                'sort'  => 1,
                'meta'  => 'Apple Boss: tienda de iPhone, Mac y accesorios nuevos y seminuevos en Cochabamba, con equipos revisados, stock real, garantía propia y servicio técnico.',
                'html'  => $this->nosotros(config('documentos.garantia.meses')),
            ],
            'envios' => [
                'title' => 'Envíos y entrega',
                'sort'  => 3,
                'meta'  => 'Cómo recibes tu compra de Apple Boss: retiro en la tienda de Cochabamba, delivery el mismo día o envío por courier al interior, sin costo. Plazos, pago y reserva.',
                'html'  => $this->envios(),
            ],
        ];

        foreach ($paginas as $slug => $p) {
            $actual = DB::table('pages')->where('slug', $slug)->first();
            $datos = ['title' => $p['title'], 'content' => $p['html'], 'meta_description' => $p['meta'], 'updated_at' => now()];

            if (! $actual) {
                DB::table('pages')->insert($datos + ['slug' => $slug, 'active' => true, 'sort_order' => $p['sort'], 'created_at' => now()]);
            } elseif (mb_strlen(strip_tags((string) $actual->content)) < 1500) {
                DB::table('pages')->where('id', $actual->id)->update($datos);
            }
        }
    }

    public function down(): void
    {
        // Los textos quedan.
    }

    /** @param array<string, int> $meses */
    private function nosotros(array $meses): string
    {
        $direccion = self::DIRECCION;
        $horario = self::HORARIO;
        $mapa = self::MAPA;

        return <<<HTML
<p>Apple Boss es una tienda de Cochabamba dedicada a los equipos Apple: iPhone, Mac, iPad, Apple Watch y AirPods, nuevos y seminuevos, con sus accesorios y con servicio técnico propio. Vendemos en la tienda física y en appleboss.com.bo, con los mismos precios y el mismo stock.</p>
<h2>Cómo trabajamos</h2>
<ul>
<li><strong>Equipos revisados.</strong> Cada equipo pasa por nuestro servicio técnico antes de publicarse. En un seminuevo ves su estado y la salud de la batería antes de comprar.</li>
<li><strong>Stock real.</strong> Lo que ves publicado está en la tienda hoy; lo que se vende deja de publicarse al instante. No vendemos lo que no tenemos.</li>
<li><strong>Precios claros.</strong> En bolivianos, sin letra chica. Si pagas en USDT, el equivalente se calcula con el dólar paralelo del momento.</li>
<li><strong>Garantía propia.</strong> {$meses['equipo_nuevo']} meses en equipos nuevos y {$meses['equipo_seminuevo']} en seminuevos, atendida en Cochabamba por nuestro servicio técnico. Léela completa en <a href="/paginas/garantia">Garantía</a>.</li>
<li><strong>Atención directa.</strong> Nos escribes por WhatsApp y te responde la misma gente que te atiende en la tienda.</li>
</ul>
<h2>Qué encuentras</h2>
<ul>
<li><a href="/iphone">iPhone</a> y <a href="/mac">Mac</a> nuevos y <a href="/seminuevos">seminuevos</a>, y más productos Apple.</li>
<li>Accesorios: cargadores originales y certificados, cables, vidrios templados y las <a href="/myskin">fundas MYSKIN</a>.</li>
<li><a href="/trade-in">Trade-In</a>: entregas tu equipo usado como parte de pago de uno nuevo.</li>
<li><a href="/servicio-tecnico">Servicio técnico</a> para iPhone, Mac y otros equipos, con diagnóstico e informe técnico.</li>
</ul>
<h2>Dónde estamos</h2>
<p>{$direccion}, Bolivia. <a href="{$mapa}">Ver en Google Maps</a>.</p>
<p>Atendemos de {$horario}. Puedes venir a ver y probar los equipos en persona.</p>
<h2>Contacto</h2>
<p>WhatsApp <a href="https://wa.me/59175904313">+591 75904313</a> · <a href="mailto:ventas@appleboss.com.bo">ventas@appleboss.com.bo</a></p>
<p>Las opiniones de quienes ya compraron están en nuestro <a href="{$mapa}">perfil de Google</a> y en las reseñas de cada producto, que solo pueden dejar quienes recibieron su pedido.</p>
HTML;
    }

    private function envios(): string
    {
        $destinos = config('envios.envio.destinos', []);
        $lista = implode(', ', array_slice(array_keys($destinos), 0, -1)) . ' y ' . array_key_last($destinos);
        $plazo = $destinos[array_key_first($destinos)]['plazo'] ?? '2 a 5 días hábiles';
        $horas = intdiv((int) config('envios.minutos_para_pagar', 120), 60);
        $delivery = config('envios.delivery.ciudad', 'Cochabamba');
        $direccion = self::DIRECCION;
        $horario = self::HORARIO;

        return <<<HTML
<p>Tienes tres formas de recibir tu compra y ninguna tiene costo: retirar en la tienda, delivery en {$delivery} o envío al interior del país. Eliges una al hacer el pedido.</p>
<h2>Retiro en tienda</h2>
<ul>
<li>{$direccion}. Atendemos de {$horario}.</li>
<li>Puedes pagar en línea o al retirar, en la tienda. Si pagas al retirar, el equipo queda apartado y te avisamos cuando esté listo.</li>
<li>Trae el código de tu pedido. Antes de llevártelo, lo pruebas con nosotros.</li>
</ul>
<h2>Delivery en {$delivery}</h2>
<ul>
<li>Te lo lleva nuestro propio repartidor a tu casa u oficina <strong>el mismo día en que se confirma tu pago</strong>. Si el pago se confirma fuera del horario de atención, sale al día siguiente.</li>
<li>Al hacer el pedido marcas tu zona, tu barrio, la dirección y el punto en el mapa, para que llegue sin vueltas.</li>
<li>Se paga antes, en línea (QR, transferencia o Binance Pay). El repartidor no cobra en efectivo.</li>
<li>Revisa el paquete frente al repartidor: si está golpeado o abierto, no lo recibas.</li>
</ul>
<h2>Envío al interior</h2>
<ul>
<li>Enviamos por courier a {$lista}. Llega en <strong>{$plazo}</strong>, con código de seguimiento que te mandamos por WhatsApp.</li>
<li>El envío sale una vez confirmado el pago en línea. Nos das el nombre de quien recibe, su teléfono y la dirección.</li>
<li>Va embalado y precintado. Si llega golpeado o abierto, no lo recibas y avísanos en el momento.</li>
</ul>
<h2>Pago y reserva</h2>
<ul>
<li>Al hacer el pedido te reservamos el equipo por {$horas} horas. Si en ese tiempo no llega el pago ni el comprobante, el pedido se cancela solo y el equipo vuelve a la tienda.</li>
<li>Puedes pagar con QR, transferencia bancaria o Binance Pay (USDT); al retirar en la tienda, también en efectivo.</li>
<li>Sigue tu pedido en cualquier momento en <a href="/seguimiento">Seguimiento</a>, con tu código.</li>
</ul>
<p>¿Dudas sobre tu zona o tu envío? Escríbenos por WhatsApp al <a href="https://wa.me/59175904313">+591 75904313</a>.</p>
HTML;
    }
};
