<?php

namespace Database\Seeders;

use App\Models\StoreService;
use Illuminate\Database\Seeder;

/**
 * Tarjetas de ejemplo para «Nuestros servicios». Solo se cargan con la tabla vacía: lo que el administrador escribió
 * en Tienda online → Servicios manda y volver a correr el seeder no lo pisa.
 */
class StoreServiceSeeder extends Seeder
{
    public function run(): void
    {
        if (StoreService::exists()) {
            return;
        }

        $services = [
            ['icon' => 'scan', 'title' => 'Diagnóstico gratuito', 'description' => 'Revisamos tu equipo sin costo para identificar el problema antes de cualquier reparación.'],
            ['icon' => 'wrench', 'title' => 'Servicio técnico', 'description' => 'Reparaciones de iPhone y Mac realizadas por técnicos con experiencia en equipos Apple.'],
            ['icon' => 'chat', 'title' => 'Atención directa', 'description' => 'Te asesoramos por WhatsApp o en tienda para que elijas el equipo correcto.', 'accion' => 'whatsapp'],
            ['icon' => 'badge', 'title' => 'Equipos revisados', 'description' => 'Todo equipo seminuevo pasa por revisión técnica antes de publicarse. Sin sorpresas.'],
        ];

        foreach ($services as $i => $service) {
            StoreService::create(array_merge(['accion' => 'ninguna'], $service, ['active' => true, 'sort_order' => $i]));
        }
    }
}
