<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Foto de cada modelo de referencia (Tienda online → Modelos y fotos). La usa la comparativa pública; sin foto,
 * la comparativa dibuja una ilustración a escala. El seeder de modelos no toca estas columnas.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('modelos_referencia', function (Blueprint $table) {
            $table->string('foto_original')->nullable()->after('datos');
            $table->string('foto_card')->nullable()->after('foto_original');       // 640 × 768 como máximo: la comparativa
            $table->string('foto_detalle')->nullable()->after('foto_card');       // 1280 × 1536 como máximo: pantallas grandes
            $table->json('foto_meta')->nullable()->after('foto_detalle');         // nombre, tipo, peso y medidas del original
            $table->timestamp('foto_actualizada_at')->nullable()->after('foto_meta');
        });
    }

    public function down(): void
    {
        Schema::table('modelos_referencia', function (Blueprint $table) {
            $table->dropColumn(['foto_original', 'foto_card', 'foto_detalle', 'foto_meta', 'foto_actualizada_at']);
        });
    }
};
