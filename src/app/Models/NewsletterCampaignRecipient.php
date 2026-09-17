<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class NewsletterCampaignRecipient extends Model
{
    protected $fillable = ['campaign_id', 'subscriber_id', 'email', 'estado', 'error', 'enviado_at'];

    protected function casts(): array
    {
        return ['enviado_at' => 'datetime'];
    }

    public function subscriber(): BelongsTo
    {
        return $this->belongsTo(NewsletterSubscriber::class, 'subscriber_id');
    }
}
