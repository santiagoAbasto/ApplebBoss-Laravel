<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Automation\AutomationReportController;
use App\Http\Controllers\Automation\TopProductsController;
use App\Http\Controllers\ReporteController;
use App\Http\Controllers\Api\V1\ProductApiController;

// ========================
// 📦 API PÚBLICA v1 — productos y catálogo
// NUNCA exponer: precio_costo, ganancia, IMEI, serial, notas privadas.
// ========================
Route::prefix('v1')
    ->name('api.v1.')
    ->middleware(['throttle:120,1'])
    ->group(function () {
        Route::get('/products',        [ProductApiController::class, 'index'])->name('products.index');
        Route::get('/filters',         [ProductApiController::class, 'filters'])->name('filters');
        Route::get('/products/{slug}', [ProductApiController::class, 'show'])->name('products.show');
    });

/*
|--------------------------------------------------------------------------
| 🔌 API DE INTEGRACIÓN v1 — solo lectura, para sistemas autorizados (la futura IA de Apple Boss)
|--------------------------------------------------------------------------
| Token: Authorization: Bearer <token> (Sistema → Integraciones API). Cada ruta pide su permiso.
| Se anota cada llamada, también las rechazadas. Contrato: docs/integrations/APPLE_BOSS_API_CONTRACT.md
| No hay POST, PUT, PATCH ni DELETE: esta API no cambia stock, precios ni productos.
*/
Route::prefix('v1/integration')
    ->name('api.integration.')
    ->middleware(['integracion.registro', 'throttle:integracion-ip', 'auth:sanctum', 'throttle:integracion'])
    ->controller(\App\Http\Controllers\Api\Integracion\IntegracionController::class)
    ->group(function () {
        $id = '[a-z0-9-]{1,40}';
        Route::get('/health', 'health')->middleware('integracion.scope')->name('health');
        Route::get('/products', 'products')->middleware('integracion.scope:integration.products.read')->name('products');
        Route::get('/products/{id}', 'product')->where('id', $id)->middleware('integracion.scope:integration.products.read')->name('product');
        Route::get('/products/{id}/images', 'images')->where('id', $id)->middleware('integracion.scope:integration.products.read,integration.media.read')->name('product.images');
        Route::get('/products/{id}/price', 'price')->where('id', $id)->middleware('integracion.scope:integration.products.read,integration.pricing.read')->name('product.price');
        Route::get('/products/{id}/availability', 'availability')->where('id', $id)->middleware('integracion.scope:integration.products.read,integration.inventory.read')->name('product.availability');
        Route::get('/categories', 'categories')->middleware('integracion.scope:integration.categories.read')->name('categories');
        Route::get('/exchange-rates', 'exchangeRates')->middleware('integracion.scope:integration.exchange_rates.read')->name('exchange-rates');
        Route::get('/changes', 'changes')->middleware('integracion.scope:integration.products.read')->name('changes');
    });

/*
|--------------------------------------------------------------------------
| 🤖 RUTAS USADAS EXCLUSIVAMENTE POR n8n
| Middleware: automation
|--------------------------------------------------------------------------
| ❌ NO requieren login
| ✅ Protegidas por X-AUTOMATION-TOKEN
| ✅ Usadas por n8n (cron, IA, reportes automáticos)
*/
Route::middleware(['automation', 'throttle:30,1'])
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
    });

/*
|--------------------------------------------------
| Export financiero (costo + ganancia de toda la tienda)
|--------------------------------------------------
| GET /api/automation/reportes/exportar
| Ámbito 'export': token APARTE (AUTOMATION_EXPORT_TOKEN). n8n NO lo usa.
| Vacío por defecto = cerrado. El admin exporta desde el panel (ruta web con sesión).
*/
Route::middleware(['automation:export', 'throttle:30,1'])
    ->prefix('automation')
    ->group(function () {
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
