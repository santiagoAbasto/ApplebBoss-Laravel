<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemNotification extends Model
{
    protected $fillable = [
        'type',
        'title',
        'message',
        'read',
        'report_id',
        'sale_id',

    ];

    public function report()
    {
        return $this->belongsTo(AutomationReport::class, 'report_id');
    }

    public function sale()
    {
        return $this->belongsTo(Venta::class, 'sale_id');
    }
}
