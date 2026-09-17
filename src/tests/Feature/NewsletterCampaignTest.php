<?php

namespace Tests\Feature;

use App\Jobs\DispatchNewsletterCampaign;
use App\Jobs\SendNewsletterBatch;
use App\Mail\NewsletterCampaignMail;
use App\Models\NewsletterCampaign;
use App\Models\NewsletterCampaignRecipient;
use App\Models\NewsletterSubscriber;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class NewsletterCampaignTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->forceFill(['rol' => 'admin'])->save();
        return $user;
    }

    private function campaign(array $overrides = []): NewsletterCampaign
    {
        return NewsletterCampaign::create(array_merge([
            'asunto'  => 'Ofertas de septiembre',
            'bloques' => [['tipo' => 'titulo', 'texto' => 'Hola'], ['tipo' => 'texto', 'texto' => 'Nuevos equipos']],
        ], $overrides));
    }

    public function test_non_admin_cannot_access_campaigns(): void
    {
        $user = User::factory()->create(['email_verified_at' => now()]);
        $this->actingAs($user)->get(route('admin.newsletter.campaigns.index'))->assertStatus(403);
    }

    public function test_admin_can_create_and_open_campaign(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.newsletter.campaigns.store'))
            ->assertRedirect();

        $campaign = NewsletterCampaign::first();
        $this->assertSame('borrador', $campaign->estado);

        $this->get(route('admin.newsletter.campaigns.edit', $campaign))->assertOk();
    }

    public function test_update_sanitizes_blocks(): void
    {
        $campaign = $this->campaign();

        $this->actingAs($this->admin())->patchJson(route('admin.newsletter.campaigns.update', $campaign), [
            'asunto'  => '<b>Promo</b>',
            'destino' => 'todos',
            'bloques' => [
                ['tipo' => 'texto', 'texto' => '<script>alert(1)</script>Hola'],
                ['tipo' => 'boton', 'texto' => 'Clic', 'url' => 'javascript:alert(1)'],
                ['tipo' => 'imagen', 'url' => 'https://otro-sitio.com/x.png'],
                ['tipo' => 'html', 'texto' => '<iframe>'],
                ['tipo' => 'boton', 'texto' => 'Catálogo', 'url' => '/catalogo'],
            ],
        ])->assertOk();

        $bloques = $campaign->fresh()->bloques;
        $this->assertSame('Promo', $campaign->fresh()->asunto);
        $this->assertCount(2, $bloques); // texto limpio + botón válido
        $this->assertSame('alert(1)Hola', $bloques[0]['texto']);
        $this->assertSame('/catalogo', $bloques[1]['url']);
    }

    public function test_sent_campaign_cannot_be_edited(): void
    {
        $campaign = $this->campaign(['estado' => 'enviada']);

        $this->actingAs($this->admin())
            ->patchJson(route('admin.newsletter.campaigns.update', $campaign), ['asunto' => 'X', 'destino' => 'todos'])
            ->assertStatus(422);
    }

    public function test_send_requires_active_subscribers(): void
    {
        Queue::fake();
        $campaign = $this->campaign();

        $this->actingAs($this->admin())->postJson(route('admin.newsletter.campaigns.send', $campaign))->assertStatus(422);
        Queue::assertNothingPushed();
    }

    public function test_send_dispatches_job_and_locks_campaign(): void
    {
        Queue::fake();
        NewsletterSubscriber::create(['email' => 'a@correo.com']);
        $campaign = $this->campaign();

        $this->actingAs($this->admin())->postJson(route('admin.newsletter.campaigns.send', $campaign))
            ->assertOk()->assertJson(['total' => 1]);

        $this->assertSame('enviando', $campaign->fresh()->estado);
        Queue::assertPushed(DispatchNewsletterCampaign::class);
    }

    public function test_dispatch_creates_recipients_only_for_active_and_selected(): void
    {
        Queue::fake();
        $a = NewsletterSubscriber::create(['email' => 'a@correo.com']);
        $b = NewsletterSubscriber::create(['email' => 'b@correo.com']);
        NewsletterSubscriber::create(['email' => 'baja@correo.com', 'unsubscribed_at' => now()]);

        $todos = $this->campaign(['estado' => 'enviando']);
        (new DispatchNewsletterCampaign($todos->id))->handle();
        $this->assertSame(['a@correo.com', 'b@correo.com'], $todos->recipients()->orderBy('email')->pluck('email')->all());

        $sel = $this->campaign(['estado' => 'enviando', 'destino' => 'seleccion', 'seleccion' => [$b->id]]);
        (new DispatchNewsletterCampaign($sel->id))->handle();
        $this->assertSame(['b@correo.com'], $sel->recipients()->pluck('email')->all());

        Queue::assertPushed(SendNewsletterBatch::class, 2);
    }

    public function test_batch_sends_mail_with_unsubscribe_link_and_finishes(): void
    {
        Mail::fake();
        Queue::fake();
        $sub  = NewsletterSubscriber::create(['email' => 'a@correo.com']);
        $gone = NewsletterSubscriber::create(['email' => 'b@correo.com']);
        $campaign = $this->campaign(['estado' => 'enviando']);
        (new DispatchNewsletterCampaign($campaign->id))->handle();

        $gone->update(['unsubscribed_at' => now()]); // se dio de baja después de programado

        (new SendNewsletterBatch($campaign->id, $campaign->recipients()->pluck('id')->all()))->handle();

        Mail::assertSent(NewsletterCampaignMail::class, 1);
        Mail::assertSent(NewsletterCampaignMail::class, fn ($m) => $m->hasTo('a@correo.com')
            && $m->unsubscribeUrl === route('newsletter.baja', $sub->token));

        $fresh = $campaign->fresh();
        $this->assertSame('enviada', $fresh->estado);
        $this->assertSame(1, $fresh->enviados);
        $this->assertSame('omitido', NewsletterCampaignRecipient::where('email', 'b@correo.com')->value('estado'));
    }

    public function test_cancelled_campaign_stops_sending(): void
    {
        Mail::fake();
        Queue::fake();
        NewsletterSubscriber::create(['email' => 'a@correo.com']);
        $campaign = $this->campaign(['estado' => 'enviando']);
        (new DispatchNewsletterCampaign($campaign->id))->handle();

        $campaign->update(['estado' => 'cancelada']);
        (new SendNewsletterBatch($campaign->id, $campaign->recipients()->pluck('id')->all()))->handle();

        Mail::assertNothingSent();
    }

    public function test_preview_renders_html_without_script(): void
    {
        $this->actingAs($this->admin())
            ->post(route('admin.newsletter.campaigns.preview'), [
                'asunto'  => 'Hola',
                'bloques' => [['tipo' => 'titulo', 'texto' => '<script>x</script>Bienvenido']],
            ])
            ->assertOk()
            ->assertSee('Bienvenido')
            ->assertDontSee('<script>', false);
    }

    public function test_unsubscribe_flow(): void
    {
        $sub = NewsletterSubscriber::create(['email' => 'cliente@correo.com']);

        $this->get(route('newsletter.baja', $sub->token))->assertOk()
            ->assertInertia(fn ($p) => $p->component('Store/NewsletterBaja')->where('estado', 'activo'));

        $this->post(route('newsletter.baja.confirmar', $sub->token))->assertRedirect(route('newsletter.baja', $sub->token));
        $this->assertNotNull($sub->fresh()->unsubscribed_at);
    }

    public function test_one_click_unsubscribe_without_csrf(): void
    {
        $sub = NewsletterSubscriber::create(['email' => 'cliente@correo.com']);

        $this->post(route('newsletter.baja.confirmar', $sub->token), ['List-Unsubscribe' => 'One-Click'])
            ->assertOk()->assertJson(['ok' => true]);
        $this->assertNotNull($sub->fresh()->unsubscribed_at);
    }

    public function test_invalid_token_shows_invalid_page(): void
    {
        $this->get(route('newsletter.baja', 'prueba'))->assertOk()
            ->assertInertia(fn ($p) => $p->where('estado', 'invalido')->where('token', null));
    }

    public function test_import_skips_invalid_and_duplicates(): void
    {
        NewsletterSubscriber::create(['email' => 'ya@correo.com']);

        $this->actingAs($this->admin())->post(route('admin.newsletter.subscribers.import'), [
            'emails' => "nuevo@correo.com, YA@correo.com\nno-es-correo; otro@correo.com",
        ])->assertRedirect();

        $this->assertSame(3, NewsletterSubscriber::count());
        $this->assertNotNull(NewsletterSubscriber::where('email', 'otro@correo.com')->value('token'));
    }
}
