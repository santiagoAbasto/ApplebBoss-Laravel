<?php

namespace App\Support\Checkout;

/** Opciones de entrega y su costo. Todo sale de config/envios.php: nada se inventa en el front. */
class Entrega
{
    public const RETIRO = 'retiro';
    public const ENVIO  = 'envio';

    /** Lo que se le muestra al cliente en el checkout. */
    public static function opciones(): array
    {
        $opciones = [];

        if (config('envios.retiro.habilitado')) {
            $opciones[] = [
                'valor'    => self::RETIRO,
                'etiqueta' => config('envios.retiro.etiqueta'),
                'detalle'  => 'Retiras en nuestra tienda de ' . config('envios.retiro.ciudad') . '.',
                'costo'    => 0.0,
            ];
        }

        // El envío solo se ofrece si existe una forma de cobrarlo a distancia. Ofrecerlo con
        // «pago al retirar» como única opción dejaba al cliente en un callejón sin salida.
        if (config('envios.envio.habilitado') && \App\Support\Pagos\MetodosDePago::hayPagoADistancia()) {
            $opciones[] = [
                'valor'    => self::ENVIO,
                'etiqueta' => 'Envío a domicilio',
                'detalle'  => 'Te lo llevamos con seguimiento.',
                'costo'    => null, // depende del departamento
            ];
        }

        return $opciones;
    }

    /** Departamentos a los que sí se envía, con su costo y plazo. */
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

    /** Costo del envío calculado en el servidor (el navegador nunca lo define). */
    public static function costo(string $tipoEntrega, ?string $departamento = null): float
    {
        if ($tipoEntrega !== self::ENVIO) {
            return 0.0;
        }

        return (float) (config("envios.envio.destinos.{$departamento}.costo") ?? 0);
    }

    public static function plazo(?string $departamento): ?string
    {
        return $departamento ? (config("envios.envio.destinos.{$departamento}.plazo") ?? null) : null;
    }
}
