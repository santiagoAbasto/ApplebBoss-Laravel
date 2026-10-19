<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Un componente que se dibuja en JSX sin estar importado ni definido compila igual (Vite no lo ve) y revienta recién
 * al abrir la página en producción: «Compartir is not defined» (19-10-2026). Esta prueba lo atrapa antes.
 * Regla: si un archivo usa <Nombre ...>, «Nombre» tiene que aparecer en el archivo fuera de sus etiquetas
 * (un import, una función, una constante o una prop desestructurada como `icon: Icon`).
 */
class ComponentesImportadosTest extends TestCase
{
    public function test_ningun_componente_se_usa_sin_importarlo_o_definirlo(): void
    {
        $faltan = [];
        $archivos = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator(resource_path('js')));

        foreach ($archivos as $archivo) {
            if (! in_array($archivo->getExtension(), ['jsx', 'tsx'], true)) {
                continue;
            }

            $codigo = file_get_contents($archivo->getPathname());
            preg_match_all('/<([A-Z][A-Za-z0-9_]*)[\s\/>]/', $codigo, $m);

            foreach (array_unique($m[1]) as $nombre) {
                $sinEtiquetas = preg_replace('/<\/?' . $nombre . '\b/', '', $codigo);
                if (! preg_match('/\b' . $nombre . '\b/', $sinEtiquetas)) {
                    $faltan[] = str_replace(resource_path('js') . '/', '', $archivo->getPathname()) . ' → <' . $nombre . '>';
                }
            }
        }

        $this->assertSame([], $faltan, "Componentes usados sin importar ni definir:\n" . implode("\n", $faltan));
    }
}
