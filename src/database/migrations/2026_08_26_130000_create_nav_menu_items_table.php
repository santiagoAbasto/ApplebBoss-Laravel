<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nav_menu_items', function (Blueprint $table) {
            $table->id();
            $table->string('slot', 20)->index(); // header | footer | mobile
            $table->foreignId('parent_id')->nullable()->constrained('nav_menu_items')->nullOnDelete();
            $table->string('label', 120);
            $table->string('url', 500)->nullable();
            $table->string('group', 80)->nullable();  // footer column heading (used when parent_id is null in footer)
            $table->boolean('open_in_new_tab')->default(false);
            $table->boolean('myskin')->default(false); // lime color styling
            $table->boolean('active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();

            $table->index(['slot', 'active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nav_menu_items');
    }
};
