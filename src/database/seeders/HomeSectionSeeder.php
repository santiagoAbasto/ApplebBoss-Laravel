<?php

namespace Database\Seeders;

use App\Models\HomeSection;
use Illuminate\Database\Seeder;

class HomeSectionSeeder extends Seeder
{
    /** Mismo orden del header: iPhone → Mac → Más Apple → MYSKIN → Accesorios → Seminuevos. */
    public function run(): void
    {
        $sections = [
            ['type' => 'hero',              'label' => 'Hero principal',        'active' => true,  'settings' => ['tema' => 'appleboss_navy']],
            ['type' => 'trust',             'label' => 'Confianza',             'active' => true,  'settings' => []],
            ['type' => 'featured',          'label' => 'Productos destacados',  'active' => true,  'settings' => ['titulo' => 'Productos destacados', 'limit' => 8]],
            ['type' => 'category_rail',     'label' => 'Categorías',            'active' => true,  'settings' => []],
            ['type' => 'category_products', 'label' => 'iPhone',                'active' => true,  'settings' => ['titulo' => 'iPhone', 'categoria' => 'celulares', 'limit' => 8]],
            ['type' => 'category_products', 'label' => 'Mac',                   'active' => true,  'settings' => ['titulo' => 'Mac', 'categoria' => 'computadoras', 'limit' => 8]],
            ['type' => 'category_products', 'label' => 'Más Apple',             'active' => true,  'settings' => ['titulo' => 'Más Apple', 'categoria' => 'productos-apple', 'limit' => 8]],
            ['type' => 'myskin',            'label' => 'MYSKIN',                'active' => true,  'settings' => []],
            ['type' => 'category_products', 'label' => 'Accesorios',            'active' => true,  'settings' => ['titulo' => 'Accesorios', 'categoria' => 'accesorios', 'limit' => 8]],
            ['type' => 'semiused',          'label' => 'Seminuevos',            'active' => true,  'settings' => ['titulo' => 'Seminuevos seleccionados']],
            ['type' => 'trade_in',          'label' => 'Trade-In',              'active' => true,  'settings' => ['titulo' => 'Tu equipo actual vale como parte de pago']],
            ['type' => 'product_collection','label' => 'Disponibles ahora',     'active' => true,  'settings' => ['titulo' => 'Disponibles ahora']],
            ['type' => 'new_arrivals',      'label' => 'Nuevos ingresos',       'active' => false, 'settings' => ['titulo' => 'Nuevos ingresos']],
            ['type' => 'offers',            'label' => 'Ofertas',               'active' => false, 'settings' => ['titulo' => 'Ofertas']],
            ['type' => 'services',          'label' => 'Servicios',             'active' => true,  'settings' => []],
            ['type' => 'location',          'label' => 'Visitanos',             'active' => true,  'settings' => []],
            ['type' => 'news',              'label' => 'Novedades',             'active' => true,  'settings' => []],
            ['type' => 'faq',               'label' => 'Preguntas frecuentes',  'active' => true,  'settings' => []],
        ];

        foreach ($sections as $i => $data) {
            HomeSection::updateOrCreate(
                ['type' => $data['type'], 'label' => $data['label']],
                $data + ['orden' => $i + 1]
            );
        }
    }
}
