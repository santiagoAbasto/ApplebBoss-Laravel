<?php

namespace App\Support\Checkout;

use App\Models\CatalogoPublicacion;
use App\Models\Pedido;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Arma un pedido a partir de lo que el navegador dice que tiene en el carrito.
 *
 * Del navegador solo se acepta QUÉ producto y CUÁNTOS: el precio, la disponibilidad y el costo
 * de envío los resuelve el servidor mirando el inventario. Si algo ya no está, el pedido no se
 * crea y se le dice al cliente exactamente qué se cayó.
 */
class CreadorDePedido
{
    /**
     * @param  array  $claves   claves del carrito, con forma "tipo:id"
     * @param  array  $datos    datos validados del formulario de checkout
     * @throws ValidationException si algo del carrito ya no se puede vender
     */
    public static function crear(array $claves, array $datos): Pedido
    {
        return DB::transaction(function () use ($claves, $datos) {
            $lineas = self::resolverLineas($claves);

            if ($lineas === []) {
                throw ValidationException::withMessages([
                    'carrito' => 'Tu carrito está vacío o los productos ya no están disponibles.',
                ]);
            }

            $tipoEntrega = $datos['tipo_entrega'] === Entrega::ENVIO ? Entrega::ENVIO : Entrega::RETIRO;
            $departamento = $tipoEntrega === Entrega::ENVIO ? ($datos['envio_departamento'] ?? null) : null;

            if ($tipoEntrega === Entrega::ENVIO && ! Entrega::seEnviaA($departamento)) {
                throw ValidationException::withMessages([
                    'envio_departamento' => 'Por ahora no hacemos envíos a ese departamento.',
                ]);
            }

            $subtotal = array_sum(array_column($lineas, 'subtotal'));
            $costoEnvio = Entrega::costo($tipoEntrega, $departamento);

            $pedido = Pedido::create([
                'codigo'             => Pedido::nuevoCodigo(),
                'token_seguimiento'  => Pedido::nuevoToken(),
                'nombre_cliente'     => $datos['nombre_cliente'],
                'email_cliente'      => $datos['email_cliente'],
                'telefono_cliente'   => $datos['telefono_cliente'],
                'documento'          => $datos['documento'] ?? null,
                'razon_social'       => $datos['razon_social'] ?? null,
                'tipo_entrega'       => $tipoEntrega,
                'envio_departamento' => $departamento,
                'envio_ciudad'       => $tipoEntrega === Entrega::ENVIO ? ($datos['envio_ciudad'] ?? null) : null,
                'envio_direccion'    => $tipoEntrega === Entrega::ENVIO ? ($datos['envio_direccion'] ?? null) : null,
                'envio_referencia'   => $tipoEntrega === Entrega::ENVIO ? ($datos['envio_referencia'] ?? null) : null,
                'envio_destinatario' => $tipoEntrega === Entrega::ENVIO ? ($datos['envio_destinatario'] ?? $datos['nombre_cliente']) : null,
                'envio_telefono'     => $tipoEntrega === Entrega::ENVIO ? ($datos['envio_telefono'] ?? $datos['telefono_cliente']) : null,
                'subtotal'           => $subtotal,
                'costo_envio'        => $costoEnvio,
                'total'              => $subtotal + $costoEnvio,
                'moneda'             => 'BOB',
                'estado'             => Pedido::PENDIENTE_PAGO,
                'metodo_pago'        => $datos['metodo_pago'] ?? null,
                'notas_cliente'      => $datos['notas_cliente'] ?? null,
                'expira_en'          => now()->addMinutes((int) config('envios.minutos_para_pagar', 120)),
            ]);

            foreach ($lineas as $linea) {
                $pedido->items()->create([
                    'tipo'            => $linea['tipo'],
                    'producto_id'     => $linea['producto_id'],
                    'nombre'          => $linea['nombre'],
                    'condicion'       => $linea['condicion'],
                    'slug'            => $linea['slug'],
                    'precio_unitario' => $linea['precio'],
                    'cantidad'        => $linea['cantidad'],
                    'subtotal'        => $linea['subtotal'],
                    // IMEI y serie NO se copian todavía: recién con el pago confirmado
                ]);
            }

            $pedido->registrarEvento(
                'Pedido creado',
                'Te guardamos el equipo hasta ' . $pedido->expira_en->format('H:i') . ' para que completes el pago.',
            );

            return $pedido->load('items', 'eventos');
        });
    }

    /**
     * Convierte las claves del carrito en líneas con precio del servidor.
     * Descarta en silencio lo que ya no está publicado o disponible (el checkout avisa después).
     */
    public static function resolverLineas(array $claves): array
    {
        $lineas = [];

        foreach (array_slice(array_values(array_unique($claves)), 0, 50) as $clave) {
            if (! is_string($clave)) {
                continue;
            }

            [$tipo, $id] = array_pad(explode(':', $clave, 2), 2, null);
            if (! $tipo || ! ctype_digit((string) $id)) {
                continue;
            }

            $pub = CatalogoPublicacion::with('imagenes')
                ->publicadoAhora()
                ->where('producto_tipo', $tipo)
                ->where('producto_id', (int) $id)
                ->first();

            if (! $pub || ! $pub->productoDisponible()) {
                continue;
            }

            $precio = (float) $pub->precioPublico();
            if ($precio <= 0) {
                continue;
            }

            $lineas[] = [
                'clave'       => $clave,
                'tipo'        => $tipo,
                'producto_id' => (int) $id,
                'nombre'      => $pub->titulo,
                'condicion'   => $pub->condicion,
                'slug'        => $pub->slug,
                'precio'      => $precio,
                'cantidad'    => 1, // el stock es por unidad
                'subtotal'    => $precio,
            ];
        }

        return $lineas;
    }

    /** Claves del carrito que ya no se pueden comprar (para avisarle al cliente). */
    public static function clavesNoDisponibles(array $claves): array
    {
        $validas = array_column(self::resolverLineas($claves), 'clave');

        return array_values(array_diff(array_values(array_unique($claves)), $validas));
    }
}
