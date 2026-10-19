<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * El enlace que recibe el cliente para abrir su documento (nota de venta, de servicio, de reserva, informe técnico o
 * cotización): una clave aleatoria que no deja ver el tipo ni el número interno, y que vence. Vencida, el panel arma
 * una nueva la próxima vez que se comparte.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enlaces_documento', function (Blueprint $table) {
            $table->id();
            $table->string('token', 64)->unique();
            $table->string('tipo', 20);
            $table->unsignedBigInteger('documento_id');
            $table->timestamp('vence_en');
            $table->timestamps();
            $table->index(['tipo', 'documento_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enlaces_documento');
    }
};
