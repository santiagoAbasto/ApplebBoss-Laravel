<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * La comparativa de modelos (/comparar/iphone) en los menús que se administran desde el panel:
 * dentro de «iPhone» en el header y en la columna «Comprar» del footer. La barra de categorías y el menú del
 * celular ya la muestran fija, como el Trade-In.
 */
return new class extends Migration
{
    private const URL = '/comparar/iphone';

    public function up(): void
    {
        $now = now();
        $base = ['open_in_new_tab' => false, 'myskin' => false, 'active' => true, 'created_at' => $now, 'updated_at' => $now];

        $iphone = DB::table('nav_menu_items')->where('slot', 'header')->where('url', '/iphone')->whereNull('parent_id')->first();
        if ($iphone && ! DB::table('nav_menu_items')->where('parent_id', $iphone->id)->where('url', self::URL)->exists()) {
            DB::table('nav_menu_items')->insert($base + [
                'slot'       => 'header',
                'parent_id'  => $iphone->id,
                'label'      => 'Comparar modelos',
                'url'        => self::URL,
                'group'      => null,
                'sort_order' => (int) DB::table('nav_menu_items')->where('parent_id', $iphone->id)->max('sort_order') + 1,
            ]);
        }

        $hayFooter = DB::table('nav_menu_items')->where('slot', 'footer')->exists();
        if ($hayFooter && ! DB::table('nav_menu_items')->where('slot', 'footer')->where('url', self::URL)->whereNull('parent_id')->exists()) {
            DB::table('nav_menu_items')->insert($base + [
                'slot'       => 'footer',
                'parent_id'  => null,
                'label'      => 'Comparar iPhone',
                'url'        => self::URL,
                'group'      => 'Comprar',
                'sort_order' => 7,
            ]);
        }
    }

    public function down(): void
    {
        DB::table('nav_menu_items')->where('url', self::URL)->whereIn('slot', ['header', 'footer'])->delete();
    }
};
