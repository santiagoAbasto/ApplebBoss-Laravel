<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Tienda online → Novedades, alineado y cableado (2026-09-16).
 *
 * - La foto principal se guarda con sus variantes (como las fotos de los modelos): `imagen_original`, `imagen_card`
 *   e `imagen_detalle`. Antes `featured_image` guardaba una dirección suelta que nunca se achicaba ni se borraba.
 * - Se quitan dos campos que no usaba nadie: `sort_order` (el panel pedía una «Posición» que la tienda ignoraba: las
 *   novedades van por fecha) y `og_image` (no había dónde cargarla).
 * - El inicio suma la sección «Novedades» (Portada), antes de las preguntas frecuentes. Sin novedades publicadas no se
 *   dibuja.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('novedades', function (Blueprint $table) {
            $table->string('imagen_original', 500)->nullable()->after('excerpt');
            $table->string('imagen_card', 500)->nullable()->after('imagen_original');
            $table->string('imagen_detalle', 500)->nullable()->after('imagen_card');
            $table->json('imagen_meta')->nullable()->after('imagen_detalle');
        });

        // Las fotos que ya estaban en el disco público se conservan tal cual (sin variantes)
        foreach (DB::table('novedades')->whereNotNull('featured_image')->get(['id', 'featured_image']) as $n) {
            if (str_starts_with($n->featured_image, '/storage/')) {
                $ruta = substr($n->featured_image, strlen('/storage/'));
                DB::table('novedades')->where('id', $n->id)->update([
                    'imagen_original' => $ruta, 'imagen_card' => $ruta, 'imagen_detalle' => $ruta,
                ]);
            }
        }

        Schema::table('novedades', function (Blueprint $table) {
            $table->dropIndex(['sort_order']);
        });
        Schema::table('novedades', function (Blueprint $table) {
            $table->dropColumn(['featured_image', 'og_image', 'sort_order']);
        });

        if (Schema::hasTable('home_sections') && ! DB::table('home_sections')->where('type', 'news')->exists()) {
            $faq = DB::table('home_sections')->where('type', 'faq')->min('orden');
            if ($faq !== null) {
                DB::table('home_sections')->where('orden', '>=', $faq)->increment('orden');
            }

            DB::table('home_sections')->insert([
                'type'       => 'news',
                'label'      => 'Novedades',
                'active'     => true,
                'orden'      => $faq ?? ((int) DB::table('home_sections')->max('orden') + 1),
                'settings'   => json_encode([]),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('novedades', function (Blueprint $table) {
            $table->string('featured_image')->nullable();
            $table->string('og_image')->nullable();
            $table->unsignedInteger('sort_order')->default(0)->index();
        });

        foreach (DB::table('novedades')->whereNotNull('imagen_detalle')->get(['id', 'imagen_detalle']) as $n) {
            DB::table('novedades')->where('id', $n->id)->update(['featured_image' => '/storage/' . $n->imagen_detalle]);
        }

        Schema::table('novedades', function (Blueprint $table) {
            $table->dropColumn(['imagen_original', 'imagen_card', 'imagen_detalle', 'imagen_meta']);
        });

        if (Schema::hasTable('home_sections')) {
            DB::table('home_sections')->where('type', 'news')->delete();
        }
    }
};
