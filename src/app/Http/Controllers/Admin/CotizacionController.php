<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Cotizacion;
use App\Models\User;
use App\Models\Celular;
use App\Models\Computadora;
use App\Models\ProductoGeneral;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Mail\CotizacionMailable;
use App\Models\ProductoApple;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Google_Client;
use Google_Service_Drive;
use Google_Service_Drive_Permission;

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

        // 1. Crear la cotización sin URL aún
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

        // 2. Exportar PDF y subir a Drive usando OAuth personal
        $pdfPath = $this->generarPDFLocal($cotizacion->id);
        $driveUrl = $this->exportarPDFYGuardar($cotizacion->id);

        if ($driveUrl) {
            $cotizacion->update(['drive_url' => $driveUrl]);
        }


        // 4. Enviar por correo si aplica
        if ($request->correo_cliente) {
            try {
                Mail::to($request->correo_cliente)->queue(new CotizacionMailable($cotizacion));
                $cotizacion->update(['enviado_por_correo' => true]);
            } catch (\Exception $e) {
                \Log::error('Error al enviar cotización: ' . $e->getMessage());
            }
        }

        return redirect()->route('admin.cotizaciones.index')->with('success', 'Cotización registrada exitosamente.');
    }


    public function exportarPDF($id)
    {
        try {
            // 1. Obtener cotización
            $cotizacion = Cotizacion::findOrFail($id);

            // 2. Generar PDF con DomPDF
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.cotizacion', compact('cotizacion'))->setPaper('letter');
            $pdfContent = $pdf->output();
            $fileName = 'cotizacion_' . $cotizacion->id . '.pdf';

            // 3. Configurar cliente Google
            $client = new \Google_Client();
            $client->setAuthConfig(storage_path('app/google/credentials.json')); // tu archivo client_secret.json
            $client->addScope(\Google_Service_Drive::DRIVE);
            $client->setAccessType('offline');

            // 4. Cargar token desde archivo
            $tokenPath = storage_path('app/google/token.json');
            if (!file_exists($tokenPath)) {
                return response()->json(['error' => '❌ No se encontró el archivo token.json.'], 403);
            }

            $accessToken = json_decode(file_get_contents($tokenPath), true);
            $client->setAccessToken($accessToken);

            // 5. Verificar y refrescar token si está expirado
            if ($client->isAccessTokenExpired()) {
                if ($client->getRefreshToken()) {
                    $newToken = $client->fetchAccessTokenWithRefreshToken($client->getRefreshToken());
                    file_put_contents($tokenPath, json_encode($client->getAccessToken()));
                } else {
                    return response()->json(['error' => '❌ Token expirado y no hay refresh token disponible.'], 403);
                }
            }

            // 6. Subir a Google Drive
            $service = new \Google_Service_Drive($client);
            $folderId = env('GOOGLE_DRIVE_FOLDER_ID');

            $fileMetadata = new \Google_Service_Drive_DriveFile([
                'name' => $fileName,
                'parents' => [$folderId],
            ]);

            $file = $service->files->create($fileMetadata, [
                'data' => $pdfContent,
                'mimeType' => 'application/pdf',
                'uploadType' => 'multipart',
                'fields' => 'id',
            ]);

            // 7. Hacer público el archivo
            $permission = new \Google_Service_Drive_Permission([
                'type' => 'anyone',
                'role' => 'reader',
            ]);
            $service->permissions->create($file->id, $permission);

            // 8. Crear URL pública
            $publicUrl = 'https://drive.google.com/file/d/' . $file->id . '/view?usp=sharing';

            // 9. Guardar la URL en base de datos
            $cotizacion->update([
                'url_drive' => $publicUrl,
            ]);

            // 10. Retornar respuesta exitosa
            return response()->json([
                'mensaje' => '✅ PDF generado y subido a Google Drive correctamente.',
                'url' => $publicUrl,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => '❌ Error al subir archivo a Google Drive: ' . $e->getMessage()
            ], 500);
        }
    }

    private function exportarPDFYGuardar($cotizacionId)
    {
        $cotizacion = Cotizacion::findOrFail($cotizacionId);

        $pdfPath = $this->generarPDFLocal($cotizacionId);

        $client = new \Google_Client();
        $client->setAuthConfig(storage_path('app/google/credentials.json'));
        $client->addScope(\Google_Service_Drive::DRIVE_FILE);
        $client->setAccessType('offline');

        // Cargar el token de acceso (usualmente desde storage o DB)
        $tokenPath = storage_path('app/google/token.json');
        if (file_exists($tokenPath)) {
            $accessToken = json_decode(file_get_contents($tokenPath), true);
            $client->setAccessToken($accessToken);
        }

        $service = new \Google_Service_Drive($client);

        $fileMetadata = new \Google_Service_Drive_DriveFile([
            'name' => 'cotizacion_' . $cotizacionId . '.pdf',
            'parents' => ['1l_NdBQ_rgDiFYy6iFdisV3r7ERdNC15I']
        ]);

        $content = file_get_contents($pdfPath);

        $uploadedFile = $service->files->create($fileMetadata, [
            'data' => $content,
            'mimeType' => 'application/pdf',
            'uploadType' => 'multipart',
            'fields' => 'id',
        ]);

        // Hacer el archivo público
        $permission = new \Google_Service_Drive_Permission([
            'type' => 'anyone',
            'role' => 'reader',
        ]);
        $service->permissions->create($uploadedFile->id, $permission);

        // Obtener URL pública
        $publicUrl = "https://drive.google.com/file/d/{$uploadedFile->id}/view?usp=sharing";

        return $publicUrl; // ✅ RETORNAR VALOR
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
        $driveUrl = $this->exportarPDFYGuardar($cotizacion->id); // ✅ obtener URL
        $cotizacion->update(['drive_url' => $driveUrl]); // ✅ guardar en BD


        return to_route('vendedor.cotizaciones.index')->with('success', 'Cotización registrada correctamente.');
    }

    public function verPDFLocalVendedor($id)
    {
        $cotizacion = Cotizacion::where('id', $id)
            ->where('user_id', auth()->id()) // asegurar que solo acceda a las suyas
            ->firstOrFail();

        $filePath = storage_path('app/public/cotizaciones/cotizacion_' . $cotizacion->id . '.pdf');

        if (!file_exists($filePath)) {
            abort(404, 'Archivo PDF no encontrado.');
        }

        return response()->file($filePath);
    }


    public function googleAuth()
    {
        $client = new \Google_Client();
        $client->setClientId(env('GOOGLE_CLIENT_ID'));
        $client->setClientSecret(env('GOOGLE_CLIENT_SECRET'));
        $client->setRedirectUri(env('GOOGLE_REDIRECT_URI'));
        $client->addScope(\Google_Service_Drive::DRIVE_FILE);
        $client->setAccessType('offline');
        $client->setPrompt('select_account consent');

        $authUrl = $client->createAuthUrl();

        return redirect()->away($authUrl);
    }

    public function googleCallback(Request $request)
    {
        $client = new \Google_Client();
        $client->setClientId(env('GOOGLE_CLIENT_ID'));
        $client->setClientSecret(env('GOOGLE_CLIENT_SECRET'));
        $client->setRedirectUri(env('GOOGLE_REDIRECT_URI'));

        if ($request->has('code')) {
            $accessToken = $client->fetchAccessTokenWithAuthCode($request->get('code'));

            if (isset($accessToken['access_token'])) {
                Session::put('google_access_token', $accessToken);
                return redirect()->route('admin.cotizaciones.index')
                    ->with('success', '✅ Cuenta de Google conectada correctamente.');
            } else {
                return redirect()->route('admin.cotizaciones.index')
                    ->with('error', '❌ Error al obtener token de acceso.');
            }
        }

        return redirect()->route('admin.cotizaciones.index')
            ->with('error', '❌ Código de autorización no encontrado.');
    }

    private function generarPDFLocal($cotizacionId)
    {
        $cotizacion = Cotizacion::findOrFail($cotizacionId);
        $pdf = PDF::loadView('pdf.cotizacion', compact('cotizacion'));

        $fileName = 'cotizacion_' . $cotizacion->id . '.pdf';
        $filePath = storage_path('app/public/' . $fileName);
        $pdf->save($filePath);

        return $filePath;
    }
}
