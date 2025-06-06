<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cotizacion;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Mail\CotizacionMailable;
use App\Models\ProductoApple;

class CotizacionController extends Controller
{
    public function index()
    {
        $cotizaciones = Cotizacion::with('usuario')->latest()->get()->map(function ($c) {
            $c->total = (float) $c->total;
            return $c;
        });

        return Inertia::render('Admin/Cotizaciones/Index', [
            'cotizaciones' => $cotizaciones
        ]);
    }

    public function create()
    {
        return Inertia::render('Admin/Cotizaciones/Create', [
            'fechaHoy' => now()->toDateString(),
            'celulares' => Celular::where('estado', 'disponible')->get(),
            'computadoras' => Computadora::where('estado', 'disponible')->get(),
            'productosGenerales' => ProductoGeneral::where('estado', 'disponible')->get(),
            'productosApple' => ProductoApple::where('estado', 'disponible')->get(),

        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nombre_cliente' => 'required|string|max:255',
            'telefono_completo' => 'required|string|regex:/^\+\d{8,15}$/',
            'correo_cliente' => 'nullable|email|max:255',
            'items' => 'required|array|min:1',
            'fecha_cotizacion' => 'required|date',
            'descuento' => 'nullable|numeric|min:0',
        ]);
    
        $items = collect($request->items)->map(function ($item) {
            $sinFactura = floatval($item['precio_sin_factura'] ?? 0);
            $conFactura = floatval($item['precio_con_factura'] ?? 0);
        
            return [
                'nombre' => $item['nombre'],
                'cantidad' => intval($item['cantidad']),
                'precio_base' => $sinFactura,
                'precio_sin_factura' => $sinFactura,
                'precio_con_factura' => $conFactura,
            ];
        });
        
    
        $subtotalConFactura = $items->sum(fn($item) => $item['precio_con_factura'] * $item['cantidad']);
        $descuento = floatval($request->descuento ?? 0);
        $totalConFactura = max(0, $subtotalConFactura - $descuento);
    
        $cotizacion = Cotizacion::create([
            'nombre_cliente' => $request->nombre_cliente,
            'telefono' => $request->telefono_completo,
            'correo_cliente' => $request->correo_cliente,
            'fecha_cotizacion' => $request->fecha_cotizacion,
            'notas_adicionales' => $request->filled('notas_adicionales') ? $request->notas_adicionales : '',
            'user_id' => Auth::id(),
            'items' => $items,
            'descuento' => $descuento,
            'total' => $totalConFactura,
        ]);
    
        $this->exportarPDFYGuardar($cotizacion->id);
    
        if ($request->correo_cliente) {
            try {
                Mail::to($request->correo_cliente)->queue(new CotizacionMailable($cotizacion));
            } catch (\Exception $e) {
                \Log::error('Error al enviar cotización: ' . $e->getMessage());
            }
        }
    
        return redirect()->route('admin.cotizaciones.index')->with('success', 'Cotización registrada exitosamente.');
    }

    public function exportarPDF($id)
    {
        $cotizacion = Cotizacion::findOrFail($id);

        if (is_string($cotizacion->items)) {
            $cotizacion->items = json_decode($cotizacion->items, true);
        }
        
        $pdf = Pdf::loadView('pdf.cotizacion', compact('cotizacion'))->setPaper('letter');
        return $pdf->stream('cotizacion_' . $cotizacion->id . '.pdf');
    }

    public function exportarPDFYGuardar($id)
    {
        $cotizacion = Cotizacion::findOrFail($id);

        if (is_string($cotizacion->items)) {
            $cotizacion->items = json_decode($cotizacion->items, true);
        }        

        if ($cotizacion->drive_url && str_contains($cotizacion->drive_url, 'https://drive.google.com')) {
            return $cotizacion->drive_url;
        }

        $pdf = Pdf::loadView('pdf.cotizacion', compact('cotizacion'))->setPaper('letter');
        $pdfContent = $pdf->output();
        $fileName = 'cotizacion_' . $cotizacion->id . '.pdf';

        $client = new \Google_Client();
        $client->setAuthConfig(storage_path('app/google/credentials.json'));
        $client->addScope(\Google_Service_Drive::DRIVE);
        $service = new \Google_Service_Drive($client);

        $fileMetadata = new \Google_Service_Drive_DriveFile([
            'name' => $fileName,
            'parents' => [env('GOOGLE_DRIVE_FOLDER_ID')],
        ]);

        $file = $service->files->create($fileMetadata, [
            'data' => $pdfContent,
            'mimeType' => 'application/pdf',
            'uploadType' => 'multipart',
            'fields' => 'id',
        ]);

        $service->permissions->create($file->id, new \Google_Service_Drive_Permission([
            'type' => 'anyone',
            'role' => 'reader',
        ]));

        $url = 'https://drive.google.com/file/d/' . $file->id . '/view?usp=sharing';
        $cotizacion->drive_url = $url;
        $cotizacion->save();

        return $url;
        
        // Al final de store()
        $this->exportarPDFYGuardar($cotizacion->id);
        
    }

    public function whatsappFinal($id)
    {
        $cotizacion = Cotizacion::findOrFail($id);
    
        // ✅ Solo el vendedor tiene restricción de propiedad
        if (auth()->user()->rol === 'vendedor' && $cotizacion->user_id !== auth()->id()) {
            abort(403, 'No autorizado');
        }
    
        $numero = preg_replace('/\D/', '', $cotizacion->telefono);
        if (!$numero || strlen($numero) < 8) {
            return back()->with('error', 'El número no es válido.');
        }
    
        $pdfUrl = $this->exportarPDFYGuardar($id);
        $mensaje = "Hola {$cotizacion->nombre_cliente}, gracias por confiar en *AppleBoss* 😊\n\n"
            . "📝 *Cotización AppleBoss*\n"
            . "👤 Cliente: {$cotizacion->nombre_cliente}\n"
            . "📄 Cotización N.º: {$cotizacion->id}\n"
            . "💰 Total: Bs " . number_format($cotizacion->total, 2) . "\n"
            . "🔗 Ver PDF: $pdfUrl";
    
        $url = "https://wa.me/{$numero}?text=" . rawurlencode($mensaje);
        return redirect()->away($url);
    }
        

