<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Carritos y pedidos que alguien dejó sin pagar, para invitarlo a retomarlos (App\Support\Carritos\Recuperacion).
 * Una fila por episodio: la abierta (sin recuperado_en) es el carrito actual de la persona; las cerradas quedan
 * como historial para la tasa de recuperación del panel.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('carritos', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->string('token', 40)->unique();                 // el enlace del correo; nadie necesita sesión para abrirlo
            $t->json('items');                                 // [{key, nombre, precio, imagen, url}] tal como se vio en la tienda
            $t->decimal('total', 12, 2)->default(0);
            $t->string('origen', 10)->default('carrito');      // carrito | pedido (uno vencido sin pagar)
            $t->foreignId('pedido_id')->nullable()->constrained('pedidos')->nullOnDelete();
            $t->timestamp('actualizado_en');                   // último cambio del cliente: desde acá corre la hora del primer aviso
            $t->unsignedTinyInteger('recordatorios')->default(0);
            $t->timestamp('recordado_en')->nullable();
            $t->timestamp('recuperado_en')->nullable();        // compró después de un recordatorio
            $t->foreignId('recuperado_pedido_id')->nullable()->constrained('pedidos')->nullOnDelete();
            $t->timestamps();
            $t->index(['user_id', 'recuperado_en']);
            $t->index(['recordatorios', 'actualizado_en']);
        });

        Schema::table('users', fn (Blueprint $t) => $t->boolean('sin_recordatorios')->default(false));

        // La política de privacidad cuenta los recordatorios (solo si el párrafo sigue como lo dejó la migración de textos)
        $antes = '<p>Los avisos de tu pedido (recibido, pago confirmado, en camino), las respuestas a tus consultas y, si te suscribiste, el newsletter. No agregamos píxeles de seguimiento a los correos.</p>';
        $despues = '<p>Los avisos de tu pedido (recibido, pago confirmado, en camino), las respuestas a tus consultas y, si te suscribiste, el newsletter. Si dejas productos en el carrito o un pedido sin pagar, te mandamos hasta dos recordatorios al correo de tu cuenta, con un enlace para no recibir más. No agregamos píxeles de seguimiento a los correos.</p>';
        $pagina = DB::table('pages')->where('slug', 'privacidad')->first();
        if ($pagina && str_contains((string) $pagina->content, $antes)) {
            DB::table('pages')->where('id', $pagina->id)->update(['content' => str_replace($antes, $despues, $pagina->content), 'updated_at' => now()]);
        }
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $t) => $t->dropColumn('sin_recordatorios'));
        Schema::dropIfExists('carritos');
    }
};
