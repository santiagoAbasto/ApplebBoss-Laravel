<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AutomationReport extends Model
{
    protected $fillable = ['period', 'content', 'read'];
}
