<?php

namespace App\Http\Controllers\Automation;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\AutomationReport;
use App\Models\AutomationReportView;
use App\Models\SystemNotification;

class AutomationReportController extends Controller
{
    /**
     * 🔐 Verifica token seguro para n8n
     */
    protected function authorizeAutomation(Request $request): void
    {
        $incomingToken = (string) $request->header('X-AUTOMATION-TOKEN');
        $systemToken   = (string) config('app.automation_token');

        if (!hash_equals($systemToken, $incomingToken)) {
            abort(403, 'Unauthorized');
        }
    }

    /**
     * 🔁 USADO POR n8n
     * Guarda reporte automático (semanal / mensual)
     */
    public function store(Request $request)
    {
        $this->authorizeAutomation($request);

        $validated = $request->validate([
            'period'        => ['required', 'string', 'max:20'],
            'period_start'  => ['required', 'date'],
            'period_end'    => ['required', 'date'],
            'report'        => ['required', 'array'],
            'engine'        => ['nullable', 'string'],
            'prompt_version'=> ['nullable', 'string'],
        ]);

        $saved = AutomationReport::updateOrCreate(
            ['period' => $validated['period']],
            [
                'content'        => $validated['report'],
                'period_start'   => $validated['period_start'],
                'period_end'     => $validated['period_end'],
                'engine_version' => $validated['engine'] ?? 'gpt-4o',
                'prompt_version' => $validated['prompt_version'] ?? 'retail_v1',
                'generated_at'   => now(),
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | 🔔 Crear notificación del sistema
        |--------------------------------------------------------------------------
        */
        SystemNotification::updateOrCreate(
            [
                'type'      => 'report',
                'report_id' => $saved->id,
            ],
            [
                'title'   => 'Nuevo análisis inteligente disponible',
                'message' => 'Se generó el reporte automático del periodo ' . $validated['period'],
            ]
        );

        return response()->json([
            'ok' => true,
            'report_id' => $saved->id,
        ]);
    }

    /**
     * 📥 Devuelve el último reporte cerrado
     * Solo ADMIN
     */
    public function latest()
    {
        $user = auth()->user();

        if (!$user || $user->rol !== 'admin') {
            return response()->json(['show' => false]);
        }

        $report = AutomationReport::whereDate('period_end', '<=', now())
            ->latest('period_end')
            ->first();

        if (!$report) {
            return response()->json(['show' => false]);
        }

        $alreadyViewed = AutomationReportView::where('report_id', $report->id)
            ->where('user_id', $user->id)
            ->exists();

        return response()->json([
            'show'   => !$alreadyViewed,
            'report' => $report,
        ]);
    }

    /**
     * 👁️ Vista detallada (Inertia)
     */
    public function show(AutomationReport $report)
    {
        return inertia('Admin/Automation/Show', [
            'report' => $report,
        ]);
    }

    /**
     * ✅ Marcar como visto
     */
    public function markViewed(AutomationReport $report)
    {
        AutomationReportView::updateOrCreate(
            [
                'report_id' => $report->id,
                'user_id'   => auth()->id(),
            ],
            [
                'viewed_at' => now(),
            ]
        );

        return response()->json(['ok' => true]);
    }
}