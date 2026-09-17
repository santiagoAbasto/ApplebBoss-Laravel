<?php

namespace App\Support;

use App\Models\NewsletterCampaign;
use App\Models\NewsletterSubscriber;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * ¿La tienda puede mandar correos ahora mismo?
 *
 * Lo revisan las tres pantallas del newsletter (Campañas, Suscriptores y Ajustes) para avisar **antes** de que el
 * administrador escriba una campaña y descubra al final que no sale. Mira tres cosas:
 *
 * 1. **El correo** (`.env` del servidor): el servicio, el servidor SMTP, la cuenta, la clave y la dirección desde la
 *    que salen los correos. En producción esto es lo único que queda por cargar: la clave de la cuenta de envío.
 * 2. **La cola**: los correos no se mandan en el momento, los manda un proceso aparte (`php artisan queue:work`).
 *    Sin ese proceso, una campaña queda «enviando» para siempre. Se detecta por los trabajos que no se consumen.
 * 3. **La lista**: sin suscriptores activos no hay a quién mandarle.
 *
 * **Nunca devuelve la clave ni la cuenta**: solo si están cargadas.
 */
class NewsletterEstado
{
    /** Un trabajo que lleva más de este tiempo sin tomarse significa que nadie está atendiendo la cola. */
    private const SEGUNDOS_SIN_ATENDER = 180;

    public static function correo(): array
    {
        $servicio = (string) config('mail.default');
        $config   = config('mail.mailers.' . $servicio, []);
        $desde    = (string) config('mail.from.address');

        $esSmtp   = ($config['transport'] ?? $servicio) === 'smtp';
        $host     = (string) ($config['host'] ?? '');
        $cuenta   = (string) ($config['username'] ?? '');
        $clave    = (string) ($config['password'] ?? '');

        // Un servidor de pruebas (Mailpit, Mailhog) no pide cuenta ni clave
        $local    = $esSmtp && in_array($host, ['127.0.0.1', 'localhost', 'mailpit', 'mailhog'], true);

        $falta = match (true) {
            $servicio === 'log'                    => 'El correo está en modo prueba: los envíos se escriben en el registro del servidor y no le llegan a nadie.',
            $esSmtp && $host === ''                => 'Falta el servidor de correo (MAIL_HOST) en el servidor.',
            $esSmtp && ! $local && $cuenta === ''  => 'Falta la cuenta de correo (MAIL_USERNAME) en el servidor.',
            $esSmtp && ! $local && $clave === ''   => 'Falta la clave de la cuenta de correo (MAIL_PASSWORD) en el servidor.',
            $desde === '' || $desde === 'hello@example.com' => 'Falta la dirección desde la que salen los correos (MAIL_FROM_ADDRESS) en el servidor.',
            default                                => null,
        };

        return [
            'listo'    => $falta === null,
            'falta'    => $falta,
            'servicio' => $servicio,
            'servidor' => $host ?: null,
            'desde'    => $desde ?: null,
            // Solo si está cargada: la clave nunca sale de acá
            'con_clave' => $clave !== '',
            'prueba'    => $servicio === 'log',
        ];
    }

    public static function cola(): array
    {
        $conexion = (string) config('queue.default');

        if ($conexion === 'sync') {
            return [
                'listo'    => false,
                'falta'    => 'La cola está en modo directo: el envío se haría de una sola vez y la pantalla se quedaría colgada. En el servidor hay que poner QUEUE_CONNECTION=database y dejar corriendo «php artisan queue:work».',
                'conexion' => $conexion,
                'pendientes' => 0,
                'fallidos'   => 0,
                'atendida'   => false,
            ];
        }

        $pendientes = 0;
        $fallidos   = 0;
        $atrasado   = null;

        if ($conexion === 'database' && Schema::hasTable('jobs')) {
            $pendientes = DB::table('jobs')->count();
            $atrasado   = DB::table('jobs')->where('available_at', '<', now()->subSeconds(self::SEGUNDOS_SIN_ATENDER)->getTimestamp())->exists();
        }
        if (Schema::hasTable('failed_jobs')) {
            $fallidos = DB::table('failed_jobs')->count();
        }

        return [
            'listo'      => ! $atrasado,
            'falta'      => $atrasado ? 'Hay envíos esperando hace rato y nadie los atiende: el proceso «php artisan queue:work» del servidor está detenido.' : null,
            'conexion'   => $conexion,
            'pendientes' => $pendientes,
            'fallidos'   => $fallidos,
            'atendida'   => ! $atrasado,
        ];
    }

    /**
     * El error del servidor de correo, en palabras que el administrador pueda accionar.
     * Los proveedores devuelven mensajes largos en inglés; acá se traducen los tres que pasan de verdad.
     */
    public static function explicarFallo(\Throwable $e): string
    {
        $mensaje = $e->getMessage();

        return match (true) {
            str_contains($mensaje, '535') || stripos($mensaje, 'authentic') !== false
                => 'el servidor de correo rechazó la cuenta o la clave. En Gmail hay que usar una «contraseña de aplicación», no la del correo.',
            stripos($mensaje, 'could not be established') !== false || stripos($mensaje, 'connection') !== false
                => 'no se pudo conectar con el servidor de correo. Revisa el servidor y el puerto (MAIL_HOST y MAIL_PORT).',
            stripos($mensaje, 'timed out') !== false
                => 'el servidor de correo no respondió a tiempo. Puede estar bloqueado el puerto de salida.',
            default => \Illuminate\Support\Str::limit($mensaje, 180, '…'),
        };
    }

    /** Todo junto, como lo reciben las pantallas del newsletter. */
    public static function resumen(): array
    {
        $correo = self::correo();
        $cola   = self::cola();
        $activos = NewsletterSubscriber::active()->count();

        return [
            'correo'   => $correo,
            'cola'     => $cola,
            'activos'  => $activos,
            'bajas'    => NewsletterSubscriber::whereNotNull('unsubscribed_at')->count(),
            'enviando' => NewsletterCampaign::where('estado', 'enviando')->count(),
            // Se puede mandar una campaña de verdad
            'listo'    => $correo['listo'] && $cola['listo'] && $activos > 0,
        ];
    }
}
