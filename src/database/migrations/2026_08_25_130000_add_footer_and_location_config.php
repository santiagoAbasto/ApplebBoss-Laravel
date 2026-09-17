<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $ahora = now();

        $nuevos = [
            ['clave' => 'tienda_pais',          'valor' => 'Bolivia',                                           'tipo' => 'texto', 'grupo' => 'tienda',   'etiqueta' => 'País'],
            ['clave' => 'footer_tagline',        'valor' => 'Tecnología seleccionada con criterio. Precios claros. Personas reales para ayudarte a elegir.', 'tipo' => 'texto', 'grupo' => 'tienda', 'etiqueta' => 'Tagline del footer'],
            ['clave' => 'tienda_descripcion',    'valor' => 'Especialistas en iPhone, Mac y accesorios Apple en Cochabamba, Bolivia.',                         'tipo' => 'texto', 'grupo' => 'tienda', 'etiqueta' => 'Descripción corta de la tienda'],
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
        DB::table('configuracion_tienda')->whereIn('clave', ['tienda_pais', 'footer_tagline', 'tienda_descripcion'])->delete();
    }
};
