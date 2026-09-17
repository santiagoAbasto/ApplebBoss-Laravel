<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Datos estructurados del modelo (números, sí/no y «no tiene» explícito) para comparar y recomendar.
 * Los textos de la ficha (`specs`) se generan a partir de estos datos.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::table('modelos_referencia', function (Blueprint $table) {
            $table->json('datos')->nullable()->after('specs');
        });
    }

    public function down(): void
    {
        Schema::table('modelos_referencia', function (Blueprint $table) {
            $table->dropColumn('datos');
        });
    }
};
