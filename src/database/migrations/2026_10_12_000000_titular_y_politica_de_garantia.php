<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Completa los textos legales: titular y NIT en privacidad y términos, y la política de cambios y devoluciones en los
 * términos (reemplaza los «[DATO POR CONFIRMAR…]» de la migración anterior). La página Garantía deja de ser el texto
 * corto del seeder y pasa a ser la política completa: la misma que imprime la nota de venta (config/documentos.php),
 * con los plazos de ahí. Sin marcadores, privacidad y términos dejan de ser borradores y entran al sitemap
 * (Page::esBorrador). Un texto ya trabajado en el panel no se toca.
 */
return new class extends Migration
{
    private const TITULAR = 'Santiago Abasto (Apple Boss)';
    private const NIT = '12555473014';

    public function up(): void
    {
        $cambios = [
            'Apple Boss — [DATO POR CONFIRMAR: nombre completo o razón social del titular]' => self::TITULAR,
            '[DATO POR CONFIRMAR: NIT]' => self::NIT,
            '<li>[DATO POR CONFIRMAR: política de cambios y devoluciones — en qué casos, en qué plazo y en qué estado se recibe un producto, y cómo se devuelve el dinero]</li>' => $this->resumenDeCambios(),
        ];

        foreach (DB::table('pages')->whereIn('slug', ['privacidad', 'terminos'])->get() as $pagina) {
            $nuevo = strtr((string) $pagina->content, $cambios);
            if ($nuevo !== $pagina->content) {
                DB::table('pages')->where('id', $pagina->id)->update(['content' => $nuevo, 'updated_at' => now()]);
            }
        }

        $garantia = DB::table('pages')->where('slug', 'garantia')->first();
        $datos = [
            'title'            => 'Garantía',
            'content'          => $this->garantia(config('documentos.garantia.meses')),
            'meta_description' => 'Garantía de Apple Boss: plazos para equipos nuevos, seminuevos y cargadores, qué cubre, qué no (golpes, líquidos, terceros), cómo reclamar y cuándo hay cambio o devolución.',
            'updated_at'       => now(),
        ];

        if (! $garantia) {
            DB::table('pages')->insert($datos + ['slug' => 'garantia', 'active' => true, 'sort_order' => 2, 'created_at' => now()]);
        } elseif (mb_strlen(strip_tags((string) $garantia->content)) < 1500) {
            DB::table('pages')->where('id', $garantia->id)->update($datos);
        }
    }

    public function down(): void
    {
        // Los textos quedan: volver a los marcadores dejaría a la tienda sin políticas publicadas.
    }

    private function resumenDeCambios(): string
    {
        return <<<HTML
<li>Los cambios y las devoluciones aplican solo por defecto de fábrica confirmado por nuestro servicio técnico dentro del plazo de garantía: primero reparamos; si no se puede, cambiamos el equipo por otro igual o equivalente; y si tampoco es posible, devolvemos el dinero pagado.</li>
<li>No hacemos cambios ni devoluciones por cambio de opinión, de color o de modelo. Antes de comprar puedes revisar y probar el equipo en la tienda o al recibirlo.</li>
<li>La garantía no cubre golpes, líquidos, descargas eléctricas, cargadores no certificados ni equipos abiertos o reparados por terceros. El detalle, los plazos y cómo reclamar están en <a href="/paginas/garantia">Garantía, cambios y devoluciones</a>.</li>
HTML;
    }

    /** @param array<string, int> $meses */
    private function garantia(array $meses): string
    {
        return <<<HTML
<p>Todo lo que vendemos pasa por una revisión antes de entregarse y sale con garantía de Apple Boss. Esta página explica cuánto dura, qué cubre, qué no, cómo reclamar y en qué casos hay cambio o devolución. Es la misma garantía que figura en tu nota de venta.</p>
<h2>Plazos</h2>
<ul>
<li><strong>Equipos nuevos:</strong> {$meses['equipo_nuevo']} meses.</li>
<li><strong>Equipos seminuevos:</strong> {$meses['equipo_seminuevo']} meses.</li>
<li><strong>Cargadores originales Apple:</strong> {$meses['cargador_original']} meses.</li>
<li><strong>Cargadores certificados:</strong> {$meses['cargador_certificado']} meses.</li>
</ul>
<p>El plazo corre desde la fecha de entrega que figura en tu nota de venta. Los demás accesorios (fundas, vidrios, cables) se revisan contigo al entregarlos; si alguno sale con falla de fábrica, avísanos dentro de los 7 días.</p>
<h2>Qué cubre</h2>
<p>Las fallas de fábrica que impiden el funcionamiento normal del equipo, es decir, las que no fueron causadas por el uso:</p>
<ul>
<li>problemas internos de hardware;</li>
<li>fallas de encendido que no vienen de un mal uso;</li>
<li>defectos de fabricación confirmados en la revisión técnica.</li>
</ul>
<p>En un seminuevo, la salud de la batería publicada es la del día de la venta. El desgaste normal de la batería con el uso no es una falla de fábrica.</p>
<h2>Qué no cubre</h2>
<p>La garantía queda sin efecto si el daño viene de alguno de estos casos:</p>
<ol>
<li>golpes, caídas o presión indebida;</li>
<li>contacto con líquidos, humedad, arena o polvo;</li>
<li>descargas eléctricas, picos de voltaje, cortocircuitos o cargadores no certificados;</li>
<li>equipos abiertos, manipulados o reparados por terceros antes de traerlos a Apple Boss;</li>
<li>alteración o ausencia del IMEI o del número de serie;</li>
<li>pantallas rotas, flex dañados o baterías infladas por mal uso;</li>
<li>problemas de software causados por el usuario (instalaciones, bloqueos de cuenta, jailbreak).</li>
</ol>
<p><strong>Sobre el agua:</strong> aunque un iPhone sea resistente a salpicaduras, esa resistencia baja con el tiempo y los golpes, y el daño por líquidos no está cubierto ni por Apple Boss ni por la <a href="https://support.apple.com/es-lamr/109350">garantía limitada de Apple</a>. Los iPhone tienen un indicador interno de contacto con líquido que se pone rojo; lo revisamos en el diagnóstico.</p>
<h2>Cómo hacer valer la garantía</h2>
<ol>
<li>Escríbenos por WhatsApp al <a href="https://wa.me/59175904313">+591 75904313</a> con el código de tu nota de venta y lo que pasa.</li>
<li>Trae el equipo a la tienda (Av. Melchor Urquidi, entre C. Fidel Anze y Av. Julio Rodríguez, Cochabamba) con tu nota de venta o su código, y con el IMEI o número de serie legible. Si estás en otra ciudad, coordinamos el envío contigo.</li>
<li>Registramos el equipo y nuestro servicio técnico hace el diagnóstico, que puede demorar hasta 72 horas hábiles. Recibir el equipo para evaluarlo no significa que la garantía ya esté aceptada.</li>
<li>Si la falla es de fábrica y está dentro del plazo, la reparamos sin costo. Si no se puede reparar, cambiamos el equipo por otro igual o equivalente. Si tampoco es posible, te devolvemos el dinero.</li>
<li>Si la falla está entre las exclusiones, te informamos el diagnóstico y, si quieres, te cotizamos la reparación como servicio técnico.</li>
</ol>
<p>La garantía se aplica una vez por cada falla y sigue vigente por el tiempo que le quede después de la reparación.</p>
<h2>Cambios y devoluciones</h2>
<ul>
<li>Cambiamos o devolvemos un producto <strong>solo por defecto de fábrica</strong> confirmado por nuestro servicio técnico dentro del plazo de garantía, en el orden de arriba: reparación, cambio y, en último caso, devolución del dinero.</li>
<li>No hacemos cambios ni devoluciones por cambio de opinión, de color o de modelo. Por eso te invitamos a revisar y probar el equipo antes de pagar, en la tienda o al recibir el delivery.</li>
<li>Para un cambio, el equipo debe entregarse completo, con sus accesorios y sin bloqueo de cuenta (Buscar mi iPhone desactivado).</li>
<li>Si un envío llega golpeado o con el precinto abierto, no lo recibas y avísanos en el momento.</li>
<li>Cuando corresponde devolver el dinero, lo hacemos por el mismo medio con el que pagaste, dentro de los 5 días hábiles de confirmado el diagnóstico.</li>
</ul>
<h2>Tus derechos</h2>
<p>Nada de esta página limita los derechos que te reconoce la Ley N.º 453, General de los Derechos de las Usuarias y los Usuarios y de las Consumidoras y los Consumidores, ni su reglamento (Decreto Supremo N.º 2130): entre ellos, que una falla de fábrica se repare o se cambie el producto y, si no se cumple en el plazo del reglamento, que se devuelva lo pagado. Si no estás de acuerdo con un diagnóstico, escríbenos a <a href="mailto:ventas@appleboss.com.bo">ventas@appleboss.com.bo</a>; también puedes reclamar ante la autoridad de defensa del consumidor.</p>
HTML;
    }
};
