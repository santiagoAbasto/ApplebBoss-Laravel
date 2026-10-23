<?php

use App\Models\CatalogCategory;
use App\Models\NavMenuItem;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Separa los celulares que no son iPhone. La categoría «iPhone» pasa a ser solo Apple; los Pixel, Samsung, Xiaomi,
 * etc. caen en una categoría nueva «Android» (slug celulares-android), que se deriva de la marca del equipo
 * (CatalogoPublicacion::categoriaPublica()). Aquí se crea la categoría del catálogo y su ítem de menú, justo
 * después de iPhone. Idempotente: no duplica si ya existen.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('catalog_categories')) {
            CatalogCategory::firstOrCreate(
                ['slug' => 'celulares-android'],
                [
                    'name'             => 'Android',
                    'description'      => 'Celulares Android: Google Pixel, Samsung, Xiaomi y más.',
                    'active'           => true,
                    'show_home'        => false,
                    'show_navigation'  => true,
                    'is_myskin'        => false,
                    'sort_order'       => 2,
                    'meta_title'       => 'Celulares Android en Cochabamba — Apple Boss',
                    'meta_description' => 'Celulares Android (Google Pixel, Samsung, Xiaomi) en Cochabamba, con garantía real y atención directa.',
                ]
            );
        }

        if (Schema::hasTable('nav_menu_items')
            && ! NavMenuItem::where('slot', 'header')->whereNull('parent_id')->where('url', '/catalogo?categoria=celulares-android')->exists()) {

            // Correr un lugar los ítems que van después de iPhone (sort_order 0) para que Android quede en 2.º lugar
            foreach (['header', 'mobile'] as $slot) {
                NavMenuItem::where('slot', $slot)->whereNull('parent_id')->where('sort_order', '>=', 1)->increment('sort_order');
            }

            $parent = NavMenuItem::create([
                'slot' => 'header', 'label' => 'Android', 'url' => '/catalogo?categoria=celulares-android',
                'myskin' => false, 'active' => true, 'sort_order' => 1,
            ]);
            $hijos = [
                ['Ver todos los Android', '/catalogo?categoria=celulares-android'],
                ['Nuevos', '/catalogo?categoria=celulares-android&condicion=Nuevo'],
                ['Seminuevos', '/catalogo?categoria=celulares-android&condicion=Seminuevo'],
            ];
            foreach ($hijos as $j => [$label, $url]) {
                NavMenuItem::create([
                    'slot' => 'header', 'parent_id' => $parent->id, 'label' => $label, 'url' => $url,
                    'active' => true, 'sort_order' => $j,
                ]);
            }
            NavMenuItem::create([
                'slot' => 'mobile', 'label' => 'Android', 'url' => '/catalogo?categoria=celulares-android',
                'myskin' => false, 'active' => true, 'sort_order' => 1,
            ]);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('nav_menu_items')) {
            NavMenuItem::where('url', 'like', '/catalogo?categoria=celulares-android%')->delete();
            NavMenuItem::where('slot', 'header')->where('label', 'Android')->whereNull('parent_id')->delete();
            NavMenuItem::where('slot', 'mobile')->where('label', 'Android')->delete();
        }
        if (Schema::hasTable('catalog_categories')) {
            CatalogCategory::where('slug', 'celulares-android')->delete();
        }
    }
};
