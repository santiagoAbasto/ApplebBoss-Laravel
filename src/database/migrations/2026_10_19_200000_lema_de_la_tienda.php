<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * El lema genérico («Equipos revisados · Stock real…», «Precios reales · Atención personalizada») deja paso al que eligió
 * el dueño: «Garantía real · Compra segura y protegida · Cochabamba, Bolivia» (barra de anuncio). Las descripciones cuentan
 * lo que distingue a la tienda: buen precio, asesoría en cada paso y una postventa que responde. Solo se cambia un texto
 * que sigue exactamente como lo dejó la instalación o una migración: lo que el dueño editó en el panel queda como está.
 */
return new class extends Migration
{
    private const CAMBIOS = [
        ['configuracion_tienda', 'valor', ['clave' => 'anuncio_barra'],
            'Equipos revisados · Stock real · Atención en Bolivia',
            'Garantía real · Compra segura y protegida · Cochabamba, Bolivia'],
        ['configuracion_tienda', 'valor', ['clave' => 'seo_descripcion_default'],
            'iPhone, Mac, iPad y accesorios Apple en Cochabamba, Bolivia. Equipos revisados y atención personalizada.',
            'iPhone, Mac, iPad y accesorios Apple en Cochabamba, Bolivia. Buen precio, asesoría en cada paso y una postventa que responde.'],
        ['seo_pages', 'description', [],
            'iPhone, Mac, iPad y accesorios Apple disponibles en Cochabamba. Equipos revisados, precios reales, atención personalizada.',
            'iPhone, Mac, iPad y accesorios Apple en Cochabamba a buen precio, con asesoría en cada paso y una postventa que responde cuando la necesitas.'],
        ['pages', 'meta_description', ['slug' => 'nosotros'],
            'Apple Boss: tienda de iPhone, Mac y accesorios nuevos y seminuevos en Cochabamba, con equipos revisados, stock real, garantía propia y servicio técnico.',
            'Apple Boss: iPhone, Mac y accesorios nuevos y seminuevos en Cochabamba a buen precio, con asesoría en cada paso, garantía propia y una postventa que responde.'],
        ['catalog_categories', 'description', ['slug' => 'celulares'],
            'Equipos revisados y disponibles.',
            'iPhone nuevos y seminuevos, y un asesor para ayudarte a elegir el tuyo.'],
        ['catalog_categories', 'meta_description', ['slug' => 'celulares'],
            'iPhone nuevos y seminuevos disponibles en Cochabamba. Equipos revisados, condición real.',
            'iPhone nuevos y seminuevos en Cochabamba a buen precio, con asesoría para elegir y una postventa que responde.'],
        ['store_services', 'description', ['title' => 'Equipos revisados'],
            'Todo equipo seminuevo pasa por revisión técnica antes de publicarse. Sin sorpresas.',
            'Después de la compra seguimos contigo: te ayudamos a configurar tu equipo, respondemos tus dudas y atendemos la garantía en la tienda.'],
        ['store_services', 'title', ['title' => 'Equipos revisados'],
            'Equipos revisados',
            'Postventa que responde'],
    ];

    public function up(): void
    {
        $this->aplicar(false);
    }

    public function down(): void
    {
        $this->aplicar(true);
    }

    private function aplicar(bool $alReves): void
    {
        foreach (self::CAMBIOS as [$tabla, $columna, $donde, $viejo, $nuevo]) {
            [$de, $a] = $alReves ? [$nuevo, $viejo] : [$viejo, $nuevo];
            if ($alReves && $donde === ['title' => 'Equipos revisados']) {
                $donde = ['title' => 'Postventa que responde'];
            }
            DB::table($tabla)->where($donde)->where($columna, $de)->update([$columna => $a]);
        }

        // Nosotros: la lista «Cómo trabajamos» empieza por lo que distingue a la tienda; revisados y stock siguen como hechos
        [$de, $a] = $alReves ? [$this->listaNueva(), $this->listaVieja()] : [$this->listaVieja(), $this->listaNueva()];
        foreach (DB::table('pages')->where('slug', 'nosotros')->get(['id', 'content']) as $pagina) {
            if (str_contains((string) $pagina->content, $de)) {
                DB::table('pages')->where('id', $pagina->id)->update(['content' => str_replace($de, $a, $pagina->content), 'updated_at' => now()]);
            }
        }
    }

    private function listaVieja(): string
    {
        $meses = config('documentos.garantia.meses');

        return <<<HTML
<li><strong>Equipos revisados.</strong> Cada equipo pasa por nuestro servicio técnico antes de publicarse. En un seminuevo ves su estado y la salud de la batería antes de comprar.</li>
<li><strong>Stock real.</strong> Lo que ves publicado está en la tienda hoy; lo que se vende deja de publicarse al instante. No vendemos lo que no tenemos.</li>
<li><strong>Precios claros.</strong> En bolivianos, sin letra chica. Si pagas en USDT, el equivalente se calcula con el dólar paralelo del momento.</li>
<li><strong>Garantía propia.</strong> {$meses['equipo_nuevo']} meses en equipos nuevos y {$meses['equipo_seminuevo']} en seminuevos, atendida en Cochabamba por nuestro servicio técnico. Léela completa en <a href="/paginas/garantia">Garantía</a>.</li>
<li><strong>Atención directa.</strong> Nos escribes por WhatsApp y te responde la misma gente que te atiende en la tienda.</li>
HTML;
    }

    private function listaNueva(): string
    {
        $meses = config('documentos.garantia.meses');

        return <<<HTML
<li><strong>Buen precio.</strong> En bolivianos y sin letra chica: el precio que ves es el que pagas. Si pagas en USDT, el equivalente se calcula con el dólar paralelo del momento.</li>
<li><strong>Asesoría en cada paso.</strong> Antes de comprar te ayudamos a elegir el equipo que de verdad te conviene, sin presión. Nos escribes por WhatsApp y te responde la misma gente que te atiende en la tienda.</li>
<li><strong>Postventa que responde.</strong> Después de la compra seguimos contigo: te ayudamos a configurar tu equipo, respondemos tus dudas y atendemos la garantía propia ({$meses['equipo_nuevo']} meses en equipos nuevos y {$meses['equipo_seminuevo']} en seminuevos) en Cochabamba, con nuestro servicio técnico. Léela completa en <a href="/paginas/garantia">Garantía</a>.</li>
<li><strong>Equipos revisados.</strong> Cada equipo pasa por nuestro servicio técnico antes de publicarse. En un seminuevo ves su estado y la salud de la batería antes de comprar.</li>
<li><strong>Lo publicado está en la tienda.</strong> Lo que se vende deja de publicarse al instante: no vendemos lo que no tenemos.</li>
HTML;
    }
};
