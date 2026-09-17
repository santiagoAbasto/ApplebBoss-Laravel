<?php

namespace Database\Seeders;

use App\Models\Faq;
use Illuminate\Database\Seeder;

class FaqSeeder extends Seeder
{
    public function run(): void
    {
        $faqs = [
            [
                'question' => '¿Los equipos tienen garantía?',
                'answer'   => 'Sí, todos nuestros equipos cuentan con garantía Apple Boss. Revisa la sección de Garantía para conocer los detalles y condiciones.',
            ],
            [
                'question' => '¿Puedo ver el equipo antes de comprarlo?',
                'answer'   => 'Por supuesto. Atendemos de forma presencial en Cochabamba. Coordinamos una visita por WhatsApp.',
            ],
            [
                'question' => '¿Hacen envíos a otras ciudades?',
                'answer'   => 'Escríbenos por WhatsApp y te contamos las opciones de envío disponibles para tu ciudad.',
            ],
            [
                'question' => '¿Qué métodos de pago aceptan?',
                'answer'   => 'Aceptamos transferencias bancarias y efectivo. Confirmamos el pago antes de reservar el equipo.',
            ],
            [
                'question' => '¿Qué significa que un equipo es "Seminuevo"?',
                'answer'   => 'Seminuevo significa que el equipo fue usado previamente pero pasó por nuestro proceso de revisión. Está en buen estado funcional y cosmético.',
            ],
            [
                'question' => '¿Puedo reservar un equipo?',
                'answer'   => 'Sí, una vez confirmado el pago o una señal, el equipo queda reservado a tu nombre hasta coordinar la entrega.',
            ],
        ];

        foreach ($faqs as $i => $faq) {
            Faq::updateOrCreate(
                ['scope' => 'general', 'question' => $faq['question']],
                array_merge($faq, ['scope' => 'general', 'active' => true, 'sort_order' => $i])
            );
        }
    }
}
