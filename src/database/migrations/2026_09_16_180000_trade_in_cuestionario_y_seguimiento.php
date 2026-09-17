<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Trade-In, alineado y cableado (2026-09-16).
 *
 * - Las respuestas del cliente pasan a `respuestas` (JSON), con las preguntas de App\Support\TradeIn\Cuestionario:
 *   cuenta y bloqueos, bypass, funcionamiento pieza por pieza, estado físico, batería, reparaciones y accesorios. Las
 *   columnas sueltas de antes (enciende, pantalla_rota, estado_fisico…) se convierten y se quitan.
 * - `fotos` (JSON, en el disco privado), `ciudad` e `interes` (qué equipo quiere llevar).
 * - `historial` (JSON): cuándo llegó, los cambios de etapa y de valor, y cuándo se le escribió por WhatsApp.
 * - `system_notifications.trade_in_id`: el aviso del Resumen lleva a la solicitud.
 */
return new class extends Migration
{
    private const VIEJAS = [
        'enciende', 'pantalla_funciona', 'pantalla_rota', 'face_touch_id_funciona', 'camaras_funcionan', 'botones_funcionan',
        'carga_correctamente', 'estado_fisico', 'tiene_golpes', 'tiene_rayaduras', 'salud_bateria', 'tiene_caja', 'tiene_accesorios',
    ];

    public function up(): void
    {
        Schema::table('trade_in_solicitudes', function (Blueprint $table) {
            $table->json('respuestas')->nullable()->after('color');
            $table->json('fotos')->nullable()->after('respuestas');
            $table->string('ciudad', 60)->nullable()->after('email_contacto');
            $table->string('interes', 160)->nullable()->after('ciudad');
            $table->json('historial')->nullable()->after('atendido_por');
        });

        foreach (DB::table('trade_in_solicitudes')->get() as $s) {
            $f = fn ($ok) => $ok ? 'funciona' : 'falla';
            $fisico = ['excelente' => 'impecable', 'bueno' => 'leve', 'regular' => 'visible', 'malo' => 'visible'][$s->estado_fisico] ?? 'leve';
            $incluye = array_values(array_filter([$s->tiene_caja ? 'caja' : null, $s->tiene_accesorios ? 'cable' : null]));

            DB::table('trade_in_solicitudes')->where('id', $s->id)->update([
                'respuestas' => json_encode(array_filter([
                    'funcionamiento' => [
                        'enciende'  => $f($s->enciende),
                        'imagen'    => $f($s->pantalla_funciona),
                        'biometria' => $f($s->face_touch_id_funciona),
                        'camaras'   => $f($s->camaras_funcionan),
                        'botones'   => $f($s->botones_funcionan),
                        'carga'     => $f($s->carga_correctamente),
                    ],
                    'pantalla' => $s->pantalla_rota ? 'rota' : $fisico,
                    'cuerpo'   => $s->tiene_golpes ? 'visible' : $fisico,
                    'bateria'  => $s->salud_bateria !== null ? (int) $s->salud_bateria : null,
                    'incluye'  => $incluye ?: ['solo'],
                ], fn ($v) => $v !== null), JSON_UNESCAPED_UNICODE),
                'historial' => json_encode([['tipo' => 'recibida', 'fecha' => Carbon::parse($s->created_at)->toIso8601String()]]),
            ]);
        }

        Schema::table('trade_in_solicitudes', function (Blueprint $table) {
            $table->dropColumn(self::VIEJAS);
        });

        Schema::table('system_notifications', function (Blueprint $table) {
            $table->unsignedBigInteger('trade_in_id')->nullable()->index();
        });
    }

    public function down(): void
    {
        Schema::table('system_notifications', function (Blueprint $table) {
            $table->dropIndex(['trade_in_id']);
            $table->dropColumn('trade_in_id');
        });

        Schema::table('trade_in_solicitudes', function (Blueprint $table) {
            $table->boolean('enciende')->default(true);
            $table->boolean('pantalla_funciona')->default(true);
            $table->boolean('pantalla_rota')->default(false);
            $table->boolean('face_touch_id_funciona')->default(true);
            $table->boolean('camaras_funcionan')->default(true);
            $table->boolean('botones_funcionan')->default(true);
            $table->boolean('carga_correctamente')->default(true);
            $table->string('estado_fisico')->default('bueno');
            $table->boolean('tiene_golpes')->default(false);
            $table->boolean('tiene_rayaduras')->default(false);
            $table->integer('salud_bateria')->nullable();
            $table->boolean('tiene_caja')->default(false);
            $table->boolean('tiene_accesorios')->default(false);
        });

        Schema::table('trade_in_solicitudes', function (Blueprint $table) {
            $table->dropColumn(['respuestas', 'fotos', 'ciudad', 'interes', 'historial']);
        });
    }
};
