<?php

namespace Database\Seeders;

use App\Models\NavMenuItem;
use Illuminate\Database\Seeder;

class NavMenuSeeder extends Seeder
{
    public function run(): void
    {
        NavMenuItem::truncate();

        // ── Header (con sub-ítems) ──────────────────────────────────────
        $headerItems = [
            [
                'label'  => 'iPhone',
                'url'    => '/iphone',
                'myskin' => false,
                'children' => [
                    ['label' => 'Ver todos los iPhones', 'url' => '/iphone'],
                    ['label' => 'Nuevos', 'url' => '/catalogo?categoria=celulares&condicion=Nuevo'],
                    ['label' => 'Seminuevos', 'url' => '/catalogo?categoria=celulares&condicion=Seminuevo'],
                ],
            ],
            [
                'label'  => 'Mac',
                'url'    => '/mac',
                'myskin' => false,
                'children' => [
                    ['label' => 'Ver todas las Mac', 'url' => '/mac'],
                    ['label' => 'Nuevas', 'url' => '/catalogo?categoria=computadoras&condicion=Nuevo'],
                    ['label' => 'Seminuevos', 'url' => '/catalogo?categoria=computadoras&condicion=Seminuevo'],
                ],
            ],
            [
                'label'  => 'Más Apple',
                'url'    => '/catalogo?categoria=productos-apple',
                'myskin' => false,
                'children' => [
                    ['label' => 'Todos los productos', 'url' => '/catalogo?categoria=productos-apple'],
                    ['label' => 'iPad', 'url' => '/catalogo?categoria=productos-apple&q=ipad'],
                    ['label' => 'Apple Watch', 'url' => '/catalogo?categoria=productos-apple&q=watch'],
                    ['label' => 'AirPods', 'url' => '/catalogo?categoria=productos-apple&q=airpods'],
                ],
            ],
            [
                'label'  => 'Fundas MYSKIN',
                'url'    => '/myskin',
                'myskin' => true,
                'children' => [
                    ['label' => 'Ver todas las fundas', 'url' => '/myskin'],
                    ['label' => 'Para iPhone 14 Series', 'url' => '/catalogo?categoria=fundas&q=14'],
                    ['label' => 'Para iPhone 15 Series', 'url' => '/catalogo?categoria=fundas&q=15'],
                    ['label' => 'Para iPhone 13 Series', 'url' => '/catalogo?categoria=fundas&q=13'],
                ],
            ],
            [
                'label'  => 'Accesorios',
                'url'    => '/catalogo?categoria=accesorios',
                'myskin' => false,
                'children' => [
                    ['label' => 'Todos los accesorios', 'url' => '/catalogo?categoria=accesorios'],
                    ['label' => 'Cargadores', 'url' => '/catalogo?categoria=accesorios&q=cargador'],
                    ['label' => 'Cables', 'url' => '/catalogo?categoria=accesorios&q=cable'],
                ],
            ],
            [
                'label'  => 'Seminuevos',
                'url'    => '/seminuevos',
                'myskin' => false,
                'children' => [
                    ['label' => 'Ver seminuevos', 'url' => '/seminuevos'],
                    ['label' => 'iPhone seminuevo', 'url' => '/catalogo?categoria=celulares&condicion=Seminuevo'],
                    ['label' => 'Mac seminueva', 'url' => '/catalogo?categoria=computadoras&condicion=Seminuevo'],
                ],
            ],
        ];

        foreach ($headerItems as $i => $def) {
            $parent = NavMenuItem::create([
                'slot'       => 'header',
                'label'      => $def['label'],
                'url'        => $def['url'],
                'myskin'     => $def['myskin'],
                'active'     => true,
                'sort_order' => $i,
            ]);
            foreach ($def['children'] ?? [] as $j => $child) {
                NavMenuItem::create([
                    'slot'       => 'header',
                    'parent_id'  => $parent->id,
                    'label'      => $child['label'],
                    'url'        => $child['url'],
                    'active'     => true,
                    'sort_order' => $j,
                ]);
            }
        }

        // ── Footer ─────────────────────────────────────────────────────
        $footerGroups = [
            [
                'group' => 'Comprar',
                'items' => [
                    ['label' => 'iPhone',           'url' => '/iphone'],
                    ['label' => 'Mac',              'url' => '/mac'],
                    ['label' => 'Fundas MYSKIN',    'url' => '/myskin'],
                    ['label' => 'Accesorios',       'url' => '/catalogo?categoria=accesorios'],
                    ['label' => 'Seminuevos',       'url' => '/seminuevos'],
                    ['label' => 'Todo el catálogo', 'url' => '/catalogo'],
                ],
            ],
            [
                'group' => 'Ayuda',
                'items' => [
                    ['label' => 'Cómo comprar',         'url' => '/catalogo'],
                    ['label' => 'Contacto',             'url' => '/#contacto'],
                    ['label' => 'Preguntas frecuentes', 'url' => '/#faq'],
                ],
            ],
            [
                'group' => 'Apple Boss',
                'items' => [
                    ['label' => 'Nuestra tienda', 'url' => '/'],
                    ['label' => 'Acceder',         'url' => '/login'],
                ],
            ],
        ];

        $sortGroup = 0;
        foreach ($footerGroups as $groupDef) {
            foreach ($groupDef['items'] as $j => $item) {
                NavMenuItem::create([
                    'slot'       => 'footer',
                    'group'      => $groupDef['group'],
                    'label'      => $item['label'],
                    'url'        => $item['url'],
                    'active'     => true,
                    'sort_order' => $sortGroup * 100 + $j,
                ]);
            }
            $sortGroup++;
        }

        // ── Mobile (mirror header top-level) ───────────────────────────
        $mobileItems = collect($headerItems)->map(fn ($d) => [
            'label'  => $d['label'],
            'url'    => $d['url'],
            'myskin' => $d['myskin'],
        ])->all();

        foreach ($mobileItems as $i => $def) {
            NavMenuItem::create([
                'slot'       => 'mobile',
                'label'      => $def['label'],
                'url'        => $def['url'],
                'myskin'     => $def['myskin'],
                'active'     => true,
                'sort_order' => $i,
            ]);
        }
    }
}
