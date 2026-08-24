<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('catalogo_publicaciones', function (Blueprint $table) {
            // Promoción
            $table->decimal('precio_promocional', 10, 2)->nullable()->after('orden');
            $table->timestamp('promocion_desde')->nullable()->after('precio_promocional');
            $table->timestamp('promocion_hasta')->nullable()->after('promocion_desde');
            $table->string('badge', 60)->nullable()->after('promocion_hasta')
                  ->comment('Ej: OFERTA, NUEVO INGRESO, ÚLTIMAS UNIDADES');

            // Observaciones públicas (ya existe 'observaciones' — agregar campo para FAQ)
            // El campo que_incluye y observaciones ya existen, solo agregamos badge/promo.
        });
    }

    public function down(): void
    {
        Schema::table('catalogo_publicaciones', function (Blueprint $table) {
            $table->dropColumn(['precio_promocional', 'promocion_desde', 'promocion_hasta', 'badge']);
        });
    }
};
