<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Pedir reseña al cliente después de una venta: botón en el panel (WhatsApp + correo) y un correo que sale solo
 * unos días después. `resena_pedida_en` marca a quién ya se le pidió, para no repetir. El enlace de calificación
 * (el g.page de Google) vive en configuración para que el dueño lo cambie sin tocar código.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ventas', function (Blueprint $table) {
            $table->timestamp('resena_pedida_en')->nullable()->after('correo_enviado_en');
        });

        if (! DB::table('configuracion_tienda')->where('clave', 'resena_enlace')->exists()) {
            DB::table('configuracion_tienda')->insert([
                'clave'      => 'resena_enlace',
                'valor'      => 'https://g.page/r/Ce_YKZWYAZCKEAE/review',
                'tipo'       => 'texto',
                'grupo'      => 'resenas',
                'etiqueta'   => 'Enlace de Google para pedir calificación',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('ventas', function (Blueprint $table) {
            $table->dropColumn('resena_pedida_en');
        });

        DB::table('configuracion_tienda')->where('clave', 'resena_enlace')->delete();
    }
};
