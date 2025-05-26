<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('cotizaciones', function (Blueprint $table) {
            $table->id();

            // Datos del cliente
            $table->string('nombre_cliente');
            $table->string('telefono_cliente')->nullable();
            $table->string('correo_cliente')->nullable();

            // Detalle de ítems cotizados (servicios o productos)
            $table->json('items');

        // Cálculos de precios
            $table->decimal('precio_base', 10, 2)->nullable();
            $table->decimal('precio_sin_factura', 10, 2)->nullable();
            $table->decimal('precio_con_factura', 10, 2)->nullable();
            $table->decimal('descuento', 10, 2)->default(0); // 👈 Aquí agregas el campo
            $table->decimal('total', 10, 2);

            // Información adicional
            $table->text('notas_adicionales')->nullable();
            $table->date('fecha_cotizacion');

            // Relación con el usuario que genera
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Estado de envío
            $table->boolean('enviado_por_correo')->default(false);
            $table->boolean('enviado_por_whatsapp')->default(false);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cotizaciones');
    }
};
