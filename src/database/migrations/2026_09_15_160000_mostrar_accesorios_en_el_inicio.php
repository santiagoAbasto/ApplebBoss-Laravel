<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Accesorios en el inicio: su acceso sale en «¿Qué estás buscando?» y su descripción nombra lo que tiene (cargadores,
 * vidrios, fundas y cables). Solo si la categoría sigue como la dejó el seeder: no pisa lo que se editó en el panel.
 */
return new class extends Migration
{
    private const ANTES = 'Cargadores, cables y más.';

    private const DESPUES = 'Cargadores, vidrios, fundas, cables y más.';

    public function up(): void
    {
        DB::table('catalog_categories')
            ->where('slug', 'accesorios')
            ->where('description', self::ANTES)
            ->update(['show_home' => true, 'description' => self::DESPUES, 'updated_at' => now()]);
    }

    public function down(): void
    {
        DB::table('catalog_categories')
            ->where('slug', 'accesorios')
            ->where('description', self::DESPUES)
            ->update(['show_home' => false, 'description' => self::ANTES, 'updated_at' => now()]);
    }
};
