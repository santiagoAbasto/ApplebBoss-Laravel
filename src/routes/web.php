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
use App\Http\Controllers\ReporteController; // ✅ Nuevo controlador

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
    Route::get('/dashboard', fn () => Inertia::render('Admin/Dashboard'))->name('dashboard');

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

    // 🛒 CRUD Ventas
    Route::resource('ventas', VentaController::class)
        ->names('ventas')
        ->parameters(['ventas' => 'venta']);

    // 🧰 CRUD Servicio Técnico
    Route::resource('servicios', ServicioTecnicoController::class)
        ->names('servicios')
        ->parameters(['servicios' => 'servicio']);

    // 📊 Reportes
    Route::get('/reportes', [ReporteController::class, 'index'])->name('reportes.index'); // ✅ Añadido
});

// 🛒 Rutas del VENDEDOR
Route::middleware(['auth', 'verified', 'rol:vendedor'])->prefix('vendedor')->name('vendedor.')->group(function () {
    Route::get('/dashboard', fn () => Inertia::render('Vendedor/Dashboard'))->name('dashboard');

    // 📱 Visualización de celulares
    Route::get('/celulares', [CelularController::class, 'index'])->name('celulares.index');

    // 💻 Visualización de computadoras
    Route::get('/computadoras', [ComputadoraController::class, 'index'])->name('computadoras.index');

    // 📦 Visualización de productos generales
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

require __DIR__.'/auth.php';
