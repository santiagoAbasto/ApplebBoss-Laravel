<?php

namespace Tests\Unit;

use App\Support\TextoEnriquecido;
use PHPUnit\Framework\TestCase;

class TextoEnriquecidoTest extends TestCase
{
    public function test_limpiar_deja_solo_lo_permitido_y_sin_atributos(): void
    {
        $sucio = '<div onclick="x()">Hola <strong style="color:red">mundo</strong></div>'
            . '<script>alert(1)</script><img src=x onerror=alert(1)>'
            . '<a href="javascript:alert(1)">malo</a> <a href="https://wa.me/591" target="_blank">bueno</a>';

        $limpio = TextoEnriquecido::limpiar($sucio);

        $this->assertStringContainsString('<p>Hola <strong>mundo</strong></p>', $limpio);
        $this->assertStringNotContainsString('<script', $limpio);
        $this->assertStringNotContainsString('alert(1)</', $limpio);
        $this->assertStringNotContainsString('>alert(1)', $limpio);
        $this->assertStringNotContainsString('onclick', $limpio);
        $this->assertStringNotContainsString('<img', $limpio);
        $this->assertStringNotContainsString('javascript:', $limpio);
        $this->assertStringContainsString('<a href="https://wa.me/591" target="_blank" rel="noopener noreferrer">bueno</a>', $limpio);
        $this->assertNull(TextoEnriquecido::limpiar('<p><br></p>'));
    }

    public function test_una_nota_de_texto_plano_pegada_de_corrido_sale_con_titulo_rotulos_y_lista(): void
    {
        $nota = 'CONDICIONES DE GARANTÍA Y BENEFICIOS Obsequio incluido: Se entrega 1 cable. '
            . 'Garantía inicial: El equipo cuenta con 3 meses de garantía. '
            . 'La garantía NO cubre: Daños por caídas; contacto con agua; sobrecargas eléctricas. '
            . 'Importante: La garantía cubre únicamente lo aquí establecido.';

        $html = TextoEnriquecido::aHtml($nota);

        $this->assertStringContainsString('<h3>Condiciones de garantía y beneficios</h3>', $html);
        $this->assertStringContainsString('<p><strong>Garantía inicial:</strong> El equipo cuenta con 3 meses de garantía.</p>', $html);
        $this->assertStringContainsString('<li>Contacto con agua.</li>', $html);
        $this->assertSame(3, substr_count($html, '<li>'));
    }

    /** Así la escriben en la tienda: título en mayúsculas y cada rótulo solo en su renglón. */
    public function test_una_nota_con_el_rotulo_en_un_renglon_y_el_texto_abajo_tambien_se_estructura(): void
    {
        $nota = "CONDICIONES DE GARANTÍA Y BENEFICIOS\n\nGarantía inicial:\nEl equipo cuenta con 3 meses.\n\n"
            . "La garantía NO cubre:\nDaños por caídas; contacto con agua; sobrecargas eléctricas.\n\nImportante: No cubre daños accidentales.";

        $html = TextoEnriquecido::aHtml($nota);

        $this->assertStringStartsWith('<h3>Condiciones de garantía y beneficios</h3>', $html);
        $this->assertStringContainsString('<p><strong>Garantía inicial:</strong> El equipo cuenta con 3 meses.</p>', $html);
        $this->assertSame(3, substr_count($html, '<li>'));
        $this->assertStringContainsString('<p><strong>Importante:</strong> No cubre daños accidentales.</p>', $html);
    }

    public function test_el_texto_plano_escapa_html_y_el_de_80mm_sale_sin_etiquetas(): void
    {
        $this->assertSame('<p>Precio &lt; 100 &amp; entrega</p>', TextoEnriquecido::aHtml('Precio < 100 & entrega'));
        $this->assertSame("Garantía\nTres meses", TextoEnriquecido::aTexto('<h3>Garantía</h3><p>Tres&nbsp;meses</p>'));
        $this->assertSame('', TextoEnriquecido::aHtml(null));
    }

    /** En Linux «LOGO.png» y «logo.png» son archivos distintos: así se perdió el logo en producción. */
    public function test_toda_imagen_que_piden_los_pdf_existe_con_ese_nombre_exacto(): void
    {
        $raiz = dirname(__DIR__, 2);
        foreach (glob($raiz . '/resources/views/pdf/{,*/}*.blade.php', GLOB_BRACE) as $vista) {
            preg_match_all("/public_path\('([^']+)'\)/", file_get_contents($vista), $m);
            foreach ($m[1] as $ruta) {
                $existentes = array_map('basename', glob($raiz . '/public/' . dirname($ruta) . '/*'));
                $this->assertContains(basename($ruta), $existentes, basename($vista) . ' pide ' . $ruta);
            }
        }
    }
}
