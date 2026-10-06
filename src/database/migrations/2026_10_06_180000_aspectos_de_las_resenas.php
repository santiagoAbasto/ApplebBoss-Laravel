<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Quien recibió su pedido califica por partes: el producto, la entrega y la atención, además de la tienda en general
 * (que sigue siendo `calificacion`). Las reseñas de Google y las cargadas a mano no traen partes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resenas', function (Blueprint $t) {
            $t->json('aspectos')->nullable()->after('calificacion');
        });
    }

    public function down(): void
    {
        Schema::table('resenas', function (Blueprint $t) {
            $t->dropColumn('aspectos');
        });
    }
};
