<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Automation\AutomationReportController;
use App\Http\Controllers\Automation\TopProductsController;
use App\Http\Controllers\ReporteController;

/*
|--------------------------------------------------------------------------
| 🤖 RUTAS USADAS EXCLUSIVAMENTE POR n8n
| Middleware: automation
|--------------------------------------------------------------------------
| ❌ NO requieren login
| ✅ Protegidas por X-AUTOMATION-TOKEN
| ✅ Usadas por n8n (cron, IA, reportes automáticos)
*/
Route::middleware('automation')
    ->prefix('automation')
    ->group(function () {

        /*
        |--------------------------------------------------
        | Test de conexión n8n → Laravel
        |--------------------------------------------------
        */
        Route::get('/test', function () {
            return response()->json([
                'status'  => 'ok',
                'message' => 'Automation access granted',
            ]);
        });

        /*
        |--------------------------------------------------
        | IA / Análisis: Top productos por categoría
        |--------------------------------------------------
        | GET /api/automation/top-products
        */
        Route::get('/top-products', TopProductsController::class);

        /*
        |--------------------------------------------------
        | n8n → Laravel: Guardar reporte automático
        |--------------------------------------------------
        | POST /api/automation/reports
        */
        Route::post('/reports', [
            AutomationReportController::class,
            'store'
        ]);

        /*
        |--------------------------------------------------
        | n8n → Laravel: Exportar PDF de ventas
        |--------------------------------------------------
        | GET /api/automation/reportes/exportar
        */
        Route::get('/reportes/exportar', [
            ReporteController::class,
            'exportar'
        ]);
    });


/*
|--------------------------------------------------------------------------
| 🧑‍💻 RUTAS USADAS POR EL DASHBOARD (ADMIN)
| Middleware: auth normal
|--------------------------------------------------------------------------
| ❌ NO accesibles por n8n
| ✅ Usadas por React + Inertia
*/
Route::middleware('auth')->group(function () {

    /*
    |--------------------------------------------------
    | Último reporte automático (alerta dashboard)
    |--------------------------------------------------
    | GET /api/automation/reports/latest
    */
    Route::get('/automation/reports/latest', [
        AutomationReportController::class,
        'latest'
    ]);

    /*
    |--------------------------------------------------
    | Marcar reporte como leído
    |--------------------------------------------------
    | POST /api/automation/reports/{report}/read
    */
    Route::post('/automation/reports/{report}/read', [
        AutomationReportController::class,
        'markAsRead'
    ]);
});
