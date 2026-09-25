<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Delivery propio en Cochabamba y cotización en USDT.
 *
 * El delivery pide zona, barrio y el punto del mapa, porque el repartidor llega a una casa,
 * no a un departamento. El monto en USDT se congela en el pedido: el paralelo se mueve y el
 * cliente tiene que pagar lo que le mostramos, ni más ni menos.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pedidos', function (Blueprint $t) {
            $t->string('envio_zona', 80)->nullable()->after('envio_ciudad');
            $t->string('envio_barrio', 80)->nullable()->after('envio_zona');
            $t->decimal('envio_lat', 10, 7)->nullable()->after('envio_referencia');
            $t->decimal('envio_lng', 10, 7)->nullable()->after('envio_lat');
            $t->decimal('pago_monto_usdt', 12, 2)->nullable()->after('pago_referencia');
        });
    }

    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $t) {
            $t->dropColumn(['envio_zona', 'envio_barrio', 'envio_lat', 'envio_lng', 'pago_monto_usdt']);
        });
    }
};
