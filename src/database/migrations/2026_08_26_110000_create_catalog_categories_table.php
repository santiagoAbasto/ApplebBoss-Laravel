<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalog_categories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('catalog_categories')->nullOnDelete();
            $table->string('name', 100);
            $table->string('slug', 120)->unique();
            $table->text('description')->nullable();
            $table->boolean('active')->default(true);
            $table->boolean('show_home')->default(false);
            $table->boolean('show_navigation')->default(true);
            $table->boolean('is_myskin')->default(false); // categoría especial MYSKIN
            $table->unsignedSmallInteger('sort_order')->default(0);
            // SEO
            $table->string('meta_title', 255)->nullable();
            $table->text('meta_description')->nullable();
            // Hero de categoría (opcional)
            $table->string('hero_eyebrow', 100)->nullable();
            $table->string('hero_titulo', 255)->nullable();
            $table->text('hero_descripcion')->nullable();
            $table->string('hero_cta_label', 60)->nullable();
            $table->string('hero_cta_url', 255)->nullable();
            $table->timestamps();

            $table->index(['active', 'sort_order']);
            $table->index('parent_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalog_categories');
    }
};
