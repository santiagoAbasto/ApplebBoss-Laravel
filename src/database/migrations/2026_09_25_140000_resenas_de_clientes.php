<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Reseñas de clientes.
 *
 * Dos orígenes, los dos reales: la que deja quien recibió su pedido de la web (compra verificada, atada al pedido) y
 * la que la tienda carga desde donde la recibió (Google, Facebook, WhatsApp, en el local), con el enlace para
 * comprobarla. Ninguna se publica sola: la aprueba alguien del panel.
 *
 * El inicio suma la sección «Reseñas» justo después de las preguntas frecuentes. Sin reseñas publicadas no se dibuja.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('resenas', function (Blueprint $t) {
            $t->id();
            $t->string('nombre', 80);                   // como firma; en la tienda sale «Nombre I.»
            $t->unsignedTinyInteger('calificacion');    // 1 a 5
            $t->text('texto');
            $t->string('fuente', 20);                   // web | google | facebook | instagram | whatsapp | tienda
            $t->string('enlace', 300)->nullable();      // dónde está publicada la original
            $t->string('producto', 120)->nullable();    // qué compró
            $t->date('fecha');                          // cuándo la escribió
            // Compra verificada: una sola por pedido
            $t->foreignId('pedido_id')->nullable()->unique()->constrained('pedidos')->nullOnDelete();
            $t->boolean('publicada')->default(false);
            $t->unsignedInteger('orden')->default(0);
            $t->timestamps();

            $t->index(['publicada', 'orden']);
        });

        if (Schema::hasTable('home_sections') && ! DB::table('home_sections')->where('type', 'reviews')->exists()) {
            $faq = DB::table('home_sections')->where('type', 'faq')->max('orden');
            if ($faq !== null) {
                DB::table('home_sections')->where('orden', '>', $faq)->increment('orden');
            }

            DB::table('home_sections')->insert([
                'type'       => 'reviews',
                'label'      => 'Reseñas',
                'active'     => true,
                'orden'      => $faq !== null ? $faq + 1 : ((int) DB::table('home_sections')->max('orden') + 1),
                'settings'   => json_encode([]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('home_sections')) {
            DB::table('home_sections')->where('type', 'reviews')->delete();
        }

        Schema::dropIfExists('resenas');
    }
};
