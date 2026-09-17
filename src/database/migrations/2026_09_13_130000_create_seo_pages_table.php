<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * SEO administrable página por página.
 * - tipo 'pagina':    una URL fija (home, catálogo, hubs...).
 * - tipo 'plantilla': páginas dinámicas (producto, novedad, página CMS). {titulo} se reemplaza.
 * Los campos vacíos usan el valor por defecto definido en App\Support\Seo.
 */
return new class extends Migration
{
    private const PAGES = [
        // page_key = nombre de la ruta
        ['store.home',            '/',                         'Inicio',                     'pagina',    false],
        ['store.catalog',         '/catalogo',                 'Catálogo',                   'pagina',    false],
        ['hub.iphone',            '/iphone',                   'iPhone',                     'pagina',    false],
        ['hub.mac',               '/mac',                      'Mac',                        'pagina',    false],
        ['hub.myskin',            '/myskin',                   'Fundas MYSKIN',              'pagina',    false],
        ['hub.seminuevos',        '/seminuevos',               'Seminuevos',                 'pagina',    false],
        ['trade-in.index',        '/trade-in',                 'Trade-In',                   'pagina',    false],
        ['novedades.index',       '/novedades',                'Novedades',                  'pagina',    false],
        ['store.compare',         '/comparar',                 'Comparar productos',         'pagina',    true],
        ['trade-in.confirmacion', '/trade-in/confirmacion/…',  'Trade-In — confirmación',    'pagina',    true],
        ['newsletter.baja',       '/newsletter/baja/…',        'Newsletter — darse de baja', 'pagina',    true],
        ['store.product',         '/productos/{slug}',         'Producto (plantilla)',       'plantilla', false],
        ['novedades.show',        '/novedades/{slug}',         'Novedad (plantilla)',        'plantilla', false],
        ['store.page',            '/paginas/{slug}',           'Página informativa (plantilla)', 'plantilla', false],
    ];

    public function up(): void
    {
        Schema::create('seo_pages', function (Blueprint $table) {
            $table->id();
            $table->string('page_key', 80)->unique();
            $table->string('path', 191);
            $table->string('label', 120);
            $table->string('tipo', 20)->default('pagina');
            $table->string('title', 191)->nullable();
            $table->string('description', 320)->nullable();
            $table->string('og_image', 255)->nullable();   // ruta en disco public
            $table->boolean('noindex')->default(false);
            $table->string('canonical', 255)->nullable();
            $table->unsignedSmallInteger('orden')->default(0);
            $table->timestamps();
        });

        $now = now();

        // El título/descr. del home ya existían en configuración: se migran para no perderlos.
        $homeTitle = DB::table('configuracion_tienda')->where('clave', 'seo_titulo_home')->value('valor');
        $homeDesc  = DB::table('configuracion_tienda')->where('clave', 'seo_descripcion_home')->value('valor');

        foreach (self::PAGES as $i => [$key, $path, $label, $tipo, $noindex]) {
            DB::table('seo_pages')->insert([
                'page_key'    => $key,
                'path'        => $path,
                'label'       => $label,
                'tipo'        => $tipo,
                'title'       => $key === 'store.home' ? $homeTitle : null,
                'description' => $key === 'store.home' ? $homeDesc : null,
                'noindex'     => $noindex,
                'orden'       => $i + 1,
                'created_at'  => $now,
                'updated_at'  => $now,
            ]);
        }

        // Ajustes globales de SEO
        foreach ([
            ['seo_sitio_nombre',         'Apple Boss',                                                                                     'Nombre del sitio (og:site_name)'],
            ['seo_descripcion_default',  'iPhone, Mac, iPad y accesorios Apple en Cochabamba, Bolivia. Equipos revisados y atención personalizada.', 'Descripción por defecto'],
            ['seo_og_imagen_default',    '',                                                                                               'Imagen por defecto para redes sociales'],
        ] as [$clave, $valor, $etiqueta]) {
            DB::table('configuracion_tienda')->insertOrIgnore([
                'clave' => $clave, 'valor' => $valor, 'tipo' => 'texto', 'grupo' => 'seo', 'etiqueta' => $etiqueta,
                'created_at' => $now, 'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('seo_pages');
        DB::table('configuracion_tienda')->whereIn('clave', ['seo_sitio_nombre', 'seo_descripcion_default', 'seo_og_imagen_default'])->delete();
    }
};
