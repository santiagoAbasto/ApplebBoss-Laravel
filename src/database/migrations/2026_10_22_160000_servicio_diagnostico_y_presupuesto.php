<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Servicio técnico en dos modos: «directo» (ya se sabe el precio, como siempre) y «diagnóstico» (entra para revisar,
 * sin precio de reparación todavía). El presupuesto se carga después y el cliente lo aprueba o rechaza por correo.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('servicio_tecnicos', function (Blueprint $table) {
            if (! Schema::hasColumn('servicio_tecnicos', 'modo')) {
                // Las filas viejas ya tenían precio: son «directo».
                $table->string('modo', 20)->default('directo')->after('estado');
            }
            if (! Schema::hasColumn('servicio_tecnicos', 'cuota_diagnostico')) {
                $table->decimal('cuota_diagnostico', 12, 2)->nullable()->after('precio_venta');
            }
            if (! Schema::hasColumn('servicio_tecnicos', 'presupuesto_en')) {
                $table->timestamp('presupuesto_en')->nullable()->after('cuota_diagnostico');
            }
            if (! Schema::hasColumn('servicio_tecnicos', 'aprobado_en')) {
                $table->timestamp('aprobado_en')->nullable()->after('presupuesto_en');
            }
            if (! Schema::hasColumn('servicio_tecnicos', 'rechazado_en')) {
                $table->timestamp('rechazado_en')->nullable()->after('aprobado_en');
            }
        });
    }

    public function down(): void
    {
        Schema::table('servicio_tecnicos', function (Blueprint $table) {
            foreach (['modo', 'cuota_diagnostico', 'presupuesto_en', 'aprobado_en', 'rechazado_en'] as $col) {
                if (Schema::hasColumn('servicio_tecnicos', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
