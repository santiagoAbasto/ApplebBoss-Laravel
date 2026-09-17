<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Tienda online → Ubicaciones pasa a ser el único lugar de los datos del local.
 *
 * - `horarios`: el horario día por día (lunes a domingo, hasta dos tramos por día). `hours` queda como aclaración en texto.
 * - La dirección, la ciudad, el país y el horario también estaban en Configuración, y la tienda mezclaba las dos fuentes.
 *   Lo que el administrador escribió ahí pasa al local principal si ese dato estaba vacío; los valores de ejemplo de la
 *   instalación (nunca editados, como el horario «Lunes a sábado de 9:00 a 19:00») no se copian: no son datos reales.
 */
return new class extends Migration
{
    private const CLAVES = [
        'tienda_direccion' => 'address',
        'tienda_ciudad'    => 'city',
        'tienda_pais'      => 'country',
        'tienda_horario'   => 'hours',
    ];

    public function up(): void
    {
        Schema::table('store_locations', function (Blueprint $table) {
            $table->json('horarios')->nullable()->after('hours');
        });

        if (! Schema::hasTable('configuracion_tienda')) {
            return;
        }

        $filas = DB::table('configuracion_tienda')->whereIn('clave', array_keys(self::CLAVES))->get()->keyBy('clave');

        $escritos = [];
        foreach (self::CLAVES as $clave => $campo) {
            $fila = $filas->get($clave);
            $editada = $fila && filled($fila->valor) && $fila->created_at && $fila->updated_at && $fila->updated_at > $fila->created_at;
            if ($editada) {
                $escritos[$campo] = trim((string) $fila->valor);
            }
        }

        if ($escritos !== []) {
            $principal = DB::table('store_locations')->orderByDesc('active')->orderBy('sort_order')->orderBy('id')->first();

            if ($principal) {
                $vacios = array_filter($escritos, fn ($valor, $campo) => blank($principal->{$campo}), ARRAY_FILTER_USE_BOTH);
                if ($vacios !== []) {
                    DB::table('store_locations')->where('id', $principal->id)->update($vacios + ['updated_at' => now()]);
                }
            } else {
                DB::table('store_locations')->insert($escritos + [
                    'name'       => 'Apple Boss',
                    'active'     => true,
                    'sort_order' => 0,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        DB::table('configuracion_tienda')->whereIn('clave', array_keys(self::CLAVES))->delete();
    }

    public function down(): void
    {
        $principal = DB::table('store_locations')->where('active', true)->orderBy('sort_order')->orderBy('id')->first();

        Schema::table('store_locations', function (Blueprint $table) {
            $table->dropColumn('horarios');
        });

        if (! Schema::hasTable('configuracion_tienda')) {
            return;
        }

        $etiquetas = [
            'tienda_direccion' => 'Dirección de la tienda',
            'tienda_ciudad'    => 'Ciudad',
            'tienda_pais'      => 'País',
            'tienda_horario'   => 'Horario de atención',
        ];

        foreach (self::CLAVES as $clave => $campo) {
            DB::table('configuracion_tienda')->updateOrInsert(['clave' => $clave], [
                'valor'      => $principal?->{$campo},
                'tipo'       => 'texto',
                'grupo'      => 'tienda',
                'etiqueta'   => $etiquetas[$clave],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
};
