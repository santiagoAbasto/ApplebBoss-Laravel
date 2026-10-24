<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tipo de SIM del celular: 'fisico' (chip físico) o 'esim' (chip virtual). Distingue dos equipos iguales de distinto
 * precio (un iPhone 17 con chip físico cuesta distinto que el mismo con eSIM). Nulo = no especificado (equipos viejos).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('celulares', function (Blueprint $table) {
            if (! Schema::hasColumn('celulares', 'sim')) {
                $table->string('sim')->nullable()->after('color');
            }
        });
    }

    public function down(): void
    {
        Schema::table('celulares', function (Blueprint $table) {
            if (Schema::hasColumn('celulares', 'sim')) {
                $table->dropColumn('sim');
            }
        });
    }
};
