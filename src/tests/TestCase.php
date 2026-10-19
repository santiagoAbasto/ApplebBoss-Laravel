<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Un aviso de obsolescencia de PHP («deprecated») falla la prueba en vez de perderse: Laravel los ignora mientras
     * corren las pruebas y en producción van al canal nulo, así que sin esto un código que la próxima versión de PHP va
     * a romper pasa en silencio. Así se encontraron los dos avisos de PHP 8.5 del 19-10-2026.
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutDeprecationHandling();
    }
}
