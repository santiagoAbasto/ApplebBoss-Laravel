<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Cada documento que se entrega al cliente (nota de venta, nota de servicio, nota de reserva e informe técnico) guarda
 * el correo al que se mandó y cuándo. El servicio técnico suma un estado (recibido → en reparación → listo → entregado)
 * para avisarle al cliente por correo en cada paso; los servicios ya registrados se dan por entregados, salvo los de la
 * última semana, que siguen en recibido.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ventas', function (Blueprint $table) {
            $table->string('correo_cliente', 191)->nullable()->after('telefono_cliente');
            $table->timestamp('correo_enviado_en')->nullable()->after('notas_adicionales');
        });

        Schema::table('servicio_tecnicos', function (Blueprint $table) {
            $table->string('correo', 191)->nullable()->after('telefono');
            $table->string('estado', 20)->default('recibido')->after('equipo');
            $table->timestamp('correo_enviado_en')->nullable()->after('notas_adicionales');
        });

        DB::table('servicio_tecnicos')
            ->where('created_at', '<', now()->subDays(7))
            ->update(['estado' => 'entregado']);

        Schema::table('reservas', function (Blueprint $table) {
            $table->string('correo_cliente', 191)->nullable()->after('telefono_cliente');
            $table->timestamp('correo_enviado_en')->nullable()->after('terminos_condiciones');
        });

        Schema::table('diagnosticos', function (Blueprint $table) {
            $table->timestamp('correo_enviado_en')->nullable()->after('tecnico');
        });
    }

    public function down(): void
    {
        Schema::table('ventas', fn (Blueprint $t) => $t->dropColumn(['correo_cliente', 'correo_enviado_en']));
        Schema::table('servicio_tecnicos', fn (Blueprint $t) => $t->dropColumn(['correo', 'estado', 'correo_enviado_en']));
        Schema::table('reservas', fn (Blueprint $t) => $t->dropColumn(['correo_cliente', 'correo_enviado_en']));
        Schema::table('diagnosticos', fn (Blueprint $t) => $t->dropColumn(['correo_enviado_en']));
    }
};
