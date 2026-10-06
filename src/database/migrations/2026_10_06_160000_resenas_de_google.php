<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Las reseñas del perfil de Google llegan solas, una vez al día, por la API de Google Business Profile.
 * El id de Google evita duplicarlas y permite borrar acá las que se borraron allá.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('resenas', function (Blueprint $t) {
            $t->string('google_id', 200)->nullable()->unique()->after('pedido_id');
        });
    }

    public function down(): void
    {
        Schema::table('resenas', function (Blueprint $t) {
            $t->dropUnique(['google_id']);
            $t->dropColumn('google_id');
        });
    }
};
