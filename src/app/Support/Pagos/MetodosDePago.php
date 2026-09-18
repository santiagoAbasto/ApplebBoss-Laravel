<?php

namespace App\Support\Pagos;

/** Formas de pago que la tienda puede ofrecer, según lo que esté configurado. */
class MetodosDePago
{
    public const QR_BNB           = 'qr_bnb';
    public const TRANSFERENCIA    = 'transferencia';
    public const EFECTIVO_TIENDA  = 'efectivo_tienda';

    /** Lo que se le muestra al cliente en el checkout. */
    public static function disponibles(): array
    {
        $metodos = [];

        if (PasarelaBnb::disponible()) {
            $metodos[] = [
                'valor'    => self::QR_BNB,
                'etiqueta' => 'QR del Banco Nacional de Bolivia',
                'detalle'  => 'Escaneas el QR con tu app del banco y la confirmación es automática.',
                'automatico' => true,
            ];
        }

        if (config('pagos.transferencia.habilitado') && filled(config('pagos.transferencia.cuenta'))) {
            $metodos[] = [
                'valor'    => self::TRANSFERENCIA,
                'etiqueta' => 'Transferencia o QR bancario',
                'detalle'  => 'Te mostramos la cuenta, transfieres y subes tu comprobante.',
                'automatico' => false,
            ];
        }

        if (config('pagos.efectivo_en_tienda.habilitado')) {
            $metodos[] = [
                'valor'    => self::EFECTIVO_TIENDA,
                'etiqueta' => 'Pago al retirar en tienda',
                'detalle'  => 'Reservamos tu equipo y pagas cuando lo retiras.',
                'automatico' => false,
            ];
        }

        return $metodos;
    }

    public static function valores(): array
    {
        return array_column(self::disponibles(), 'valor');
    }

    /** Datos de la cuenta para transferir (nunca se inventan: salen de la configuración). */
    public static function datosDeTransferencia(): ?array
    {
        if (! config('pagos.transferencia.habilitado') || blank(config('pagos.transferencia.cuenta'))) {
            return null;
        }

        return [
            'banco'     => config('pagos.transferencia.banco'),
            'titular'   => config('pagos.transferencia.titular'),
            'cuenta'    => config('pagos.transferencia.cuenta'),
            'documento' => config('pagos.transferencia.documento'),
        ];
    }
}
