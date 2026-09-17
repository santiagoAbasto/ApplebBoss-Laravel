<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tienda online → Servicios: cada tarjeta de «Nuestros servicios» puede hacer algo cuando el cliente la toca.
 * `accion`: ninguna (solo informa), whatsapp (abre un chat sobre ese servicio) o enlace (lleva a una página).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('store_services', function (Blueprint $table) {
            $table->string('accion', 20)->default('ninguna')->after('description');
            $table->string('enlace', 500)->nullable()->after('accion');
            $table->string('boton', 40)->nullable()->after('enlace');
        });
    }

    public function down(): void
    {
        Schema::table('store_services', function (Blueprint $table) {
            $table->dropColumn(['accion', 'enlace', 'boton']);
        });
    }
};
