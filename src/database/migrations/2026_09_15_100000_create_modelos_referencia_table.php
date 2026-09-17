<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Modelos de referencia (iPhone X, MacBook Air M2…): su ficha técnica completa se carga una vez
 * y llena las publicaciones de todos los equipos de ese modelo. También alimenta la comparativa pública.
 */
return new class extends Migration {
    public function up(): void
    {
        Schema::create('modelos_referencia', function (Blueprint $table) {
            $table->id();
            $table->string('tipo', 30);                 // celular, computadora, producto_apple
            $table->string('familia', 30);              // iphone, mac, ipad, watch, airpods
            $table->string('nombre');
            $table->string('slug')->unique();
            $table->unsignedSmallInteger('anio')->nullable();
            $table->json('alias')->nullable();          // otras formas de escribir el modelo en el inventario
            $table->json('specs')->nullable();          // claves de la ficha técnica
            $table->decimal('autonomia_video_horas', 4, 1)->nullable(); // de un equipo nuevo
            $table->unsignedInteger('orden')->default(0);
            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->index(['tipo', 'activo']);
        });

        Schema::table('catalogo_publicaciones', function (Blueprint $table) {
            $table->foreignId('modelo_referencia_id')->nullable()->after('producto_id')
                ->constrained('modelos_referencia')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('catalogo_publicaciones', function (Blueprint $table) {
            $table->dropConstrainedForeignId('modelo_referencia_id');
        });

        Schema::dropIfExists('modelos_referencia');
    }
};
