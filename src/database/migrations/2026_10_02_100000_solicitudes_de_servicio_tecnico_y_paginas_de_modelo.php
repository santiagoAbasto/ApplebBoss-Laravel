<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * La página pública de servicio técnico (/servicio-tecnico) y la página de cada modelo (/iphone/iphone-15-pro-max).
 *
 * - `solicitudes_servicio`: lo que el cliente pide desde el formulario de /servicio-tecnico. Se atiende en el panel
 *   (Tienda online → Solicitudes de servicio) y avisa en el Resumen (`system_notifications.solicitud_servicio_id`).
 * - Las dos páginas quedan en «Google y redes sociales» para escribirles título y descripción.
 * - El pie y el menú del celular suman el enlace, y las tarjetas «Servicio técnico» y «Diagnóstico gratuito» del
 *   inicio llevan a la página si todavía no llevaban a ningún lado.
 */
return new class extends Migration
{
    private const SEO = [
        ['servicio-tecnico.index', '/servicio-tecnico',  'Servicio técnico',              'pagina'],
        ['store.modelo',           '/iphone/{modelo}',   'Página de un modelo (plantilla)', 'plantilla'],
    ];

    private const MENU = [
        ['slot' => 'footer', 'label' => 'Servicio técnico', 'url' => '/servicio-tecnico', 'group' => 'Ayuda', 'sort_order' => 99],
        ['slot' => 'mobile', 'label' => 'Servicio técnico', 'url' => '/servicio-tecnico', 'group' => null,    'sort_order' => 7],
    ];

    public function up(): void
    {
        Schema::create('solicitudes_servicio', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 20)->unique();
            $table->string('tipo_equipo', 30);
            $table->string('marca', 60)->nullable();
            $table->string('modelo', 120);
            $table->json('problemas');
            $table->text('descripcion')->nullable();
            $table->string('nombre_contacto', 120);
            $table->string('telefono_contacto', 30);
            $table->string('estado', 20)->default('nuevo')->index();
            $table->text('notas_internas')->nullable();
            $table->foreignId('atendido_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::table('system_notifications', function (Blueprint $table) {
            $table->unsignedBigInteger('solicitud_servicio_id')->nullable()->index();
        });

        $now = now();

        foreach (self::SEO as [$key, $path, $label, $tipo]) {
            if (! DB::table('seo_pages')->where('page_key', $key)->exists()) {
                DB::table('seo_pages')->insert([
                    'page_key' => $key, 'path' => $path, 'label' => $label, 'tipo' => $tipo, 'noindex' => false,
                    'orden' => (int) DB::table('seo_pages')->max('orden') + 1, 'created_at' => $now, 'updated_at' => $now,
                ]);
            }
        }

        foreach (self::MENU as $item) {
            if (! DB::table('nav_menu_items')->where('slot', $item['slot'])->where('url', $item['url'])->exists()) {
                DB::table('nav_menu_items')->insert($item + [
                    'parent_id' => null, 'open_in_new_tab' => false, 'myskin' => false, 'active' => true, 'created_at' => $now, 'updated_at' => $now,
                ]);
            }
        }

        DB::table('store_services')->whereIn('title', ['Servicio técnico', 'Diagnóstico gratuito'])->where('accion', 'ninguna')
            ->update(['accion' => 'enlace', 'enlace' => '/servicio-tecnico', 'updated_at' => $now]);
    }

    public function down(): void
    {
        DB::table('store_services')->where('enlace', '/servicio-tecnico')->update(['accion' => 'ninguna', 'enlace' => null]);
        DB::table('nav_menu_items')->where('url', '/servicio-tecnico')->delete();
        DB::table('seo_pages')->whereIn('page_key', array_column(self::SEO, 0))->delete();

        Schema::table('system_notifications', function (Blueprint $table) {
            $table->dropIndex(['solicitud_servicio_id']);
            $table->dropColumn('solicitud_servicio_id');
        });

        Schema::dropIfExists('solicitudes_servicio');
    }
};
