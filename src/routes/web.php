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
use App\Http\Controllers\ReservaController;
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
use App\Http\Controllers\Admin\SystemNotificationController;
use App\Http\Controllers\Admin\InventoryAuditController;
use App\Http\Controllers\Admin\CatalogoPublicacionController;
use App\Http\Controllers\Admin\ConfiguracionTiendaController;
use App\Http\Controllers\Admin\CatalogCategoryController;
use App\Http\Controllers\Admin\CollectionController;
use App\Http\Controllers\Admin\FaqController;
use App\Http\Controllers\Admin\HomeSectionController;
use App\Http\Controllers\Admin\MenuController;
use App\Http\Controllers\Admin\PageController;
use App\Http\Controllers\Admin\LocationController;
use App\Http\Controllers\Admin\ServiceController;
use App\Http\Controllers\PublicPageController;
use App\Http\Controllers\HubController;
use App\Http\Controllers\PublicCatalogController;
use App\Http\Controllers\Api\PublicSearchController;
use App\Http\Controllers\RobotsController;
use App\Http\Controllers\SitemapController;
use App\Http\Controllers\TradeInController;
use App\Http\Controllers\NovedadPublicController;
use App\Http\Controllers\Admin\TradeInAdminController;
use App\Http\Controllers\Admin\NovedadController;

use Illuminate\Http\Request;

// 🗺 SEO
Route::get('/robots.txt', [RobotsController::class, 'index'])->name('robots');
Route::get('/sitemap.xml', [SitemapController::class, 'index'])->name('sitemap');

// 📖 API Docs — Swagger UI estático (sin anotaciones, spec en public/api-docs/openapi.json)
Route::get('/api/docs', fn () => view('api-docs'))->name('api.docs')->middleware('throttle:60,1');

// 🔍 Búsqueda pública — JSON, throttled
Route::get('/api/buscar', PublicSearchController::class)
    ->middleware('throttle:60,1')
    ->name('api.buscar');

// 📄 Páginas estáticas CMS
Route::get('/paginas/{slug}', [PublicPageController::class, 'show'])->name('store.page');

// 📰 Novedades
Route::get('/novedades', [NovedadPublicController::class, 'index'])->name('novedades.index');
Route::get('/novedades/{slug}', [NovedadPublicController::class, 'show'])->name('novedades.show');

// 🔄 Trade-In
Route::get('/trade-in', [TradeInController::class, 'index'])->name('trade-in.index');
Route::post('/trade-in', [TradeInController::class, 'store'])->name('trade-in.store')->middleware('throttle:10,1');
Route::get('/trade-in/confirmacion/{codigo}', [TradeInController::class, 'confirmacion'])->name('trade-in.confirmacion');
Route::post('/newsletter', [\App\Http\Controllers\NewsletterController::class, 'store'])->name('newsletter.store')->middleware('throttle:5,1');
// Baja del newsletter: GET muestra confirmación (evita bajas por escáneres de links), POST confirma (también "un clic" de Gmail/Outlook)
Route::get('/newsletter/baja/{token}', [\App\Http\Controllers\NewsletterController::class, 'unsubscribeShow'])->name('newsletter.baja')->middleware('throttle:30,1');
Route::post('/newsletter/baja/{token}', [\App\Http\Controllers\NewsletterController::class, 'unsubscribe'])->name('newsletter.baja.confirmar')->middleware('throttle:20,1');

// 🏠 Rutas públicas del catálogo
Route::get('/', [PublicCatalogController::class, 'home'])->name('store.home');
Route::get('/catalogo', [PublicCatalogController::class, 'index'])->name('store.catalog');
Route::get('/productos/{slug}', [PublicCatalogController::class, 'show'])->name('store.product');
// Página de una colección: la vitrina armada a mano en Tienda online → Colecciones
Route::get('/coleccion/{collection:slug}', [PublicCatalogController::class, 'coleccion'])->name('store.collection');
Route::get('/comparar', [PublicCatalogController::class, 'compare'])->name('store.compare');
// Comparativa de modelos (base de modelos de referencia): /comparar/iphone?modelos=iphone-14-plus,iphone-16
Route::get('/comparar/{familia}', [\App\Http\Controllers\ComparadorModelosController::class, 'show'])
    ->whereIn('familia', array_keys(\App\Http\Controllers\ComparadorModelosController::FAMILIAS))
    ->name('store.compare.modelos');

// Category hubs — páginas editoriales canónicas
Route::get('/iphone',       [HubController::class, 'iphone'])->name('hub.iphone');
Route::get('/mac',          [HubController::class, 'mac'])->name('hub.mac');
Route::get('/myskin',       [HubController::class, 'myskin'])->name('hub.myskin');
Route::get('/seminuevos',   [HubController::class, 'seminuevos'])->name('hub.seminuevos');
// Redirige a catálogo mientras no tengan hub propio
Route::get('/apple',        fn () => redirect('/catalogo?categoria=productos-apple', 302))->name('hub.apple');
Route::get('/accesorios',   fn () => redirect('/catalogo?categoria=accesorios', 302))->name('hub.accesorios');

// API pública: sincronización del carrito (el servidor es autoridad de precios)
Route::post('/api/carrito/sync', [PublicCatalogController::class, 'syncCart'])
    ->name('api.carrito.sync')
    ->middleware('throttle:60,1');

