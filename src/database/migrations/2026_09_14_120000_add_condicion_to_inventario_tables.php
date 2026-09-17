<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Condición comercial del inventario (Nuevo / Seminuevo): alimenta las publicaciones de la tienda.
 * Los productos que ya estaban publicados toman la condición que se eligió al publicarlos;
 * el resto queda sin condición hasta que alguien la elija (nunca se inventa).
 */
return new class extends Migration
{
    private const TABLAS = [
        'celular'          => 'celulares',
        'computadora'      => 'computadoras',
        'producto_apple'   => 'productos_apple',
        'producto_general' => 'productos_generales',
    ];

    public function up(): void
    {
        foreach (self::TABLAS as $tabla) {
            Schema::table($tabla, function (Blueprint $table) {
                $table->string('condicion', 20)->nullable()->after('estado');
            });
        }

        DB::table('catalogo_publicaciones')
            ->whereIn('condicion', ['Nuevo', 'Seminuevo'])
            ->whereIn('producto_tipo', array_keys(self::TABLAS))
            ->orderBy('id')
            ->get(['producto_tipo', 'producto_id', 'condicion'])
            ->each(function ($pub) {
                DB::table(self::TABLAS[$pub->producto_tipo])
                    ->where('id', $pub->producto_id)
                    ->whereNull('condicion')
                    ->update(['condicion' => $pub->condicion]);
            });
    }

    public function down(): void
    {
        foreach (self::TABLAS as $tabla) {
            Schema::table($tabla, function (Blueprint $table) {
                $table->dropColumn('condicion');
            });
        }
    }
};
