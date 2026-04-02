<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SystemNotification;

class SystemNotificationController extends Controller
{
    public function index()
    {
        return response()->json([
            'notifications' => SystemNotification::latest()->take(20)->get(),
        ]);
    }

    public function markAsRead(SystemNotification $notification)
    {
        $notification->update(['read' => true]);

        return response()->json(['ok' => true]);
    }
}