/*
|--------------------------------------------------------------------------
| Checkout y seguimiento de pedidos (tienda en línea)
|--------------------------------------------------------------------------
| El precio y la disponibilidad los decide el servidor. El pedido avanza solo
| con el pago confirmado, y el seguimiento pide token o correo: es privado.
*/
Route::controller(\App\Http\Controllers\CheckoutController::class)->group(function () {
    // Comprar exige cuenta: el pedido queda atado a alguien y la persona puede seguirlo
    // sin códigos. El pago y el estado NO piden sesión: se abren con el token que va en
    // el correo, que es lo que permite pagar desde otro dispositivo.
    Route::get('/checkout', 'mostrar')->name('checkout')->middleware(['auth', 'throttle:60,1']);
    Route::post('/checkout', 'guardar')->name('checkout.guardar')->middleware(['auth', 'throttle:10,1']);
    Route::get('/pedido/{codigo}/pago', 'pago')->name('checkout.pago')->middleware('throttle:60,1');
    Route::post('/pedido/{codigo}/pago/reportar', 'reportarPago')->name('checkout.reportar')->middleware('throttle:10,1');
    Route::get('/pedido/{codigo}/estado', 'estado')->name('checkout.estado')->middleware('throttle:120,1');
    // Aviso de Libélula. No confirma por sí solo: dispara la consulta contra la pasarela.
    Route::get('/pedido/{codigo}/libelula/aviso', 'avisoLibelula')->name('pago.libelula.aviso')->middleware('throttle:60,1');
    // Webhook de Binance Pay. Tampoco confirma solo: dispara la consulta contra Binance.
    Route::post('/pedido/{codigo}/binance/aviso', 'avisoBinance')->name('pago.binance.aviso')->middleware('throttle:60,1');
});

/*
|--------------------------------------------------------------------------
| Cuenta de quien compra
|--------------------------------------------------------------------------
| Un `User` con rol 'cliente'. No entra al panel: `RolMiddleware` usa lista blanca.
*/
Route::controller(\App\Http\Controllers\Tienda\CuentaController::class)->group(function () {
    Route::middleware('guest')->group(function () {
        Route::get('/crear-cuenta', 'crear')->name('cuenta.crear');
        Route::post('/crear-cuenta', 'registrar')->name('cuenta.registrar')->middleware('throttle:5,1');
    });

    Route::get('/mi-cuenta', 'index')->name('cuenta.index')->middleware(['auth', 'throttle:60,1']);
});

// La puerta de quien compra, separada de la del equipo (/login). Las credenciales se
// comprueban con el mismo controlador, así que el horario del vendedor se sigue aplicando.
Route::middleware('guest')->group(function () {
    Route::get('/ingresar', [\App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'tienda'])
        ->name('cuenta.entrar');
    Route::post('/ingresar', [\App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'store'])
        ->name('cuenta.entrar.enviar')->middleware('throttle:10,1');
});

// Entrar con Google. Solo clientes: el staff usa contraseña, que es donde se revisa el horario.
Route::controller(\App\Http\Controllers\Tienda\GoogleLoginController::class)
    ->middleware(['guest', 'throttle:20,1'])
    ->group(function () {
        Route::get('/auth/google', 'redirigir')->name('google.entrar');
        Route::get('/auth/google/callback', 'volver')->name('google.volver');
    });

Route::controller(\App\Http\Controllers\SeguimientoController::class)->group(function () {
    Route::get('/seguimiento', 'buscar')->name('seguimiento')->middleware('throttle:60,1');
    Route::post('/seguimiento', 'resolver')->name('seguimiento.resolver')->middleware('throttle:15,1');
    Route::get('/seguimiento/{codigo}', 'ver')->name('seguimiento.ver')->middleware('throttle:60,1');
});

