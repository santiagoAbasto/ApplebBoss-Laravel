<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Panel → Diagnósticos: el informe técnico que la tienda entrega firmado sobre el estado de un equipo.
 * Y las cotizaciones pueden hacerse en dólares (las de siempre quedan en bolivianos).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('diagnosticos', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 20)->nullable()->unique();
            $table->date('fecha');
            $table->string('cliente_nombre');
            $table->string('cliente_telefono', 20)->nullable();
            $table->string('cliente_correo')->nullable();
            $table->string('equipo');
            $table->string('identificador', 60)->nullable(); // IMEI o número de serie
            $table->text('falla_reportada');                  // lo que dice el cliente, con sus palabras
            $table->json('pruebas')->nullable();              // lo que probó el técnico, punto por punto
            $table->text('conclusion')->nullable();
            $table->text('recomendacion')->nullable();
            $table->string('tecnico')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::table('cotizaciones', function (Blueprint $table) {
            $table->string('moneda', 3)->default('BOB')->after('total');
        });
    }

    public function down(): void
    {
        Schema::table('cotizaciones', function (Blueprint $table) {
            $table->dropColumn('moneda');
        });

        Schema::dropIfExists('diagnosticos');
    }
};
