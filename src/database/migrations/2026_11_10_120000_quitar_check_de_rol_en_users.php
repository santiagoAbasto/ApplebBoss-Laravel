<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * En PostgreSQL el `enum('admin','vendedor')` original dejó un CHECK (`users_rol_check`) que el `->change()` a texto de
 * 2026_09_16_200100 no quitó. Por eso la base rechazaba a todo cliente de la tienda (rol «cliente») y a los roles
 * propios: el 01-11-2026 una clienta no pudo crear su cuenta con Google. Qué rol vale lo decide la app, no la columna.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE users DROP CONSTRAINT IF EXISTS users_rol_check');
        }
    }

    public function down(): void
    {
        // No se vuelve a cerrar: rechazaría a los clientes y a los roles propios que ya existan.
    }
};
