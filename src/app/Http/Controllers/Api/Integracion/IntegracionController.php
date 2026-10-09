<?php

namespace App\Http\Controllers\Api\Integracion;

use App\Http\Controllers\Controller;
use App\Models\Integracion;
use App\Support\Integracion\ErrorApi;
use App\Support\Integracion\InventarioIntegracion;
use App\Support\InventarioCatalogo;
use App\Support\Pagos\TipoDeCambio;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * API REST de integración v1 — solo lectura, para sistemas autorizados de Apple Boss (la futura plataforma de IA).
 * Contrato en docs/integrations/APPLE_BOSS_API_CONTRACT.md y docs/integrations/APPLE_BOSS_API_OPENAPI.yaml.
 *
 * Esta API entrega lo que el sistema Apple Boss tiene registrado, nada más. Que un producto no aparezca NO quiere
 * decir que la empresa no lo venda: hay catálogos externos (Google Drive, proveedores) que esta API no conoce.
 */
class IntegracionController extends Controller
{
    private const ORDENES = ['updated_desc', 'updated_asc', 'name', 'price_asc', 'price_desc'];

    private const DISPONIBILIDADES = ['in_stock', 'available', 'reserved', 'sold', 'sold_out', 'unavailable', 'all'];

    /** GET /health — la API responde y el token sirve. */
    public function health(Request $request): JsonResponse
    {
        $integracion = $this->integracion($request);

        return response()->json(['data' => [
            'status'      => 'ok',
            'api_version' => 'v1',
            'integration' => ['name' => $integracion->nombre],
            'scopes'      => array_values($integracion->scopes ?? []),
            'server_time' => now()->toIso8601String(),
        ]]);
    }

    /** GET /products */
    public function products(Request $request): JsonResponse
    {
        $f = $request->validate([
            'search'        => 'sometimes|nullable|string|max:100',
            'category'      => ['sometimes', 'nullable', Rule::in(array_values(InventarioIntegracion::CATEGORIAS))],
            'kind'          => ['sometimes', 'nullable', Rule::in(['unit', 'article'])],
            'condition'     => ['sometimes', 'nullable', Rule::in([...array_values(InventarioIntegracion::CONDICIONES), 'unknown'])],
            'availability'  => ['sometimes', 'nullable', Rule::in(self::DISPONIBILIDADES)],
            'min_price'     => 'sometimes|nullable|numeric|min:0|max:100000000',
            'max_price'     => 'sometimes|nullable|numeric|min:0|max:100000000',
            'currency'      => ['sometimes', 'nullable', Rule::in(['BOB'])],
            'updated_since' => 'sometimes|nullable|date',
            'sort'          => ['sometimes', 'nullable', Rule::in(self::ORDENES)],
            'page'          => 'sometimes|integer|min:1|max:100000',
            'per_page'      => 'sometimes|integer|min:1|max:100',
            'brand'         => 'prohibited',
        ], [
            'brand.prohibited' => 'El sistema no registra marcas: este filtro no existe. Ver APPLE_BOSS_API_CONTRACT.md.',
            'currency.in'      => 'Los precios del inventario están solo en BOB.',
        ]);

        $integracion = $this->integracion($request);
        $orden = $f['sort'] ?? 'updated_desc';
        $disponibilidad = $f['availability'] ?? 'in_stock';
        $porPrecio = isset($f['min_price']) || isset($f['max_price']) || str_starts_with($orden, 'price_');

        if ($porPrecio && ! $integracion->tieneScope('integration.pricing.read')) {
            return ErrorApi::respuesta(403, 'insufficient_scope', 'Filtrar u ordenar por precio pide el permiso integration.pricing.read.', ['required_scope' => 'integration.pricing.read']);
        }
        if ($disponibilidad !== 'in_stock' && ! $integracion->tieneScope('integration.inventory.read')) {
            return ErrorApi::respuesta(403, 'insufficient_scope', 'Filtrar por disponibilidad pide el permiso integration.inventory.read.', ['required_scope' => 'integration.inventory.read']);
        }

        $inventario = new InventarioIntegracion($integracion);
        $items = $this->filtrar($inventario->todos(), $f, $disponibilidad);
        $items = $this->ordenar($items, $orden)->values();

        $porPagina = (int) ($f['per_page'] ?? 25);
        $total = $items->count();
        $pagina = (int) ($f['page'] ?? 1);

        return response()->json([
            'data' => $items->slice(($pagina - 1) * $porPagina, $porPagina)->pluck('json')->values(),
            'meta' => [
                'page'         => $pagina,
                'per_page'     => $porPagina,
                'total'        => $total,
                'last_page'    => max(1, (int) ceil($total / $porPagina)),
                'sort'         => $orden,
                'availability' => $disponibilidad,
                'source'       => InventarioIntegracion::SISTEMA,
                'retrieved_at' => $inventario->momento(),
            ],
        ]);
    }

    /** GET /products/{id} */
    public function product(Request $request, string $id): JsonResponse
    {
        [$producto, $momento] = $this->buscar($request, $id);

        return $producto ? $this->dato($producto['json'], $momento) : $this->noExiste($id);
    }

