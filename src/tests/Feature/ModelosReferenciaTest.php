<?php

namespace Tests\Feature;

use App\Models\CatalogoPublicacion;
use App\Models\Celular;
use App\Models\ModeloReferencia;
use App\Models\User;
use App\Support\InventarioCatalogo;
use Database\Seeders\ModelosReferenciaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ModelosReferenciaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ModelosReferenciaSeeder::class);
    }

    private function celular(string $modelo, array $datos = []): Celular
    {
        return Celular::create(array_merge([
            'modelo' => $modelo, 'capacidad' => '256 GB', 'color' => 'GRIS ESPACIAL', 'bateria' => '90',
            'imei_1' => fake()->unique()->numerify('###############'), 'estado_imei' => 'libre', 'procedencia' => 'EEUU',
            'precio_costo' => 1500, 'precio_venta' => 2100, 'estado' => 'disponible', 'condicion' => 'Seminuevo',
        ], $datos));
    }

    public function test_detecta_el_modelo_sin_confundir_variantes(): void
    {
        $this->assertSame('iPhone X', ModeloReferencia::detectar('celular', 'IPHONE X')?->nombre);
        $this->assertSame('iPhone X', ModeloReferencia::detectar('celular', 'ip x 64gb')?->nombre);
        $this->assertSame('iPhone XR', ModeloReferencia::detectar('celular', 'IPHONE XR')?->nombre);
        $this->assertSame('iPhone XS Max', ModeloReferencia::detectar('celular', 'iphone xs max 256 GB')?->nombre);
        $this->assertSame('iPhone XS', ModeloReferencia::detectar('celular', 'IPHONE XS')?->nombre);   // no es el XS Max
        $this->assertSame('iPhone 11 Pro Max', ModeloReferencia::detectar('celular', 'IPHONE 11 PRO MAX')?->nombre);
        $this->assertSame('iPhone 11 Pro', ModeloReferencia::detectar('celular', 'iphone 11 pro')?->nombre);
        $this->assertSame('iPhone 11', ModeloReferencia::detectar('celular', 'IPHONE 11')?->nombre);
        $this->assertSame('iPhone 12', ModeloReferencia::detectar('celular', 'IPHONE 12')?->nombre);
        $this->assertSame('iPhone 12 mini', ModeloReferencia::detectar('celular', 'IPHONE 12 MINI')?->nombre);
        $this->assertSame('iPhone 12 Pro', ModeloReferencia::detectar('celular', 'IPHONE 12 PRO 256GB')?->nombre);
        $this->assertSame('iPhone 12 Pro Max', ModeloReferencia::detectar('celular', 'ip 12 pro max')?->nombre);
        $this->assertSame('iPhone 13 mini', ModeloReferencia::detectar('celular', 'IPHONE 13 MINI')?->nombre);
        $this->assertSame('iPhone 13', ModeloReferencia::detectar('celular', 'IPHONE 13')?->nombre);
        $this->assertSame('iPhone SE (3.ª generación)', ModeloReferencia::detectar('celular', 'iphone se 2022')?->nombre);
        $this->assertSame('iPhone SE (2.ª generación)', ModeloReferencia::detectar('celular', 'IPHONE SE 2020')?->nombre);
        $this->assertSame('iPhone 13 Pro', ModeloReferencia::detectar('celular', 'IPHONE 13 PRO')?->nombre);
        $this->assertSame('iPhone 13 Pro Max', ModeloReferencia::detectar('celular', 'IPHONE 13 PRO MAX')?->nombre);
        $this->assertSame('iPhone 14 Plus', ModeloReferencia::detectar('celular', 'IPHONE 14 PLUS')?->nombre);
        $this->assertSame('iPhone 14', ModeloReferencia::detectar('celular', 'IPHONE 14 128GB')?->nombre);
        $this->assertSame('iPhone 14 Pro', ModeloReferencia::detectar('celular', 'IPHONE 14 PRO')?->nombre);
        $this->assertSame('iPhone 14 Pro Max', ModeloReferencia::detectar('celular', 'ip 14 pro max 1TB')?->nombre);
        $this->assertSame('iPhone 15', ModeloReferencia::detectar('celular', 'IPHONE 15 128GB')?->nombre);
        $this->assertSame('iPhone 15 Plus', ModeloReferencia::detectar('celular', 'IPHONE 15 PLUS')?->nombre);
        $this->assertSame('iPhone 15 Pro', ModeloReferencia::detectar('celular', 'ip 15 pro')?->nombre);
        $this->assertSame('iPhone 15 Pro Max', ModeloReferencia::detectar('celular', 'IPHONE 15 PRO MAX 256GB')?->nombre);
        $this->assertSame('iPhone 16 Plus', ModeloReferencia::detectar('celular', 'IPHONE 16 PLUS 128GB')?->nombre);
        $this->assertSame('iPhone 16e', ModeloReferencia::detectar('celular', 'IPHONE 16E')?->nombre);
        $this->assertSame('iPhone 16', ModeloReferencia::detectar('celular', 'IPHONE 16 128GB')?->nombre);
        $this->assertSame('iPhone 16 Pro', ModeloReferencia::detectar('celular', 'ip 16 pro')?->nombre);
        $this->assertSame('iPhone 16 Pro Max', ModeloReferencia::detectar('celular', 'IPHONE 16 PRO MAX 256GB')?->nombre);
        $this->assertSame('iPhone 17', ModeloReferencia::detectar('celular', 'IPHONE 17')?->nombre);
        $this->assertSame('iPhone 17e', ModeloReferencia::detectar('celular', 'IPHONE 17E')?->nombre);   // no es el 17
        $this->assertSame('iPhone Air', ModeloReferencia::detectar('celular', 'IPHONE AIR 256GB')?->nombre);
        $this->assertSame('iPhone Air', ModeloReferencia::detectar('celular', 'ip 17 air')?->nombre);
        $this->assertSame('iPhone 17 Pro', ModeloReferencia::detectar('celular', 'IPHONE 17 PRO')?->nombre);
        $this->assertSame('iPhone 17 Pro Max', ModeloReferencia::detectar('celular', 'IPHONE 17 PRO MAX 256GB')?->nombre);   // no es el 17 Pro
        $this->assertSame('iPhone 18 Pro Max', ModeloReferencia::detectar('celular', 'ip 18 pro max 2tb')?->nombre);
        $this->assertSame('iPhone Duo', ModeloReferencia::detectar('celular', 'IPHONE DUO 512GB')?->nombre);
        $this->assertNull(ModeloReferencia::detectar('celular', 'IPHONE 18'));   // el 18 no está en la base
        $this->assertNull(ModeloReferencia::detectar('celular', 'IPHONE 99'));
        $this->assertNull(ModeloReferencia::detectar('computadora', 'IPHONE X'));
        $this->assertNull(ModeloReferencia::detectar('celular', ''));
    }

    public function test_el_seeder_se_puede_correr_de_nuevo_sin_duplicar(): void
    {
        $antes = ModeloReferencia::count();
        $this->seed(ModelosReferenciaSeeder::class);

        $this->assertGreaterThanOrEqual(3, $antes);
        $this->assertSame($antes, ModeloReferencia::count());
    }

    public function test_al_publicar_llena_la_ficha_con_el_modelo_y_los_datos_del_equipo(): void
    {
        $celular = $this->celular('IPHONE XS MAX');

        $pub = InventarioCatalogo::crear('celular', $celular, null, true);

        $this->assertSame('iPhone XS Max', $pub->modeloReferencia->nombre);
        $this->assertSame('A12 Bionic', $pub->atributos['chip']);
        $this->assertSame('6,5 pulgadas', $pub->atributos['tamano_pantalla']);
        $this->assertSame('256 GB', $pub->atributos['capacidad']);        // del equipo, no del modelo
        $this->assertArrayNotHasKey('capacidades_disponibles', $pub->atributos);
        $this->assertArrayNotHasKey('colores_disponibles', $pub->atributos);
    }

    public function test_la_ficha_dice_si_es_compatible_con_apple_intelligence_y_omite_lo_que_no_tiene(): void
    {
        $catorcePlus = ModeloReferencia::where('slug', 'iphone-14-plus')->first();
        $ficha = $catorcePlus->fichaParaPublicacion();

        $this->assertSame('No compatible', $ficha['apple_intelligence']);   // el cliente lo pregunta: se dice aunque sea no
        $this->assertArrayNotHasKey('teleobjetivo', $ficha);                // lo demás que no tiene no se copia
        $this->assertSame('6 GB', $ficha['ram']);                           // Apple no la publica: fuentes externas
        $this->assertSame('4.325 mAh', $ficha['bateria_mah']);
        $this->assertArrayNotHasKey('apple_intelligence', $catorcePlus->specs);   // la comparativa lo muestra como «No compatible»
        $this->assertSame('Compatible', ModeloReferencia::where('slug', 'iphone-16')->first()->fichaParaPublicacion()['apple_intelligence']);

        $pub = InventarioCatalogo::crear('celular', $this->celular('IPHONE 14 PLUS'), null, true);
        $this->getJson("/api/v1/products/{$pub->slug}")->assertOk()->assertJsonPath('data.atributos.apple_intelligence', 'No compatible');
    }

    public function test_la_autonomia_de_un_seminuevo_se_estima_con_su_bateria(): void
    {
        $pub = InventarioCatalogo::crear('celular', $this->celular('IPHONE X', ['bateria' => '90']), null, true);

        $this->getJson("/api/v1/products/{$pub->slug}")
            ->assertOk()
            ->assertJsonPath('data.atributos.autonomia_video_horas', 13)
            ->assertJsonPath('data.atributos.autonomia_estimada_horas', 12);   // 13 h × 90 %

        $nuevo = InventarioCatalogo::crear('celular', $this->celular('IPHONE XR', ['bateria' => '100 SELLADO', 'condicion' => 'Nuevo']), null, true);
        $this->getJson("/api/v1/products/{$nuevo->slug}")->assertJsonMissingPath('data.atributos.autonomia_estimada_horas');
    }

    public function test_el_editor_sugiere_el_modelo_y_guarda_el_elegido(): void
    {
        $admin = User::factory()->create(['rol' => 'admin']);
        $celular = $this->celular('IPHONE XR');
        $pub = CatalogoPublicacion::create([
            'producto_tipo' => 'celular', 'producto_id' => $celular->id, 'storefront' => 'APPLE_BOSS', 'publicado' => false,
            'titulo' => 'iPhone XR', 'slug' => 'iphone-xr-prueba', 'resumen' => 'Disponible.', 'condicion' => 'Seminuevo', 'categoria' => 'celulares',
        ]);
        $xr = ModeloReferencia::where('slug', 'iphone-xr')->first();

        $this->actingAs($admin)
            ->get(route('admin.catalogo.edit', $pub))
            ->assertInertia(fn (Assert $page) => $page
                ->has('modelosReferencia', ModeloReferencia::where('tipo', 'celular')->count())
                ->where('modeloSugerido', $xr->id));

        $this->actingAs($admin)
            ->from(route('admin.catalogo.edit', $pub))
            ->patch(route('admin.catalogo.update', $pub), [
                'storefront' => 'APPLE_BOSS', 'titulo' => $pub->titulo, 'slug' => $pub->slug, 'resumen' => $pub->resumen,
                'categoria' => 'celulares', 'condicion' => 'Seminuevo', 'publicado' => false, 'destacado' => false, 'orden' => 0,
                'modelo_referencia_id' => $xr->id, 'atributos' => $xr->fichaParaPublicacion(),
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame($xr->id, $pub->fresh()->modelo_referencia_id);
        $this->assertSame('A12 Bionic', $pub->fresh()->atributos['chip']);
    }
}
