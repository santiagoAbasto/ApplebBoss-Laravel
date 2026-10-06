<?php

namespace Tests\Feature;

use App\Models\ConfiguracionTienda;
use App\Models\Resena;
use App\Models\User;
use App\Support\ResenasDeGoogle;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ResenasDeGoogleTest extends TestCase
{
    use RefreshDatabase;

    private const PAGINA_1 = [
        'reviews' => [
            ['reviewId' => 'r1', 'reviewer' => ['displayName' => 'María Fernanda López'], 'starRating' => 'FIVE',
                'comment' => "Excelente atención\n\n(Translated by Google)\nExcellent service", 'createTime' => '2026-09-01T15:00:00Z'],
            // Solo estrellas: cuenta en el promedio de Google pero no hay texto que mostrar
            ['reviewId' => 'r2', 'reviewer' => ['displayName' => 'Sin Texto'], 'starRating' => 'FOUR', 'createTime' => '2026-09-02T15:00:00Z'],
        ],
        'averageRating' => 4.8, 'totalReviewCount' => 72, 'nextPageToken' => 'p2',
    ];

    private const PAGINA_2 = [
        'reviews' => [
            ['reviewId' => 'r3', 'reviewer' => ['displayName' => 'A Google user', 'isAnonymous' => true], 'starRating' => 'THREE',
                'comment' => "(Translated by Google) Good but slow\n\n(Original)\nBueno, pero tardaron", 'createTime' => '2026-09-03T15:00:00Z'],
        ],
        'averageRating' => 4.8, 'totalReviewCount' => 72,
    ];

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        config(['services.google.client_id' => 'cliente', 'services.google.client_secret' => 'secreto']);
    }

    private function fingirGoogle(array ...$paginas): void
    {
        $resenas = Http::sequence();
        foreach ($paginas as $pagina) {
            $resenas->push($pagina);
        }

        Http::fake([
            'oauth2.googleapis.com/token' => Http::response(['access_token' => 'acceso']),
            'mybusinessaccountmanagement.googleapis.com/*' => Http::response(['accounts' => [['name' => 'accounts/1']]]),
            'mybusinessbusinessinformation.googleapis.com/*' => Http::response(['locations' => [
                ['name' => 'locations/9', 'title' => 'Apple Boss', 'metadata' => ['mapsUri' => 'https://maps.google.com/?cid=9']],
            ]]),
            'mybusiness.googleapis.com/v4/accounts/1/locations/9/reviews*' => $resenas,
        ]);
    }

    public function test_trae_todas_las_paginas_sin_publicar_con_el_texto_original_y_el_promedio_de_google(): void
    {
        ResenasDeGoogle::conectar('refresh', 'dueno@example.com');
        $this->fingirGoogle(self::PAGINA_1, self::PAGINA_2);

        $this->assertSame(['nuevas' => 2, 'actualizadas' => 0, 'borradas' => 0], ResenasDeGoogle::importar());

        $maria = Resena::where('google_id', 'r1')->firstOrFail();
        $this->assertSame('Excelente atención', $maria->texto);
        $this->assertSame(5, $maria->calificacion);
        $this->assertSame('google', $maria->fuente);
        $this->assertSame('https://maps.google.com/?cid=9', $maria->enlace);
        $this->assertFalse($maria->publicada);
        $this->assertSame('María L.', $maria->firma());

        $anonima = Resena::where('google_id', 'r3')->firstOrFail();
        $this->assertSame('Bueno, pero tardaron', $anonima->texto);
        $this->assertSame('Cliente de Google', $anonima->nombre);
        $this->assertNull(Resena::where('google_id', 'r2')->first());

        $this->assertSame(['fuente' => 'google', 'promedio' => 4.8, 'total' => 72, 'enlace' => 'https://maps.google.com/?cid=9'], ResenasDeGoogle::resumen());
        $this->assertSame('accounts/1/locations/9', ConfiguracionTienda::get('google_resenas_ubicacion'));
        Http::assertSent(fn ($r) => str_contains($r->url(), 'pageToken=p2'));
    }

    public function test_no_duplica_y_borra_las_que_se_borraron_en_google(): void
    {
        ResenasDeGoogle::conectar('refresh', null);
        $this->fingirGoogle(self::PAGINA_1, self::PAGINA_2, self::PAGINA_2);

        ResenasDeGoogle::importar();
        Resena::where('google_id', 'r3')->update(['publicada' => true]);

        // Segunda vuelta: r1 ya no está en Google
        $this->assertSame(['nuevas' => 0, 'actualizadas' => 0, 'borradas' => 1], ResenasDeGoogle::importar());
        $this->assertSame(['r3'], Resena::pluck('google_id')->all());
        $this->assertTrue(Resena::firstOrFail()->publicada); // lo que aprobó el panel no se pierde
    }

    public function test_si_google_retira_el_permiso_no_toca_nada_y_avisa_en_el_panel(): void
    {
        ResenasDeGoogle::conectar('refresh', null);
        Resena::create(['nombre' => 'Ana Paz', 'calificacion' => 5, 'texto' => 'Muy buena atención', 'fuente' => 'google',
            'google_id' => 'r9', 'fecha' => '2026-09-01', 'publicada' => true]);
        Http::fake(['oauth2.googleapis.com/token' => Http::response(['error' => 'invalid_grant'], 400)]);

        try {
            ResenasDeGoogle::importar();
            $this->fail('Debió fallar.');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('Vuelve a conectar', $e->getMessage());
        }

        $this->assertSame(1, Resena::count());
        $this->assertStringContainsString('Vuelve a conectar', ResenasDeGoogle::estado()['error']);
    }

    public function test_el_panel_conecta_con_permiso_offline_y_publica_de_una_vez_solo_las_de_google(): void
    {
        $admin = User::factory()->create(['rol' => 'admin']);

        $ida = $this->actingAs($admin)->get('/admin/resenas/google/conectar');
        $ida->assertRedirect();
        $url = $ida->headers->get('Location');
        $this->assertStringStartsWith('https://accounts.google.com/', $url);
        $this->assertStringContainsString(urlencode(ResenasDeGoogle::SCOPE), $url);
        $this->assertStringContainsString('access_type=offline', $url);
        $this->assertStringContainsString(urlencode('/admin/resenas/google/volver'), $url);

        Resena::create(['nombre' => 'Ana Paz', 'calificacion' => 5, 'texto' => 'Muy buena atención', 'fuente' => 'google', 'google_id' => 'r1', 'fecha' => '2026-09-01']);
        Resena::create(['nombre' => 'Luis Rojas', 'calificacion' => 4, 'texto' => 'Me atendieron bien', 'fuente' => 'whatsapp', 'fecha' => '2026-09-01']);

        $this->actingAs($admin)->post('/admin/resenas/google/publicar')->assertRedirect();
        $this->assertTrue(Resena::where('google_id', 'r1')->value('publicada'));
        $this->assertFalse(Resena::where('fuente', 'whatsapp')->value('publicada'));
    }

    public function test_el_comando_diario_no_hace_nada_sin_google_conectado(): void
    {
        Http::fake();

        $this->artisan('resenas:google')->assertSuccessful();
        Http::assertNothingSent();
    }
}