    public function whatsappFinalLibre(Request $request)
{
    $telefono = $request->input('telefono');
    $mensaje = $request->input('mensaje');

    return Inertia::render('Admin/Cotizaciones/EnviarWhatsapp', [
        'telefono' => $telefono,
        'mensaje' => $mensaje,
    ]);
}


    public function reenviarCorreo($id)
    {
        $cotizacion = Cotizacion::findOrFail($id);
        if ($cotizacion->correo_cliente) {
            Mail::to($cotizacion->correo_cliente)->queue(new CotizacionMailable($cotizacion));
        }

        return back()->with('success', 'Correo reenviado exitosamente.');
    }

    public function enviarLoteWhatsapp(Request $request)
    {
        $ids = $request->input('ids', []);
        $links = [];
    
        foreach ($ids as $id) {
            $cotizacion = Cotizacion::find($id);
            if (!$cotizacion) continue;
    
            // ✅ Solo aplicar filtro si es vendedor
            if (auth()->user()->rol === 'vendedor' && $cotizacion->user_id !== auth()->id()) continue;
    
            $numero = preg_replace('/\D/', '', $cotizacion->telefono);
            if (!$numero || strlen($numero) < 8) continue;
    
            $pdfUrl = $this->exportarPDFYGuardar($id);
            $mensaje = "Hola {$cotizacion->nombre_cliente}, gracias por confiar en *AppleBoss* 😊\n\n"
                . "📝 *Cotización AppleBoss*\n"
                . "👤 Cliente: {$cotizacion->nombre_cliente}\n"
                . "📄 Cotización N.º: {$cotizacion->id}\n"
                . "💰 Total: Bs " . number_format($cotizacion->total, 2) . "\n"
                . "🔗 Ver PDF: $pdfUrl";
    
            $links[] = [
                'nombre' => $cotizacion->nombre_cliente,
                'telefono' => $numero,
                'cotizacion_id' => $cotizacion->id,
                'total' => $cotizacion->total,
                'pdf' => $pdfUrl,
                'link' => "https://wa.me/{$numero}?text=" . rawurlencode($mensaje),
            ];
        }
    
        $layout = auth()->user()->rol === 'admin'
            ? 'Admin/Cotizaciones/WhatsappLote'
            : 'Vendedor/Cotizaciones/WhatsappLote';
    
        return Inertia::render($layout, [
            'links' => $links
        ]);
    }      

    public function indexVendedor()
{
    $cotizaciones = Cotizacion::where('user_id', auth()->id())
        ->latest()
        ->get();

    return Inertia::render('Vendedor/Cotizaciones/Index', [
        'cotizaciones' => $cotizaciones
    ]);
}

public function createVendedor()
{
    $celulares = Celular::where('estado', 'disponible')->get();
    $computadoras = Computadora::where('estado', 'disponible')->get();
    $productosGenerales = ProductoGeneral::where('estado', 'disponible')->get();
    $productosApple = ProductoApple::where('estado', 'disponible')->get();

    return Inertia::render('Vendedor/Cotizaciones/Create', [ // 👈 MUY IMPORTANTE
        'fechaHoy' => now()->toDateString(),
        'celulares' => $celulares,
        'computadoras' => $computadoras,
        'productosGenerales' => $productosGenerales,
        'productosApple' => $productosApple,
    ]);
}

public function storeVendedor(Request $request)
{
    $request->validate([
        'nombre_cliente' => 'required|string|max:255',
        'telefono_completo' => 'required|string|regex:/^\+\d{8,15}$/',
        'correo_cliente' => 'nullable|email|max:255',
        'fecha_cotizacion' => 'required|date',
        'items' => 'required|array|min:1',
        'descuento' => 'nullable|numeric|min:0',
    ]);

    // Procesamiento de los ítems
    $items = collect($request->items)->map(function ($item) {
        $sinFactura = floatval($item['precio_sin_factura'] ?? 0);
        $conFactura = floatval($item['precio_con_factura'] ?? 0);

        return [
            'nombre' => $item['nombre'],
            'cantidad' => intval($item['cantidad']),
            'precio_base' => $sinFactura,
            'precio_sin_factura' => $sinFactura,
            'precio_con_factura' => $conFactura,
        ];
    });

    $subtotalConFactura = $items->sum(fn($item) => $item['precio_con_factura'] * $item['cantidad']);
    $descuento = floatval($request->descuento ?? 0);
    $totalConFactura = max(0, $subtotalConFactura - $descuento);

    // Crear la cotización
    $cotizacion = Cotizacion::create([
        'nombre_cliente' => $request->nombre_cliente,
        'telefono' => $request->telefono_completo,
        'correo_cliente' => $request->correo_cliente,
        'fecha_cotizacion' => $request->fecha_cotizacion,
        'notas_adicionales' => $request->filled('notas_adicionales') ? $request->notas_adicionales : '',
        'user_id' => auth()->id(),
        'items' => $items,
        'descuento' => $descuento,
        'total' => $totalConFactura,
        'enviado_por_correo' => false,
        'enviado_por_whatsapp' => false,
    ]);

    // Generar y guardar el PDF
    $this->exportarPDFYGuardar($cotizacion->id);

    return to_route('vendedor.cotizaciones.index')->with('success', 'Cotización registrada correctamente.');
}
}