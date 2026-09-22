<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Cómo entra el equipo al taller: la revisión punto por punto y el código de desbloqueo van en una sola columna JSON
 * (la lista de puntos no es fija: en el mostrador se agregan los que hagan falta sin tocar la base).
 *
 * Los técnicos pasan a ser un catálogo con su especialidad, para que al elegir la marca del equipo solo aparezcan
 * los que la atienden. Los que ya trabajaron entran atendiendo cualquier equipo hasta que el administrador lo precise.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tecnicos', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 120)->unique();
            $table->string('especialidad', 20)->default('ambas');
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });

        Schema::table('servicio_tecnicos', function (Blueprint $table) {
            $table->string('marca', 20)->nullable()->after('equipo');
            $table->json('recepcion')->nullable()->after('detalle_servicio');
        });

        $ahora = now();
        $nombres = DB::table('servicio_tecnicos')
            ->whereNotNull('tecnico')
            ->where('tecnico', '<>', '')
            ->distinct()
            ->pluck('tecnico');

        foreach ($nombres as $nombre) {
            DB::table('tecnicos')->insertOrIgnore([
                'nombre'       => trim($nombre),
                'especialidad' => 'ambas',
                'activo'       => true,
                'created_at'   => $ahora,
                'updated_at'   => $ahora,
            ]);
        }
    }

    public function down(): void
    {
        Schema::table('servicio_tecnicos', function (Blueprint $table) {
            $table->dropColumn(['marca', 'recepcion']);
        });

        Schema::dropIfExists('tecnicos');
    }
};
