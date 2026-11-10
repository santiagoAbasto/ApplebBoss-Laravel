<?php

namespace Tests\Unit;

use App\Support\Proveedor\Colores;
use PHPUnit\Framework\TestCase;

/**
 * Los colores del proveedor salen con el nombre de la página de Apple (apple.com/la y support.apple.com/es-lamr,
 * verificados el 10-11-2026). Lo que no tiene equivalente seguro no se inventa: devuelve null.
 */
class ColoresOficialesTest extends TestCase
{
    private const IPHONE_18_PRO = ['Negro', 'Plata', 'Glaciar', 'Borgoña'];
    private const IPHONE_17_PRO = ['Plata', 'Naranja cósmico', 'Azul profundo'];
    private const IPHONE_17 = ['Negro', 'Blanco', 'Azul neblina', 'Salvia', 'Lavanda'];
    private const IPHONE_16 = ['Negro', 'Blanco', 'Rosa', 'Verde azulado', 'Ultramarino'];
    private const WATCH_12 = ['Bronce oscuro', 'Oro claro', 'Negro', 'Gris espacial'];
    private const WATCH_11 = ['Oro rosa', 'Plata', 'Gris espacial', 'Negro azabache'];
    private const IPAD_AIR = ['Azul', 'Morado', 'Blanco estelar', 'Gris espacial'];

    public function test_el_vino_de_la_lista_es_el_borgona_de_apple(): void
    {
        $this->assertSame('Borgoña', Colores::oficial('Vino', self::IPHONE_18_PRO));
        $this->assertSame('Glaciar', Colores::oficial('Azul', self::IPHONE_18_PRO));
        $this->assertSame('Plata', Colores::oficial('Silver', self::IPHONE_18_PRO));
    }

    public function test_cosmic_y_deep_del_17_pro(): void
    {
        $this->assertSame('Naranja cósmico', Colores::oficial('Cosmic', self::IPHONE_17_PRO));
        $this->assertSame('Azul profundo', Colores::oficial('Deep', self::IPHONE_17_PRO));
    }

    public function test_el_mismo_nombre_del_proveedor_segun_el_modelo(): void
    {
        $this->assertSame('Lavanda', Colores::oficial('Lila', self::IPHONE_17));
        $this->assertSame('Morado', Colores::oficial('Lila', self::IPAD_AIR));
        $this->assertSame('Salvia', Colores::oficial('Verde', self::IPHONE_17));
        $this->assertSame('Azul neblina', Colores::oficial('Azul', self::IPHONE_17));
        $this->assertSame('Ultramarino', Colores::oficial('Azul', self::IPHONE_16));
        $this->assertSame('Verde azulado', Colores::oficial('Teal', self::IPHONE_16));
        $this->assertSame('Gris espacial', Colores::oficial('Negro', self::IPAD_AIR));
        $this->assertSame('Negro azabache', Colores::oficial('Negro', self::WATCH_11));
        $this->assertSame('Oro rosa', Colores::oficial('Gold Pink', self::WATCH_11));
        $this->assertSame('Oro rosa', Colores::oficial('Rosa', self::WATCH_11));
    }

    public function test_el_watch_series_12(): void
    {
        $this->assertSame('Negro', Colores::oficial('Negro', self::WATCH_12));
        $this->assertSame('Gris espacial', Colores::oficial('Plomo', self::WATCH_12));
        $this->assertSame('Bronce oscuro', Colores::oficial('Bronce', self::WATCH_12));
        $this->assertSame('Oro claro', Colores::oficial('Crema', self::WATCH_12));
    }

    public function test_lo_que_no_tiene_equivalente_no_se_inventa(): void
    {
        $this->assertNull(Colores::oficial('Fucsia', self::IPHONE_17));
        $this->assertNull(Colores::oficial('Vino', self::IPHONE_17));     // el iPhone 17 no viene en borgoña
        $this->assertNull(Colores::oficial('Negro', []));                 // sin ficha, no hay con qué comparar
    }
}
