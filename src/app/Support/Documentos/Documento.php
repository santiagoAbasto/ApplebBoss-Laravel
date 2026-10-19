<?php

namespace App\Support\Documentos;

use App\Models\Cotizacion;
use App\Models\Diagnostico;
use App\Models\Reserva;
use App\Models\ServicioTecnico;
use App\Models\Venta;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Lo que la tienda le entrega al cliente en papel o por correo: la nota de venta, la nota de servicio técnico, la nota
 * de reserva y el informe técnico. Acá vive, una sola vez, cómo se arma el PDF de cada uno, su enlace público firmado,
 * el mensaje de WhatsApp listo para mandar y lo que el panel necesita para los botones de compartir.
 *
 * El enlace público es una clave aleatoria de 32 caracteres (tabla enlaces_documento): no deja ver el tipo ni el número
 * interno, no se puede adivinar ni recorrer, y vence a los 30 días. Abre una página de marca con vista previa para
 * WhatsApp y el botón al PDF, que no se indexa ni manda la clave a otros sitios.
 */
final class Documento
{
    public const TIPOS = [
        'venta'       => Venta::class,
        'servicio'    => ServicioTecnico::class,
        'reserva'     => Reserva::class,
        'diagnostico' => Diagnostico::class,
        'cotizacion'  => Cotizacion::class,
    ];

    /** Días que vale un enlace. El PDF también va adjunto al correo: el enlace es para abrirlo rápido, no para siempre. */
    public const VIGENCIA_DIAS = 30;

    /** Enlaces ya resueltos para cada documento (por objeto: se olvidan solos cuando el modelo deja de existir). */
    private static ?\WeakMap $enlaces = null;

    public static function tipo(Model $doc): string
    {
        return array_search($doc::class, self::TIPOS, true) ?: throw new \InvalidArgumentException('No es un documento del cliente: ' . $doc::class);
    }

    public static function buscar(string $tipo, int $id): Model
    {
        $modelo = self::TIPOS[$tipo] ?? abort(404);

        return $modelo::findOrFail($id);
    }

    public static function codigo(Model $doc): string
    {
        return match (true) {
            $doc instanceof Diagnostico => (string) $doc->codigo,
            $doc instanceof Cotizacion  => 'COT-' . $doc->id,
            default                     => (string) $doc->codigo_nota,
        };
    }

    public static function titulo(Model $doc): string
    {
        return match (self::tipo($doc)) {
            'venta'       => 'Nota de venta ' . self::codigo($doc),
            'servicio'    => 'Nota de servicio ' . self::codigo($doc),
            'reserva'     => 'Nota de reserva ' . self::codigo($doc),
            'diagnostico' => 'Informe técnico ' . self::codigo($doc),
            'cotizacion'  => 'Cotización ' . self::codigo($doc),
        };
    }

    public static function nombre(Model $doc): ?string
    {
        return match (self::tipo($doc)) {
            'venta', 'reserva', 'cotizacion' => $doc->nombre_cliente,
            'servicio'                       => $doc->cliente,
            'diagnostico'                    => $doc->cliente_nombre,
        };
    }

    /** El nombre de pila, para saludar: «Ana», no «Ana María Quispe Flores». */
    public static function nombreDePila(Model $doc): string
    {
        $nombre = trim((string) self::nombre($doc));

        return $nombre === '' ? 'Hola' : Str::ucfirst(Str::lower(Str::before($nombre, ' ')));
    }

    public static function telefono(Model $doc): ?string
    {
        return match (self::tipo($doc)) {
            'venta', 'reserva'       => $doc->telefono_cliente,
            'servicio', 'cotizacion' => $doc->telefono,
            'diagnostico'            => $doc->cliente_telefono,
        };
    }

    /** En qué columna guarda cada documento el correo del cliente. */
    public static function campoCorreo(Model $doc): string
    {
        return match (self::tipo($doc)) {
            'venta', 'reserva', 'cotizacion' => 'correo_cliente',
            'servicio'                       => 'correo',
            'diagnostico'                    => 'cliente_correo',
        };
    }

    public static function correo(Model $doc): ?string
    {
        $correo = trim((string) $doc->{self::campoCorreo($doc)});

        return $correo === '' ? null : Str::lower($correo);
    }

    /** Un diagnóstico sin firma es un borrador: no sale de la tienda. */
    public static function publicable(Model $doc): bool
    {
        return ! ($doc instanceof Diagnostico) || $doc->listo();
    }

