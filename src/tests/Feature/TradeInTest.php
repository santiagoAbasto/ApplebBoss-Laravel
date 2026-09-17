<?php

namespace Tests\Feature;

use App\Models\SystemNotification;
use App\Models\TradeInSolicitud;
use App\Models\User;
use App\Support\TradeIn\Cuestionario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Trade-In: el formulario público (/trade-in) con el cuestionario por tipo de equipo, la confirmación que solo ve quien
 * envió la solicitud, las fotos privadas, el aviso del panel y el seguimiento en Tienda online → Trade-In.
 */
class TradeInTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['rol' => 'admin', 'name' => 'Ana']);
    }

    private function todoFunciona(string $tipo): array
    {
        $componentes = collect(Cuestionario::paraTipo($tipo))->firstWhere('id', 'funcionamiento')['componentes'];

        return collect($componentes)->mapWithKeys(fn (array $c) => [$c['id'] => 'funciona'])->all();
    }

    private function formulario(array $cambios = [], array $respuestas = []): array
    {
        return [
            'tipo_dispositivo'  => 'iPhone',
            'modelo'            => 'iPhone 14 Pro',
            'capacidad'         => '256 GB',
            'color'             => 'Morado oscuro',
            'respuestas'        => [
                'cuenta_apple' => 'mia', 'bypass' => 'no', 'operador' => 'liberado', 'imei' => 'no', 'empresa' => 'no',
                'funcionamiento' => $this->todoFunciona('iPhone'),
                'pantalla' => 'leve', 'cuerpo' => 'leve', 'trasera' => 'impecable', 'lentes' => 'sanos', 'agua' => 'no',
                'bateria' => 88, 'piezas' => 'no_aparece', 'reparaciones' => ['ninguna'], 'garantia' => 'no', 'incluye' => ['caja', 'cable'],
                ...$respuestas,
            ],
            'nombre_contacto'   => 'Carla Rojas',
            'telefono_contacto' => '70012345',
            'email_contacto'    => 'carla@example.com',
            'ciudad'            => 'Cochabamba',
            'interes'           => 'iPhone 16 Pro',
            'declaracion'       => '1',
            ...$cambios,
        ];
    }

    private function solicitud(array $datos = []): TradeInSolicitud
    {
        return TradeInSolicitud::create(array_merge([
            'codigo'            => TradeInSolicitud::generarCodigo(),
            'tipo_dispositivo'  => 'iPhone',
            'modelo'            => 'iPhone 13',
            'capacidad'         => '128 GB',
            'respuestas'        => $this->formulario()['respuestas'],
            'nombre_contacto'   => 'Luis Pérez',
            'telefono_contacto' => '+591 7001-2345',
            'estado'            => 'nuevo',
            'historial'         => [['tipo' => 'recibida', 'fecha' => now()->toIso8601String()]],
        ], $datos));
    }

    // ─── Tienda ─────────────────────────────────────────────────────────────────

    public function test_el_formulario_trae_el_cuestionario_y_los_modelos_de_la_base(): void
    {
        $this->get('/trade-in')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Store/TradeIn')
                ->has('cuestionario.pasos', 6)
                ->where('cuestionario.preguntas.iPhone', fn ($preguntas) => collect($preguntas)->pluck('id')->contains('bypass')
                    && ! collect($preguntas)->flatMap(fn ($p) => $p['opciones'] ?? [])->contains(fn ($o) => isset($o['nivel'])))
                ->where('cuestionario.preguntas.AirPods', fn ($preguntas) => ! collect($preguntas)->pluck('id')->contains('bypass'))
                ->where('cuestionario.tipos', fn ($tipos) => collect($tipos)->where('grupo', 'Otras marcas')->pluck('valor')->all()
                    === ['Celular Android', 'Laptop', 'PC de escritorio', 'Consola', 'Otro'])
                ->where('cuestionario.preguntas.Consola', fn ($preguntas) => collect($preguntas)->pluck('id')->contains('baneo')
                    && ! collect($preguntas)->pluck('id')->contains('cuenta_apple'))
                ->has('cuestionario.marcas.Laptop')
                ->has('modelos.iPhone'));
    }

    public function test_recibe_equipos_de_otras_marcas_con_sus_propias_preguntas(): void
    {
        // Una consola: marca, cuenta, baneo y lectora; sin pantalla ni batería
        $consola = [
            'tipo_dispositivo' => 'Consola',
            'marca'            => 'Microsoft Xbox',
            'modelo'           => 'Xbox Series X',
            'capacidad'        => '1 TB',
            'color'            => '',
            'respuestas'       => [
                'cuenta_consola' => 'mia', 'baneo' => 'no', 'modificada' => 'no',
                'funcionamiento' => $this->todoFunciona('Consola'), 'lectora' => 'falla',
                'pantalla' => 'sin_pantalla', 'cuerpo' => 'leve', 'agua' => 'no',
                'reparaciones' => ['ninguna'], 'garantia' => 'marca', 'controles' => 2, 'incluye' => ['cables', 'juegos'],
                'bateria' => 90, 'cuenta_apple' => 'mia',
            ],
        ];
        $this->post('/trade-in', $this->formulario($consola))->assertSessionHasNoErrors();

        $xbox = TradeInSolicitud::firstOrFail();
        $this->assertSame('Microsoft Xbox', $xbox->marca);
        $this->assertSame('Xbox Series X · 1 TB', $xbox->dispositivo());
        $this->assertArrayNotHasKey('bateria', $xbox->respuestas);
        $this->assertArrayNotHasKey('cuenta_apple', $xbox->respuestas);
        $this->assertSame(2, $xbox->respuestas['controles']);
        $this->assertSame('detalles', $xbox->grado());   // la lectora falla
        $this->assertContains('La lectora de discos falla', array_column($xbox->alertas(), 'texto'));

        // Una laptop: la marca, el procesador y la memoria son obligatorios
        $laptop = [
            'tipo_dispositivo' => 'Laptop',
            'marca'            => '',
            'modelo'           => 'ROG Strix G15',
            'capacidad'        => '512 GB',
            'memoria'          => '16 GB',
            'color'            => '',
            'respuestas'       => [
                'bloqueo_pc' => 'si', 'empresa' => 'no',
                'funcionamiento' => $this->todoFunciona('Laptop'),
                'pantalla' => 'impecable', 'cuerpo' => 'impecable', 'agua' => 'no',
                'duracion' => 'media', 'reparaciones' => ['mejoras'], 'garantia' => 'no', 'incluye' => ['cargador'],
            ],
        ];
        $this->post('/trade-in', $this->formulario($laptop))
            ->assertSessionHasErrors(['marca' => 'Escribe la marca de tu equipo.', 'respuestas.procesador' => 'Escribe: Procesador.']);

        $laptop['marca'] = 'ASUS';
        $laptop['respuestas'] += ['procesador' => '  AMD Ryzen 7 <b>5800H</b> ', 'grafica' => 'NVIDIA GeForce RTX 3070'];
        $this->post('/trade-in', $this->formulario($laptop))->assertSessionHasNoErrors();

        $asus = TradeInSolicitud::latest('id')->firstOrFail();
        $this->assertSame('ASUS ROG Strix G15 · 512 GB · 16 GB de memoria', $asus->dispositivo());
        $this->assertSame('AMD Ryzen 7 5800H', $asus->respuestas['procesador']);
        $this->assertSame('revisar', $asus->grado());   // contraseña de BIOS
        $this->assertSame('Tu equipo', $asus->resumen()[0]['titulo']);
        $this->assertSame(['Procesador', 'Tarjeta gráfica'], array_column($asus->resumen()[0]['filas'], 'pregunta'));
        $this->actingAs($this->admin())->get(route('admin.trade-in.show', $asus))
            ->assertInertia(fn (Assert $page) => $page
                ->where('solicitud.marca', 'ASUS')
                ->where('solicitud.resumen.0.filas.1.respuesta', 'NVIDIA GeForce RTX 3070')
                ->where('solicitud.inventario', null));
        auth()->logout();

        // Un celular Android con la cuenta de otra persona
        $this->post('/trade-in', $this->formulario([
            'tipo_dispositivo' => 'Celular Android',
            'marca'            => 'Samsung',
            'modelo'           => 'Galaxy S23',
            'capacidad'        => '256 GB',
            'memoria'          => '8 GB',
            'color'            => '',
            'respuestas'       => [
                'cuenta_google' => 'otra', 'bypass' => 'no', 'operador' => 'liberado', 'imei' => 'no', 'empresa' => 'no',
                'funcionamiento' => $this->todoFunciona('Celular Android'),
                'pantalla' => 'impecable', 'cuerpo' => 'impecable', 'trasera' => 'impecable', 'lentes' => 'sanos', 'agua' => 'no',
                'duracion' => 'buena', 'reparaciones' => ['ninguna'], 'garantia' => 'no', 'incluye' => ['solo'],
            ],
        ]))->assertSessionHasNoErrors();

        $galaxy = TradeInSolicitud::latest('id')->firstOrFail();
        $this->assertSame('Samsung Galaxy S23 · 256 GB · 8 GB de memoria', $galaxy->dispositivo());
        $this->assertSame([['nivel' => 'critico', 'texto' => 'Tiene la cuenta de Google o de la marca de otra persona']], $galaxy->alertas());
    }

    public function test_la_solicitud_llega_al_panel_con_sus_respuestas_y_un_aviso(): void
    {
        $this->post('/trade-in', $this->formulario())
            ->assertRedirect(route('trade-in.confirmacion', ['codigo' => 'AB-TI-000001']));

        $solicitud = TradeInSolicitud::firstOrFail();
        $this->assertSame('nuevo', $solicitud->estado);
        $this->assertSame('no', $solicitud->respuestas['bypass']);
        $this->assertSame(88, $solicitud->respuestas['bateria']);
        $this->assertSame('iPhone 14 Pro · 256 GB · Morado oscuro', $solicitud->dispositivo());
        $this->assertSame('muy_bueno', $solicitud->grado());
        $this->assertSame('recibida', $solicitud->historial[0]['tipo']);

        $aviso = SystemNotification::where('type', 'trade_in')->firstOrFail();
        $this->assertSame($solicitud->id, (int) $aviso->trade_in_id);
        $this->assertStringContainsString('AB-TI-000001', $aviso->message);

        $this->get('/trade-in/confirmacion/AB-TI-000001')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Store/TradeInConfirmacion')
                ->where('nombre', 'Carla')
                ->where('equipo', 'iPhone 14 Pro · 256 GB · Morado oscuro')
                ->missing('valor_estimado')
                ->missing('notas_internas')
                ->where('seo.robots', 'noindex,nofollow'));
    }

    public function test_la_confirmacion_solo_la_ve_quien_envio_la_solicitud(): void
    {
        $solicitud = $this->solicitud();

        // El código es correlativo: sin la sesión que la envió, no se muestran el nombre ni el teléfono
        $this->get("/trade-in/confirmacion/{$solicitud->codigo}")->assertNotFound();
    }

    public function test_valida_las_preguntas_de_cada_tipo_de_equipo(): void
    {
        $sinBypass = $this->formulario();
        unset($sinBypass['respuestas']['bypass'], $sinBypass['respuestas']['funcionamiento']['senal']);

        $this->post('/trade-in', [...$sinBypass, 'telefono_contacto' => 'llámame', 'declaracion' => '0'])
            ->assertSessionHasErrors([
                'respuestas.bypass' => 'Responde: ¿Tiene bypass o se desbloqueó con un programa?',
                'respuestas.funcionamiento.senal' => 'Dinos si funciona: Señal y llamadas con chip.',
                'telefono_contacto' => 'Escribe un número válido, por ejemplo 70012345.',
                'declaracion',
            ]);
        $this->assertSame(0, TradeInSolicitud::count());

        // Unos AirPods no llevan preguntas de cuenta ni de IMEI: si llegan, se descartan
        $this->post('/trade-in', $this->formulario([
            'tipo_dispositivo' => 'AirPods',
            'modelo'           => 'AirPods Pro (2.ª generación)',
            'capacidad'        => '',
            'respuestas'       => [
                'bypass' => 'si', 'funcionamiento' => $this->todoFunciona('AirPods'), 'cuerpo' => 'visible', 'agua' => 'no',
                'reparaciones' => ['ninguna', 'bateria'], 'garantia' => 'no_se', 'incluye' => ['solo'],
            ],
        ]))->assertSessionHasNoErrors();

        $airpods = TradeInSolicitud::firstOrFail();
        $this->assertArrayNotHasKey('bypass', $airpods->respuestas);
        $this->assertSame(['bateria'], $airpods->respuestas['reparaciones']);   // «Nunca se reparó» no va con otra
        $this->assertSame('bueno', $airpods->grado());
    }

    public function test_un_robot_que_llena_el_campo_oculto_no_crea_nada(): void
    {
        $this->post('/trade-in', $this->formulario(['sitio_web' => 'https://spam.example']))
            ->assertRedirect(route('trade-in.index'));

        $this->assertSame(0, TradeInSolicitud::count());
        $this->assertSame(0, SystemNotification::count());
    }

    public function test_las_fotos_son_privadas_y_se_borran_con_la_solicitud(): void
    {
        Storage::fake('local');

        $this->post('/trade-in', $this->formulario(['fotos' => [
            UploadedFile::fake()->image('frente.jpg', 1200, 900),
            UploadedFile::fake()->image('bateria.png', 800, 1600),
        ]]))->assertSessionHasNoErrors();

        $solicitud = TradeInSolicitud::firstOrFail();
        $this->assertCount(2, $solicitud->fotos);
        Storage::disk('local')->assertExists($solicitud->fotos[0]['ruta']);
        $this->assertStringStartsWith("trade-in/{$solicitud->codigo}/", $solicitud->fotos[0]['ruta']);

        $this->get(route('admin.trade-in.foto', [$solicitud, 0]))->assertRedirect('/login');

        $admin = $this->admin();
        $this->actingAs($admin)->get(route('admin.trade-in.foto', [$solicitud, 1]))->assertOk();
        $this->actingAs($admin)->get(route('admin.trade-in.foto', [$solicitud, 5]))->assertNotFound();

        $this->actingAs($admin)->delete(route('admin.trade-in.destroy', $solicitud))->assertRedirect(route('admin.trade-in.index'));
        Storage::disk('local')->assertMissing($solicitud->fotos[0]['ruta']);
        $this->assertSame(0, TradeInSolicitud::count());
        $this->assertSame(0, SystemNotification::where('trade_in_id', $solicitud->id)->count());
    }

    // ─── Panel ──────────────────────────────────────────────────────────────────

    public function test_solo_un_admin_entra(): void
    {
        $solicitud = $this->solicitud();

        $this->get(route('admin.trade-in.index'))->assertRedirect('/login');
        $this->get(route('admin.trade-in.show', $solicitud))->assertRedirect('/login');
        $this->patch(route('admin.trade-in.update', $solicitud), ['estado' => 'rechazado'])->assertRedirect('/login');
        $this->assertSame('nuevo', $solicitud->fresh()->estado);
    }

    public function test_el_listado_marca_lo_critico_lo_demorado_y_el_whatsapp(): void
    {
        $this->travel(-30)->hours();
        $conBypass = $this->solicitud(['respuestas' => $this->formulario([], ['bypass' => 'si'])['respuestas']]);
        $this->travelBack();
        $this->solicitud(['estado' => 'completado', 'telefono_contacto' => '4-4251234']);

        $this->actingAs($this->admin())
            ->get(route('admin.trade-in.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/TradeIn/Index')
                ->where('resumen.demoradas', 1)
                ->where('resumen.por_estado.nuevo', 1)
                ->where('solicitudes', fn ($filas) => ($fila = collect($filas)->firstWhere('id', $conBypass->id))
                    && $fila['criticas'] === ['Tiene bypass']
                    && $fila['grado'] === 'revisar'
                    && $fila['demorada'] === true
                    && $fila['whatsapp'] === '59170012345'
                    && collect($filas)->firstWhere('estado', 'completado')['whatsapp'] === null)
                ->where('avisosAdmin.trade_in', 1));
    }

    public function test_el_detalle_resume_las_respuestas_por_paso(): void
    {
        $solicitud = $this->solicitud(['respuestas' => $this->formulario([], ['pantalla' => 'rota', 'bateria' => 76])['respuestas']]);

        $this->actingAs($this->admin())
            ->get(route('admin.trade-in.show', $solicitud))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/TradeIn/Show')
                ->where('solicitud.grado', 'detalles')
                ->where('solicitud.alertas', fn ($alertas) => collect($alertas)->pluck('texto')->contains('Pantalla fisurada o rota')
                    && collect($alertas)->pluck('texto')->contains('Batería al 76 %'))
                ->where('solicitud.resumen', fn ($pasos) => collect($pasos)->pluck('titulo')->all()
                    === ['Cuenta y bloqueos', 'Funcionamiento', 'Estado físico', 'Batería y reparaciones'])
                ->where('solicitud.ficha', null));
    }

    public function test_el_seguimiento_registra_la_etapa_el_valor_y_quien_la_atiende(): void
    {
        $admin = $this->admin();
        $solicitud = $this->solicitud();

        $this->actingAs($admin)->from(route('admin.trade-in.show', $solicitud))
            ->patch(route('admin.trade-in.update', $solicitud), [
                'estado' => 'cotizado', 'valor_estimado' => '2800', 'nota_estimacion' => 'Con caja suma Bs 100.', 'notas_internas' => 'Revisar Face ID.',
            ])
            ->assertSessionHas('success', "La solicitud {$solicitud->codigo} pasó a «Cotizada».");

        $solicitud->refresh();
        $this->assertSame($admin->id, $solicitud->atendido_por);
        $this->assertSame(['recibida', 'etapa', 'valor'], array_column($solicitud->historial, 'tipo'));
        $this->assertSame('Ana', $solicitud->historial[1]['usuario']);
        $this->assertStringContainsString('el valor estimado es de Bs 2.800, sujeto a la revisión del equipo en la tienda. Con caja suma Bs 100.', $solicitud->mensajeWhatsapp());
    }

    public function test_escribir_por_whatsapp_pasa_una_nueva_a_esperando_respuesta(): void
    {
        $solicitud = $this->solicitud();

        $this->actingAs($this->admin())->post(route('admin.trade-in.contacto', $solicitud))->assertSessionHas('success');

        $solicitud->refresh();
        $this->assertSame('pendiente', $solicitud->estado);
        $this->assertSame(['recibida', 'whatsapp', 'etapa'], array_column($solicitud->historial, 'tipo'));
    }

    public function test_el_numero_de_whatsapp_se_arma_con_codigo_de_pais(): void
    {
        $numero = fn (string $telefono) => (new TradeInSolicitud(['telefono_contacto' => $telefono]))->whatsapp();

        $this->assertSame('59170012345', $numero('70012345'));
        $this->assertSame('59160012345', $numero('600 12 345'));
        $this->assertSame('59170012345', $numero('+591 7001-2345'));
        $this->assertSame('59170012345', $numero('00591 70012345'));
        $this->assertSame('13055550100', $numero('+1 (305) 555-0100'));
        $this->assertNull($numero('4-4251234'));   // un fijo no tiene WhatsApp
    }
}
