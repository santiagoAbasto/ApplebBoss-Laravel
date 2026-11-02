<?php

namespace Tests\Feature;

use App\Console\Commands\ImportarProveedor;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

/**
 * Panel → Listas de proveedor. En producción el disco por defecto quedó en 'google' (sin driver) y la subida reventaba
 * con «Disk [google] does not have a configured driver». El apartado debe usar su propio disco local y escribir el .json
 * donde el importador lo lee (storage/app/proveedores), pase lo que pase con el disco por defecto.
 */
class ProveedorSubidaTest extends TestCase
{
    use RefreshDatabase;

    private const PROV = 'Proveedor Test 9Z';
    private const SLUG = 'proveedor-test-9z';

    protected function setUp(): void
    {
        parent::setUp();
        Cache::put('tc.blue.momento', now()->toISOString());
        Cache::put('tc.blue.ultimo', 12.0);
    }

    protected function tearDown(): void
    {
        // Limpiar lo que el apartado escribe en el disco real (no lo borra RefreshDatabase).
        $disco = Storage::disk('proveedores');
        $disco->delete('proveedores/' . self::SLUG . '.json');
        foreach ($disco->files('proveedores-temp') as $f) {
            $disco->delete($f);
        }
        parent::tearDown();
    }

    /** Un .xlsx mínimo con el formato de Apple Land, puesto donde la vista previa lo deja. */
    private function stagearXlsx(): string
    {
        $ss = new Spreadsheet();
        $sh = $ss->getActiveSheet();
        $sh->setCellValue('B1', 'SOLO $US o UDT'); // dispara la sección de precios
        $sh->setCellValue('B2', 'IPHONES');        // título
        $sh->setCellValue('B3', '15 NORMAL 128gb');
        $sh->setCellValue('D3', '640$');

        $token = 'proveedores-temp/test-' . uniqid() . '.xlsx';
        $ruta = Storage::disk('proveedores')->path($token);
        @mkdir(dirname($ruta), 0775, true);
        (new Xlsx($ss))->save($ruta);

        return $token;
    }

    public function test_aplicar_escribe_donde_el_importador_lee_aunque_el_disco_por_defecto_este_roto(): void
    {
        // Como en producción: el disco por defecto no tiene driver. El apartado no debe tocarlo.
        config(['filesystems.default' => 'google']);

        $token = $this->stagearXlsx();

        $this->actingAs(User::factory()->create(['rol' => 'admin']))
            ->post(route('admin.proveedores.aplicar'), ['proveedor' => self::PROV, 'token' => $token])
            ->assertRedirect(route('admin.proveedores.index'))
            ->assertSessionHas('success')
            ->assertSessionHasNoErrors();

        // El .json quedó en storage/app/proveedores (donde el importador lo lee), no en app/private ni en 'google'.
        $this->assertTrue(Storage::disk('proveedores')->exists('proveedores/' . self::SLUG . '.json'));
        $this->assertContains(
            storage_path('app/proveedores/' . self::SLUG . '.json'),
            ImportarProveedor::listasVigentes(),
        );
    }

    public function test_un_token_que_no_es_del_temporal_se_rechaza(): void
    {
        config(['filesystems.default' => 'google']);

        $this->actingAs(User::factory()->create(['rol' => 'admin']))
            ->post(route('admin.proveedores.aplicar'), ['proveedor' => self::PROV, 'token' => '../../etc/passwd'])
            ->assertSessionHas('error');

        $this->assertFalse(Storage::disk('proveedores')->exists('proveedores/' . self::SLUG . '.json'));
    }
}
