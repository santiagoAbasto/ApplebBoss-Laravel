<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * SEO administrable de la comparativa de modelos (/comparar/iphone y, más adelante, /comparar/mac).
 * Es una plantilla: {titulo} se reemplaza por «modelos de iPhone». Los campos vacíos usan App\Support\Seo::DEFAULTS.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::table('seo_pages')->where('page_key', 'store.compare.modelos')->exists()) {
            return;
        }

        DB::table('seo_pages')->insert([
            'page_key'   => 'store.compare.modelos',
            'path'       => '/comparar/{familia}',
            'label'      => 'Comparar modelos (plantilla)',
            'tipo'       => 'plantilla',
            'noindex'    => false,
            'orden'      => (int) DB::table('seo_pages')->max('orden') + 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        DB::table('seo_pages')->where('page_key', 'store.compare.modelos')->delete();
    }
};