// 🚀 Redirección al dashboard según el rol autenticado
Route::middleware(['auth', 'verified'])->get('/dashboard', function () {
    $user = auth()->user();
    // El cliente no tiene panel: su lugar es «Mi cuenta»
    if ($user->esCliente()) {
        return redirect()->route('cuenta.index');
    }

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
// El panel: entra quien tenga el módulo permitido en su rol (Usuarios y roles). Lo que no pertenece a ningún
// módulo queda solo para administradores; la regla vive en App\Support\Permisos y App\Http\Middleware\PermisoMiddleware.
Route::middleware(['auth', 'verified', 'permiso'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {

        // 📊 Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index'])
            ->name('dashboard');

        // ========================
        // 🌐 CATÁLOGO WEB (publicaciones)
        // ========================
        Route::prefix('catalogo')->name('catalogo.')->group(function () {
            Route::get('/', [CatalogoPublicacionController::class, 'index'])->name('index');
            Route::post('/', [CatalogoPublicacionController::class, 'store'])->name('store');
            Route::get('/importar', [\App\Http\Controllers\Admin\CatalogoImportController::class, 'index'])->name('importar');
            Route::post('/importar', [\App\Http\Controllers\Admin\CatalogoImportController::class, 'store'])->name('importar.store');
            Route::get('/nuevo/{tipo}/{id}', [CatalogoPublicacionController::class, 'createFromInventory'])->name('create');
            Route::get('/{publicacion}/editar', [CatalogoPublicacionController::class, 'edit'])->name('edit');
            Route::patch('/{publicacion}', [CatalogoPublicacionController::class, 'update'])->name('update');
            Route::patch('/{publicacion}/destacado', [CatalogoPublicacionController::class, 'toggleDestacado'])->name('destacado');
            Route::delete('/{publicacion}', [CatalogoPublicacionController::class, 'destroy'])->name('destroy');

            // Imágenes
            Route::post('/{publicacion}/imagenes', [CatalogoPublicacionController::class, 'uploadImagen'])->name('imagenes.upload');
            Route::delete('/{publicacion}/imagenes/{imagen}', [CatalogoPublicacionController::class, 'deleteImagen'])->name('imagenes.delete');
            Route::post('/{publicacion}/imagenes/reordenar', [CatalogoPublicacionController::class, 'reordenarImagenes'])->name('imagenes.reordenar');
            Route::post('/{publicacion}/imagenes/{imagen}/principal', [CatalogoPublicacionController::class, 'setPrincipal'])->name('imagenes.principal');

            // Compatibilidades
            Route::post('/{publicacion}/compatibilidades', [CatalogoPublicacionController::class, 'syncCompatibilidades'])->name('compatibilidades.sync');
        });

        // Modelos de referencia: fichas oficiales y la foto de cada modelo para la comparativa pública
        Route::prefix('modelos')->name('modelos.')->controller(\App\Http\Controllers\Admin\ModeloReferenciaController::class)->group(function () {
            Route::get('/', 'index')->name('index');
            Route::get('/{modelo:slug}', 'show')->name('show');
            Route::post('/{modelo:slug}/foto', 'subirFoto')->name('foto')->middleware('throttle:30,1');
            Route::delete('/{modelo:slug}/foto', 'quitarFoto')->name('foto.quitar');
        });

        // ========================
        // ⚙️ CONFIGURACIÓN DE TIENDA (CMS)
        // ========================
        Route::get('/configuracion/tienda', [ConfiguracionTiendaController::class, 'edit'])->name('configuracion.tienda.edit');
        Route::post('/configuracion/tienda', [ConfiguracionTiendaController::class, 'update'])->name('configuracion.tienda.update');

        // ========================
        // 📣 MARKETING: NEWSLETTER + SEO POR PÁGINA
        // ========================
        Route::prefix('newsletter')->name('newsletter.')->group(function () {
            $c = \App\Http\Controllers\Admin\NewsletterCampaignController::class;
            Route::get('/campanas', [$c, 'index'])->name('campaigns.index');
            Route::post('/campanas', [$c, 'store'])->name('campaigns.store');
            Route::post('/campanas/vista-previa', [$c, 'preview'])->name('campaigns.preview');
            Route::post('/campanas/imagenes', [$c, 'uploadImage'])->name('campaigns.image')->middleware('throttle:30,1');
            Route::get('/campanas/productos', [$c, 'products'])->name('campaigns.products');
            Route::get('/campanas/{campaign}', [$c, 'edit'])->name('campaigns.edit');
            Route::patch('/campanas/{campaign}', [$c, 'update'])->name('campaigns.update');
            Route::post('/campanas/{campaign}/prueba', [$c, 'sendTest'])->name('campaigns.test')->middleware('throttle:10,1');
            Route::post('/campanas/{campaign}/enviar', [$c, 'send'])->name('campaigns.send');
            Route::post('/campanas/{campaign}/cancelar', [$c, 'cancel'])->name('campaigns.cancel');
            Route::get('/campanas/{campaign}/estado', [$c, 'status'])->name('campaigns.status');
            Route::post('/campanas/{campaign}/duplicar', [$c, 'duplicate'])->name('campaigns.duplicate');
            Route::delete('/campanas/{campaign}', [$c, 'destroy'])->name('campaigns.destroy');

            $s = \App\Http\Controllers\Admin\NewsletterSubscriberController::class;
            Route::get('/suscriptores', [$s, 'index'])->name('subscribers.index');
            Route::get('/suscriptores/buscar', [$s, 'search'])->name('subscribers.search');
            Route::get('/suscriptores/exportar', [$s, 'export'])->name('subscribers.export');
            Route::post('/suscriptores', [$s, 'store'])->name('subscribers.store');
            Route::post('/suscriptores/importar', [$s, 'import'])->name('subscribers.import');
            Route::patch('/suscriptores/{subscriber}', [$s, 'update'])->name('subscribers.update');
            Route::delete('/suscriptores/{subscriber}', [$s, 'destroy'])->name('subscribers.destroy');

            Route::get('/ajustes', [\App\Http\Controllers\Admin\NewsletterSettingsController::class, 'edit'])->name('settings.edit');
            Route::post('/ajustes', [\App\Http\Controllers\Admin\NewsletterSettingsController::class, 'update'])->name('settings.update');
            // Correo de prueba: confirma que la clave del servidor de correo quedó bien cargada
            Route::post('/ajustes/prueba', [\App\Http\Controllers\Admin\NewsletterSettingsController::class, 'test'])->name('settings.test')->middleware('throttle:10,1');
        });

        Route::get('/seo', [\App\Http\Controllers\Admin\SeoController::class, 'index'])->name('seo.index');
        Route::post('/seo/general', [\App\Http\Controllers\Admin\SeoController::class, 'updateGlobal'])->name('seo.global');
        Route::post('/seo/imagen', [\App\Http\Controllers\Admin\SeoController::class, 'uploadImage'])->name('seo.image')->middleware('throttle:30,1');
        Route::patch('/seo/{seoPage}', [\App\Http\Controllers\Admin\SeoController::class, 'update'])->name('seo.update');

        // ========================
        // 🔔 NOTIFICACIONES SISTEMA
        // ========================
        Route::get('/notifications', [SystemNotificationController::class, 'index'])
            ->name('notifications.index');

        Route::post('/notifications/{notification}/read', [SystemNotificationController::class, 'markAsRead'])
            ->name('notifications.read');

        // ========================
        // 🤖 AUTOMATION REPORTS
        // ========================
        Route::prefix('automation')
            ->name('automation.')
            ->group(function () {

                Route::get('/latest-weekly', [AutomationReportController::class, 'latestWeekly'])
                    ->name('latestWeekly');

                Route::post('/{report}/mark-viewed', [AutomationReportController::class, 'markViewed'])
                    ->name('markViewed');

                Route::get('/{report}', [AutomationReportController::class, 'show'])
                    ->name('show');
            });

        // ========================
        // 📱 CRUD Celulares
        // ========================
        // Va antes del resource: si no, "condicion" se tomaría como el id de un celular
        Route::patch('celulares/condicion', [CelularController::class, 'condicionMasiva'])
            ->name('celulares.condicion');

        Route::resource('celulares', CelularController::class)
            ->names('celulares')
            ->parameters(['celulares' => 'celular']);

        // ========================
        // 💻 CRUD Computadoras
        // ========================
        // Va antes del resource: si no, "condicion" se tomaría como el id de una computadora
        Route::patch('computadoras/condicion', [ComputadoraController::class, 'condicionMasiva'])
            ->name('computadoras.condicion');

        Route::resource('computadoras', ComputadoraController::class)
            ->names('computadoras');

        // ========================
        // 📦 Productos Generales
        // ========================
        Route::get('productos-generales/verificar-codigo', [ProductoGeneralController::class, 'verificarCodigo'])
            ->name('productos-generales.verificar-codigo');

        // Va antes del resource: si no, "condicion" se tomaría como el id de un producto
        Route::patch('productos-generales/condicion', [ProductoGeneralController::class, 'condicionMasiva'])
            ->name('productos-generales.condicion');

        Route::resource('productos-generales', ProductoGeneralController::class)
            ->names('productos-generales')
            ->parameters(['productos-generales' => 'producto']);

        // ========================
        // 🛒 Ventas
        // ========================
        Route::get('/ventas/buscar-nota', [VentaController::class, 'buscarNota'])
            ->name('ventas.buscarNota');

        Route::get('/ventas/{venta}/boleta', [VentaController::class, 'boleta'])
            ->name('ventas.boleta');

        Route::get('/ventas/{venta}/boleta-80', [VentaController::class, 'boleta80'])
            ->name('ventas.boleta80');

        // Sin «ver» ni «borrar»: VentaController no los tiene y ninguna pantalla los usa (respondían con error)
        Route::resource('ventas', VentaController::class)
            ->except(['show', 'destroy'])
            ->names('ventas')
            ->parameters(['ventas' => 'venta']);

        // ========================
        // 🧾 Pedidos de la tienda en línea
        // ========================
        Route::get('/pedidos', [App\Http\Controllers\Admin\PedidoController::class, 'index'])->name('pedidos.index');
        Route::get('/pedidos/{pedido}', [App\Http\Controllers\Admin\PedidoController::class, 'show'])->name('pedidos.show');
        Route::get('/pedidos/{pedido}/comprobante', [App\Http\Controllers\Admin\PedidoController::class, 'comprobante'])->name('pedidos.comprobante');
        Route::post('/pedidos/{pedido}/confirmar-pago', [App\Http\Controllers\Admin\PedidoController::class, 'confirmarPago'])->name('pedidos.confirmarPago');
        Route::post('/pedidos/{pedido}/avanzar', [App\Http\Controllers\Admin\PedidoController::class, 'avanzar'])->name('pedidos.avanzar');
        Route::post('/pedidos/{pedido}/cancelar', [App\Http\Controllers\Admin\PedidoController::class, 'cancelar'])->name('pedidos.cancelar');
        Route::post('/pedidos/{pedido}/nota', [App\Http\Controllers\Admin\PedidoController::class, 'notaInterna'])->name('pedidos.nota');

        // ========================
        // 📌 Reservas
        // ========================
        Route::get('/reservas/activas', [ReservaController::class, 'activas'])
            ->name('reservas.activas');

        Route::patch('/reservas/{reserva}/estado', [ReservaController::class, 'updateEstado'])
            ->name('reservas.estado');

        Route::get('/reservas/{reserva}/boleta', [ReservaController::class, 'boleta'])
            ->name('reservas.boleta');

        Route::get('/reservas/{reserva}/boleta-80', [ReservaController::class, 'boleta80'])
            ->name('reservas.boleta80');

        Route::resource('reservas', ReservaController::class)
            ->only(['index', 'create', 'store'])
            ->names('reservas')
            ->parameters(['reservas' => 'reserva']);

        // ========================
        // 🧰 Servicios Técnicos
        // ========================
        Route::resource('servicios', ServicioTecnicoController::class)
            ->only(['index', 'create', 'store'])
            ->names('servicios')
            ->parameters(['servicios' => 'servicio']);

        Route::get('/servicios/{servicio}/boleta', [ServicioTecnicoController::class, 'boleta'])
            ->name('servicios.boleta');

        Route::get('/servicios/{servicio}/recibo-80mm', [ServicioTecnicoController::class, 'recibo80mm'])
            ->name('servicios.recibo80mm');

        Route::get('/servicios/exportar-filtrado', [ServicioTecnicoController::class, 'exportarFiltrado'])
            ->name('servicios.exportarFiltrado');

        Route::get('/servicios/exportar-resumen', [ServicioTecnicoController::class, 'exportarResumen'])
            ->name('servicios.exportarResumen');

        // El costo del servicio lo carga el administrador (el vendedor registra solo lo que cobra)
        Route::patch('/servicios/{servicio}/costo', [ServicioTecnicoController::class, 'cargarCosto'])
            ->name('servicios.costo');

        // ========================
        // 📊 Reportes
        // ========================
        Route::get('/reportes', [ReporteController::class, 'index'])
            ->name('reportes.index');

        Route::get('/reportes/exportar', [ReporteController::class, 'exportar'])
            ->name('reportes.exportar');

        Route::get('/reportes/exportar-dia', [ReporteController::class, 'exportDia'])
            ->name('reportes.exportar-dia');

        Route::get('/reportes/exportar-semana', [ReporteController::class, 'exportSemana'])
            ->name('reportes.exportar-semana');

        Route::get('/reportes/exportar-mes', [ReporteController::class, 'exportMes'])
            ->name('reportes.exportar-mes');

        Route::get('/reportes/exportar-anio', [ReporteController::class, 'exportAnio'])
            ->name('reportes.exportar-anio');

        // ========================
        // ✔️ Permuta habilitar
        // ========================
        Route::patch('/celulares/{celular}/habilitar', [CelularController::class, 'habilitar'])
            ->name('celulares.habilitar');

        Route::patch('/computadoras/{computadora}/habilitar', [ComputadoraController::class, 'habilitar'])
            ->name('computadoras.habilitar');

        Route::patch('/productos-generales/{producto}/habilitar', [ProductoGeneralController::class, 'habilitar'])
            ->name('productos-generales.habilitar');

        // ========================
        // 📦 Cotizaciones
        // ========================
        Route::resource('cotizaciones', CotizacionController::class)
            ->only(['index', 'create', 'store'])
            ->names('cotizaciones');

        Route::get('cotizaciones/{cotizacion}/pdf', [CotizacionController::class, 'exportarPDF'])
            ->name('cotizaciones.pdf');

        Route::post('cotizaciones/{id}/reenviar', [CotizacionController::class, 'reenviarCorreo'])
            ->name('cotizaciones.reenviar');

        Route::post('cotizaciones/enviar-lote', [CotizacionController::class, 'enviarLoteWhatsapp'])
            ->name('cotizaciones.enviar-lote');

        Route::get('cotizaciones/whatsapp-final', [CotizacionController::class, 'whatsappFinalLibre'])
            ->name('cotizaciones.enviar-whatsapp-libre');

        // ========================
        // 📤 Exportaciones
        // ========================
        // 👥 SISTEMA: USUARIOS Y ROLES
        // ========================
        Route::get('/usuarios', [\App\Http\Controllers\Admin\UsuarioController::class, 'index'])->name('usuarios.index');
        Route::post('/usuarios', [\App\Http\Controllers\Admin\UsuarioController::class, 'store'])->name('usuarios.store');
        Route::patch('/usuarios/{usuario}', [\App\Http\Controllers\Admin\UsuarioController::class, 'update'])->name('usuarios.update');
        Route::delete('/usuarios/{usuario}', [\App\Http\Controllers\Admin\UsuarioController::class, 'destroy'])->name('usuarios.destroy');

        Route::post('/roles', [\App\Http\Controllers\Admin\RolController::class, 'store'])->name('roles.store');
        Route::patch('/roles/{rol}', [\App\Http\Controllers\Admin\RolController::class, 'update'])->name('roles.update');
        Route::delete('/roles/{rol}', [\App\Http\Controllers\Admin\RolController::class, 'destroy'])->name('roles.destroy');

        Route::get('/exportar', [ExportController::class, 'index'])
            ->name('exportaciones.index');

        Route::get('/exportar/personalizado', [ExportController::class, 'personalizado'])
            ->name('exportar.personalizado');

        Route::get('/exportar/por-nombre', [ExportController::class, 'porNombre'])
            ->name('exportar.por-nombre');

        // Cuántos productos saldrían con lo escrito, para no generar un PDF vacío
        Route::get('/exportar/contar', [ExportController::class, 'contar'])
            ->name('exportar.contar');

        Route::get('/exportar/fundas-magsafe-14-pro-max', [ExportController::class, 'fundasMagsafe14ProMax'])
            ->name('exportar.fundas-magsafe-14-pro-max');

        Route::get('/exportar/celulares', [ExportController::class, 'celulares'])
            ->name('exportar.celulares');

        Route::get('/exportar/computadoras', [ExportController::class, 'computadoras'])
            ->name('exportar.computadoras');

        Route::get('/exportar/productos-generales', [ExportController::class, 'productosGenerales'])
            ->name('exportar.productos-generales');

        Route::get('/exportar/productos-generales/{tipo}', [ExportController::class, 'productosGeneralesPorTipo'])
            ->name('exportar.productos-generales.tipo');

        Route::get('/exportar/productos-apple', [ExportController::class, 'productosApple'])
            ->name('exportar.productos-apple');

        // ========================
        // 🍎 Productos Apple
        // ========================
        // Van antes del resource: si no, "condicion" se tomaría como el id de un producto
        Route::patch('productos-apple/condicion', [ProductoAppleController::class, 'condicionMasiva'])
            ->name('productos-apple.condicion');
        Route::patch('productos-apple/{productoApple}/habilitar', [ProductoAppleController::class, 'habilitar'])
            ->name('productos-apple.habilitar');

        Route::resource('productos-apple', ProductoAppleController::class)
            ->names('productos-apple')
            ->parameters(['productos-apple' => 'productoApple']);

        // ========================
        // 🔎 Auditoría física de inventario
        // ========================
        Route::get('/auditoria-inventario', [InventoryAuditController::class, 'index'])
            ->name('inventory-audits.index');
        Route::post('/auditoria-inventario', [InventoryAuditController::class, 'store'])
            ->name('inventory-audits.store');
        Route::post('/auditoria-inventario/{inventoryAudit}/escanear', [InventoryAuditController::class, 'scan'])
            ->name('inventory-audits.scan');
        Route::post('/auditoria-inventario/{inventoryAudit}/cerrar', [InventoryAuditController::class, 'close'])
            ->name('inventory-audits.close');
        Route::get('/auditoria-inventario/{inventoryAudit}/pdf', [InventoryAuditController::class, 'pdf'])
            ->name('inventory-audits.pdf');

        // ========================
        // 🏠 Home Builder (CMS de secciones)
        // ========================
        Route::get('/home-builder', [HomeSectionController::class, 'index'])
            ->name('home-builder.index');
        Route::patch('/home-builder/{homeSection}', [HomeSectionController::class, 'update'])
            ->name('home-builder.update');
        Route::post('/home-builder/reorder', [HomeSectionController::class, 'reorder'])
            ->name('home-builder.reorder');

        // ========================
        // 🗂️ Categories CMS
        // ========================
        Route::get('/sitio/categorias', [CatalogCategoryController::class, 'index'])
            ->name('categories.index');
        Route::get('/sitio/categorias/{category}/editar', [CatalogCategoryController::class, 'edit'])
            ->name('categories.edit');
        Route::patch('/sitio/categorias/{category}', [CatalogCategoryController::class, 'update'])
            ->name('categories.update');
        Route::patch('/sitio/categorias/{category}/visibilidad', [CatalogCategoryController::class, 'visibilidad'])
            ->name('categories.visibilidad');
        Route::post('/sitio/categorias/reorder', [CatalogCategoryController::class, 'reorder'])
            ->name('categories.reorder');

        // ========================
        // 🛠️ Services CMS
        // ========================
        Route::get('/sitio/servicios', [ServiceController::class, 'index'])
            ->name('services.index');
        Route::post('/sitio/servicios', [ServiceController::class, 'store'])
            ->name('services.store');
        Route::patch('/sitio/servicios/{service}', [ServiceController::class, 'update'])
            ->name('services.update');
        Route::delete('/sitio/servicios/{service}', [ServiceController::class, 'destroy'])
            ->name('services.destroy');
        Route::post('/sitio/servicios/reorder', [ServiceController::class, 'reorder'])
            ->name('services.reorder');

        // ========================
        // ❓ FAQ CMS
        // ========================
        Route::get('/sitio/faq', [FaqController::class, 'index'])
            ->name('faqs.index');
        Route::post('/sitio/faq', [FaqController::class, 'store'])
            ->name('faqs.store');
        Route::patch('/sitio/faq/{faq}', [FaqController::class, 'update'])
            ->name('faqs.update');
        Route::delete('/sitio/faq/{faq}', [FaqController::class, 'destroy'])
            ->name('faqs.destroy');
        Route::post('/sitio/faq/reorder', [FaqController::class, 'reorder'])
            ->name('faqs.reorder');
        Route::post('/sitio/faq/copiar', [FaqController::class, 'copiar'])
            ->name('faqs.copiar');

        // ========================
        // 📄 Pages CMS
        // ========================
        Route::get('/sitio/paginas', [PageController::class, 'index'])
            ->name('pages.index');
        Route::get('/sitio/paginas/{page}/editar', [PageController::class, 'edit'])
            ->name('pages.edit');
        Route::patch('/sitio/paginas/{page}', [PageController::class, 'update'])
            ->name('pages.update');
        Route::post('/sitio/paginas', [PageController::class, 'store'])
            ->name('pages.store');
        Route::patch('/sitio/paginas/{page}/visibilidad', [PageController::class, 'visibilidad'])
            ->name('pages.visibilidad');
        Route::post('/sitio/paginas/orden', [PageController::class, 'reorder'])
            ->name('pages.reorder');
        Route::delete('/sitio/paginas/{page}', [PageController::class, 'destroy'])
            ->name('pages.destroy');

        // ========================
        // 🧭 Menú CMS
        // ========================
        Route::get('/sitio/menus', [MenuController::class, 'index'])
            ->name('menus.index');
        Route::post('/sitio/menus/items', [MenuController::class, 'store'])
            ->name('menus.store');
        Route::patch('/sitio/menus/items/{menuItem}', [MenuController::class, 'update'])
            ->name('menus.update');
        Route::delete('/sitio/menus/items/{menuItem}', [MenuController::class, 'destroy'])
            ->name('menus.destroy');
        Route::post('/sitio/menus/reorder', [MenuController::class, 'reorder'])
            ->name('menus.reorder');
        Route::post('/sitio/menus/copiar', [MenuController::class, 'copiar'])
            ->name('menus.copiar');

        // ========================
        // 📦 Collections CMS
        // ========================
        Route::get('/sitio/colecciones', [CollectionController::class, 'index'])
            ->name('collections.index');
        Route::post('/sitio/colecciones', [CollectionController::class, 'store'])
            ->name('collections.store');
        Route::get('/sitio/colecciones/{collection}/editar', [CollectionController::class, 'edit'])
            ->name('collections.edit');
        Route::patch('/sitio/colecciones/{collection}', [CollectionController::class, 'update'])
            ->name('collections.update');
        Route::post('/sitio/colecciones/{collection}/publicaciones', [CollectionController::class, 'syncPublicaciones'])
            ->name('collections.sync');
        Route::patch('/sitio/colecciones/{collection}/visibilidad', [CollectionController::class, 'visibilidad'])
            ->name('collections.visibilidad');
        Route::post('/sitio/colecciones/orden', [CollectionController::class, 'reorder'])
            ->name('collections.reorder');
        Route::delete('/sitio/colecciones/{collection}', [CollectionController::class, 'destroy'])
            ->name('collections.destroy');

        // ========================
        // 📍 Locations CMS
        // ========================
        Route::get('/sitio/ubicaciones', [LocationController::class, 'index'])
            ->name('locations.index');
        Route::get('/sitio/ubicaciones/crear', [LocationController::class, 'create'])
            ->name('locations.create');
        Route::post('/sitio/ubicaciones', [LocationController::class, 'store'])
            ->name('locations.store');
        Route::post('/sitio/ubicaciones/reorder', [LocationController::class, 'reorder'])
            ->name('locations.reorder');
        Route::get('/sitio/ubicaciones/{location}/editar', [LocationController::class, 'edit'])
            ->name('locations.edit');
        Route::patch('/sitio/ubicaciones/{location}', [LocationController::class, 'update'])
            ->name('locations.update');
        Route::delete('/sitio/ubicaciones/{location}', [LocationController::class, 'destroy'])
            ->name('locations.destroy');

        // ========================
        // 👥 Clientes
        // ========================
        Route::get('/clientes', [ClienteAdminController::class, 'index'])
            ->name('clientes.index');

        Route::get('/clientes/sugerencias', [ClienteAdminController::class, 'sugerencias'])
            ->name('clientes.sugerencias');

        Route::get('/clientes/{cliente}/edit', [ClienteAdminController::class, 'edit'])
            ->name('clientes.edit');

        Route::put('/clientes/{cliente}', [ClienteAdminController::class, 'update'])
            ->name('clientes.update');


        // ========================
        // 💰 Egresos
        // ========================
        Route::get('/egresos', [EgresoController::class, 'index'])
            ->name('egresos.index');

        Route::get('/egresos/create', [EgresoController::class, 'create'])
            ->name('egresos.create');

        Route::post('/egresos', [EgresoController::class, 'store'])
            ->name('egresos.store');

        Route::get('/egresos/exportar/pdf', [EgresoController::class, 'exportarPDF'])
            ->name('egresos.exportar-pdf');

        // ========================
        // 🔄 TRADE-IN
        // ========================
        Route::get('/trade-in', [TradeInAdminController::class, 'index'])
            ->name('trade-in.index');
        Route::get('/trade-in/{tradeIn}', [TradeInAdminController::class, 'show'])
            ->name('trade-in.show');
        Route::patch('/trade-in/{tradeIn}', [TradeInAdminController::class, 'update'])
            ->name('trade-in.update');
        Route::post('/trade-in/{tradeIn}/contacto', [TradeInAdminController::class, 'contacto'])
            ->name('trade-in.contacto');
        Route::get('/trade-in/{tradeIn}/fotos/{indice}', [TradeInAdminController::class, 'foto'])
            ->whereNumber('indice')->name('trade-in.foto');
        Route::delete('/trade-in/{tradeIn}', [TradeInAdminController::class, 'destroy'])
            ->name('trade-in.destroy');

        // ========================
        // 📰 NOVEDADES
        // ========================
        Route::get('/novedades', [NovedadController::class, 'index'])
            ->name('novedades.index');
        Route::post('/novedades', [NovedadController::class, 'store'])
            ->name('novedades.store');
        Route::get('/novedades/{novedad}/editar', [NovedadController::class, 'edit'])
            ->name('novedades.edit');
        Route::patch('/novedades/{novedad}', [NovedadController::class, 'update'])
            ->name('novedades.update');
        Route::patch('/novedades/{novedad}/publicacion', [NovedadController::class, 'publicacion'])
            ->name('novedades.publicacion');
        Route::delete('/novedades/{novedad}', [NovedadController::class, 'destroy'])
            ->name('novedades.destroy');
    });
// ========================
// 🤖 RUTA PARA n8n
// ========================
Route::post('/automation/store', [
    AutomationReportController::class,
    'store'
])->middleware('automation')->name('automation.store');

// ========================
// 🧑‍💼 RUTAS VENDEDOR
// ========================

Route::middleware(['auth', 'verified', 'rol:vendedor'])
    ->prefix('vendedor')
    ->name('vendedor.')
    ->group(function () {

        // ========================
        // 📊 DASHBOARD
        // ========================

        Route::get('/dashboard', [DashboardVendedorController::class, 'index'])
            ->name('dashboard');

        // ========================
        // 📦 PRODUCTOS
        // ========================

        Route::get('/productos', [ProductoVendedorController::class, 'index'])
            ->name('productos.index');

        Route::get('/celulares', [CelularController::class, 'index'])
            ->name('celulares.index');

        Route::get('/computadoras', [ComputadoraController::class, 'index'])
            ->name('computadoras.index');

        Route::get('/productos-generales', [ProductoGeneralController::class, 'index'])
            ->name('productos-generales.index');

        // ========================
        // 🛒 VENTAS
        // ========================

        Route::get('/ventas', [VentaController::class, 'index'])
            ->name('ventas.index');

        Route::get('/ventas/create', [VentaController::class, 'create'])
            ->name('ventas.create');

        Route::post('/ventas', [VentaController::class, 'store'])
            ->name('ventas.store');

        Route::get('/ventas/{venta}/edit', [VentaController::class, 'edit'])
            ->name('ventas.edit');

        Route::put('/ventas/{venta}', [VentaController::class, 'update'])
            ->name('ventas.update');

        Route::get('/ventas/{venta}/boleta', [VentaController::class, 'boleta'])
            ->name('ventas.boleta');

        Route::get('/ventas/{venta}/boleta-80', [VentaController::class, 'boleta80'])
            ->name('ventas.boleta80');

        Route::get('/ventas/exportar/pdf', [VentaController::class, 'exportarVentasVendedor'])
            ->name('ventas.exportar');

        Route::get('/ventas/buscar-nota', [VentaController::class, 'buscarNota'])
            ->name('ventas.buscarNota');

        Route::get('/ventas/buscar-solo-ventas', [VentaController::class, 'buscarSoloVentas'])
            ->name('ventas.buscarSoloVentas');

        // ========================
        // 📌 RESERVAS
        // ========================

        Route::get('/reservas', [ReservaController::class, 'index'])
            ->name('reservas.index');

        Route::get('/reservas/create', [ReservaController::class, 'create'])
            ->name('reservas.create');

        Route::post('/reservas', [ReservaController::class, 'store'])
            ->name('reservas.store');

        Route::get('/reservas/activas', [ReservaController::class, 'activas'])
            ->name('reservas.activas');

        Route::patch('/reservas/{reserva}/estado', [ReservaController::class, 'updateEstado'])
            ->name('reservas.estado');

        Route::get('/reservas/{reserva}/boleta', [ReservaController::class, 'boleta'])
            ->name('reservas.boleta');

        Route::get('/reservas/{reserva}/boleta-80', [ReservaController::class, 'boleta80'])
            ->name('reservas.boleta80');

        // ========================
        // 🧰 SERVICIO TÉCNICO
        // ========================

        Route::get('/servicios', [ServicioTecnicoController::class, 'index'])
            ->name('servicios.index');

        Route::get('/servicios/create', [ServicioTecnicoController::class, 'create'])
            ->name('servicios.create');

        Route::post('/servicios', [ServicioTecnicoController::class, 'store'])
            ->name('servicios.store');

        Route::get('/servicios/{servicio}/boleta', [ServicioTecnicoController::class, 'boleta'])
            ->name('servicios.boleta'); // ✅ CORREGIDO

        Route::get('/servicios/{servicio}/recibo-80mm', [ServicioTecnicoController::class, 'recibo80mm'])
            ->name('servicios.recibo80mm');

        Route::get('/servicios/exportar-filtrado', [ServicioTecnicoController::class, 'exportarFiltrado'])
            ->name('servicios.exportarFiltrado');

        Route::get('/servicios/exportar-resumen', [ServicioTecnicoController::class, 'exportarResumen'])
            ->name('servicios.exportarResumen');

        // ========================
        // 📄 COTIZACIONES
        // ========================

        Route::get('/cotizaciones', [CotizacionController::class, 'indexVendedor'])
            ->name('cotizaciones.index');

        Route::get('/cotizaciones/crear', [CotizacionController::class, 'createVendedor'])
            ->name('cotizaciones.create');

        Route::post('/cotizaciones', [CotizacionController::class, 'storeVendedor'])
            ->name('cotizaciones.store');

        Route::get('/cotizaciones/pdf/{id}', [CotizacionController::class, 'exportarPDF'])
            ->name('cotizaciones.pdf');

        Route::post('/cotizaciones/reenviar/{id}', [CotizacionController::class, 'reenviarCorreo'])
            ->name('cotizaciones.reenviar');

        // Mismos nombres que en el panel de administración: las dos pantallas son la misma pieza
        Route::get('/cotizaciones/whatsapp-final', [CotizacionController::class, 'whatsappFinalLibre'])
            ->name('cotizaciones.enviar-whatsapp-libre');

        Route::post('/cotizaciones/enviar-lote', [CotizacionController::class, 'enviarLoteWhatsapp'])
            ->name('cotizaciones.enviar-lote');

        // ========================
        // 👥 CLIENTES
        // ========================

        Route::prefix('clientes')
            ->name('clientes.')
            ->group(function () {

                Route::get('/', [ClienteVendedorController::class, 'index'])
                    ->name('index');

                Route::get('/sugerencias', [ClienteVendedorController::class, 'sugerencias'])
                    ->name('sugerencias');

                Route::get('/{id}/edit', [ClienteVendedorController::class, 'edit'])
                    ->name('edit');

                Route::put('/{id}', [ClienteVendedorController::class, 'update'])
                    ->name('update');
            });
    });


// ========================
// 🔄 API & EXTRAS
// ========================



// API STOCK (solo el equipo: devuelve IMEI, costo y procedencia)
Route::middleware(['auth', 'verified', 'rol:admin|vendedor', 'throttle:120,1'])
    ->prefix('api/stock')
    ->name('api.stock.')
    ->group(function () {

        Route::get('celulares', [StockController::class, 'celulares'])
            ->name('celulares');

        Route::get('computadoras', [StockController::class, 'computadoras'])
            ->name('computadoras');

        Route::get('productos-generales', [StockController::class, 'productosGenerales'])
            ->name('productos_generales');

        Route::get('productos-apple', [StockController::class, 'productosApple'])
            ->name('productos_apple');

        Route::post('buscar', [StockController::class, 'buscarPorCodigo'])
            ->name('buscar_codigo');
    });


// Google Drive OAuth
Route::middleware(['auth', 'verified', 'rol:admin'])->group(function () {
    Route::get('/google-auth', [GoogleDriveController::class, 'redirectToGoogle'])
        ->name('google.auth');

    Route::get('/oauth2callback', [GoogleDriveController::class, 'handleGoogleCallback'])
        ->name('google.callback');
});


// API Permuta Store (solo el equipo)
Route::middleware(['auth', 'verified', 'rol:admin|vendedor', 'throttle:60,1'])->group(function () {
    Route::post('/api/permuta/celular', [CelularController::class, 'apiStore']);
    Route::post('/api/permuta/computadora', [ComputadoraController::class, 'apiStore']);
    Route::post('/api/permuta/producto_general', [ProductoGeneralController::class, 'apiStore']);
});

require __DIR__ . '/auth.php';