    /** GET /products/{id}/images — fotos reales de la publicación visible en la tienda. Sin publicación: []. */
    public function images(Request $request, string $id): JsonResponse
    {
        [$producto, $momento] = $this->buscar($request, $id);

        return $producto ? response()->json([
            'data' => $producto['json']['images'],
            'meta' => ['product_id' => $id, 'publication_status' => $producto['json']['publication']['status'], 'retrieved_at' => $momento],
        ]) : $this->noExiste($id);
    }

    /** GET /products/{id}/price */
    public function price(Request $request, string $id): JsonResponse
    {
        [$producto, $momento] = $this->buscar($request, $id);

        return $producto ? $this->dato(['product_id' => $id] + $producto['json']['pricing'] + ['source' => $producto['json']['source']], $momento) : $this->noExiste($id);
    }

    /** GET /products/{id}/availability — estado al momento del pedido. Leerlo justo antes de prometer stock. */
    public function availability(Request $request, string $id): JsonResponse
    {
        [$producto, $momento] = $this->buscar($request, $id);

        return $producto ? $this->dato(['product_id' => $id] + $producto['json']['availability'] + ['source' => $producto['json']['source']], $momento) : $this->noExiste($id);
    }

    /** GET /categories — los grupos del inventario y, en accesorios, sus tipos. */
    public function categories(Request $request): JsonResponse
    {
        $integracion = $this->integracion($request);
        $inventario = new InventarioIntegracion($integracion);
        $conStock = $integracion->tieneScope('integration.inventory.read');
        $libres = $conStock ? $inventario->todos()->where('estado', 'available') : collect();

        $data = collect(InventarioIntegracion::CATEGORIAS)->map(fn ($id, $tipo) => [
            'id'              => $id,
            'name'            => InventarioCatalogo::GRUPOS[$tipo]['label'],
            'inventory_type'  => $tipo,
            'available_items' => $conStock ? $libres->where('categoria', $id)->count() : null,
            'subcategories'   => $tipo === 'producto_general'
                ? collect(InventarioCatalogo::TIPO_GENERAL)->map(fn ($nombre, $clave) => [
                    'id'              => $clave,
                    'name'            => $nombre,
                    'available_items' => $conStock ? $libres->filter(fn ($i) => ($i['json']['attributes']['accessory_type']['id'] ?? null) === $clave)->count() : null,
                ])->values()
                : [],
        ])->values();

        return response()->json(['data' => $data, 'meta' => ['source' => InventarioIntegracion::SISTEMA, 'retrieved_at' => $inventario->momento()]]);
    }

    /** GET /exchange-rates — el tipo de cambio que la tienda ya usa para cobrar en USDT. Nunca uno inventado. */
    public function exchangeRates(): JsonResponse
    {
        $tc = TipoDeCambio::detalle();

        return response()->json([
            'data' => $tc ? [[
                'base'      => 'USD',
                'quote'     => 'BOB',
                'rate'      => number_format($tc['tasa'], 2, '.', ''),
                'rate_type' => 'parallel_buy',
                'origin'    => $tc['origen'],
                'provider'  => $tc['origen'] === 'manual' ? 'manual' : 'dolarbluebolivia.click',
                'as_of'     => $tc['momento'],
                'usage'     => 'Bolivianos por dólar paralelo (lado compra). La tienda lo usa para cobrar en USDT; los precios del inventario están en BOB y no se convierten.',
            ]] : [],
            'meta' => ['available' => $tc !== null, 'source' => InventarioIntegracion::SISTEMA, 'retrieved_at' => now()->toIso8601String()],
        ]);
    }

    /**
     * GET /changes — productos que cambiaron desde una fecha (since) o desde el último lote leído (cursor), del más
     * viejo al más nuevo. Vendido o agotado = tombstone. Un registro borrado del inventario no se puede informar acá:
     * se detecta con la sincronización completa de /products.
     */
    public function changes(Request $request): JsonResponse
    {
        $f = $request->validate([
            'since'  => 'required_without:cursor|nullable|date',
            'cursor' => 'required_without:since|nullable|string|max:200',
            'limit'  => 'sometimes|integer|min:1|max:200',
        ], [
            'since.required_without'  => 'Manda since (fecha ISO 8601) o el cursor que devolvió el lote anterior.',
            'cursor.required_without' => 'Manda since (fecha ISO 8601) o el cursor que devolvió el lote anterior.',
        ]);

        $desde = null;
        if (! empty($f['cursor'])) {
            $desde = $this->leerCursor($f['cursor']);
            if ($desde === null) {
                return ErrorApi::respuesta(422, 'invalid_parameters', 'El cursor no es válido.', ['cursor' => ['El cursor no es válido.']]);
            }
        }

        $limite = (int) ($f['limit'] ?? 100);
        $inventario = new InventarioIntegracion($this->integracion($request));
        $momentoSince = isset($f['since']) ? Carbon::parse($f['since'])->getTimestamp() : null;

        $cambios = $inventario->todos()
            ->filter(fn ($i) => $i['actualizado'] !== null)
            ->filter(fn ($i) => $desde
                ? [$i['actualizado']->getTimestamp(), $i['id']] > $desde
                : $i['actualizado']->getTimestamp() >= $momentoSince)
            ->sortBy([fn ($a, $b) => $a['actualizado']->getTimestamp() <=> $b['actualizado']->getTimestamp(), fn ($a, $b) => strcmp($a['id'], $b['id'])])
            ->values();

        $lote = $cambios->take($limite);
        $ultimo = $lote->last();

        return response()->json([
            'data' => $lote->map(fn ($i) => [
                'change_type' => in_array($i['estado'], ['sold', 'sold_out'], true) ? 'tombstone' : 'upsert',
                'id'          => $i['id'],
                'updated_at'  => $i['json']['updated_at'],
                'product'     => $i['json'],
            ])->values(),
            'meta' => [
                'next_cursor'  => $ultimo ? $this->cursor($ultimo) : ($f['cursor'] ?? null),
                'has_more'     => $cambios->count() > $limite,
                'retrieved_at' => $inventario->momento(),
            ],
        ]);
    }

