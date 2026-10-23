<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * La marca del teléfono (iphone, samsung, google, xiaomi…). Antes todo celular se mostraba como «iPhone»; con esto un
 * Pixel sale como Google, etc. Se rellena por nombre con el comando `celulares:marcar` (default: iphone).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('celulares', function (Blueprint $table) {
            if (! Schema::hasColumn('celulares', 'marca')) {
                $table->string('marca', 32)->nullable()->after('modelo')->index();
            }
        });
    }

    public function down(): void
    {
        Schema::table('celulares', function (Blueprint $table) {
            if (Schema::hasColumn('celulares', 'marca')) {
                $table->dropColumn('marca');
            }
        });
    }
};
