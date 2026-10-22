<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * El título y la descripción de la home pasan a decir que Apple Boss es una «tienda de productos Apple
 * en Cochabamba», que es lo que la gente escribe en Google y le pregunta a ChatGPT («tiendas de Apple
 * en Cochabamba»). No se dice «Apple Store» ni «Tienda de Apple» a secas: es un revendedor independiente,
 * no una tienda oficial de Apple.
 *
 * Vive en `seo_pages` (editable en Sistema → SEO). Solo se cambia si todavía está el texto viejo:
 * si el dueño ya lo personalizó, no se toca.
 */
return new class extends Migration
{
    private const TITULO_NUEVO = 'Apple Boss — Tienda de productos Apple en Cochabamba';
    private const TITULO_VIEJO = 'Apple Boss — Tecnología Apple en Cochabamba';

    private const DESC_NUEVA = 'Tienda de productos Apple en Cochabamba: iPhone, Mac, iPad, Apple Watch y accesorios, nuevos y seminuevos, con servicio técnico, garantía y asesoría en cada paso.';

    // Las descripciones que llegó a tener la home antes; solo se reemplaza una de estas.
    private const DESCS_VIEJAS = [
        'iPhone, Mac, iPad y accesorios Apple disponibles en Cochabamba. Equipos revisados, precios reales, atención personalizada.',
        'iPhone, Mac, iPad y accesorios Apple en Cochabamba a buen precio, con asesoría en cada paso y una postventa que responde cuando la necesitas.',
    ];

    public function up(): void
    {
        DB::table('seo_pages')->where('page_key', 'store.home')
            ->where('title', self::TITULO_VIEJO)
            ->update(['title' => self::TITULO_NUEVO, 'updated_at' => now()]);

        DB::table('seo_pages')->where('page_key', 'store.home')
            ->whereIn('description', self::DESCS_VIEJAS)
            ->update(['description' => self::DESC_NUEVA, 'updated_at' => now()]);

        Cache::forget('seo_pages_map');
    }

    public function down(): void
    {
        DB::table('seo_pages')->where('page_key', 'store.home')
            ->where('title', self::TITULO_NUEVO)
            ->update(['title' => self::TITULO_VIEJO, 'updated_at' => now()]);

        DB::table('seo_pages')->where('page_key', 'store.home')
            ->where('description', self::DESC_NUEVA)
            ->update(['description' => self::DESCS_VIEJAS[0], 'updated_at' => now()]);

        Cache::forget('seo_pages_map');
    }
};