    public static function nombreArchivo(Model $doc): string
    {
        return Str::slug(self::titulo($doc)) . '.pdf';
    }

    /** El mismo PDF que imprime el panel. */
    public static function pdf(Model $doc): \Barryvdh\DomPDF\PDF
    {
        return match (self::tipo($doc)) {
            'venta'       => self::pdfDeVenta($doc),
            'servicio'    => self::pdfDeServicio($doc),
            'reserva'     => Pdf::loadView('pdf.reserva', ['reserva' => $doc->load(['items', 'items.celular', 'items.computadora', 'items.productoGeneral', 'items.productoApple', 'vendedor', 'venta'])]),
            'diagnostico' => Pdf::loadView('pdf.diagnostico', ['diagnostico' => $doc]),
            'cotizacion'  => Pdf::loadView('pdf.cotizacion', ['cotizacion' => $doc]),
        };
    }

    private static function pdfDeVenta(Venta $venta): \Barryvdh\DomPDF\PDF
    {
        $venta->load(['items', 'items.celular', 'items.computadora', 'items.productoGeneral', 'items.productoApple', 'vendedor',
            'entregadoCelular', 'entregadoComputadora', 'entregadoProductoGeneral', 'entregadoProductoApple', 'reserva']);

        $sumaSubtotalItems = $venta->items->sum('subtotal');
        $valorPermuta = $venta->valor_permuta ?? 0;
        $montoReserva = $venta->monto_reserva_aplicado ?? 0;
        $totalAPagar = $sumaSubtotalItems - $valorPermuta - $montoReserva;

        return Pdf::loadView('pdf.boleta', compact('venta', 'sumaSubtotalItems', 'valorPermuta', 'montoReserva', 'totalAPagar'));
    }

    private static function pdfDeServicio(ServicioTecnico $servicio): \Barryvdh\DomPDF\PDF
    {
        $servicio->load('vendedor');

        return Pdf::loadView('pdf.boleta_servicio', [
            'servicio'          => $servicio,
            'servicios_cliente' => self::trabajosDeServicio($servicio),
        ]);
    }

    /** Los trabajos de la nota de servicio con lo que paga el cliente por cada uno (nunca el costo). */
    public static function trabajosDeServicio(ServicioTecnico $servicio): \Illuminate\Support\Collection
    {
        return collect(json_decode((string) $servicio->detalle_servicio, true) ?: [])
            ->filter(fn ($i) => is_array($i) && isset($i['descripcion']))
            ->map(fn ($i) => ['descripcion' => $i['descripcion'], 'precio' => (float) ($i['precio'] ?? 0)])
            ->values();
    }

    /** Enlace público del documento (la página con el PDF). Null si todavía no puede salir (informe sin firmar). */
    public static function enlace(Model $doc): ?string
    {
        if (! self::publicable($doc)) {
            return null;
        }

        $guardado = (self::$enlaces ??= new \WeakMap())[$doc] ?? null;
        if (! $guardado || $guardado[1]->lte(now()->addDay())) {
            self::prepararEnlaces([$doc]);
            $guardado = self::$enlaces[$doc];
        }

        return route('documentos.publico', $guardado[0]);
    }

    /**
     * Deja resuelto el enlace vigente de cada documento con una consulta por tipo y, si faltan, una sola inserción:
     * un listado de 500 ventas no hace 500 escrituras. Un enlace que vence en menos de un día se reemplaza.
     */
    public static function prepararEnlaces(iterable $docs): void
    {
        self::$enlaces ??= new \WeakMap();
        $porTipo = collect($docs)->filter(fn (Model $d) => self::publicable($d))->groupBy(fn (Model $d) => self::tipo($d));

        foreach ($porTipo as $tipo => $grupo) {
            $vigentes = DB::table('enlaces_documento')
                ->where('tipo', $tipo)
                ->whereIn('documento_id', $grupo->map->getKey()->unique()->values())
                ->where('vence_en', '>', now()->addDay())
                ->orderBy('vence_en')
                ->get()
                ->keyBy('documento_id');

            $nuevos = [];
            $resueltos = [];
            foreach ($grupo as $doc) {
                $id = $doc->getKey();
                if (! isset($resueltos[$id])) {
                    if ($fila = $vigentes->get($id)) {
                        $resueltos[$id] = [$fila->token, Carbon::parse($fila->vence_en)];
                    } else {
                        $resueltos[$id] = [Str::random(32), now()->addDays(self::VIGENCIA_DIAS)];
                        $nuevos[] = ['token' => $resueltos[$id][0], 'tipo' => $tipo, 'documento_id' => $id,
                            'vence_en' => $resueltos[$id][1], 'created_at' => now(), 'updated_at' => now()];
                    }
                }
                self::$enlaces[$doc] = $resueltos[$id];
            }

            foreach (array_chunk($nuevos, 500) as $lote) {
                DB::table('enlaces_documento')->insert($lote);
            }
        }
    }

