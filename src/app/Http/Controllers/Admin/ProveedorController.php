<?php

namespace App\Http\Controllers\Admin;

use App\Console\Commands\ImportarProveedor;
use App\Http\Controllers\Controller;
use App\Support\Proveedor\Cotejo;
use App\Support\Proveedor\LectorLista;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

/**
 * Panel → Listas de proveedor. El dueño sube el Excel (Apple Land) o el PDF (Planet), ve una vista previa de lo que el
 * sistema entendió (producto, costo, margen y precio final en Bs) y recién al confirmar se publica. El margen y el Bs
 * al paralelo se calculan solos; la lista subida se guarda en storage (persiste) y reemplaza a la de base del proveedor.
 */
class ProveedorController extends Controller
{
    private const TEMP = 'proveedores-temp';

    public function index()
    {
        return Inertia::render('Admin/Proveedores/Index', [
            'proveedores' => self::proveedores(),
        ]);
    }

    /** Lee el archivo subido y devuelve la vista previa, sin publicar nada. Guarda el archivo en un temporal. */
    public function previsualizar(Request $request)
    {
        $datos = $request->validate([
            'proveedor' => 'required|string|max:60',
            'archivo'   => 'required|file|mimes:xlsx,xls,pdf|max:10240',
        ], [
            'archivo.mimes' => 'Sube el Excel (.xlsx) o el PDF de la lista.',
            'archivo.max'   => 'El archivo no puede pesar más de 10 MB.',
        ]);

        $token = $request->file('archivo')->store(self::TEMP);
        $leido = LectorLista::leer(Storage::path($token));
        $cotejo = Cotejo::preparar($leido['items'], self::listaActual($datos['proveedor']));

        return Inertia::render('Admin/Proveedores/Index', [
            'proveedores' => self::proveedores(),
            'vista'       => [
                'proveedor' => $datos['proveedor'],
                'token'     => $token,
                'filas'     => $cotejo['filas'],
                'resumen'   => $cotejo['resumen'],
                'errores'   => $leido['errores'],
                'archivo'   => $request->file('archivo')->getClientOriginalName(),
            ],
        ]);
    }

    /** Confirma: vuelve a leer el temporal (no confía en el front), guarda la lista y republica el catálogo. */
    public function aplicar(Request $request)
    {
        $datos = $request->validate([
            'proveedor' => 'required|string|max:60',
            'token'     => 'required|string',
        ]);

        // El token tiene que ser un temporal nuestro que exista (no una ruta arbitraria).
        if (! str_starts_with($datos['token'], self::TEMP . '/') || ! Storage::exists($datos['token'])) {
            return back()->with('error', 'El archivo de la vista previa venció. Súbelo de nuevo.');
        }

        $leido = LectorLista::leer(Storage::path($datos['token']));
        $cotejo = Cotejo::preparar($leido['items'], self::listaActual($datos['proveedor']));
        if (! $cotejo['items']) {
            return back()->with('error', 'No se reconoció ningún producto en el archivo.');
        }

        $slug = Str::slug($datos['proveedor']) ?: 'proveedor';
        Storage::put("proveedores/{$slug}.json", json_encode(
            ['proveedor' => $datos['proveedor'], 'items' => $cotejo['items']],
            JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
        ));
        Storage::delete($datos['token']);

        $codigo = Artisan::call('catalogo:importar-proveedor');
        if ($codigo !== 0) {
            return back()->with('error', 'La lista se guardó, pero falló al publicar. Revisa e intenta de nuevo.');
        }

        $n = $cotejo['resumen']['total'];

        return redirect()->route('admin.proveedores.index')
            ->with('success', "Lista de {$datos['proveedor']} actualizada: {$n} productos publicados con su margen. Tus fotos se conservaron.");
    }

    // ─── Apoyo ───────────────────────────────────────────────────────────────────

    /** Los proveedores con lista vigente: nombre, cuántos productos y si es de base o subida. */
    private static function proveedores(): array
    {
        $out = [];
        foreach (ImportarProveedor::listasVigentes() as $ruta) {
            $data = json_decode((string) file_get_contents($ruta), true) ?: [];
            $out[] = [
                'nombre'    => $data['proveedor'] ?? pathinfo($ruta, PATHINFO_FILENAME),
                'items'     => count($data['items'] ?? []),
                'subida'    => str_contains($ruta, '/storage/'),
                'archivo'   => basename($ruta),
            ];
        }

        return $out;
    }

    /** Los items del .json vigente de un proveedor (para conservar nombres y colores al cotejar). */
    private static function listaActual(string $proveedor): array
    {
        $slug = Str::slug($proveedor);
        foreach (ImportarProveedor::listasVigentes() as $ruta) {
            $data = json_decode((string) file_get_contents($ruta), true) ?: [];
            if (Str::slug($data['proveedor'] ?? pathinfo($ruta, PATHINFO_FILENAME)) === $slug) {
                return $data['items'] ?? [];
            }
        }

        return [];
    }
}
