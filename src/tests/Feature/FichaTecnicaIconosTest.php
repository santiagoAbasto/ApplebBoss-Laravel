<?php

namespace Tests\Feature;

use App\Models\ModeloReferencia;
use App\Support\FichaTecnica\TextosCelular;
use Database\Seeders\ModelosReferenciaSeeder;
use Tests\TestCase;

/** La ficha pública del celular y la de la computadora muestran cada dato de la base, cada uno con su propio ícono. */
class FichaTecnicaIconosTest extends TestCase
{
    /** @return array<string, string> clave del campo => ícono, del bloque `tipo: [` hasta el siguiente */
    private function campos(string $tipo = 'celular', string $siguiente = 'computadora'): array
    {
        $jsx = file_get_contents(resource_path('js/Components/Store/fichaTecnica.jsx'));
        $inicio = strpos($jsx, "{$tipo}: [");
        $bloque = substr($jsx, $inicio, strpos($jsx, "{$siguiente}: [") - $inicio);
        preg_match_all("/c\\('([a-z_]+)', '[^']*', '[^']*', (\\w+)/u", $bloque, $m, PREG_SET_ORDER);

        return collect($m)->mapWithKeys(fn ($x) => [$x[1] => $x[2]])->all();
    }

    private function camposCelular(): array
    {
        return $this->campos('celular', 'computadora');
    }

    public function test_cada_dato_de_la_base_tiene_su_campo_en_la_ficha(): void
    {
        $campos = $this->camposCelular();
        $claves = collect(ModelosReferenciaSeeder::modelos())
            ->where('tipo', 'celular')
            ->flatMap(fn ($modelo) => array_keys(TextosCelular::desde($modelo['datos'])))
            ->unique()
            ->reject(fn ($clave) => in_array($clave, ModeloReferencia::CAMPOS_SOLO_COMPARATIVA, true));

        foreach ($claves as $clave) {
            $this->assertArrayHasKey($clave, $campos, "La ficha no muestra «{$clave}».");
        }
    }

    public function test_cada_caracteristica_del_celular_tiene_su_propio_icono(): void
    {
        $campos = $this->camposCelular();
        $repetidos = array_keys(array_filter(array_count_values($campos), fn ($n) => $n > 1));
        $this->assertSame([], $repetidos, 'Íconos repetidos: ' . implode(', ', $repetidos));

        $iconos = file_get_contents(resource_path('js/Components/Store/Icons.jsx'));
        foreach (array_unique($campos) as $icono) {
            $this->assertMatchesRegularExpression("/export const {$icono}\\b/", $iconos, "Falta el ícono {$icono}.");
        }
    }

    /** Mac y PC comparten los grupos de la computadora: cada dato de las dos tiene su campo y ningún ícono se repite. */
    public function test_cada_dato_de_la_computadora_tiene_su_campo_y_su_propio_icono(): void
    {
        $campos = $this->campos('computadora', 'producto_apple');
        $claves = collect(ModelosReferenciaSeeder::modelos())
            ->where('tipo', 'computadora')
            ->flatMap(fn ($modelo) => array_keys(ModelosReferenciaSeeder::textos($modelo)))
            ->unique()
            ->reject(fn ($clave) => in_array($clave, ModeloReferencia::CAMPOS_SOLO_COMPARATIVA, true));
        foreach ($claves as $clave) {
            $this->assertArrayHasKey($clave, $campos, "La ficha de la computadora no muestra «{$clave}».");
        }

        $repetidos = array_keys(array_filter(array_count_values($campos), fn ($n) => $n > 1));
        $this->assertSame([], $repetidos, 'Íconos repetidos en la computadora: ' . implode(', ', $repetidos));
        $iconos = file_get_contents(resource_path('js/Components/Store/Icons.jsx'));
        foreach (array_unique($campos) as $icono) {
            $this->assertMatchesRegularExpression("/export const {$icono}\\b/", $iconos, "Falta el ícono {$icono}.");
        }
    }

    /** Accesorios: cada dato de la base de accesorios tiene su campo en la ficha, cada uno con su propio ícono. */
    public function test_cada_dato_de_los_accesorios_tiene_su_campo_y_su_propio_icono(): void
    {
        $jsx = file_get_contents(resource_path('js/Components/Store/fichaTecnica.jsx'));
        $inicio = strpos($jsx, 'producto_general: [');
        $bloque = substr($jsx, $inicio, strpos($jsx, "\n};", $inicio) - $inicio);
        preg_match_all("/c\\('([a-z_]+)', '[^']*', '[^']*', (\\w+)/u", $bloque, $m, PREG_SET_ORDER);
        $campos = collect($m)->mapWithKeys(fn ($x) => [$x[1] => $x[2]])->all();

        $claves = collect(ModelosReferenciaSeeder::modelos())
            ->where('tipo', 'producto_general')
            ->flatMap(fn ($modelo) => array_keys(ModelosReferenciaSeeder::textos($modelo)))
            ->merge(\App\Support\FichaTecnica\EsquemaAccesorio::FICHA)
            ->unique();
        foreach ($claves as $clave) {
            $this->assertArrayHasKey($clave, $campos, "La ficha del accesorio no muestra «{$clave}».");
        }

        $repetidos = array_keys(array_filter(array_count_values($campos), fn ($n) => $n > 1));
        $this->assertSame([], $repetidos, 'Íconos repetidos en los accesorios: ' . implode(', ', $repetidos));
        $iconos = file_get_contents(resource_path('js/Components/Store/Icons.jsx'));
        foreach (array_unique($campos) as $icono) {
            $this->assertMatchesRegularExpression("/export const {$icono}\\b/", $iconos, "Falta el ícono {$icono}.");
        }
    }
}