    /** El documento de un enlace y hasta cuándo vale; null si la clave no existe o el documento ya no está. */
    public static function porToken(string $token): ?array
    {
        $fila = DB::table('enlaces_documento')->where('token', $token)->first();
        $modelo = $fila ? (self::TIPOS[$fila->tipo] ?? null) : null;
        $doc = $modelo ? $modelo::find($fila->documento_id) : null;

        return $doc ? [$doc, Carbon::parse($fila->vence_en)] : null;
    }

    /** La línea de la vista previa (WhatsApp, Facebook): qué es el documento, sin datos del cliente. */
    public static function resumen(Model $doc): string
    {
        return match (self::tipo($doc)) {
            'venta'       => 'Tu comprobante con el detalle y la garantía, en PDF.',
            'servicio'    => 'El detalle de tu servicio técnico, en PDF.',
            'reserva'     => 'Tu reserva con el abono y el saldo, en PDF.',
            'diagnostico' => 'El informe técnico firmado de tu equipo, en PDF.',
            'cotizacion'  => 'Tu cotización con precios y condiciones, en PDF.',
        };
    }

    /** El número para WhatsApp, con el 591 de Bolivia si vino sin código de país. */
    public static function numeroWhatsapp(?string $telefono): ?string
    {
        $digitos = preg_replace('/\D+/', '', (string) $telefono);

        if (strlen($digitos) < 7) {
            return null;
        }

        return strlen($digitos) === 8 ? '591' . $digitos : $digitos;
    }

    /** El mensaje de WhatsApp armado: saludo, qué documento es, el enlace al PDF y de dónde viene. */
    public static function mensajeWhatsapp(Model $doc): string
    {
        $nombre = self::nombreDePila($doc);
        $codigo = self::codigo($doc);
        $enlace = self::enlace($doc);
        $saludo = $nombre === 'Hola' ? 'Hola' : "Hola {$nombre}";

        $cuerpo = match (self::tipo($doc)) {
            'venta'       => "{$saludo}, gracias por tu compra en Apple Boss. Te dejamos tu nota de venta {$codigo} con el detalle y la garantía:",
            'servicio'    => "{$saludo}, te escribimos de Apple Boss por tu {$doc->equipo}. Tu nota de servicio {$codigo} está acá:",
            'reserva'     => "{$saludo}, te escribimos de Apple Boss. Tu reserva {$codigo} quedó registrada; acá está la nota:",
            'diagnostico' => "{$saludo}, te escribimos de Apple Boss. Ya está el informe técnico {$codigo} de tu {$doc->equipo}:",
            'cotizacion'  => "{$saludo}, te escribimos de Apple Boss. Acá está tu cotización {$codigo}:",
        };

        return $cuerpo . ($enlace ? "\n{$enlace}" : '') . "\n\nCualquier consulta, responde por este mismo chat. Apple Boss · appleboss.com.bo";
    }

    public static function whatsapp(Model $doc): ?string
    {
        $numero = self::numeroWhatsapp(self::telefono($doc));

        return $numero ? 'https://wa.me/' . $numero . '?text=' . rawurlencode(self::mensajeWhatsapp($doc)) : null;
    }

    /** Lo que el panel necesita para los botones Correo, WhatsApp y Copiar de una fila. */
    public static function compartir(Model $doc): array
    {
        return [
            'tipo'              => self::tipo($doc),
            'id'                => $doc->getKey(),
            'codigo'            => self::codigo($doc),
            'correo'            => self::correo($doc),
            'telefono'          => self::telefono($doc),
            'whatsapp'          => self::whatsapp($doc),
            'mensaje'           => self::mensajeWhatsapp($doc),
            'enlace'            => self::enlace($doc),
            'publicable'        => self::publicable($doc),
            'correo_enviado_en' => $doc->correo_enviado_en?->toIso8601String(),
        ];
    }
}
