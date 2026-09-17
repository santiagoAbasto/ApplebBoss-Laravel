<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('trade_in_solicitudes', function (Blueprint $table) {
            $table->id();
            $table->string('codigo')->unique();          // AB-TI-000001

            // Dispositivo
            $table->string('tipo_dispositivo');          // iPhone, MacBook, iPad, etc.
            $table->string('marca')->default('Apple');
            $table->string('modelo');                    // iPhone 13, MacBook Air M2, etc.
            $table->string('capacidad')->nullable();     // 128GB, 256GB, etc.
            $table->string('color')->nullable();

            // Diagnóstico
            $table->boolean('enciende')->default(true);
            $table->boolean('pantalla_funciona')->default(true);
            $table->boolean('pantalla_rota')->default(false);
            $table->boolean('face_touch_id_funciona')->default(true);
            $table->boolean('camaras_funcionan')->default(true);
            $table->boolean('botones_funcionan')->default(true);
            $table->boolean('carga_correctamente')->default(true);
            $table->enum('estado_fisico', ['excelente', 'bueno', 'regular', 'malo'])->default('bueno');
            $table->boolean('tiene_golpes')->default(false);
            $table->boolean('tiene_rayaduras')->default(false);
            $table->integer('salud_bateria')->nullable();   // % para iOS
            $table->boolean('tiene_caja')->default(false);
            $table->boolean('tiene_accesorios')->default(false);
            $table->text('observaciones_cliente')->nullable();

            // Estimación (calculada por reglas admin)
            $table->decimal('valor_estimado', 10, 2)->nullable();
            $table->string('moneda', 3)->default('BOB');
            $table->text('nota_estimacion')->nullable();

            // Contacto
            $table->string('nombre_contacto');
            $table->string('telefono_contacto');
            $table->string('email_contacto')->nullable();

            // Proceso
            $table->enum('estado', [
                'nuevo',
                'pendiente',
                'contactado',
                'evaluacion',
                'cotizado',
                'aceptado',
                'rechazado',
                'completado',
            ])->default('nuevo');

            $table->text('notas_internas')->nullable();     // NO exponer públicamente
            $table->foreignId('atendido_por')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('estado');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trade_in_solicitudes');
    }
};
