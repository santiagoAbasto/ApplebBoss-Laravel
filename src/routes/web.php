<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;

// 📦 Controladores usados
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CelularController;
use App\Http\Controllers\ProductoGeneralController;
use App\Http\Controllers\ComputadoraController;
use App\Http\Controllers\VentaController;
use App\Http\Controllers\ServicioTecnicoController;
use App\Http\Controllers\ReporteController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Admin\CotizacionController;
use App\Http\Controllers\Admin\ExportController;
use App\Http\Controllers\Admin\ClienteAdminController;
use App\Http\Controllers\Api\StockController;
use App\Http\Controllers\ProductoAppleController; // 👈 Asegúrate que esté arriba
use App\Http\Controllers\Vendedor\ProductoVendedorController;
use App\Http\Controllers\Vendedor\DashboardVendedorController;
use App\Http\Controllers\Vendedor\ClienteVendedorController;
use App\Http\Controllers\EgresoController;
use App\Http\Controllers\GoogleDriveController;
use App\Http\Controllers\Automation\AutomationReportController;


// 🏠 Ruta pública inicial
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// 🚀 Redirección al dashboard según el rol autenticado
Route::middleware(['auth', 'verified'])->get('/dashboard', function () {
    $user = auth()->user();
    return redirect()->route($user->rol === 'admin' ? 'admin.dashboard' : 'vendedor.dashboard');
})->name('dashboard');

// 👤 Perfil del usuario (edición, actualización y eliminación)
Route::middleware(['auth'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});


