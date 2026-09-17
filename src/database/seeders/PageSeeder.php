<?php

namespace Database\Seeders;

use App\Models\Page;
use Illuminate\Database\Seeder;

class PageSeeder extends Seeder
{
    public function run(): void
    {
        $pages = [
            [
                'slug'  => 'nosotros',
                'title' => 'Nosotros',
                'sort_order' => 1,
                'content' => '<h2>Sobre Apple Boss</h2><p>Somos una tienda especializada en equipos Apple en Bolivia. Ofrecemos iPhones, Macs y accesorios revisados con garantía.</p><p>Atendemos de forma directa, con precios claros y stock real.</p>',
            ],
            [
                'slug'  => 'garantia',
                'title' => 'Garantía',
                'sort_order' => 2,
                'content' => '<h2>Garantía Apple Boss</h2><p>Todos nuestros equipos pasan por un proceso de revisión antes de la venta. La garantía cubre defectos de funcionamiento bajo uso normal.</p><h3>Condiciones</h3><ul><li>La garantía es válida desde la fecha de compra.</li><li>No cubre daños físicos ni líquidos.</li><li>Contáctanos por WhatsApp para iniciar un reclamo.</li></ul>',
            ],
            [
                'slug'  => 'envios',
                'title' => 'Envíos y entrega',
                'sort_order' => 3,
                'content' => '<h2>Envíos y entrega</h2><p>Si estás en otra ciudad, consúltanos por WhatsApp las opciones de envío para tu zona. El envío se coordina una vez confirmado el pago.</p><h3>Entrega en Cochabamba</h3><p>Entregamos personalmente en Cochabamba con coordinación previa por WhatsApp.</p>',
            ],
            [
                'slug'  => 'privacidad',
                'title' => 'Política de privacidad',
                'sort_order' => 4,
                'content' => '<h2>Política de privacidad</h2><p>Apple Boss respeta la privacidad de sus clientes. Los datos que recopilamos se usan exclusivamente para gestionar tu compra y atenderte.</p><p>No compartimos tu información con terceros.</p>',
            ],
            [
                'slug'  => 'terminos',
                'title' => 'Términos y condiciones',
                'sort_order' => 5,
                'content' => '<h2>Términos y condiciones</h2><p>Al realizar una compra en Apple Boss aceptas las siguientes condiciones:</p><ul><li>Los precios están expresados en bolivianos (BOB).</li><li>La compra se confirma una vez verificado el pago.</li><li>El equipo se reserva al momento de la confirmación.</li></ul>',
            ],
        ];

        foreach ($pages as $data) {
            Page::updateOrCreate(['slug' => $data['slug']], array_merge($data, ['active' => true]));
        }
    }
}
