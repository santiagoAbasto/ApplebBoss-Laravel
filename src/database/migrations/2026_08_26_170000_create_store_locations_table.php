<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('store_locations', function (Blueprint $table) {
            $table->id();
            $table->string('name', 120);
            $table->string('address', 300)->nullable();
            $table->string('city', 100)->default('Cochabamba');
            $table->string('country', 100)->default('Bolivia');
            $table->string('phone', 50)->nullable();
            $table->string('whatsapp', 30)->nullable();
            $table->string('hours', 200)->nullable();
            $table->string('map_embed_url', 1000)->nullable(); // Google Maps iframe src
            $table->string('map_link_url', 500)->nullable();   // link to Google Maps
            $table->text('description')->nullable();
            $table->boolean('active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('store_locations');
    }
};
