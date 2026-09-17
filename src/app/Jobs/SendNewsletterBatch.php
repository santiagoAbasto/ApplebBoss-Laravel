<?php

namespace App\Jobs;

use App\Mail\NewsletterCampaignMail;
use App\Models\NewsletterCampaign;
use App\Models\NewsletterCampaignRecipient;
use App\Support\NewsletterContent;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

/**
 * Envía un lote de correos. Cada destinatario se marca al enviarse, así un reintento
 * del job nunca manda dos veces el mismo correo.
 */
class SendNewsletterBatch implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 85;

    public function __construct(public int $campaignId, public array $recipientIds) {}

    public function handle(): void
    {
        $campaign = NewsletterCampaign::find($this->campaignId);
        if (! $campaign || $campaign->estado !== 'enviando') {
            return;
        }

        $bloques = NewsletterContent::forView($campaign->bloques ?? []);

        $recipients = NewsletterCampaignRecipient::with('subscriber')
            ->whereIn('id', $this->recipientIds)
            ->where('estado', 'pendiente')
            ->get();

        foreach ($recipients as $r) {
            // Permite cancelar a mitad de camino
            if (NewsletterCampaign::whereKey($campaign->id)->value('estado') !== 'enviando') {
                return;
            }

            // Se dio de baja después de programado el envío
            if (! $r->subscriber || $r->subscriber->unsubscribed_at) {
                $r->update(['estado' => 'omitido']);
                continue;
            }

            try {
                Mail::to($r->email)->send(new NewsletterCampaignMail(
                    $campaign,
                    $bloques,
                    route('newsletter.baja', $r->subscriber->token),
                ));
                $r->update(['estado' => 'enviado', 'enviado_at' => now(), 'error' => null]);
                $campaign->increment('enviados');
            } catch (\Throwable $e) {
                $r->update(['estado' => 'fallido', 'error' => Str::limit($e->getMessage(), 480, '')]);
                $campaign->increment('fallidos');
                Log::warning('Newsletter: fallo de envío', ['campaign' => $campaign->id, 'recipient' => $r->id, 'error' => $e->getMessage()]);
            }
        }

        $quedan = NewsletterCampaignRecipient::where('campaign_id', $campaign->id)->where('estado', 'pendiente')->exists();
        if (! $quedan) {
            NewsletterCampaign::whereKey($campaign->id)->where('estado', 'enviando')
                ->update(['estado' => 'enviada', 'finalizada_at' => now()]);
        }
    }
}
