<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Marca de "cuenta de demostración" (solo lectura) para el acceso del jurado.
 * Una cuenta con demo=true no puede guardar nada y no está sujeta al horario laboral.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'demo')) {
                $table->boolean('demo')->default(false)->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'demo')) {
                $table->dropColumn('demo');
            }
        });
    }
};
