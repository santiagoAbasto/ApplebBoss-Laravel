<?php

namespace Database\Seeders;

use App\Models\StoreLocation;
use Illuminate\Database\Seeder;

class StoreLocationSeeder extends Seeder
{
    public function run(): void
    {
        // Lo cargado en Tienda online → Ubicaciones manda: volver a correr el seeder no lo pisa
        if (StoreLocation::exists()) {
            return;
        }

        StoreLocation::create([
            'name'        => 'Apple Boss Cochabamba',
            'address'     => 'Cochabamba, Bolivia',
            'city'        => 'Cochabamba',
            'country'     => 'Bolivia',
            'description' => 'Visita nuestra tienda en Cochabamba. Puedes ver y probar los equipos en persona y hacer tu consulta directamente con nuestro equipo.',
            'active'      => true,
            'sort_order'  => 0,
        ]);
    }
}
