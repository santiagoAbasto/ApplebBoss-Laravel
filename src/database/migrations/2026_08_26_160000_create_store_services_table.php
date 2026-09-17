<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_services', function (Blueprint $table) {
            $table->id();
            $table->string('icon', 50)->default('🔧');   // emoji
            $table->string('title', 120);
            $table->string('description', 300)->nullable();
            $table->boolean('active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_services');
    }
};
