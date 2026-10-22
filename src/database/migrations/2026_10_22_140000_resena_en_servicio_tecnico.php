<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pedir reseña también cuando un servicio técnico se marca «entregado» (igual que las ventas).
 * `resena_pedida_en` marca a quién ya se le pidió, para no repetir.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('servicio_tecnicos', function (Blueprint $table) {
            $table->timestamp('resena_pedida_en')->nullable()->after('correo_enviado_en');
        });
    }

    public function down(): void
    {
        Schema::table('servicio_tecnicos', function (Blueprint $table) {
            $table->dropColumn('resena_pedida_en');
        });
    }
};