// ========================
// 🛡️ RUTAS ADMINISTRADOR
// ========================
Route::middleware(['auth', 'verified', 'rol:admin'])->prefix('admin')->name('admin.')->group(function () {

    // 📊 Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    // ========================
    // 🤖 AUTOMATION ALERTS (Dashboard IA)
    // ========================
    Route::prefix('automation')->group(function () {

        // Obtener último reporte no leído (Dashboard)
        Route::get('/reports/latest', [
            AutomationReportController::class,
            'latest'
        ])->name('automation.reports.latest');

        // Marcar reporte como leído
        Route::post('/reports/{report}/read', [
            AutomationReportController::class,
            'markAsRead'
        ])->name('automation.reports.read');
    });


    // 📱 CRUD Celulares
    Route::resource('celulares', CelularController::class)
        ->names('celulares')
        ->parameters(['celulares' => 'celular']);

    // 💻 CRUD Computadoras
    Route::resource('computadoras', ComputadoraController::class)
        ->names('computadoras');

    // 📦 CRUD Productos Generales
    Route::resource('productos-generales', ProductoGeneralController::class)
        ->names('productos-generales')
        ->parameters(['productos-generales' => 'producto']);

    // 🛒 CRUD Ventas (rutas especiales primero)
    Route::get('/ventas/buscar-nota', [VentaController::class, 'buscarNota'])->name('ventas.buscarNota');
    Route::get('/ventas/{venta}/boleta', [VentaController::class, 'boleta'])->name('ventas.boleta');

    Route::resource('ventas', VentaController::class)
        ->names('ventas')
        ->parameters(['ventas' => 'venta']);

    // 🧰 CRUD Servicios Técnicos
    Route::resource('servicios', ServicioTecnicoController::class)
        ->only(['index', 'create', 'store'])
        ->names('servicios')
        ->parameters(['servicios' => 'servicio']);

    // 🧾 Boleta A4
    Route::get(
        '/servicios/{servicio}/boleta',
        [ServicioTecnicoController::class, 'boleta']
    )->name('servicios.boleta');

    // 🖨️ Recibo térmico 80mm
    Route::get(
        '/servicios/{servicio}/recibo-80mm',
        [ServicioTecnicoController::class, 'recibo80mm']
    )->name('servicios.recibo80mm');

    Route::get(
        '/ventas/{venta}/boleta-80',
        [VentaController::class, 'boleta80']
    )->name('ventas.boleta80');


    // 📤 Exportaciones de servicios técnicos
    Route::get('/servicios/exportar', [ServicioTecnicoController::class, 'exportar'])->name('servicios.exportar');
    Route::get('/servicios/exportar-dia', [ServicioTecnicoController::class, 'exportarDia'])->name('servicios.exportar-dia');
    Route::get('/servicios/exportar-semana', [ServicioTecnicoController::class, 'exportarSemana'])->name('servicios.exportar-semana');
    Route::get('/servicios/exportar-mes', [ServicioTecnicoController::class, 'exportarMes'])->name('servicios.exportar-mes');
    Route::get('/servicios/exportar-anio', [ServicioTecnicoController::class, 'exportarAnio'])->name('servicios.exportar-anio');
    Route::get('/servicios/exportar-filtrado', [ServicioTecnicoController::class, 'exportarFiltrado'])->name('servicios.exportarFiltrado');

    // 📊 Reportes de ventas
    Route::get('/reportes', [ReporteController::class, 'index'])->name('reportes.index');
    Route::get('/reportes/exportar', [ReporteController::class, 'exportar'])->name('reportes.exportar');
    Route::get('/reportes/exportar-dia', [ReporteController::class, 'exportDia'])->name('reportes.exportar-dia');
    Route::get('/reportes/exportar-semana', [ReporteController::class, 'exportSemana'])->name('reportes.exportar-semana');
    Route::get('/reportes/exportar-mes', [ReporteController::class, 'exportMes'])->name('reportes.exportar-mes');
    Route::get('/reportes/exportar-anio', [ReporteController::class, 'exportAnio'])->name('reportes.exportar-anio');


    // ✔️ Habilitar productos entregados por permuta
    Route::patch('/celulares/{celular}/habilitar', [CelularController::class, 'habilitar'])->name('celulares.habilitar');
    Route::patch('/computadoras/{computadora}/habilitar', [ComputadoraController::class, 'habilitar'])->name('computadoras.habilitar');
    Route::patch('/productos-generales/{producto}/habilitar', [ProductoGeneralController::class, 'habilitar'])->name('productos-generales.habilitar');

    // 📦 Cotizaciones
    Route::resource('cotizaciones', CotizacionController::class)
        ->only(['index', 'create', 'store'])
        ->names('cotizaciones');

    Route::get('cotizaciones/{cotizacion}/pdf', [CotizacionController::class, 'exportarPDF'])->name('cotizaciones.pdf');
    Route::post('cotizaciones/{id}/reenviar', [CotizacionController::class, 'reenviarCorreo'])->name('cotizaciones.reenviar');
    Route::post('cotizaciones/enviar-lote', [CotizacionController::class, 'enviarLoteWhatsapp'])->name('cotizaciones.enviar-lote');

    // 🟢 WhatsApp con mensaje profesional
    Route::get('cotizaciones/whatsapp-final', [CotizacionController::class, 'whatsappFinalLibre'])->name('cotizaciones.enviar-whatsapp-libre');

    // 📄 Vista índice de exportaciones (Ziggy depende de esta)
    Route::get('/exportar', [ExportController::class, 'index'])->name('exportaciones.index');

    // 📤 Exportaciones individuales
    Route::get('/exportar/celulares', [ExportController::class, 'celulares'])->name('exportar.celulares');
    Route::get('/exportar/computadoras', [ExportController::class, 'computadoras'])->name('exportar.computadoras');
    Route::get('/exportar/productos-generales', [ExportController::class, 'productosGenerales'])->name('exportar.productos-generales');
    Route::get('/exportar/productos-generales/{tipo}', [ExportController::class, 'productosGeneralesPorTipo'])->name('exportar.productos-generales.tipo');
    Route::get('/exportar/productos-apple', [ExportController::class, 'productosApple'])->name('exportar.productos-apple');

    // 🍎 CRUD Productos Apple
    Route::resource('productos-apple', ProductoAppleController::class)
        ->names('productos-apple')
        ->parameters(['productos-apple' => 'productoApple']);

    // 📇 CLIENTES - ADMIN
    Route::get('/clientes', [ClienteAdminController::class, 'index'])->name('clientes.index');
    Route::get('/clientes/sugerencias', [ClienteAdminController::class, 'sugerencias'])->name('clientes.sugerencias');
    Route::get('/clientes/{cliente}/edit', [ClienteAdminController::class, 'edit'])->name('clientes.edit');
    Route::put('/clientes/{cliente}', [ClienteAdminController::class, 'update'])->name('clientes.update');
    Route::post('/clientes/promociones/enviar', [ClienteAdminController::class, 'enviarPromocionMasiva'])->name('clientes.promociones.enviar');

    // EGRESOS ADMIN
    Route::get('/egresos', [EgresoController::class, 'index'])->name('egresos.index');
    Route::get('/egresos/create', [EgresoController::class, 'create'])->name('egresos.create');
    Route::post('/egresos', [EgresoController::class, 'store'])->name('egresos.store');
    Route::get('/egresos/exportar/pdf', [EgresoController::class, 'exportarPDF'])->name('egresos.exportar-pdf');
});

