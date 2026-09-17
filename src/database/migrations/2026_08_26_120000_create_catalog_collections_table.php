<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalog_collections', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('slug', 120)->unique();
            $table->text('description')->nullable();
            $table->boolean('active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('catalog_collection_publicacion', function (Blueprint $table) {
            $table->id();
            $table->foreignId('collection_id')->constrained('catalog_collections')->cascadeOnDelete();
            $table->foreignId('publicacion_id')->constrained('catalogo_publicaciones')->cascadeOnDelete();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->unique(['collection_id', 'publicacion_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_collection_publicacion');
        Schema::dropIfExists('catalog_collections');
    }
};
