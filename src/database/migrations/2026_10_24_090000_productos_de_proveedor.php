<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Productos «de proveedor» (consignación): equipos que otras tiendas nos pasan. NO son nuestro capital; su costo solo
 * sirve para calcular el precio y nuestra ganancia. Se guardan en el mismo inventario con un flag, el proveedor y el
 * costo/margen EN DÓLARES; el precio en Bs se calcula al vuelo con el dólar paralelo (accessor en los modelos). Por eso
 * precio_costo y precio_venta pasan a ser nullable: en estos productos no se usan (se calculan).
 */
return new class extends Migration
{
    private const TABLAS = ['celulares', 'computadoras', 'productos_apple', 'productos_generales'];

    public function up(): void
    {
        foreach (self::TABLAS as $tabla) {
            if (! Schema::hasTable($tabla)) {
                continue;
            }
            Schema::table($tabla, function (Blueprint $t) use ($tabla) {
                if (! Schema::hasColumn($tabla, 'es_proveedor')) {
                    $t->boolean('es_proveedor')->default(false)->index()->after('precio_venta');
                }
                if (! Schema::hasColumn($tabla, 'proveedor')) {
                    $t->string('proveedor', 60)->nullable()->after('es_proveedor');
                }
                if (! Schema::hasColumn($tabla, 'costo_usd')) {
                    $t->decimal('costo_usd', 10, 2)->nullable()->after('proveedor');
                }
                if (! Schema::hasColumn($tabla, 'margen_usd')) {
                    $t->decimal('margen_usd', 10, 2)->nullable()->after('costo_usd');
                }
            });
            // En los productos de proveedor el precio/costo en Bs se calcula, no se guarda.
            Schema::table($tabla, function (Blueprint $t) {
                $t->decimal('precio_costo', 10, 2)->nullable()->change();
                $t->decimal('precio_venta', 10, 2)->nullable()->change();
            });
        }

        // Un producto de proveedor aún no está físicamente: no tiene IMEI todavía. La unicidad se mantiene (varios NULL
        // conviven bajo un índice único); al venderlo y conseguirlo recién se le carga el IMEI real.
        if (Schema::hasTable('celulares') && Schema::hasColumn('celulares', 'imei_1')) {
            Schema::table('celulares', fn (Blueprint $t) => $t->string('imei_1')->nullable()->change());
        }
    }

    public function down(): void
    {
        foreach (self::TABLAS as $tabla) {
            if (! Schema::hasTable($tabla)) {
                continue;
            }
            Schema::table($tabla, function (Blueprint $t) use ($tabla) {
                foreach (['margen_usd', 'costo_usd', 'proveedor', 'es_proveedor'] as $col) {
                    if (Schema::hasColumn($tabla, $col)) {
                        $t->dropColumn($col);
                    }
                }
            });
        }
    }
};
