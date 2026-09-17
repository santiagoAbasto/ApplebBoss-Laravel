<?php

namespace App\Http\Controllers;

use App\Models\CatalogoPublicacion;
use App\Models\ModeloReferencia;
use App\Support\Seo;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Comparativa pública de hasta 4 modelos: iPhone, Mac, productos Apple (iPad, Apple Watch, AirPods, Apple Pencil y Magic
 * Mouse), cargadores y vidrios templados. Los datos técnicos salen de la
 * base de modelos de referencia (fichas oficiales de cada marca; en los accesorios genéricos, solo lo que el producto es
 * por definición); el precio y la disponibilidad, del inventario. Nunca se envía costo, IMEI ni procedencia.
 * Una familia nueva se suma en FAMILIAS cuando exista su base.
 */
class ComparadorModelosController extends Controller
{
    public const MAXIMO = 4;

    /**
     * Familia de la URL → tipo y familia en la base, categoría de la tienda y dato de la última versión de software.
     * Los accesorios suman sus textos (título, bajada y de dónde salen los datos), los modelos que se comparan al entrar
     * (`inicio`) y la invitación que muestra la ficha del producto.
     */
    public const FAMILIAS = [
        'iphone'     => ['tipo' => 'celular', 'familia' => 'iphone', 'nombre' => 'iPhone', 'categoria' => 'celulares', 'version' => 'ultimo_ios'],
        'mac'        => ['tipo' => 'computadora', 'familia' => 'mac', 'nombre' => 'Mac', 'categoria' => 'computadoras', 'version' => 'ultimo_so'],
        // Productos Apple: una sola comparativa con todas sus familias; el selector los agrupa por tipo
        'apple'      => [
            'tipo' => 'producto_apple', 'familia' => null, 'nombre' => 'productos Apple', 'categoria' => 'productos-apple', 'version' => null,
            'titulo'     => 'Compara productos Apple',
            'bajada'     => 'iPad, Apple Watch, AirPods, Apple Pencil y Magic Mouse, lado a lado. Elige hasta 4: los datos técnicos son los de Apple; el precio y el stock, los de nuestra tienda.',
            'fuentes'    => 'Los datos técnicos salen de las fichas técnicas de Apple (support.apple.com, en inglés de EE. UU. y en español de Latinoamérica). La memoria RAM del iPad (A16) y del iPad mini, que Apple no publica, la confirman fuentes independientes. El precio y el stock son los de Apple Boss al momento de abrir esta página.',
            'inicio'     => ['ipad-a16-wifi', 'ipad-mini-a17-pro-wifi', 'ipad-air-11-m4-wifi'],
            // Los productos de otras marcas cargados en «Productos Apple» tienen ficha, pero no se comparan con los de Apple
            'excluir'    => ['otra_marca'],
            'invitacion' => ['titulo' => '¿Dudas entre modelos?', 'texto' => 'Compara productos Apple lado a lado: pantalla, chip, batería y más.'],
            'volver'     => ['url' => '/catalogo?categoria=productos-apple', 'nombre' => 'Más Apple'],
        ],
        'cargadores' => [
            'tipo' => 'producto_general', 'familia' => 'cargador', 'nombre' => 'cargadores', 'categoria' => 'accesorios', 'version' => null,
            'titulo'     => 'Compara cargadores',
            'bajada'     => 'Originales de Apple y certificados, lado a lado: potencia, carga rápida, tecnología de carga y lo que midieron laboratorios independientes.',
            'fuentes'    => 'Los datos de los cargadores de Apple salen de apple.com y de su soporte técnico; las salidas y las pruebas, de ChargerLAB. De los certificados y de otras marcas se indica solo lo que corresponde a su tipo, sin datos que no se puedan comprobar. El precio y el stock son los de Apple Boss al momento de abrir esta página.',
            'inicio'     => ['apple-adaptador-usb-c-20w', 'cargador-usb-c-20w-certificado', 'apple-adaptador-dinamico-40w'],
            'invitacion' => ['titulo' => '¿Original o certificado?', 'texto' => 'Compara los cargadores lado a lado: potencia, carga rápida y más.'],
        ],
        'vidrios'    => [
            'tipo' => 'producto_general', 'familia' => 'vidrio', 'nombre' => 'vidrios templados', 'categoria' => 'accesorios', 'version' => null,
            'titulo'     => 'Compara vidrios templados',
            'bajada'     => 'Gorilla Glass o vidrio templado tradicional: de qué están hechos, cómo se endurecen y cuánto protegen.',
            'fuentes'    => 'Lo del Gorilla Glass sale de Corning; lo del vidrio templado común, de cómo se fabrica ese vidrio; los de marca, de su página oficial. Los vidrios con filtro indican lo que dice su nombre. El precio y el stock son los de Apple Boss al momento de abrir esta página.',
            'inicio'     => ['vidrio-templado-gorilla-glass', 'vidrio-templado-tradicional'],
            'invitacion' => ['titulo' => '¿Gorilla Glass o tradicional?', 'texto' => 'Compara los vidrios templados lado a lado: de qué están hechos y cuánto protegen.'],
        ],
    ];

