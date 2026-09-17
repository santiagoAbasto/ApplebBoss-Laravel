<?php

namespace Database\Seeders;

use App\Models\ModeloReferencia;
use App\Support\FichaTecnica\EsquemaAccesorio;
use App\Support\FichaTecnica\EsquemaCelular;
use App\Support\FichaTecnica\EsquemaComputadora;
use App\Support\FichaTecnica\EsquemaPc;
use App\Support\FichaTecnica\EsquemaProductoApple;
use App\Support\FichaTecnica\TextosAccesorio;
use App\Support\FichaTecnica\TextosCelular;
use App\Support\FichaTecnica\TextosComputadora;
use App\Support\FichaTecnica\TextosPc;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use RuntimeException;

/**
 * Carga o actualiza las fichas de database/data/modelos_referencia/*.php (por slug).
 * Antes de guardar revisa que cada ficha esté completa: si a un modelo le falta un dato, no se carga nada.
 * Se puede correr las veces que haga falta: no duplica ni borra modelos.
 */
class ModelosReferenciaSeeder extends Seeder
{
    /** Todas las fichas de los archivos de datos, en orden. */
    public static function modelos(): array
    {
        $modelos = [];
        foreach (glob(database_path('data/modelos_referencia/*.php')) as $archivo) {
            foreach (require $archivo as $modelo) {
                $modelos[] = $modelo;
            }
        }

        return $modelos;
    }

    /**
     * Revisa una ficha con el esquema de su tipo y familia: iPhone, Mac, PC (laptop con Windows), producto Apple (iPad,
     * Apple Watch, AirPods…) o accesorio.
     *
     * @return array{0: list<string>, 1: list<string>} [errores, pendientes]
     */
    public static function revisar(array $modelo): array
    {
        return match ($modelo['tipo'] ?? null) {
            'celular'          => EsquemaCelular::revisar($modelo),
            'computadora'      => match ($modelo['familia'] ?? null) {
                'mac'   => EsquemaComputadora::revisar($modelo),
                'pc'    => EsquemaPc::revisar($modelo),
                default => [['Familia de computadora desconocida.'], []],
            },
            'producto_apple'   => EsquemaProductoApple::revisar($modelo),
            'producto_general' => EsquemaAccesorio::revisar($modelo),
            default            => [['Tipo de modelo desconocido.'], []],
        };
    }

    /** Los textos de la ficha y la comparativa, según el tipo y la familia del modelo (ya revisado). */
    public static function textos(array $modelo): array
    {
        return match (true) {
            $modelo['tipo'] === 'celular'          => TextosCelular::desde($modelo['datos']),
            // La ficha de un accesorio o de un producto Apple ya se escribe como se lee en la tienda. Un producto Apple suma
            // sus colores oficiales, que solo usa la comparativa (CAMPOS_SOLO_COMPARATIVA)
            $modelo['tipo'] === 'producto_general' => TextosAccesorio::desde($modelo['datos']),
            $modelo['tipo'] === 'producto_apple'   => TextosAccesorio::desde($modelo['datos'])
                + array_filter(['colores_disponibles' => $modelo['datos']['sistema']['colores'] ?? false]),
            $modelo['familia'] === 'pc'            => TextosPc::desde($modelo['datos']),
            default                                => TextosComputadora::desde($modelo['datos']),
        };
    }

    public function run(): void
    {
        $modelos = self::modelos();

        $problemas = [];
        foreach ($modelos as $modelo) {
            [$errores] = self::revisar($modelo);
            if ($errores) {
                $problemas[] = "{$modelo['nombre']}: " . implode(' ', $errores);
            }
        }
        if ($problemas) {
            throw new RuntimeException("Hay fichas incompletas; no se cargó ninguna.\n" . implode("\n", $problemas));
        }

        foreach ($modelos as $orden => $modelo) {
            $modelo['specs'] = self::textos($modelo);
            $modelo['anio'] = $modelo['datos']['sistema']['anio'] ?? null;          // un accesorio genérico no tiene año
            // Horas de video para estimar la autonomía con la salud de la batería: una iMac o un accesorio no tienen
            $modelo['autonomia_video_horas'] = ($modelo['datos']['bateria']['video_h'] ?? $modelo['datos']['sistema']['video_h'] ?? null) ?: null;

            ModeloReferencia::updateOrCreate(
                ['slug' => $modelo['slug']],
                Arr::only($modelo, ['tipo', 'familia', 'nombre', 'alias', 'specs', 'datos', 'anio', 'autonomia_video_horas'])
                    + ['orden' => $orden, 'activo' => true],
            );
        }
    }
}
