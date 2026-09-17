<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * La comparativa de Mac (/comparar/mac) en los menús que se administran desde el panel, igual que la de iPhone:
 * dentro de «Mac» en el header y en la columna «Comprar» del footer. La barra de categorías y el menú del celular
 * ya la muestran fija.
 */
return new class extends Migration
{
    private const URL = '/comparar/mac';

    public function up(): void
    {
        $now = now();
        $base = ['open_in_new_tab' => false, 'myskin' => false, 'active' => true, 'created_at' => $now, 'updated_at' => $now];

        $mac = DB::table('nav_menu_items')->where('slot', 'header')->where('url', '/mac')->whereNull('parent_id')->first();
        if ($mac && ! DB::table('nav_menu_items')->where('parent_id', $mac->id)->where('url', self::URL)->exists()) {
            DB::table('nav_menu_items')->insert($base + [
                'slot'       => 'header',
                'parent_id'  => $mac->id,
                'label'      => 'Comparar modelos',
                'url'        => self::URL,
                'group'      => null,
                'sort_order' => (int) DB::table('nav_menu_items')->where('parent_id', $mac->id)->max('sort_order') + 1,
            ]);
        }

        $hayFooter = DB::table('nav_menu_items')->where('slot', 'footer')->exists();
        if ($hayFooter && ! DB::table('nav_menu_items')->where('slot', 'footer')->where('url', self::URL)->whereNull('parent_id')->exists()) {
            $iphone = DB::table('nav_menu_items')->where('slot', 'footer')->where('url', '/comparar/iphone')->whereNull('parent_id')->first();
            DB::table('nav_menu_items')->insert($base + [
                'slot'       => 'footer',
                'parent_id'  => null,
                'label'      => 'Comparar Mac',
                'url'        => self::URL,
                'group'      => $iphone->group ?? 'Comprar',
                'sort_order' => ($iphone->sort_order ?? 7) + 1,
            ]);
        }
    }

    public function down(): void
    {
        DB::table('nav_menu_items')->where('url', self::URL)->whereIn('slot', ['header', 'footer'])->delete();
    }
};
