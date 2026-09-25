<?php

namespace App\Support\Checkout;

use App\Support\Pagos\MetodosDePago;

/** Opciones de entrega y su costo. Todo sale de config/envios.php: nada se inventa en el front. */
class Entrega
{
    public const RETIRO   = 'retiro';
    public const ENVIO    = 'envio';     // courier al interior
    public const DELIVERY = 'delivery';  // repartidor propio en Cochabamba

    /** Lo que se le muestra al cliente en el checkout. */
    public static function opciones(): array
    {
        $opciones = [];

        if (config('envios.retiro.habilitado')) {
            $opciones[] = [
                'valor'    => self::RETIRO,
                'etiqueta' => config('envios.retiro.etiqueta'),
                'detalle'  => 'Retiras en nuestra tienda de ' . config('envios.retiro.ciudad') . '.',
                'plazo'    => 'Te avisamos cuando esté listo',
                'costo'    => 0.0,
            ];
        }

        // Lo que llega a una casa solo se ofrece si existe una forma de cobrarlo a distancia.
        // Ofrecerlo con «pago al retirar» como única opción dejaba al cliente en un callejón sin salida.
        if (! MetodosDePago::hayPagoADistancia()) {
            return $opciones;
        }

        if (config('envios.envio.habilitado') && self::destinos() !== []) {
            $costos = array_column(self::destinos(), 'costo');
            $opciones[] = [
                'valor'    => self::ENVIO,
                'etiqueta' => 'Envío al interior',
                'detalle'  => 'Por courier a ' . count($costos) . ' departamentos, con código de seguimiento.',
                'plazo'    => self::destinos()[0]['plazo'] ?? null,
                // Si todos cuestan lo mismo se muestra el número; si no, depende del departamento
                'costo'    => count(array_unique($costos)) === 1 ? (float) $costos[0] : null,
            ];
        }

        if (config('envios.delivery.habilitado')) {
            $opciones[] = [
                'valor'    => self::DELIVERY,
                'etiqueta' => 'Delivery en ' . config('envios.delivery.ciudad'),
                'detalle'  => 'Te lo lleva nuestro repartidor a tu casa u oficina.',
                'plazo'    => config('envios.delivery.plazo'),
                'costo'    => (float) config('envios.delivery.costo', 0),
            ];
        }

        return $opciones;
    }

    public static function valores(): array
    {
        return array_column(self::opciones(), 'valor');
    }

    /** ¿Termina en la puerta de una casa? Entonces hay dirección y no vale pagar al retirar. */
    public static function aDomicilio(?string $tipo): bool
    {
        return $tipo === self::ENVIO || $tipo === self::DELIVERY;
    }

    /** Departamentos a los que sí se envía por courier, con su costo y plazo. */
    public static function destinos(): array
    {
        $destinos = [];
        foreach ((array) config('envios.envio.destinos', []) as $departamento => $datos) {
            $destinos[] = [
                'departamento' => $departamento,
                'costo'        => (float) ($datos['costo'] ?? 0),
                'plazo'        => $datos['plazo'] ?? null,
            ];
        }

        return $destinos;
    }

    public static function seEnviaA(?string $departamento): bool
    {
        return $departamento !== null && array_key_exists($departamento, (array) config('envios.envio.destinos', []));
    }

    /** ¿El punto del mapa cae dentro del área donde reparte la tienda? */
    public static function dentroDelDelivery(float $lat, float $lng): bool
    {
        $a = (array) config('envios.delivery.area');

        return $lat >= $a['lat_min'] && $lat <= $a['lat_max'] && $lng >= $a['lng_min'] && $lng <= $a['lng_max'];
    }

    /** Costo del envío calculado en el servidor (el navegador nunca lo define). */
    public static function costo(string $tipoEntrega, ?string $departamento = null): float
    {
        return match ($tipoEntrega) {
            self::ENVIO    => (float) (config("envios.envio.destinos.{$departamento}.costo") ?? 0),
            self::DELIVERY => (float) config('envios.delivery.costo', 0),
            default        => 0.0,
        };
    }

    /** Cuándo le llega, en palabras, para el seguimiento. */
    public static function plazo(string $tipoEntrega, ?string $departamento = null): ?string
    {
        return match ($tipoEntrega) {
            self::ENVIO    => $departamento ? (config("envios.envio.destinos.{$departamento}.plazo") ?? null) : null,
            self::DELIVERY => config('envios.delivery.plazo'),
            default        => null,
        };
    }
}
