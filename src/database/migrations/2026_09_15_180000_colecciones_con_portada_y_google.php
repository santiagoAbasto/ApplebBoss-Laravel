<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cada colección pasa a tener su propia página en la tienda (/coleccion/…), así que necesita
 * cómo aparece en Google. El nombre y la descripción siguen siendo la portada por defecto.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('catalog_collections', function (Blueprint $table) {
            $table->string('meta_title', 255)->nullable()->after('description');
            $table->string('meta_description', 500)->nullable()->after('meta_title');
        });
    }

    public function down(): void
    {
        Schema::table('catalog_collections', function (Blueprint $table) {
            $table->dropColumn(['meta_title', 'meta_description']);
        });
    }
};
