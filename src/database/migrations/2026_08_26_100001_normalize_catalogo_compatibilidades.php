<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('catalogo_compatibilidades', function (Blueprint $table) {
            // Eliminar constraint único viejo (tipo, modelo) y agregar target_id
            $table->dropUnique(['publicacion_id', 'tipo', 'modelo']);
            $table->dropIndex(['publicacion_id']);

            $table->foreignId('target_id')
                ->nullable()
                ->after('publicacion_id')
                ->constrained('compatibility_targets')
                ->cascadeOnDelete();

            // Reemplazar unique con nuevo constraint (publicacion + target)
            $table->unique(['publicacion_id', 'target_id']);
            $table->index('target_id');
        });

        // Eliminar columnas de strings libres — la tabla está vacía, migración limpia
        Schema::table('catalogo_compatibilidades', function (Blueprint $table) {
            $table->dropColumn(['tipo', 'modelo']);
        });

        // Ahora target_id es obligatorio
        Schema::table('catalogo_compatibilidades', function (Blueprint $table) {
            $table->foreignId('target_id')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('catalogo_compatibilidades', function (Blueprint $table) {
            $table->dropForeign(['target_id']);
            $table->dropUnique(['publicacion_id', 'target_id']);
            $table->dropIndex(['target_id']);
            $table->dropColumn('target_id');
            $table->string('tipo', 50)->default('iphone_model');
            $table->string('modelo', 100)->default('');
            $table->unique(['publicacion_id', 'tipo', 'modelo']);
            $table->index('publicacion_id');
        });
    }
};
