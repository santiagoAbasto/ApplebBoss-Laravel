<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::create('servicio_tecnicos', function (Blueprint $table) {
            $table->id();
            $table->string('codigo_nota', 20)->unique(); // ✅ Código nota agregado y único
            $table->string('cliente');
            $table->string('telefono')->nullable();
            $table->string('equipo');
            $table->text('detalle_servicio');
            $table->decimal('precio_costo', 10, 2)->default(0);
            $table->decimal('precio_venta', 10, 2)->default(0);
            $table->string('tecnico');
            $table->date('fecha');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('servicio_tecnicos');
    }
};
