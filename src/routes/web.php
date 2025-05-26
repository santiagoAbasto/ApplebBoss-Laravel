<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Application;
use Inertia\Inertia;

// Controladores
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CelularController;
use App\Http\Controllers\ProductoGeneralController;
use App\Http\Controllers\ComputadoraController;
use App\Http\Controllers\VentaController;
use App\Http\Controllers\ServicioTecnicoController;
use App\Http\Controllers\ReporteController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Admin\CotizacionController;


// 🏠 Página pública
Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

// 🚀 Redirección al dashboard según rol
Route::middleware(['auth', 'verified'])->get('/dashboard', function () {
    $user = auth()->user();
    return redirect()->route($user->rol === 'admin' ? 'admin.dashboard' : 'vendedor.dashboard');
})->name('dashboard');

// 👤 Perfil de usuario (común)
Route::middleware(['auth'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// 🛡️ Rutas del ADMINISTRADOR
Route::middleware(['auth', 'verified', 'rol:admin'])->prefix('admin')->name('admin.')->group(function () {
    // 📊 Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // 📱 Celulares
    Route::resource('celulares', CelularController::class)
        ->names('celulares')
        ->parameters(['celulares' => 'celular']);

    // 💻 Computadoras
    Route::resource('computadoras', ComputadoraController::class)
        ->names('computadoras');

    // 📦 Productos Generales
    Route::resource('productos-generales', ProductoGeneralController::class)
        ->names('productos-generales')
        ->parameters(['productos-generales' => 'producto']);

    // 🛒 Ventas
    Route::resource('ventas', VentaController::class)
        ->names('ventas')
        ->parameters(['ventas' => 'venta']);
    Route::post('/ventas', [VentaController::class, 'store'])->name('ventas.store');

    // 🧰 Servicios Técnicos
    Route::resource('servicios', ServicioTecnicoController::class)
        ->only(['index', 'create', 'store'])
        ->names('servicios')
        ->parameters(['servicios' => 'servicio']);
    Route::get('/servicios/exportar', [ServicioTecnicoController::class, 'exportar'])->name('servicios.exportar');

    // Exportar Servicios Técnicos por período
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

    Route::get('cotizaciones/{cotizacion}/pdf', [CotizacionController::class, 'exportarPDF'])
    ->name('cotizaciones.pdf');


    });


    // 🛒 Rutas del VENDEDOR
    Route::middleware(['auth', 'verified', 'rol:vendedor'])->prefix('vendedor')->name('vendedor.')->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('Vendedor/Dashboard'))->name('dashboard');

    Route::get('/celulares', [CelularController::class, 'index'])->name('celulares.index');
    Route::get('/computadoras', [ComputadoraController::class, 'index'])->name('computadoras.index');
    Route::get('/productos-generales', [ProductoGeneralController::class, 'index'])->name('productos-generales.index');

    // 🛒 Registro de ventas
    Route::get('/ventas', [VentaController::class, 'index'])->name('ventas.index');
    Route::get('/ventas/create', [VentaController::class, 'create'])->name('ventas.create');
    Route::post('/ventas', [VentaController::class, 'store'])->name('ventas.store');

    // 🧰 Registro de Servicio Técnico
    Route::get('/servicios', [ServicioTecnicoController::class, 'index'])->name('servicios.index');
    Route::get('/servicios/create', [ServicioTecnicoController::class, 'create'])->name('servicios.create');
    Route::post('/servicios', [ServicioTecnicoController::class, 'store'])->name('servicios.store');
});

// 🎯 Ruta API para productos en permuta por tipo
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

// routes/api.php
Route::post('/api/permuta/celular', [\App\Http\Controllers\CelularController::class, 'apiStore']);
Route::post('/api/permuta/computadora', [\App\Http\Controllers\ComputadoraController::class, 'apiStore']);
Route::post('/api/permuta/producto_general', [\App\Http\Controllers\ProductoGeneralController::class, 'apiStore']);


require __DIR__.'/auth.php';
