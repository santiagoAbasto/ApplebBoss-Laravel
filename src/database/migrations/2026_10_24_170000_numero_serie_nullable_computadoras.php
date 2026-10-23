<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Una Mac «de proveedor» aún no está físicamente: no tiene número de serie todavía. Se hace nullable (la unicidad se
 * mantiene: varios NULL conviven bajo el índice único); al venderla y conseguirla se le carga el serie real.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('computadoras') && Schema::hasColumn('computadoras', 'numero_serie')) {
            Schema::table('computadoras', fn (Blueprint $t) => $t->string('numero_serie')->nullable()->change());
        }
    }

    public function down(): void
    {
        // Se deja nullable (revertir exigiría rellenar los NULL).
    }
};
