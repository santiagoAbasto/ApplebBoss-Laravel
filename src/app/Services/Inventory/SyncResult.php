<?php

namespace App\Services\Inventory;

class SyncResult
{
    public function __construct(
        public readonly int    $created   = 0,
        public readonly int    $updated   = 0,
        public readonly int    $skipped   = 0,
        public readonly int    $errors    = 0,
        public readonly array  $errorLog  = [],
        public readonly float  $durationMs = 0.0,
    ) {}

    public function toArray(): array
    {
        return [
            'created'     => $this->created,
            'updated'     => $this->updated,
            'skipped'     => $this->skipped,
            'errors'      => $this->errors,
            'duration_ms' => $this->durationMs,
        ];
    }
}
