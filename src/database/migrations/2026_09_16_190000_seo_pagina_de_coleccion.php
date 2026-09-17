<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * La página de una colección (`/coleccion/{slug}`) ya resolvía su título con `App\Support\Seo`, pero no tenía fila en
 * `seo_pages`: era la única página pública que no se podía editar desde «Google y redes sociales».
 */
return new class extends Migration
{
    private const PAGINA = [
        'page_key' => 'store.collection',
        'path'     => '/coleccion/{slug}',
        'label'    => 'Colección (plantilla)',
        'tipo'     => 'plantilla',
        'noindex'  => false,
        'orden'    => 90,
    ];

    public function up(): void
    {
        if (! Schema::hasTable('seo_pages')) {
            return;
        }

        DB::table('seo_pages')->insertOrIgnore(self::PAGINA + [
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        if (Schema::hasTable('seo_pages')) {
            DB::table('seo_pages')->where('page_key', self::PAGINA['page_key'])->delete();
        }
    }
};
