<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ata cada pedido a la cuenta que lo hizo.
 *
 * Los datos del comprador (nombre, correo, teléfono) siguen copiados en el pedido a propósito:
 * son una foto del momento de la compra. Si mañana la persona cambia su correo, la boleta vieja
 * tiene que seguir diciendo lo que decía. `user_id` es para «mis pedidos» y para saber a quién
 * le pertenece; los datos impresos no se leen desde la cuenta.
 *
 * Nullable porque los pedidos que ya existen se hicieron sin cuenta.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->after('id')
                ->constrained()->nullOnDelete();
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::table('pedidos', function (Blueprint $table) {
            $table->dropIndex(['user_id', 'created_at']);
            $table->dropConstrainedForeignId('user_id');
        });
    }
};
