<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('catalogo_compatibilidades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('publicacion_id')
                  ->constrained('catalogo_publicaciones')
                  ->cascadeOnDelete();
            $table->string('tipo', 50)->default('iphone_model');   // iphone_model | ipad_model | mac_model | general
            $table->string('modelo', 100);
            $table->timestamps();

            $table->unique(['publicacion_id', 'tipo', 'modelo']);
            $table->index('publicacion_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('catalogo_compatibilidades');
    }
};
