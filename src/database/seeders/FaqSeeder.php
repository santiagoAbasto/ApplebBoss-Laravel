<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;

/**
 * Preguntas frecuentes de la tienda.
 *
 * Cada respuesta describe lo que el checkout hace de verdad (config/envios.php,
 * config/pagos.php y App\Support\Checkout): departamentos, costos, plazos, el tiempo
 * que se aparta el equipo y cuándo se revelan el IMEI y la serie. Si cambia el
 * comportamiento, estas respuestas hay que cambiarlas también.
 */
class FaqSeeder extends Seeder
{
    /** Las respuestas viven acá para que el seeder y la migración de datos no se contradigan. */
    public const PREGUNTAS = [
        [
            'question' => '¿Cómo compro por la web?',
            'answer'   => 'Agregas lo que quieras al carrito y en el checkout eliges cómo lo recibes y cómo pagas. El total —con el envío, si corresponde— se calcula ahí antes de que confirmes. Al terminar te damos un código para seguir tu pedido.',
        ],
        [
            'question' => '¿Hacen envíos a otras ciudades?',
            'answer'   => 'Enviamos a Cochabamba, La Paz, Santa Cruz, Oruro, Sucre, Potosí, Tarija, Beni y Pando. Al elegir tu departamento en el checkout ves el costo y el plazo exactos antes de confirmar: en Cochabamba el envío no tiene costo y llega en 1 día hábil. Si no te aparece la opción de envío, escríbenos por WhatsApp y lo coordinamos.',
        ],
        [
            'question' => '¿Qué métodos de pago aceptan?',
            'answer'   => 'Las que veas en el checkout, con el total ya calculado. Puedes pagar al retirar en nuestra tienda de Cochabamba, o por transferencia o QR: en ese caso te mostramos los datos, subes tu comprobante y confirmamos el pedido cuando verificamos el pago. Nunca te pedimos datos de tarjeta por WhatsApp ni por correo.',
        ],
        [
            'question' => '¿Cuánto tiempo me guardan el equipo?',
            'answer'   => 'Al hacer el pedido lo apartamos 2 horas para que completes el pago. Como cada equipo es una unidad única, si en ese plazo no registramos el pago vuelve a la tienda y queda disponible para otra persona.',
        ],
        [
            'question' => '¿Cuándo me dan el IMEI y el número de serie?',
            'answer'   => 'Cuando confirmamos tu pago. Hasta ese momento no mostramos el IMEI ni la serie de la unidad en ningún lado, ni siquiera en el seguimiento de tu pedido: así nadie más puede usar los datos del equipo que va a ser tuyo.',
        ],
        [
            'question' => '¿Cómo sigo mi pedido?',
            'answer'   => 'Con el código que te damos al terminar la compra, en la página de Seguimiento. Ahí ves el estado paso a paso, desde que se registra el pedido hasta la entrega.',
        ],
        [
            'question' => '¿Puedo ver el equipo antes de comprarlo?',
            'answer'   => 'Sí. Atendemos de forma presencial en Cochabamba: coordinamos una visita por WhatsApp, o eliges «Retiro en tienda» al comprar y lo revisas cuando lo recoges.',
        ],
        [
            'question' => '¿Puedo reservar un equipo?',
            'answer'   => 'Sí. Al comprar por la web el equipo queda apartado a tu nombre mientras completas el pago. También puedes reservarlo en la tienda dejando una señal.',
        ],
        [
            'question' => '¿Los equipos tienen garantía?',
            'answer'   => 'Sí, todos nuestros equipos cuentan con garantía Apple Boss. Revisa la sección de Garantía para conocer los detalles y condiciones.',
        ],
        [
            'question' => '¿Qué significa que un equipo es "Seminuevo"?',
            'answer'   => 'Seminuevo significa que el equipo fue usado previamente pero pasó por nuestro proceso de revisión. Está en buen estado funcional y cosmético.',
        ],
    ];

    public function run(): void
    {
        foreach (self::PREGUNTAS as $i => $faq) {
            Faq::updateOrCreate(
                ['scope' => 'general', 'question' => $faq['question']],
                array_merge($faq, ['scope' => 'general', 'active' => true, 'sort_order' => $i])
            );
        }
    }
}
