<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Pedidos de la tienda en línea.
 *
 * Un pedido guarda a quién se le vende, cómo se entrega y en qué estado va el pago.
 * Los datos propios de cada unidad (IMEI, serie) se copian al ítem recién cuando el pago
 * está confirmado: antes de eso no salen a ningún lado (regla del negocio).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pedidos', function (Blueprint $t) {
            $t->id();
            $t->string('codigo', 20)->unique();              // AB-260918-0001, lo ve el cliente
            $t->string('token_seguimiento', 64)->unique();   // para el link público de seguimiento

            // Quién compra
            $t->string('nombre_cliente');
            $t->string('email_cliente');
            $t->string('telefono_cliente', 30);
            $t->string('documento', 30)->nullable();         // CI o NIT para la factura
            $t->string('razon_social')->nullable();

            // Cómo se entrega
            $t->string('tipo_entrega', 10)->default('retiro'); // retiro | envio
            $t->string('envio_departamento', 40)->nullable();
            $t->string('envio_ciudad', 80)->nullable();
            $t->string('envio_direccion')->nullable();
            $t->string('envio_referencia')->nullable();
            $t->string('envio_destinatario')->nullable();
            $t->string('envio_telefono', 30)->nullable();

            // Plata (siempre calculada en el servidor)
            $t->decimal('subtotal', 12, 2)->default(0);
            $t->decimal('costo_envio', 12, 2)->default(0);
            $t->decimal('total', 12, 2)->default(0);
            $t->string('moneda', 3)->default('BOB');

            // Estado del pedido y del pago
            $t->string('estado', 24)->default('pendiente_pago');
            $t->string('metodo_pago', 24)->nullable();        // qr_bnb | transferencia | efectivo_tienda
            $t->string('pago_referencia')->nullable();        // id de la transacción / QR
            $t->text('pago_comprobante')->nullable();         // ruta del comprobante que sube el cliente
            $t->timestamp('pago_confirmado_en')->nullable();
            $t->foreignId('pago_confirmado_por')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('expira_en')->nullable();           // si no paga, se libera el stock

            // Entrega / seguimiento
            $t->string('courier', 60)->nullable();
            $t->string('tracking_codigo', 80)->nullable();
            $t->string('tracking_url')->nullable();
            $t->timestamp('enviado_en')->nullable();
            $t->timestamp('entregado_en')->nullable();

            $t->text('notas_cliente')->nullable();
            $t->text('notas_internas')->nullable();           // nunca sale a lo público
            $t->timestamps();

            $t->index(['estado', 'created_at']);
            $t->index('email_cliente');
        });

        Schema::create('pedido_items', function (Blueprint $t) {
            $t->id();
            $t->foreignId('pedido_id')->constrained('pedidos')->cascadeOnDelete();

            $t->string('tipo', 24);                           // celular | computadora | producto_apple | producto_general
            $t->unsignedBigInteger('producto_id');

            // Foto del producto al momento de comprar (el precio no se vuelve a tocar)
            $t->string('nombre');
            $t->string('condicion', 30)->nullable();
            $t->string('slug')->nullable();
            $t->decimal('precio_unitario', 12, 2);
            $t->integer('cantidad')->default(1);
            $t->decimal('subtotal', 12, 2);

            // Datos de la unidad: SOLO se llenan cuando el pago está confirmado
            $t->string('imei_1', 20)->nullable();
            $t->string('imei_2', 20)->nullable();
            $t->string('numero_serie', 60)->nullable();

            $t->timestamps();
            $t->index(['tipo', 'producto_id']);
        });

        Schema::create('pedido_eventos', function (Blueprint $t) {
            $t->id();
            $t->foreignId('pedido_id')->constrained('pedidos')->cascadeOnDelete();
            $t->string('estado', 24);                         // el estado al que pasó
            $t->string('titulo');
            $t->text('detalle')->nullable();
            $t->boolean('publico')->default(true);            // si el cliente lo ve en el seguimiento
            $t->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();

            $t->index(['pedido_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pedido_eventos');
        Schema::dropIfExists('pedido_items');
        Schema::dropIfExists('pedidos');
    }
};
