<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('home_sections', function (Blueprint $table) {
            $table->id();
            $table->string('type', 50);       // hero, category_rail, product_collection, etc.
            $table->string('label', 100);     // display name for admin
            $table->boolean('active')->default(true);
            $table->unsignedSmallInteger('orden')->default(0);
            $table->jsonb('settings')->default('{}');
            $table->timestamp('publicar_desde')->nullable();
            $table->timestamp('publicar_hasta')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('home_sections');
    }
};
