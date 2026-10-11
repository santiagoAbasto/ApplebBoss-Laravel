<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Medición propia del tráfico de la tienda (Tienda online → Tráfico): sin cookies, sin IP ni navegador en claro.
 * `dia` y `hora` se guardan ya en hora de La Paz para agrupar igual en PostgreSQL y en SQLite.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('eventos_web', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 40);
            $table->string('ruta', 300);
            $table->string('etiqueta', 120)->nullable();   // de qué: el producto agregado, lo que se buscó…
            $table->string('visitante', 16)->nullable();   // seudónimo que cambia cada día
            $table->char('pais', 2)->nullable();
            $table->string('dispositivo', 10)->nullable();
            $table->string('navegador', 10)->nullable();
            $table->string('referente', 120)->nullable();  // solo el dominio de donde llegó
            $table->char('idioma', 2)->nullable();
            $table->boolean('bot')->default(false);
            $table->date('dia');
            $table->unsignedTinyInteger('hora');
            $table->timestamp('created_at')->useCurrent();

            $table->index(['nombre', 'dia']);
            $table->index(['bot', 'dia']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('eventos_web');
    }
};
