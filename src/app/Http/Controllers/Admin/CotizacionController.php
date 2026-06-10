<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cotizacion;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;
use App\Models\ProductoApple;
use App\Models\Cliente;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Mail\CotizacionMailable;
use Google_Client;
use Google_Service_Drive;
use Google_Service_Drive_Permission;

class CotizacionController extends Controller
{
    /* ======================================================
       INDEX ADMIN
    ====================================================== */
    public function index()
    {
        return Inertia::render('Admin/Cotizaciones/Index', [
            'cotizaciones' => Cotizacion::with('usuario')->latest()->get(),
        ]);
    }

    /* ======================================================
       INDEX VENDEDOR
    ====================================================== */
    public function indexVendedor()
    {
        return Inertia::render('Vendedor/Cotizaciones/Index', [
            'cotizaciones' => Cotizacion::where('user_id', auth()->id())->latest()->get(),
        ]);
    }

    /* ======================================================
       CREATE
    ====================================================== */
    public function create()
    {
        return $this->vistaCreate();
    }

    public function createVendedor()
    {
        return $this->vistaCreate();
    }

    private function vistaCreate()
    {
        return Inertia::render(
            auth()->user()->rol === 'admin'
                ? 'Admin/Cotizaciones/Create'
                : 'Vendedor/Cotizaciones/Create',
            [
                'fechaHoy' => now()->toDateString(),
                'celulares' => Celular::where('estado', 'disponible')->get(),
                'computadoras' => Computadora::where('estado', 'disponible')->get(),
                'productosGenerales' => ProductoGeneral::where('estado', 'disponible')->get(),
                'productosApple' => ProductoApple::where('estado', 'disponible')->get(),
            ]
        );
    }

    /* ======================================================
       STORE (ADMIN + VENDEDOR)
    ====================================================== */
    public function store(Request $request)
    {
        $this->guardarCotizacion($request);
        return redirect()->route('admin.cotizaciones.index')
            ->with('success', 'Cotización registrada correctamente.');
    }

    public function storeVendedor(Request $request)
    {
        $this->guardarCotizacion($request);
        return redirect()->route('vendedor.cotizaciones.index')
            ->with('success', 'Cotización registrada correctamente.');
    }

    private function guardarCotizacion(Request $request)
    {
        $request->validate([
            'nombre_cliente' => 'required|string|max:255',
            'telefono_completo' => 'required|string|regex:/^\+\d{8,15}$/',
            'correo_cliente' => 'nullable|email|max:255',
            'fecha_cotizacion' => 'required|date',
            'items' => 'required|array|min:1',
            'items.*.nombre' => 'required|string',
            'items.*.cantidad' => 'required|integer|min:1',
            'items.*.precio_sin_factura' => 'required|numeric|min:0',
            'items.*.descuento' => 'nullable|numeric|min:0',
            'items.*.iva' => 'required|numeric|min:0',
            'items.*.it' => 'required|numeric|min:0',
            'items.*.total' => 'required|numeric|min:0',
        ]);

        $telefono = preg_replace('/\D/', '', $request->telefono_completo);

        $cliente = Cliente::firstOrCreate(
            [
                'user_id' => Auth::id(),
                'telefono' => $telefono,
            ],
            [
                'nombre' => $request->nombre_cliente,
                'correo' => $request->correo_cliente,
            ]
        );

        $items = collect($request->items)->map(fn($i) => [
            'nombre' => $i['nombre'],
            'cantidad' => (int) $i['cantidad'],
            'precio_sin_factura' => (float) $i['precio_sin_factura'],
            'descuento' => (float) ($i['descuento'] ?? 0),
            'iva' => (float) $i['iva'],
            'it' => (float) $i['it'],
            'total' => (float) $i['total'],
        ])->toArray();

        $total = collect($items)->sum('total');


        $cotizacion = Cotizacion::create([
            'user_id' => Auth::id(),
            'cliente_id' => $cliente->id,
            'nombre_cliente' => $cliente->nombre,
            'telefono' => $telefono,
            'correo_cliente' => $cliente->correo,
            'fecha_cotizacion' => $request->fecha_cotizacion,
            'notas_adicionales' => $request->notas_adicionales ?? '',
            'items' => $items,
            'total' => $total,
        ]);

        $driveUrl = $this->exportarPDFYGuardar($cotizacion->id);
        if ($driveUrl) {
            $cotizacion->update(['drive_url' => $driveUrl]);
        }

        if ($cliente->correo) {
            Mail::to($cliente->correo)->queue(new CotizacionMailable($cotizacion));
            $cotizacion->update(['enviado_por_correo' => true]);
        }

        return $cotizacion;
    }

