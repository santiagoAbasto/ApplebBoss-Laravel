<?php

namespace App\Http\Controllers\Automation;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AutomationReport;

class AutomationReportController extends Controller
{
    /**
     * 🔁 USADO POR n8n
     * Guarda el reporte generado automáticamente
     */
    public function store(Request $request)
    {
        $request->validate([
            'period' => ['required', 'string'],
            'report' => ['required', 'string'],
        ]);

        $saved = AutomationReport::create([
            'period' => $request->period,
            'content' => $request->report,
            'read' => false,
        ]);

        return response()->json([
            'ok' => true,
            'id' => $saved->id,
        ]);
    }

    /**
     * 📥 USADO POR EL DASHBOARD
     * Devuelve el último reporte NO leído
     */
    public function latest()
    {
        $report = AutomationReport::where('read', false)
            ->latest()
            ->first();

        return response()->json([
            'report' => $report,
        ]);
    }

    /**
     * ✅ USADO POR EL DASHBOARD
     * Marca un reporte como leído
     */
    public function markAsRead(AutomationReport $report)
    {
        $report->update([
            'read' => true,
        ]);

        return response()->json([
            'ok' => true,
        ]);
    }
}
