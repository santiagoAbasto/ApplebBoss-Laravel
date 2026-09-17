<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private const ITEMS = [
        ['slot' => 'footer', 'label' => 'Trade-In',  'url' => '/trade-in',  'group' => 'Comprar',    'sort_order' => 6],
        ['slot' => 'footer', 'label' => 'Novedades', 'url' => '/novedades', 'group' => 'Apple Boss', 'sort_order' => 199],
        ['slot' => 'mobile', 'label' => 'Trade-In',  'url' => '/trade-in',  'group' => null,         'sort_order' => 6],
    ];

    public function up(): void
    {
        $now = now();
        foreach (self::ITEMS as $item) {
            $exists = DB::table('nav_menu_items')
                ->where('slot', $item['slot'])
                ->where('url', $item['url'])
                ->whereNull('parent_id')
                ->exists();

            if (! $exists) {
                DB::table('nav_menu_items')->insert($item + [
                    'parent_id'       => null,
                    'open_in_new_tab' => false,
                    'myskin'          => false,
                    'active'          => true,
                    'created_at'      => $now,
                    'updated_at'      => $now,
                ]);
            }
        }
    }

    public function down(): void
    {
        foreach (self::ITEMS as $item) {
            DB::table('nav_menu_items')->where('slot', $item['slot'])->where('url', $item['url'])->delete();
        }
    }
};
