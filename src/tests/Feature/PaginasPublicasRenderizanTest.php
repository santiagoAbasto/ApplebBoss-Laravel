<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Un contexto de React solo se puede leer si su proveedor ya está montado ARRIBA.
 *
 * `StoreLayout` es quien provee el carrito. Si la página llama a `useStoreCart()` en el mismo
 * componente que después dibuja `<StoreLayout>`, el contexto todavía no existe: devuelve null,
 * el destructuring revienta y la página queda **en blanco**. Le pasó al checkout y a la pantalla
 * de pago, y no se notó porque el servidor devolvía 200: el error ocurre recién en el navegador.
 *
 * Esta prueba busca esa forma exacta del error sin necesitar un navegador.
 */
class PaginasPublicasRenderizanTest extends TestCase
{
    private function paginas(): array
    {
        $base = base_path('resources/js/Pages');
        $archivos = [];

        $it = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator($base));
        foreach ($it as $archivo) {
            if ($archivo->isFile() && $archivo->getExtension() === 'jsx') {
                $archivos[] = $archivo->getPathname();
            }
        }

        sort($archivos);

        return $archivos;
    }

    /**
     * El cuerpo del componente exportado por defecto, contando llaves.
     *
     * Hay que quedarse SOLO con ese bloque: los componentes de apoyo que van más abajo en el
     * archivo sí pueden leer el contexto, porque se dibujan dentro del layout.
     */
    private function cuerpoDelComponenteExportado(string $codigo): ?string
    {
        // Fuera comentarios y textos entre comillas: sus llaves no cuentan
        $limpio = preg_replace(['#/\*.*?\*/#s', '#//[^\n]*#'], '', $codigo);
        $limpio = preg_replace(['#"(?:\\\\.|[^"\\\\])*"#s', "#'(?:\\\\.|[^'\\\\])*'#s", '#`(?:\\\\.|[^`\\\\])*`#s'], '""', $limpio);

        $inicio = strpos($limpio, 'export default function');
        if ($inicio === false) {
            return null;
        }

        // Ojo: la primera llave después de la declaración es la del destructuring de props
        // —`function X({ a, b })`—, no la del cuerpo. Primero hay que saltar los paréntesis.
        $abreParen = strpos($limpio, '(', $inicio);
        if ($abreParen === false) {
            return null;
        }

        $paren = 0;
        $cierraParen = null;
        for ($i = $abreParen, $n = strlen($limpio); $i < $n; $i++) {
            if ($limpio[$i] === '(') {
                $paren++;
            } elseif ($limpio[$i] === ')') {
                $paren--;
                if ($paren === 0) {
                    $cierraParen = $i;
                    break;
                }
            }
        }

        if ($cierraParen === null) {
            return null;
        }

        $abre = strpos($limpio, '{', $cierraParen);
        if ($abre === false) {
            return null;
        }

        $nivel = 0;
        for ($i = $abre, $n = strlen($limpio); $i < $n; $i++) {
            if ($limpio[$i] === '{') {
                $nivel++;
            } elseif ($limpio[$i] === '}') {
                $nivel--;
                if ($nivel === 0) {
                    return substr($limpio, $inicio, $i - $inicio + 1);
                }
            }
        }

        return substr($limpio, $inicio);
    }

    public function test_ninguna_pagina_lee_el_carrito_antes_de_montar_su_proveedor(): void
    {
        $culpables = [];

        foreach ($this->paginas() as $ruta) {
            $codigo = file_get_contents($ruta);

            $componente = $this->cuerpoDelComponenteExportado($codigo);
            if ($componente === null) {
                continue;
            }

            if (str_contains($componente, 'useStoreCart()') && str_contains($componente, '<StoreLayout')) {
                $culpables[] = str_replace(base_path() . '/', '', $ruta);
            }
        }

        $this->assertSame([], $culpables, implode("\n", array_merge(
            ['Estas páginas leen el carrito en el mismo componente que monta <StoreLayout>.'],
            ['La página se va a ver en blanco. Separá el cuerpo en un componente interno:'],
            ['  export default function X(props) { return <StoreLayout><XInterno {...props} /></StoreLayout>; }'],
            $culpables
        )));
    }
}