    // ─── Internos ────────────────────────────────────────────────────────────

    private function integracion(Request $request): Integracion
    {
        return $request->user();
    }

    private function buscar(Request $request, string $id): array
    {
        $inventario = new InventarioIntegracion($this->integracion($request));

        return [$inventario->buscar($id), $inventario->momento()];
    }

    private function dato(array $data, string $momento): JsonResponse
    {
        return response()->json(['data' => $data, 'meta' => ['retrieved_at' => $momento]]);
    }

    private function noExiste(string $id): JsonResponse
    {
        return ErrorApi::respuesta(404, 'not_found', 'El sistema Apple Boss no tiene un producto con ese id. Eso no quiere decir que la empresa no lo venda.', ['id' => Str::limit($id, 60)]);
    }

    private function filtrar(Collection $items, array $f, string $disponibilidad): Collection
    {
        return $items
            ->filter(fn ($i) => match ($disponibilidad) {
                'all'      => true,
                'in_stock' => in_array($i['estado'], InventarioIntegracion::EN_STOCK, true),
                default    => $i['estado'] === $disponibilidad,
            })
            ->when($f['category'] ?? null, fn ($c, $v) => $c->where('categoria', $v))
            ->when($f['kind'] ?? null, fn ($c, $v) => $c->filter(fn ($i) => $i['json']['kind'] === $v))
            ->when($f['condition'] ?? null, fn ($c, $v) => $c->filter(fn ($i) => $i['condicion'] === ($v === 'unknown' ? null : $v)))
            ->when(isset($f['min_price']), fn ($c) => $c->filter(fn ($i) => $i['precio'] !== null && $i['precio'] >= (float) $f['min_price']))
            ->when(isset($f['max_price']), fn ($c) => $c->filter(fn ($i) => $i['precio'] !== null && $i['precio'] <= (float) $f['max_price']))
            ->when($f['updated_since'] ?? null, fn ($c, $v) => $c->filter(fn ($i) => $i['actualizado'] && $i['actualizado']->gte(Carbon::parse($v))))
            ->when($f['search'] ?? null, function ($c, $v) {
                // Todas las palabras tienen que aparecer, sin importar mayúsculas ni tildes
                $palabras = array_slice(preg_split('/\s+/', Str::ascii(mb_strtolower(trim($v))), -1, PREG_SPLIT_NO_EMPTY), 0, 8);

                return $c->filter(fn ($i) => collect($palabras)->every(fn ($p) => str_contains($i['texto'], $p)));
            });
    }

    private function ordenar(Collection $items, string $orden): Collection
    {
        $porId = fn ($a, $b) => strcmp($a['id'], $b['id']);
        $fecha = fn ($i) => $i['actualizado']?->getTimestamp() ?? 0;

        return match ($orden) {
            'updated_asc' => $items->sort(fn ($a, $b) => $fecha($a) <=> $fecha($b) ?: $porId($a, $b)),
            'name'        => $items->sort(fn ($a, $b) => strnatcasecmp((string) $a['json']['display_name'], (string) $b['json']['display_name']) ?: $porId($a, $b)),
            'price_asc'   => $items->sort(fn ($a, $b) => [$a['precio'] === null, $a['precio']] <=> [$b['precio'] === null, $b['precio']] ?: $porId($a, $b)),
            'price_desc'  => $items->sort(fn ($a, $b) => [$a['precio'] === null, -($a['precio'] ?? 0)] <=> [$b['precio'] === null, -($b['precio'] ?? 0)] ?: $porId($a, $b)),
            default       => $items->sort(fn ($a, $b) => $fecha($b) <=> $fecha($a) ?: $porId($a, $b)),
        };
    }

    private function cursor(array $item): string
    {
        return rtrim(strtr(base64_encode(json_encode([$item['actualizado']->getTimestamp(), $item['id']])), '+/', '-_'), '=');
    }

    private function leerCursor(string $cursor): ?array
    {
        $datos = json_decode((string) base64_decode(strtr($cursor, '-_', '+/'), true), true);

        return is_array($datos) && count($datos) === 2 && is_int($datos[0]) && is_string($datos[1]) ? $datos : null;
    }
}
