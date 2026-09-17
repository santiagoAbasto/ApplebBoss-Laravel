<?php

namespace Tests\Feature;

use App\Models\NewsletterSubscriber;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NewsletterTest extends TestCase
{
    use RefreshDatabase;

    public function test_subscribe_stores_normalized_email(): void
    {
        $this->postJson('/newsletter', ['email' => '  Cliente@Correo.COM '])
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertDatabaseHas('newsletter_subscribers', ['email' => 'cliente@correo.com', 'source' => 'footer']);
    }

    public function test_duplicate_email_returns_same_response_without_duplicating(): void
    {
        $this->postJson('/newsletter', ['email' => 'a@b.com'])->assertOk();
        $this->postJson('/newsletter', ['email' => 'A@B.com'])->assertOk()->assertJson(['ok' => true]);

        $this->assertSame(1, NewsletterSubscriber::count());
    }

    public function test_invalid_email_is_rejected(): void
    {
        $this->postJson('/newsletter', ['email' => 'no-es-correo'])->assertStatus(422);
        $this->assertSame(0, NewsletterSubscriber::count());
    }

    public function test_honeypot_does_not_store(): void
    {
        $this->postJson('/newsletter', ['email' => 'bot@spam.com', 'website' => 'http://spam'])->assertOk();
        $this->assertSame(0, NewsletterSubscriber::count());
    }

    public function test_resubscribe_clears_unsubscribed_at(): void
    {
        NewsletterSubscriber::create(['email' => 'vuelve@correo.com', 'unsubscribed_at' => now()]);

        $this->postJson('/newsletter', ['email' => 'vuelve@correo.com'])->assertOk();

        $this->assertNull(NewsletterSubscriber::first()->unsubscribed_at);
    }
}