    public function show(Request $request, string $familia): Response
    {
        $config = self::FAMILIAS[$familia];
        $esAccesorio = $config['tipo'] === 'producto_general';
        $modelos = ModeloReferencia::delTipo($config['tipo']);
        if ($config['familia'] !== null) {
            $modelos = $modelos->where('familia', $config['familia'])->values();
        }
        $modelos = $modelos->reject(fn (ModeloReferencia $m) => in_array($m->familia, $config['excluir'] ?? [], true))->values();
        // Los accesorios van en el orden de su base (primero los originales); los productos Apple, por tipo y en ese orden
        if ($esAccesorio || $config['tipo'] === 'producto_apple') {
            $modelos = $modelos->sortBy('orden')->values();
        }
        $ofertas = $this->ofertas($modelos, $config['categoria']);

        $pedidos = is_string($request->query('modelos')) ? explode(',', $request->query('modelos')) : [];
        $slugs = collect($pedidos)
            ->map(fn ($slug) => trim($slug))
            ->filter(fn ($slug) => $modelos->contains('slug', $slug))
            ->unique()
            ->take(self::MAXIMO)
            ->values();

        // Sin elección: los que indica la familia y, si no indica, primero los que hay en tienda y después los más recientes.
        if (! $request->has('modelos')) {
            $slugs = collect($config['inicio'] ?? [])
                ->filter(fn ($slug) => $modelos->contains('slug', $slug))
                ->concat($modelos->filter(fn (ModeloReferencia $m) => isset($ofertas[$m->id]))->pluck('slug'))
                ->concat($modelos->pluck('slug'))
                ->unique()
                ->take(isset($config['inicio']) ? count($config['inicio']) : 3)
                ->values();
        }

        app(Seo::class)->context(['titulo' => $esAccesorio || $config['familia'] === null ? $config['nombre'] : "modelos de {$config['nombre']}"]);

        return Inertia::render('Store/CompararModelos', [
            'familia'   => [
                'slug'           => $familia,
                'base'           => $config['familia'],   // la familia en la base de modelos («cargador» para /comparar/cargadores)
                'nombre'         => $config['nombre'],
                'tipo'           => $config['tipo'],
                'version_actual' => $config['version'] ? $this->versionActual($modelos, $config['version']) : null,
                'titulo'         => $config['titulo'] ?? "Compara modelos de {$config['nombre']}",
                'bajada'         => $config['bajada'] ?? null,
                'fuentes'        => $config['fuentes'] ?? null,
                'volver'         => $config['volver'] ?? ($esAccesorio
                    ? ['url' => '/catalogo?categoria=accesorios', 'nombre' => 'Accesorios']
                    : ['url' => "/{$familia}", 'nombre' => $config['nombre']]),
            ],
            'maximo'    => self::MAXIMO,
            'opciones'  => $modelos->map(fn (ModeloReferencia $m) => [
                'slug'      => $m->slug,
                'nombre'    => $m->nombre,
                'anio'      => $m->anio,
                'grupo'     => $this->grupo($m),
                'en_tienda' => isset($ofertas[$m->id]),
            ])->values(),
            'seleccion' => $slugs->map(fn (string $slug) => $this->modelo($modelos->firstWhere('slug', $slug), $ofertas))->values(),
        ]);
    }