    /* ======================================================
       PDF + GOOGLE DRIVE
    ====================================================== */
    private function exportarPDFYGuardar($id)
    {
        $cotizacion = Cotizacion::findOrFail($id);
        $pdf = Pdf::loadView('pdf.cotizacion', compact('cotizacion'));
        $content = $pdf->output();

        try {
            $credentialsPath = storage_path('app/google/credentials.json');
            $folderId = env('GOOGLE_DRIVE_FOLDER_ID');

            if (!file_exists($credentialsPath) || !$folderId) {
                Log::warning('Cotización creada sin subir PDF a Drive: falta configuración.', [
                    'cotizacion_id' => $cotizacion->id,
                ]);
                return null;
            }

            $client = new Google_Client();
            $client->setAuthConfig($credentialsPath);
            $client->addScope(Google_Service_Drive::DRIVE_FILE);
            $client->setAccessType('offline');

            $tokenPath = storage_path('app/google/token.json');
            if (file_exists($tokenPath)) {
                $client->setAccessToken(json_decode(file_get_contents($tokenPath), true));
            }

            $service = new Google_Service_Drive($client);

            $file = $service->files->create(
                new \Google_Service_Drive_DriveFile([
                    'name' => "cotizacion_{$id}.pdf",
                    'parents' => [$folderId],
                ]),
                [
                    'data' => $content,
                    'mimeType' => 'application/pdf',
                    'uploadType' => 'multipart',
                    'fields' => 'id',
                ]
            );

            $service->permissions->create($file->id, new Google_Service_Drive_Permission([
                'type' => 'anyone',
                'role' => 'reader',
            ]));

            return "https://drive.google.com/file/d/{$file->id}/view";
        } catch (\Throwable $e) {
            Log::warning('Cotización creada, pero falló la subida del PDF a Google Drive.', [
                'cotizacion_id' => $cotizacion->id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    public function exportarPDF($id)
    {
        $cotizacion = Cotizacion::findOrFail($id);

        if (auth()->user()->rol === 'vendedor' && $cotizacion->user_id !== auth()->id()) {
            abort(403);
        }

        return Pdf::loadView('pdf.cotizacion', compact('cotizacion'))
            ->stream("cotizacion_{$cotizacion->id}.pdf");
    }

    public function verPDFLocalVendedor($id)
    {
        return $this->exportarPDF($id);
    }

    private function urlPDF(Cotizacion $cotizacion): string
    {
        if ($cotizacion->drive_url) {
            return $cotizacion->drive_url;
        }

        return auth()->user()->rol === 'vendedor'
            ? route('vendedor.cotizaciones.pdf', $cotizacion->id)
            : route('admin.cotizaciones.pdf', $cotizacion->id);
    }

    /* ======================================================
       WHATSAPP INDIVIDUAL
    ====================================================== */
    public function whatsappFinal($id)
    {
        $cotizacion = Cotizacion::findOrFail($id);

        if (auth()->user()->rol === 'vendedor' && $cotizacion->user_id !== auth()->id()) {
            abort(403);
        }

        $numero = preg_replace('/\D/', '', $cotizacion->telefono);
        if (!$numero) {
            return back()->with('error', 'Número inválido');
        }

        $mensaje = "Hola {$cotizacion->nombre_cliente} 😊\n\n"
            . "📝 *Cotización Apple Technology*\n"
            . "📄 N° {$cotizacion->id}\n"
            . "💰 Total: Bs " . number_format($cotizacion->total, 2) . "\n"
            . "🔗 " . $this->urlPDF($cotizacion);

        return redirect()->away(
            "https://wa.me/{$numero}?text=" . rawurlencode($mensaje)
        );
    }

    public function whatsappFinalLibre(Request $request)
    {
        $id = $request->query('id') ?? $request->query('cotizacion_id');

        if (!$id) {
            return back()->with('error', 'Selecciona una cotización para enviar por WhatsApp.');
        }

        return $this->whatsappFinal($id);
    }

    /* ======================================================
       WHATSAPP LOTE ✅
    ====================================================== */
    public function enviarLoteWhatsapp(Request $request)
    {
        $ids = $request->input('ids', []);
        $links = [];

        foreach ($ids as $id) {
            $cotizacion = Cotizacion::find($id);
            if (!$cotizacion) continue;

            if (auth()->user()->rol === 'vendedor' && $cotizacion->user_id !== auth()->id()) continue;

            $numero = preg_replace('/\D/', '', $cotizacion->telefono);
            if (!$numero) continue;

            $mensaje = "Hola {$cotizacion->nombre_cliente} 😊\n\n"
                . "📝 *Cotización Apple Technology*\n"
                . "📄 N° {$cotizacion->id}\n"
                . "💰 Total: Bs " . number_format($cotizacion->total, 2) . "\n"
                . "🔗 " . $this->urlPDF($cotizacion);

            $links[] = [
                'nombre' => $cotizacion->nombre_cliente,
                'telefono' => $numero,
                'pdf' => $this->urlPDF($cotizacion),
                'link' => "https://wa.me/{$numero}?text=" . rawurlencode($mensaje),
            ];
        }

        return Inertia::render(
            auth()->user()->rol === 'admin'
                ? 'Admin/Cotizaciones/WhatsappLote'
                : 'Vendedor/Cotizaciones/WhatsappLote',
            ['links' => $links]
        );
    }
    /* ======================================================
   REENVIAR COTIZACIÓN POR CORREO
====================================================== */
    /* ======================================================
   REENVIAR CORREO (ADMIN + VENDEDOR)
====================================================== */
    public function reenviarCorreo($id)
    {
        $cotizacion = Cotizacion::findOrFail($id);

        // 🔐 Seguridad por rol
        if (auth()->user()->rol === 'vendedor' && $cotizacion->user_id !== auth()->id()) {
            abort(403);
        }

        // 📧 Reenviar correo
        if ($cotizacion->correo_cliente) {
            Mail::to($cotizacion->correo_cliente)
                ->queue(new CotizacionMailable($cotizacion));

            $cotizacion->update([
                'enviado_por_correo' => true,
            ]);
        }

        return back()->with('success', 'Cotización reenviada por correo.');
    }
}
