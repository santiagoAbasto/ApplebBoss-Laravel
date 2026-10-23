<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * La garantía del producto ya no se escribe a mano: se deriva de la condición (Nuevo/Seminuevo) con los meses de
 * config/documentos.php (los mismos del footer/legales). Este campo guarda el TOTAL de meses solo cuando se da MÁS
 * que lo estándar (garantía extendida); si está en null, se usa el estándar de su condición.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('catalogo_publicaciones') && ! Schema::hasColumn('catalogo_publicaciones', 'garantia_meses')) {
            Schema::table('catalogo_publicaciones', function (Blueprint $t) {
                $t->unsignedSmallInteger('garantia_meses')->nullable()->after('garantia');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('catalogo_publicaciones') && Schema::hasColumn('catalogo_publicaciones', 'garantia_meses')) {
            Schema::table('catalogo_publicaciones', fn (Blueprint $t) => $t->dropColumn('garantia_meses'));
        }
    }
};
