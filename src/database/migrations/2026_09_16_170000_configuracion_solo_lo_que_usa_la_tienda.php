<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Configuración deja solo los datos que la tienda lee de verdad y que no son de otro módulo.
 *
 * Se van cuatro claves:
 * - `hero_titulo` y `hero_subtitulo`: el hero del inicio se escribe en Tienda online → Portada (sección «hero»).
 *   Las de acá no las leía nadie: el panel las pedía y la tienda mostraba las de Portada.
 * - `seo_titulo_home` y `seo_descripcion_home`: el título y la descripción del inicio ya viven en `seo_pages`
 *   (Marketing y Google → «Google y redes sociales»), a donde los pasó la migración de `seo_pages`. Acá quedaban
 *   repetidos, y lo que se escribía no llegaba ni al título ni a la metaetiqueta que lee Google.
 *
 * Antes de borrarlas, lo que el administrador haya escrito a mano en las dos claves de SEO (`updated_at` mayor que
 * `created_at`) se copia a la fila `store.home` de `seo_pages` si ahí todavía está vacío: no se pierde nada.
 *
 * `anuncio_barra` se queda y por fin se cablea: la tienda dibujaba la barra de arriba con el texto escrito dentro del
 * código («Equipos revisados · Stock real · Atención en Bolivia»), así que lo que se escribía en el panel no llegaba a
 * ningún lado. Ahora manda el panel y, sin texto, la barra no se dibuja. Por eso pasa del grupo `home` al grupo
 * `tienda`: es de la tienda entera, no solo del inicio.
 *
 * `seo_sitio_nombre`, `seo_descripcion_default` y `seo_og_imagen_default` se quedan en la tabla porque las usa
 * `App\Support\Seo`, pero su único lugar de edición pasa a ser «Google y redes sociales», que ya las tenía.
 */
return new class extends Migration
{
    /** clave => [valor original, tipo, grupo, etiqueta] — para poder volver atrás. */
    private const BORRADAS = [
        'hero_titulo'          => ['El iPhone que buscás, disponible hoy.', 'texto', 'home', 'Título del hero'],
        'hero_subtitulo'       => ['Equipos Apple revisados, listos para usar. Consultá directamente con nuestro equipo en Cochabamba.', 'texto', 'home', 'Subtítulo del hero'],
        'seo_titulo_home'      => ['Apple Boss — Tecnología Apple en Cochabamba', 'texto', 'seo', 'Título SEO del home'],
        'seo_descripcion_home' => ['iPhone, Mac, iPad y accesorios Apple disponibles en Cochabamba. Equipos revisados, precios reales, atención personalizada.', 'texto', 'seo', 'Meta description del home'],
    ];

    /** Clave de configuración => columna de la fila `store.home` de `seo_pages`. */
    private const A_SEO_PAGES = [
        'seo_titulo_home'      => 'title',
        'seo_descripcion_home' => 'description',
    ];

    public function up(): void
    {
        if (! Schema::hasTable('configuracion_tienda')) {
            return;
        }

        $this->rescatarLoEscritoASeoPages();

        DB::table('configuracion_tienda')->where('clave', 'anuncio_barra')->update([
            'grupo'      => 'tienda',
            'etiqueta'   => 'Barra de anuncio',
            'updated_at' => DB::raw('updated_at'),
        ]);

        DB::table('configuracion_tienda')->whereIn('clave', array_keys(self::BORRADAS))->delete();
    }

    public function down(): void
    {
        if (! Schema::hasTable('configuracion_tienda')) {
            return;
        }

        DB::table('configuracion_tienda')->where('clave', 'anuncio_barra')->update([
            'grupo'      => 'home',
            'etiqueta'   => 'Texto barra de anuncio',
            'updated_at' => DB::raw('updated_at'),
        ]);

        $ahora = now();
        foreach (self::BORRADAS as $clave => [$valor, $tipo, $grupo, $etiqueta]) {
            DB::table('configuracion_tienda')->insertOrIgnore([
                'clave'      => $clave,
                'valor'      => $valor,
                'tipo'       => $tipo,
                'grupo'      => $grupo,
                'etiqueta'   => $etiqueta,
                'created_at' => $ahora,
                'updated_at' => $ahora,
            ]);
        }
    }

    /** Lo escrito a mano en Configuración pasa a «Google y redes sociales» si ahí todavía no hay nada. */
    private function rescatarLoEscritoASeoPages(): void
    {
        if (! Schema::hasTable('seo_pages')) {
            return;
        }

        $home = DB::table('seo_pages')->where('page_key', 'store.home')->first();
        if (! $home) {
            return;
        }

        $filas = DB::table('configuracion_tienda')->whereIn('clave', array_keys(self::A_SEO_PAGES))->get()->keyBy('clave');

        $rescatado = [];
        foreach (self::A_SEO_PAGES as $clave => $columna) {
            $fila = $filas->get($clave);
            $editada = $fila && filled($fila->valor) && $fila->created_at && $fila->updated_at && $fila->updated_at > $fila->created_at;
            if ($editada && blank($home->{$columna})) {
                $rescatado[$columna] = trim((string) $fila->valor);
            }
        }

        if ($rescatado !== []) {
            DB::table('seo_pages')->where('id', $home->id)->update($rescatado + ['updated_at' => now()]);
        }
    }
};