    /** Textos de la ficha, foto (la sube el admin) o medidas para la ilustración, y lo que hay en tienda. */
    private function modelo(ModeloReferencia $m, array $ofertas): array
    {
        return [
            'slug'     => $m->slug,
            'nombre'   => $m->nombre,
            'anio'     => $m->anio,
            'etiqueta' => $this->grupo($m),
            'imagen'   => $m->urlFoto('card'),
            'specs'    => $m->specs ?? [],
            'visual'   => $m->visual(),
            'oferta'   => $ofertas[$m->id] ?? null,
        ];
    }

    /** La comparativa en la que entra un modelo (la clave de FAMILIAS), o null si no entra en ninguna. */
    public static function familiaDe(ModeloReferencia $modelo): ?string
    {
        $familia = collect(self::FAMILIAS)->search(fn (array $f) => $f['tipo'] === $modelo->tipo
            && in_array($f['familia'], [$modelo->familia, null], true)
            && ! in_array($modelo->familia, $f['excluir'] ?? [], true));

        return $familia === false ? null : $familia;
    }

    /** Con qué se agrupa en el selector: el año en los equipos; en los accesorios, su grupo («Originales de Apple»); en los productos Apple, su tipo («iPad», «AirPods»). */
    private function grupo(ModeloReferencia $m): string
    {
        return match ($m->tipo) {
            'producto_general' => $m->datos['sistema']['grupo'] ?? 'Otros',
            'producto_apple'   => $m->datos['sistema']['categoria'] ?? 'Otros',
            default            => (string) $m->anio,
        };
    }

    /** La versión de software más nueva de la base («iOS 27»): la que reciben los modelos que todavía se actualizan. */
    private function versionActual(Collection $modelos, string $clave): ?string
    {
        $numero = fn (string $version) => preg_match('/\d+(?:\.\d+)*/', $version, $n) ? $n[0] : '0';

        return $modelos->map(fn (ModeloReferencia $m) => $m->specs[$clave] ?? null)
            ->filter()
            ->reduce(fn (?string $max, string $v) => $max === null || version_compare($numero($v), $numero($max), '>') ? $v : $max);
    }

    /**
     * Lo publicado y disponible de cada modelo: cuántos hay, desde qué precio y en qué condición. En los equipos cuenta
     * las publicaciones (cada una es un equipo); en los accesorios, las unidades de todos sus artículos.
     *
     * @return array<int, array{unidades: int, desde: float, condiciones: array, url: string}>
     */
    private function ofertas(Collection $modelos, string $categoria): array
    {
        $pubs = CatalogoPublicacion::query()
            ->publicadoAhora()
            ->whereIn('modelo_referencia_id', $modelos->pluck('id'))
            ->get();
        CatalogoPublicacion::precargarInventario($pubs);

        return $pubs
            ->filter(fn (CatalogoPublicacion $p) => $p->productoDisponible() && $p->precioVigente())
            ->groupBy('modelo_referencia_id')
            ->map(fn (Collection $grupo, int $id) => [
                'unidades'    => $grupo->first()->producto_tipo === 'producto_general'
                    ? $grupo->sum(fn (CatalogoPublicacion $p) => $p->unidadesDisponibles())
                    : $grupo->count(),
                'desde'       => (float) $grupo->map(fn (CatalogoPublicacion $p) => $p->promocionActiva()
                    ? (float) $p->precio_promocional
                    : $p->precioVigente())->min(),
                'condiciones' => $grupo->pluck('condicion')->filter()->unique()->sort()->values()->all(),
                'url'         => $grupo->count() === 1
                    ? route('store.product', $grupo->first()->slug)
                    : route('store.catalog', ['categoria' => $categoria, 'modelo' => $modelos->firstWhere('id', $id)->slug]),
            ])
            ->all();
    }
}
