<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CatalogoPublicacion;
use App\Support\CondicionInventario;
use App\Support\InventarioCatalogo;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/** Asistente "Agregar productos a la tienda" desde el inventario. */
class CatalogoImportController extends Controller
{
    public function index(Request $request): Response
    {
        $pendientes = InventarioCatalogo::pendientes();
        $grupo = $request->query('grupo');

        return Inertia::render('Admin/Catalogo/Importar', [
            'grupos' => collect(InventarioCatalogo::GRUPOS)
                ->map(fn ($g, $tipo) => ['tipo' => $tipo, 'label' => $g['label'], 'items' => $pendientes[$tipo] ?? []])
                ->values(),
            'condiciones' => CatalogoPublicacion::CONDICIONES,
            // Pestaña con la que abre (Categorías → «Publicar desde el inventario»)
            'grupoInicial' => is_string($grupo) && isset(InventarioCatalogo::GRUPOS[$grupo]) ? $grupo : null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'items'     => 'required|array|min:1|max:2000',
            'items.*'   => ['string', 'regex:/^(celular|computadora|producto_apple|producto_general):\d+$/'],
            'condicion' => 'nullable|in:' . implode(',', CatalogoPublicacion::CONDICIONES),
            'publicar'  => 'boolean',
            'marca'     => 'nullable|in:' . CatalogoPublicacion::STOREFRONT_APPLE_BOSS . ',' . CatalogoPublicacion::STOREFRONT_MYSKIN,
        ], [
            'items.required' => 'Elige al menos un producto.',
        ]);

        // Cada producto usa la condición de su inventario; la elegida aquí es para los que todavía no la tienen
        $sinCondicion = collect(array_unique($data['items']))
            ->map(fn ($key) => explode(':', $key))
            ->reject(fn ($p) => CondicionInventario::de(InventarioCatalogo::modelo($p[0], (int) $p[1])))
            ->count();
        if ($sinCondicion > 0 && empty($data['condicion'])) {
            return back()->withErrors(['condicion' => 'Elige la condición de los productos que todavía no la tienen en el inventario.']);
        }

        $publicar = (bool) ($data['publicar'] ?? true);
        $marca    = $data['marca'] ?? CatalogoPublicacion::STOREFRONT_APPLE_BOSS;
        $creados  = 0;
        $omitidos = 0;

        DB::transaction(function () use ($data, $publicar, $marca, &$creados, &$omitidos) {
            $yaPublicados = CatalogoPublicacion::query()->get(['producto_tipo', 'producto_id'])
                ->mapWithKeys(fn ($p) => ["{$p->producto_tipo}:{$p->producto_id}" => true])
                ->all();
            $articulos = InventarioCatalogo::articulosPublicados();

            foreach (array_unique($data['items']) as $key) {
                [$tipo, $id] = explode(':', $key);
                $m = InventarioCatalogo::modelo($tipo, (int) $id);

                if (! $m || $m->estado !== 'disponible' || isset($yaPublicados[$key])) {
                    $omitidos++;
                    continue;
                }

                if ($tipo === 'producto_general') {
                    $clave = CatalogoPublicacion::claveArticulo($m->nombre, $m->precio_venta);
                    if (isset($articulos[$clave])) {
                        $omitidos++;
                        continue;
                    }
                    $articulos[$clave] = true;
                }

                // MYSKIN solo para fundas (regla de negocio)
                $storefront = $marca === CatalogoPublicacion::STOREFRONT_MYSKIN && $tipo === 'producto_general' && $m->tipo === 'funda'
                    ? CatalogoPublicacion::STOREFRONT_MYSKIN
                    : CatalogoPublicacion::STOREFRONT_APPLE_BOSS;

                $teniaCondicion = CondicionInventario::de($m) !== null;
                $pub = InventarioCatalogo::crear($tipo, $m, $data['condicion'] ?? null, $publicar, $storefront);

                // La condición elegida aquí también queda en el inventario de los que no la tenían
                if (! $teniaCondicion && $pub->condicion) {
                    CondicionInventario::completarInventario($tipo, $m, $pub->condicion);
                }
                $yaPublicados[$key] = true;
                $creados++;
            }
        });

        $mensaje = $publicar
            ? "Listo: {$creados} " . ($creados === 1 ? 'producto ya se ve' : 'productos ya se ven') . ' en la tienda.'
            : "Listo: {$creados} " . ($creados === 1 ? 'producto quedó guardado' : 'productos quedaron guardados') . ' como borrador.';
        if ($omitidos > 0) {
            $mensaje .= " {$omitidos} no se agregaron porque ya estaban en la tienda o se vendieron.";
        }

        return redirect()->route('admin.catalogo.index')->with('success', $mensaje);
    }
}
