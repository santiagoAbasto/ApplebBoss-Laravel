<?php

namespace App\Models\Concerns;

use App\Support\Pagos\TipoDeCambio;
use App\Support\Proveedor\MargenProveedor;
use Illuminate\Database\Eloquent\Casts\Attribute;

/**
 * Productos «de proveedor» (consignación): no son nuestro capital. El costo y el margen van EN DÓLARES; el precio
 * y el costo en Bs se calculan al vuelo con el dólar paralelo, así el margen (p. ej. 60 USD) no se mueve si sube el
 * dólar. En los productos propios (es_proveedor=false) no cambia nada: devuelve lo que está guardado en Bs.
 * Cada modelo que lo usa define `const TIPO_INVENTARIO` (celular, computadora, producto_apple, producto_general).
 */
trait ProductoDeProveedor
{
    /** Nombre del equipo, para afinar el margen por subtipo (Apple Watch, AirPods). */
    public function nombreParaMargen(): string
    {
        return (string) ($this->nombre ?? $this->modelo ?? '');
    }

    /** Margen en USD: el propio del producto si lo tiene; si no, el de su categoría. */
    public function margenVigenteUsd(): float
    {
        return $this->margen_usd !== null
            ? (float) $this->margen_usd
            : MargenProveedor::enUsd(static::TIPO_INVENTARIO, $this->nombreParaMargen());
    }

    /** Precio de venta en Bs. Proveedor: (costo + margen) USD × paralelo. Propio: lo guardado. */
    protected function precioVenta(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $this->es_proveedor && $this->costo_usd !== null
                ? round(((float) $this->costo_usd + $this->margenVigenteUsd()) * TipoDeCambio::bobPorUsdt(), 2)
                : ($value === null ? null : (float) $value),
        );
    }

    /** Costo en Bs (lo que le pagamos al proveedor al vender). Proveedor: costo USD × paralelo. Propio: lo guardado. */
    protected function precioCosto(): Attribute
    {
        return Attribute::make(
            get: fn ($value) => $this->es_proveedor && $this->costo_usd !== null
                ? round((float) $this->costo_usd * TipoDeCambio::bobPorUsdt(), 2)
                : ($value === null ? null : (float) $value),
        );
    }
}
