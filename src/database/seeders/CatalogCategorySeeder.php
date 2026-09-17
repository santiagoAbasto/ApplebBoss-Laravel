<?php

namespace Database\Seeders;

use App\Models\CatalogCategory;
use Illuminate\Database\Seeder;

class CatalogCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name'            => 'iPhone',
                'slug'            => 'celulares',
                'description'     => 'Equipos revisados y disponibles.',
                'active'          => true,
                'show_home'       => true,
                'show_navigation' => true,
                'is_myskin'       => false,
                'sort_order'      => 1,
                'meta_title'      => 'iPhone disponibles en Cochabamba — Apple Boss',
                'meta_description' => 'iPhone nuevos y seminuevos disponibles en Cochabamba. Equipos revisados, condición real.',
            ],
            [
                'name'            => 'Mac',
                'slug'            => 'computadoras',
                'description'     => 'Potencia para crear y trabajar.',
                'active'          => true,
                'show_home'       => true,
                'show_navigation' => true,
                'is_myskin'       => false,
                'sort_order'      => 2,
                'meta_title'      => 'Mac disponibles en Cochabamba — Apple Boss',
                'meta_description' => 'MacBook Air, MacBook Pro, iMac y Mac mini en Cochabamba.',
            ],
            [
                'name'            => 'Apple',
                'slug'            => 'productos-apple',
                'description'     => 'iPad, Watch, AirPods y más.',
                'active'          => true,
                'show_home'       => true,
                'show_navigation' => true,
                'is_myskin'       => false,
                'sort_order'      => 3,
                'meta_title'      => 'Productos Apple en Cochabamba — Apple Boss',
                'meta_description' => 'iPad, Apple Watch, AirPods y accesorios Apple disponibles.',
            ],
            [
                'name'            => 'Fundas MYSKIN',
                'slug'            => 'fundas',
                'description'     => 'Protección con identidad propia.',
                'active'          => true,
                'show_home'       => true,
                'show_navigation' => true,
                'is_myskin'       => true,
                'sort_order'      => 4,
                'meta_title'      => 'Fundas MYSKIN — Apple Boss',
                'meta_description' => 'Fundas para iPhone con diseño propio. MYSKIN by Apple Boss.',
            ],
            [
                'name'            => 'Accesorios',
                'slug'            => 'accesorios',
                'description'     => 'Cargadores, vidrios, fundas, cables y más.',
                'active'          => true,
                'show_home'       => true,
                'show_navigation' => true,
                'is_myskin'       => false,
                'sort_order'      => 5,
                'meta_title'      => 'Accesorios Apple en Cochabamba — Apple Boss',
                'meta_description' => 'Cargadores, cables, protectores y accesorios originales y compatibles.',
            ],
        ];

        foreach ($categories as $data) {
            CatalogCategory::updateOrCreate(['slug' => $data['slug']], $data);
        }
    }
}
