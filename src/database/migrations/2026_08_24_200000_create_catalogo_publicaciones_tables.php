<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalogo_publicaciones', function (Blueprint $table) {
            $table->id();

            // Relación polimórfica al inventario
            $table->string('producto_tipo')->comment('celular|computadora|producto_apple|producto_general');
            $table->unsignedBigInteger('producto_id');
            $table->unique(['producto_tipo', 'producto_id'], 'unique_publicacion_producto');

            // Storefront
            $table->string('storefront', 20)->default('APPLE_BOSS')
                  ->comment('APPLE_BOSS|MYSKIN — MYSKIN solo para fundas/cases');

            // Estado de publicación
            $table->boolean('publicado')->default(false)->index();
            $table->boolean('destacado')->default(false);
            $table->timestamp('publicar_desde')->nullable();
            $table->timestamp('publicar_hasta')->nullable();
            $table->unsignedInteger('orden')->default(0);

            // Contenido público
            $table->string('titulo');
            $table->string('subtitulo')->nullable();
            $table->string('slug')->unique();
            $table->text('resumen');
            $table->longText('descripcion')->nullable();
            $table->text('que_incluye')->nullable();
            $table->text('observaciones')->nullable();
            $table->string('garantia')->nullable();

            // Condición comercial EXPLÍCITA — el admin elige; nunca se infiere
            $table->enum('condicion', ['Nuevo', 'Seminuevo', 'Open Box', 'Reacondicionado'])
                  ->nullable()
                  ->comment('Obligatorio definir antes de publicar. Nunca calculado automáticamente.');

            // Organización
            $table->string('categoria');
            $table->string('subcategoria')->nullable();
            $table->json('tags')->nullable();

            // Atributos dinámicos por tipo (iPhone, Mac, MYSKIN, etc.)
            $table->json('atributos')->nullable();

            // SEO
            $table->string('seo_title')->nullable();
            $table->text('seo_description')->nullable();

            $table->timestamps();

            $table->index(['publicado', 'categoria']);
            $table->index('storefront');
        });

        Schema::create('catalogo_imagenes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publicacion_id')
                  ->constrained('catalogo_publicaciones')
                  ->cascadeOnDelete();

            $table->string('nombre_original');
            $table->string('ruta_original', 500);
            $table->string('ruta_thumb', 500)->nullable();
            $table->string('ruta_card', 500)->nullable();
            $table->string('ruta_medium', 500)->nullable();
            $table->string('ruta_detail', 500)->nullable();
            $table->string('alt')->nullable();
            $table->unsignedInteger('orden')->default(0);
            $table->boolean('es_principal')->default(false);
            $table->json('metadata')->nullable()->comment('width, height, size, mime, etc.');

            $table->timestamps();

            $table->index(['publicacion_id', 'orden']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalogo_imagenes');
        Schema::dropIfExists('catalogo_publicaciones');
    }
};
