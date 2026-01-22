<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SecuenciasSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('secuencias')->updateOrInsert(
            ['clave' => 'ventas'],
            ['ultimo_numero' => 0, 'created_at' => now(), 'updated_at' => now()]
        );

        DB::table('secuencias')->updateOrInsert(
            ['clave' => 'servicio_tecnico'],
            ['ultimo_numero' => 0, 'created_at' => now(), 'updated_at' => now()]
        );
    }
}
