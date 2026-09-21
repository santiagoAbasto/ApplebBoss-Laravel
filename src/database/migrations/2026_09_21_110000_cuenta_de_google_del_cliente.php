<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Ata la cuenta de Google a la cuenta de la tienda.
 *
 * Se guarda el `sub` de Google, no el correo: el correo de una cuenta de Google puede
 * cambiar, el identificador no. Único, para que dos cuentas nunca compartan el mismo Google.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->string('google_id')->nullable()->unique()->after('telefono');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->dropUnique(['google_id']);
            $t->dropColumn('google_id');
        });
    }
};