// ========================
// 🧑‍💼 RUTAS VENDEDOR
// =======================

Route::middleware(['auth', 'verified', 'rol:vendedor'])->prefix('vendedor')->name('vendedor.')->group(function () {

    Route::get('/dashboard', fn() => Inertia::render('Vendedor/Dashboard'))->name('dashboard');
    Route::get('/dashboard', [DashboardVendedorController::class, 'index'])->name('dashboard');


    Route::get('/productos', [ProductoVendedorController::class, 'index'])->name('productos.index');
    Route::get('/celulares', [CelularController::class, 'index'])->name('celulares.index');
    Route::get('/computadoras', [ComputadoraController::class, 'index'])->name('computadoras.index');
    Route::get('/productos-generales', [ProductoGeneralController::class, 'index'])->name('productos-generales.index');

    // VENTAS
    Route::get('/ventas', [VentaController::class, 'index'])->name('ventas.index');
    Route::get('/ventas/create', [VentaController::class, 'create'])->name('ventas.create');
    Route::post('/ventas', [VentaController::class, 'store'])->name('ventas.store');
    Route::get('/ventas/{venta}/boleta', [VentaController::class, 'boleta'])->name('ventas.boleta');
    Route::get('/ventas/exportar/pdf', [VentaController::class, 'exportarVentasVendedor'])->name('ventas.exportar');
    Route::get('/ventas/buscar-nota', [VentaController::class, 'buscarNota'])->name('ventas.buscarNota');
    // Buscar ventas
    Route::get('/ventas/buscar-solo-ventas', [VentaController::class, 'buscarSoloVentas'])->name('ventas.buscarSoloVentas');

    // SERVICIO TÉCNICO
    Route::get('/servicios', [ServicioTecnicoController::class, 'index'])->name('servicios.index');
    Route::get('/servicios/create', [ServicioTecnicoController::class, 'create'])->name('servicios.create');
    Route::post('/servicios', [ServicioTecnicoController::class, 'store'])->name('servicios.store');
    Route::get('/servicios/exportar-filtrado', [ServicioTecnicoController::class, 'exportarFiltrado'])->name('servicios.exportarFiltrado');
    Route::get('/servicios/{servicio}/boleta', [ServicioTecnicoController::class, 'boleta'])->name('servicios.boleta');
    Route::get('/servicios/buscar', [ServicioTecnicoController::class, 'buscar'])->name('servicios.buscar');
    Route::get('/servicios/exportar-resumen', [ServicioTecnicoController::class, 'exportarResumen'])->name('servicios.exportarResumen');

    // COTIZACIONES PARA VENDEDOR
    Route::get('/cotizaciones', [CotizacionController::class, 'indexVendedor'])->name('cotizaciones.index');
    Route::get('/cotizaciones/crear', [CotizacionController::class, 'createVendedor'])->name('cotizaciones.create');
    Route::post('/cotizaciones', [CotizacionController::class, 'storeVendedor'])->name('cotizaciones.store');
    Route::get('cotizaciones/pdf/{id}', [CotizacionController::class, 'exportarPDF'])->name('cotizaciones.pdf');
    Route::get('cotizaciones/ver/{id}', [CotizacionController::class, 'verPDFLocalVendedor'])->name('cotizaciones.ver-pdf');

    //WHATSAPP
    Route::get('/cotizaciones/whatsapp/{id}', [CotizacionController::class, 'whatsappFinal'])->name('cotizaciones.whatsapp');
    Route::post('/cotizaciones/reenviar/{id}', [CotizacionController::class, 'reenviarCorreo'])->name('cotizaciones.reenviar');
    Route::post('/cotizaciones/whatsapp-lote', [CotizacionController::class, 'enviarLoteWhatsapp'])->name('cotizaciones.whatsapp-lote');

    // CLIENTES Y PROMOCIONES PARA VENDEDOR
    Route::prefix('clientes')->group(function () {
        Route::get('/', [ClienteVendedorController::class, 'index'])->name('clientes.index');
        Route::get('/sugerencias', [ClienteVendedorController::class, 'sugerencias'])->name('clientes.sugerencias');
        Route::get('/{id}/edit', [ClienteVendedorController::class, 'edit'])->name('clientes.edit');
        Route::put('/{id}', [ClienteVendedorController::class, 'update'])->name('clientes.update');
        Route::post('/promociones/enviar', [ClienteVendedorController::class, 'enviarPromocionMasiva'])->name('clientes.promociones.enviar');

        // 🧾 Boleta A4
        Route::get(
            '/servicios/{servicio}/boleta',
            [ServicioTecnicoController::class, 'boleta']
        )->name('servicios.boleta');

        // 🖨️ Recibo térmico 80mm
        Route::get(
            '/servicios/{servicio}/recibo-80mm',
            [ServicioTecnicoController::class, 'recibo80mm']
        )->name('servicios.recibo80mm');
    });
    // 🟢 WhatsApp boleta 8 cm
    Route::get(
        '/ventas/{venta}/boleta-80',
        [VentaController::class, 'boleta80']
    )->name('ventas.boleta80');
});

