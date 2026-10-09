<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * API de integración (solo lectura) para otros sistemas de Apple Boss, como la futura plataforma de IA.
 * Solo agrega tablas: no toca el inventario, los precios ni las publicaciones.
 */
return new class extends Migration
{
    public function up(): void
    {
        // La tabla estándar de Sanctum (ya instalado, sin usar hasta hoy). Guarda el hash del token, nunca el token.
        if (! Schema::hasTable('personal_access_tokens')) {
            Schema::create('personal_access_tokens', function (Blueprint $table) {
                $table->id();
                $table->morphs('tokenable');
                $table->text('name');
                $table->string('token', 64)->unique();
                $table->text('abilities')->nullable();
                $table->timestamp('last_used_at')->nullable();
                $table->timestamp('expires_at')->nullable()->index();
                $table->timestamps();
            });
        }

        Schema::create('integraciones', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 80);
            $table->json('scopes');
            $table->boolean('activa')->default(true);
            $table->foreignId('creado_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        // Qué pidió cada integración y qué se le respondió. Sin tokens, cabeceras ni cuerpos.
        Schema::create('integracion_solicitudes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('integracion_id')->nullable()->constrained('integraciones')->cascadeOnDelete();
            $table->unsignedBigInteger('token_id')->nullable();
            $table->string('metodo', 8);
            $table->string('ruta', 160);
            $table->unsignedSmallInteger('estado');
            $table->unsignedInteger('duracion_ms');
            $table->string('ip', 45)->nullable();
            $table->timestamp('created_at')->useCurrent()->index();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('integracion_solicitudes');
        Schema::dropIfExists('integraciones');
        Schema::dropIfExists('personal_access_tokens');
    }
};
