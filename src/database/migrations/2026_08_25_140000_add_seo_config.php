<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $ahora = now();

        $nuevos = [
            ['clave' => 'seo_titulo_home',        'valor' => 'Apple Boss — Tecnología Apple en Cochabamba',                                                                        'tipo' => 'texto', 'grupo' => 'seo', 'etiqueta' => 'Título SEO del home'],
            ['clave' => 'seo_descripcion_home',   'valor' => 'iPhone, Mac, iPad y accesorios Apple disponibles en Cochabamba. Equipos revisados, precios reales, atención personalizada.', 'tipo' => 'texto', 'grupo' => 'seo', 'etiqueta' => 'Meta description del home'],
        ];

        foreach ($nuevos as $row) {
            DB::table('configuracion_tienda')->insertOrIgnore([
                ...$row,
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ]);
        }
    }

    public function down(): void
    {
        DB::table('configuracion_tienda')->whereIn('clave', ['seo_titulo_home', 'seo_descripcion_home'])->delete();
    }
};
