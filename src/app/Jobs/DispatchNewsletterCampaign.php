<?php

namespace App\Jobs;

use App\Models\ConfiguracionTienda;
use App\Models\NewsletterCampaign;
use App\Models\NewsletterCampaignRecipient;
use App\Models\NewsletterSubscriber;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Arma la lista de destinatarios de una campaña y la reparte en lotes por minuto
 * (respeta límites del proveedor SMTP; Gmail permite ~500 correos/día).
 */
class DispatchNewsletterCampaign implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public const MAX_POR_MINUTO = 40;

    public function __construct(public int $campaignId) {}

    public function handle(): void
    {
        $campaign = NewsletterCampaign::find($this->campaignId);
        if (! $campaign || $campaign->estado !== 'enviando') {
            return;
        }

        $query = NewsletterSubscriber::active();
        if ($campaign->destino === 'seleccion') {
            $query->whereIn('id', $campaign->seleccion ?? []);
        }

        $now = now();
        $query->select('id', 'email')->orderBy('id')->chunk(500, function ($subs) use ($campaign, $now) {
            NewsletterCampaignRecipient::insertOrIgnore($subs->map(fn ($s) => [
                'campaign_id'   => $campaign->id,
                'subscriber_id' => $s->id,
                'email'         => $s->email,
                'estado'        => 'pendiente',
                'created_at'    => $now,
                'updated_at'    => $now,
            ])->all());
        });

        $pendientes = NewsletterCampaignRecipient::where('campaign_id', $campaign->id)
            ->where('estado', 'pendiente')
            ->orderBy('id')
            ->pluck('id');

        $campaign->update(['total' => NewsletterCampaignRecipient::where('campaign_id', $campaign->id)->count()]);

        if ($pendientes->isEmpty()) {
            $campaign->update(['estado' => 'enviada', 'finalizada_at' => now()]);
            return;
        }

        $porMinuto = max(1, min(self::MAX_POR_MINUTO, (int) ConfiguracionTienda::get('newsletter_lote_por_minuto', 20)));

        foreach ($pendientes->chunk($porMinuto)->values() as $i => $ids) {
            SendNewsletterBatch::dispatch($campaign->id, $ids->values()->all())->delay(now()->addMinutes($i));
        }
    }
}
