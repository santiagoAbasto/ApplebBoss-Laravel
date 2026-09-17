<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Home administrable en el mismo orden del header:
 * Hero → Confianza → Destacados → Categorías → iPhone → Mac → Más Apple
 * → Fundas MYSKIN → Accesorios → Seminuevos → Trade-In → resto.
 */
return new class extends Migration
{
    private const NEW_SECTIONS = [
        ['type' => 'featured',          'label' => 'Productos destacados', 'settings' => ['titulo' => 'Productos destacados', 'limit' => 8]],
        ['type' => 'category_products', 'label' => 'iPhone',               'settings' => ['titulo' => 'iPhone', 'categoria' => 'celulares', 'limit' => 8]],
        ['type' => 'category_products', 'label' => 'Mac',                  'settings' => ['titulo' => 'Mac', 'categoria' => 'computadoras', 'limit' => 8]],
        ['type' => 'category_products', 'label' => 'Más Apple',            'settings' => ['titulo' => 'Más Apple', 'categoria' => 'productos-apple', 'limit' => 8]],
        ['type' => 'category_products', 'label' => 'Accesorios',           'settings' => ['titulo' => 'Accesorios', 'categoria' => 'accesorios', 'limit' => 8]],
        ['type' => 'trade_in',          'label' => 'Trade-In',             'settings' => ['titulo' => 'Tu equipo actual vale como parte de pago']],
    ];

    private const ORDER = [
        ['hero', null],
        ['trust', null],
        ['featured', null],
        ['category_rail', null],
        ['category_products', 'iPhone'],
        ['category_products', 'Mac'],
        ['category_products', 'Más Apple'],
        ['myskin', null],
        ['category_products', 'Accesorios'],
        ['semiused', null],
        ['trade_in', null],
        ['product_collection', null],
        ['new_arrivals', null],
        ['offers', null],
        ['services', null],
        ['location', null],
        ['faq', null],
    ];

    public function up(): void
    {
        $now = now();

        foreach (self::NEW_SECTIONS as $row) {
            $exists = DB::table('home_sections')
                ->where('type', $row['type'])
                ->where('label', $row['label'])
                ->exists();

            if (! $exists) {
                DB::table('home_sections')->insert([
                    'type'       => $row['type'],
                    'label'      => $row['label'],
                    'active'     => true,
                    'orden'      => 0,
                    'settings'   => json_encode($row['settings'], JSON_UNESCAPED_UNICODE),
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        }

        foreach (self::ORDER as $i => [$type, $label]) {
            DB::table('home_sections')
                ->where('type', $type)
                ->when($label, fn ($q) => $q->where('label', $label))
                ->update(['orden' => $i + 1]);
        }

        // "Nuevos ingresos" repetía los mismos productos que "Disponibles ahora".
        // Queda oculto por defecto; el admin puede reactivarlo con el switch.
        DB::table('home_sections')->where('type', 'new_arrivals')->update(['active' => false]);
    }

    public function down(): void
    {
        DB::table('home_sections')->whereIn('type', ['featured', 'category_products', 'trade_in'])->delete();
    }
};