// ========================
// 🔄 API & EXTRAS
// ========================

Route::get('/api/permuta/{tipo}', function ($tipo) {
    if ($tipo === 'celular') {
        return \App\Models\Celular::where('estado', 'permuta')->latest()->take(10)->get();
    } elseif ($tipo === 'computadora') {
        return \App\Models\Computadora::where('estado', 'permuta')->latest()->take(10)->get();
    } elseif ($tipo === 'producto_general') {
        return \App\Models\ProductoGeneral::where('estado', 'permuta')->latest()->take(10)->get();
    }
    return response()->json([], 404);
});

Route::prefix('api/stock')->name('api.stock.')->group(function () {
    Route::get('celulares', [StockController::class, 'celulares'])->name('celulares');
    Route::get('computadoras', [StockController::class, 'computadoras'])->name('computadoras');
    Route::get('productos-generales', [StockController::class, 'productosGenerales'])->name('productos_generales');
    Route::get('productos-apple', [StockController::class, 'productosApple'])->name('productos_apple');

    // ✅ Búsqueda por código (POST)
    Route::post('buscar', [StockController::class, 'buscarPorCodigo'])->name('buscar_codigo');
});

Route::get('/google-auth', [GoogleDriveController::class, 'redirectToGoogle'])->name('google.auth');
Route::get('/oauth2callback', [GoogleDriveController::class, 'handleGoogleCallback'])->name('google.callback');


Route::post('/api/permuta/celular', [CelularController::class, 'apiStore']);
Route::post('/api/permuta/computadora', [ComputadoraController::class, 'apiStore']);
Route::post('/api/permuta/producto_general', [ProductoGeneralController::class, 'apiStore']);

require __DIR__ . '/auth.php';
