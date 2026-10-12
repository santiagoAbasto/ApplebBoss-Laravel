<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Cuándo se le pidió la reseña al comprador (resenas:pedir, una semana después de la entrega). Una sola vez por pedido. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pedidos', fn (Blueprint $t) => $t->timestamp('resena_pedida_en')->nullable()->after('entregado_en'));
    }

    public function down(): void
    {
        Schema::table('pedidos', fn (Blueprint $t) => $t->dropColumn('resena_pedida_en'));
    }
};
