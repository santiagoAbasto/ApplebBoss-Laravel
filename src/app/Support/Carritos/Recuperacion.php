<?php

namespace App\Support\Carritos;

use App\Mail\CarritoAbandonado;
use App\Models\Carrito;
use App\Models\Pedido;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Mail;

/**
 * Recuperación de carritos abandonados.
 *
 * La tienda solo sabe quién dejó un carrito cuando la persona tiene sesión (el checkout la exige), así que todo parte
 * de ahí: el navegador sincroniza el carrito (guardar), un pedido se vence sin pago (desdePedidoVencido) y, cuando
 * por fin compra, el episodio se cierra (alCrearPedido). Dos recordatorios como máximo: el primero una hora después
 * del último cambio, el segundo un día después del primero. Quien pide no recibir más, no recibe más.
 */
class Recuperacion
{
    public const PRIMER_AVISO_MINUTOS = 60;
    public const SEGUNDO_AVISO_HORAS = 24;

    /** Lo que el navegador sincronizó, ya validado por el servidor (PublicCatalogController::syncCart). */
    public static function guardar(User $user, array $items): void
    {
        $compactos = collect($items)->map(fn (array $i) => [
            'key'    => $i['key'],
            'nombre' => $i['name'],
            'precio' => (float) $i['price'],
            'imagen' => $i['images'][0]['url_card'] ?? null,
            'url'    => $i['url'] ?? null,
        ])->values()->all();

        $abierto = self::abiertoDe($user->id);

        if ($compactos === []) {
            $abierto?->delete(); // lo vació la persona: ya no hay nada que recordar

            return;
        }

        // El mismo carrito de antes no reinicia el reloj del recordatorio
        if ($abierto && self::claves($abierto->items) === self::claves($compactos)) {
            return;
        }

        self::abrir($user->id, $compactos, Carrito::ORIGEN_CARRITO, null, $abierto);
    }

    /** Un pedido que se canceló por falta de pago: el equipo volvió a la tienda y se puede retomar. */
    public static function desdePedidoVencido(Pedido $pedido): void
    {
        if (! $pedido->user_id) {
            return;
        }

        $items = $pedido->items->map(fn ($i) => [
            'key'    => "{$i->tipo}:{$i->producto_id}",
            'nombre' => $i->nombre,
            'precio' => (float) $i->precio_unitario,
            'imagen' => null,
            'url'    => $i->slug ? route('store.product', $i->slug) : null,
        ])->values()->all();

        if ($items === []) {
            return;
        }

        self::abrir($pedido->user_id, $items, Carrito::ORIGEN_PEDIDO, $pedido->id, self::abiertoDe($pedido->user_id));
    }

    /** Hizo un pedido: si lo habíamos recordado, cuenta como recuperado; si no, el carrito solo dejó de estar abandonado. */
    public static function alCrearPedido(Pedido $pedido): void
    {
        if (! $pedido->user_id || ! ($abierto = self::abiertoDe($pedido->user_id))) {
            return;
        }

        if ($abierto->recordatorios > 0) {
            $abierto->update(['recuperado_en' => now(), 'recuperado_pedido_id' => $pedido->id]);
        } else {
            $abierto->delete();
        }
    }

    /** Los que ya toca recordar, en orden de espera. Nunca a quien pidió no recibir más. */
    public static function pendientes(): Collection
    {
        return Carrito::abierto()->with('user')
            ->whereHas('user', fn ($q) => $q->where('sin_recordatorios', false))
            ->where(fn ($q) => $q
                ->where(fn ($p) => $p->where('recordatorios', 0)->where('actualizado_en', '<=', now()->subMinutes(self::PRIMER_AVISO_MINUTOS)))
                ->orWhere(fn ($s) => $s->where('recordatorios', 1)->where('recordado_en', '<=', now()->subHours(self::SEGUNDO_AVISO_HORAS))))
            ->orderBy('actualizado_en')
            ->limit(200)
            ->get();
    }

    /** Manda el recordatorio con lo que siga disponible. Si ya no queda nada, el carrito se descarta: no hay qué retomar. */
    public static function recordar(Carrito $carrito): bool
    {
        $disponibles = $carrito->disponibles();

        if ($disponibles->isEmpty()) {
            $carrito->delete();

            return false;
        }

        if (blank($carrito->user?->email)) {
            return false;
        }

        Mail::send(new CarritoAbandonado($carrito, $disponibles->all(), $carrito->recordatorios + 1));
        $carrito->update(['recordatorios' => $carrito->recordatorios + 1, 'recordado_en' => now()]);

        return true;
    }

    private static function abiertoDe(int $userId): ?Carrito
    {
        return Carrito::abierto()->where('user_id', $userId)->latest('id')->first();
    }

    private static function abrir(int $userId, array $items, string $origen, ?int $pedidoId, ?Carrito $abierto): Carrito
    {
        $datos = [
            'items'          => $items,
            'total'          => collect($items)->sum('precio'),
            'origen'         => $origen,
            'pedido_id'      => $pedidoId,
            'actualizado_en' => now(),
            'recordatorios'  => 0,
            'recordado_en'   => null,
        ];

        if ($abierto) {
            $abierto->update($datos);

            return $abierto;
        }

        return Carrito::create($datos + ['user_id' => $userId]);
    }

    /** @return list<string> */
    private static function claves(array $items): array
    {
        return collect($items)->pluck('key')->sort()->values()->all();
    }
}
