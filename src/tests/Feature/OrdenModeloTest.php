<?php

namespace Tests\Feature;

use App\Support\Catalogo\OrdenModelo;
use Tests\TestCase;

class OrdenModeloTest extends TestCase
{
    /** @param array<int,string> $nombres @return array<int,string> */
    private function orden(array $nombres): array
    {
        return OrdenModelo::aplicar(collect($nombres)->map(fn ($n) => ['name' => $n]))
            ->pluck('name')->all();
    }

    public function test_ordena_modelo_nuevo_primero_y_por_capacidad(): void
    {
        $resultado = $this->orden([
            'iPhone 15 Pro Max 256 GB Natural',
            'iPhone 18 Pro 256 GB Negro',
            'iPhone DUO 512 GB Titanio',
            'iPhone 18 Pro Max 1 TB Desert',
            'iPhone 18 Pro Max 256 GB Desert',
            'iPhone 17 Pro Max 2 TB Naranja',
        ]);

        $this->assertSame([
            'iPhone DUO 512 GB Titanio',        // modelo nuevo sin número → arriba
            'iPhone 18 Pro Max 1 TB Desert',    // 18 Pro Max, 1 TB antes que 256 GB
            'iPhone 18 Pro Max 256 GB Desert',
            'iPhone 18 Pro 256 GB Negro',       // Pro después de Pro Max
            'iPhone 17 Pro Max 2 TB Naranja',   // 17 después de 18 (aunque tenga 2 TB)
            'iPhone 15 Pro Max 256 GB Natural', // 15 al final
        ], $resultado);
    }

    public function test_capacidad_de_mayor_a_menor_en_el_mismo_modelo(): void
    {
        $this->assertSame(
            ['iPhone 16 Pro 1 TB', 'iPhone 16 Pro 512 GB', 'iPhone 16 Pro 256 GB'],
            $this->orden(['iPhone 16 Pro 256 GB', 'iPhone 16 Pro 1 TB', 'iPhone 16 Pro 512 GB'])
        );
    }
}
