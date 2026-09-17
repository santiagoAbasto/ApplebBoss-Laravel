<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('compatibility_targets', function (Blueprint $table) {
            $table->id();
            $table->string('family', 30);        // iphone, ipad, mac, watch, airpods, general
            $table->string('name', 100);          // "iPhone 15 Pro"
            $table->string('slug', 120)->unique(); // "iphone-15-pro"
            $table->string('generation', 50)->nullable(); // "iPhone 15"  — para agrupar
            $table->boolean('active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['family', 'active']);
            $table->index('sort_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compatibility_targets');
    }
};
