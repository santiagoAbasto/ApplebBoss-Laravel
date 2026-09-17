<?php

namespace Tests\Feature;

use App\Models\NavMenuItem;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Tienda online → Menú: los enlaces con los que el cliente se mueve por la tienda.
 * Son tres menús independientes (computadora, celular y pie de página) y solo el de la computadora
 * admite opciones adentro de un enlace.
 */
class MenusAdminTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        NavMenuItem::query()->delete();
    }

    private function admin(): User
    {
        return User::factory()->create(['rol' => 'admin']);
    }

    private function enlace(string $slot, string $label, array $datos = []): NavMenuItem
    {
        static $orden = 0;
        $orden++;

        return NavMenuItem::create(array_merge([
            'slot'       => $slot,
            'label'      => $label,
            'url'        => '/' . str($label)->slug(),
            'active'     => true,
            'sort_order' => $orden,
        ], $datos));
    }

    // ─── Panel ──────────────────────────────────────────────────────────────────

    public function test_solo_un_admin_entra(): void
    {
        $enlace = $this->enlace('header', 'iPhone');

        $this->get('/admin/sitio/menus')->assertRedirect('/login');

        $vendedor = User::factory()->create(['rol' => 'vendedor']);
        $this->actingAs($vendedor)->get('/admin/sitio/menus')->assertForbidden();
        $this->actingAs($vendedor)->patch(route('admin.menus.update', $enlace), ['label' => 'Otro'])->assertForbidden();
        $this->actingAs($vendedor)->delete(route('admin.menus.destroy', $enlace))->assertForbidden();

        $this->assertSame('iPhone', $enlace->fresh()->label);
    }

    public function test_el_listado_arma_los_tres_menus_y_dice_lo_que_falta(): void
    {
        $iphone = $this->enlace('header', 'iPhone');
        $this->enlace('header', 'Nuevos', ['parent_id' => $iphone->id, 'url' => '/catalogo?condicion=Nuevo']);
        $this->enlace('mobile', 'iPhone');
        $this->enlace('mobile', 'Trade-In', ['url' => '/trade-in']);
        $this->enlace('footer', 'Contacto', ['group' => 'Ayuda']);

        $this->actingAs($this->admin())->get('/admin/sitio/menus')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Menus/Index')
                ->has('menus.header', 1)
                ->has('menus.header.0.children', 1)
                ->where('menus.header.0.children.0.label', 'Nuevos')
                ->has('menus.mobile', 2)
                ->has('menus.footer', 1)
                ->where('menus.footer.0.group', 'Ayuda')
                ->where('resumen.mobile.visibles', 2)
                // Al menú de arriba le falta el «Trade-In» que sí está en el del celular
                ->where('faltantes.header.mobile', 1)
                ->where('columnas.0', 'Ayuda')
                ->where('slotInicial', 'header'));
    }

    public function test_se_puede_abrir_directo_un_menu(): void
    {
        $this->actingAs($this->admin())->get('/admin/sitio/menus?menu=footer')
            ->assertInertia(fn (Assert $page) => $page->where('slotInicial', 'footer'));

        $this->actingAs($this->admin())->get('/admin/sitio/menus?menu=inventado')
            ->assertInertia(fn (Assert $page) => $page->where('slotInicial', 'header'));
    }

    public function test_agregar_un_enlace_lo_pone_al_final_de_su_menu(): void
    {
        $this->enlace('footer', 'Contacto', ['group' => 'Ayuda']);

        $this->actingAs($this->admin())
            ->post(route('admin.menus.store'), ['slot' => 'footer', 'label' => 'Garantía', 'url' => '/paginas/garantia', 'group' => 'Ayuda'])
            ->assertRedirect();

        $this->assertSame(['Contacto', 'Garantía'], NavMenuItem::where('slot', 'footer')->orderBy('sort_order')->pluck('label')->all());
    }

    public function test_una_opcion_adentro_solo_cuelga_del_menu_de_arriba(): void
    {
        $delCelular = $this->enlace('mobile', 'iPhone');

        $this->actingAs($this->admin())
            ->post(route('admin.menus.store'), ['slot' => 'mobile', 'parent_id' => $delCelular->id, 'label' => 'Nuevos', 'url' => '/catalogo'])
            ->assertStatus(422);

        $this->assertSame(0, NavMenuItem::where('parent_id', $delCelular->id)->count());
    }

    public function test_el_texto_se_limpia_y_la_direccion_peligrosa_se_rechaza(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->post(route('admin.menus.store'), ['slot' => 'header', 'label' => '<b>Ofertas</b>', 'url' => '/catalogo'])
            ->assertRedirect();
        $this->assertSame('Ofertas', NavMenuItem::latest('id')->first()->label);

        $this->actingAs($admin)
            ->post(route('admin.menus.store'), ['slot' => 'header', 'label' => 'Malo', 'url' => 'javascript:alert(1)'])
            ->assertSessionHasErrors('url');
        $this->assertNull(NavMenuItem::where('label', 'Malo')->first());
    }

    public function test_el_interruptor_esconde_el_enlace_sin_borrarlo(): void
    {
        $enlace = $this->enlace('header', 'Ofertas');

        $this->actingAs($this->admin())
            ->patch(route('admin.menus.update', $enlace), ['active' => false])
            ->assertRedirect();

        $this->assertFalse($enlace->fresh()->active);
        $this->assertSame([], NavMenuItem::serializeSlot('header'));
    }

    public function test_borrar_un_enlace_se_lleva_sus_opciones(): void
    {
        $padre = $this->enlace('header', 'iPhone');
        $hijo  = $this->enlace('header', 'Nuevos', ['parent_id' => $padre->id]);

        $this->actingAs($this->admin())->delete(route('admin.menus.destroy', $padre))->assertRedirect();

        $this->assertNull(NavMenuItem::find($padre->id));
        $this->assertNull(NavMenuItem::find($hijo->id));
    }

    public function test_el_orden_se_guarda(): void
    {
        $uno = $this->enlace('header', 'iPhone');
        $dos = $this->enlace('header', 'Mac');

        $this->actingAs($this->admin())
            ->post(route('admin.menus.reorder'), ['orden' => [
                ['id' => $dos->id, 'orden' => 1],
                ['id' => $uno->id, 'orden' => 2],
            ]])
            ->assertRedirect();

        $this->assertSame(['Mac', 'iPhone'], NavMenuItem::where('slot', 'header')->orderBy('sort_order')->pluck('label')->all());
    }

    public function test_copiar_trae_los_que_faltan_y_no_repite(): void
    {
        $iphone = $this->enlace('header', 'iPhone');
        $this->enlace('header', 'Nuevos', ['parent_id' => $iphone->id]);
        $this->enlace('header', 'Fundas MYSKIN', ['url' => '/myskin', 'myskin' => true]);
        $this->enlace('header', 'Oculto', ['active' => false]);
        $this->enlace('mobile', 'iPhone');

        $this->actingAs($this->admin())
            ->post(route('admin.menus.copiar'), ['desde' => 'header', 'hacia' => 'mobile'])
            ->assertRedirect();

        $delCelular = NavMenuItem::where('slot', 'mobile')->orderBy('sort_order')->get();
        // Copia solo lo que falta y está visible; las opciones de adentro no van (el celular no las muestra)
        $this->assertSame(['iPhone', 'Fundas MYSKIN'], $delCelular->pluck('label')->all());
        $this->assertTrue($delCelular->firstWhere('label', 'Fundas MYSKIN')->myskin);
        $this->assertSame(0, NavMenuItem::where('slot', 'mobile')->whereNotNull('parent_id')->count());
    }

    public function test_al_copiar_al_pie_los_enlaces_caen_en_una_columna(): void
    {
        $this->enlace('footer', 'Contacto', ['group' => 'Ayuda']);
        $this->enlace('header', 'iPhone');

        $this->actingAs($this->admin())
            ->post(route('admin.menus.copiar'), ['desde' => 'header', 'hacia' => 'footer'])
            ->assertRedirect();

        $this->assertSame('Ayuda', NavMenuItem::where('slot', 'footer')->where('label', 'iPhone')->value('group'));
    }

    // ─── Tienda ─────────────────────────────────────────────────────────────────

    public function test_la_tienda_solo_recibe_los_enlaces_visibles(): void
    {
        $padre = $this->enlace('header', 'iPhone');
        $this->enlace('header', 'Nuevos', ['parent_id' => $padre->id]);
        $this->enlace('header', 'Oculto', ['active' => false]);
        $this->enlace('header', 'Escondida', ['parent_id' => $padre->id, 'active' => false]);

        $menu = NavMenuItem::serializeSlot('header');

        $this->assertCount(1, $menu);
        $this->assertSame('iPhone', $menu[0]['label']);
        $this->assertCount(1, $menu[0]['items']);
        $this->assertSame('Nuevos', $menu[0]['items'][0]['label']);
    }

    public function test_un_enlace_de_afuera_se_marca_como_externo(): void
    {
        $this->enlace('footer', 'WhatsApp', ['url' => 'https://wa.me/59171234567', 'open_in_new_tab' => true, 'group' => 'Ayuda']);

        $this->actingAs($this->admin())->get('/admin/sitio/menus')
            ->assertInertia(fn (Assert $page) => $page
                ->where('menus.footer.0.externo', true)
                ->where('menus.footer.0.open_in_new_tab', true));
    }
}
