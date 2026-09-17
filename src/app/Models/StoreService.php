<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Una tarjeta de «Nuestros servicios», la sección del inicio que se arma en Tienda online → Servicios.
 *
 * No es el módulo «Servicio técnico» (las órdenes de reparación): esto es lo que lee el cliente. Cada tarjeta puede
 * solo informar, abrir WhatsApp con un mensaje sobre ese servicio o llevar a una página.
 */
class StoreService extends Model
{
    /** Los íconos que sabe dibujar la tienda: `SERVICE_ICONS` en Components/Store/Icons.jsx. */
    public const ICONOS = ['scan', 'wrench', 'package', 'truck', 'badge', 'shield', 'battery', 'exchange', 'chat', 'store', 'phone', 'laptop'];

    /** Qué pasa cuando el cliente toca la tarjeta y qué dice el botón si no se escribe otro texto. */
    public const ACCIONES = [
        'ninguna'  => ['label' => 'Solo informa', 'boton' => null],
        'whatsapp' => ['label' => 'Abre WhatsApp', 'boton' => 'Consultar por WhatsApp'],
        'enlace'   => ['label' => 'Lleva a una página', 'boton' => 'Ver más'],
    ];

    protected $fillable = ['icon', 'title', 'description', 'accion', 'enlace', 'boton', 'active', 'sort_order'];

    protected $casts = ['active' => 'boolean'];

    protected $attributes = ['icon' => 'wrench', 'accion' => 'ninguna', 'active' => true];

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /** El mensaje con el que se abre WhatsApp desde esta tarjeta. */
    public function mensajeWhatsapp(): string
    {
        return ConfiguracionTienda::saludoWhatsapp() . ' quiero consultar por: ' . $this->title;
    }

    /**
     * Lo que hace de verdad la tarjeta en la tienda. Un botón de WhatsApp con el WhatsApp de la tienda apagado, o un
     * botón a una página sin dirección, no se dibuja: la tarjeta queda solo informando.
     */
    public function accionEnTienda(?bool $whatsapp = null): string
    {
        $whatsapp ??= self::whatsappActivo();

        return match ($this->accion) {
            'whatsapp' => $whatsapp ? 'whatsapp' : 'ninguna',
            'enlace'   => filled($this->enlace) ? 'enlace' : 'ninguna',
            default    => 'ninguna',
        };
    }

    /** El texto del botón: el escrito a mano o el de su acción. */
    public function textoBoton(): ?string
    {
        $porDefecto = self::ACCIONES[$this->accion]['boton'] ?? null;

        return $porDefecto === null ? null : (trim((string) $this->boton) ?: $porDefecto);
    }

    /** Las tarjetas que dibuja el inicio: solo las encendidas, en orden. Es la única consulta de la tienda. */
    public static function paraLaTienda(): array
    {
        $whatsapp = self::whatsappActivo();

        return self::active()->orderBy('sort_order')->orderBy('id')->get()
            ->map(function (self $s) use ($whatsapp) {
                $accion = $s->accionEnTienda($whatsapp);

                return [
                    'id'          => $s->id,
                    'icon'        => $s->icon,
                    'title'       => $s->title,
                    'description' => $s->description,
                    'accion'      => $accion,
                    'enlace'      => $accion === 'enlace' ? $s->enlace : null,
                    'mensaje'     => $accion === 'whatsapp' ? $s->mensajeWhatsapp() : null,
                    'boton'       => $accion === 'ninguna' ? null : $s->textoBoton(),
                ];
            })
            ->all();
    }

    /** Con la misma regla que comparte el WhatsApp con la tienda (HandleInertiaRequests). */
    public static function whatsappActivo(): bool
    {
        return ConfiguracionTienda::get('whatsapp_enabled') === '1' && ConfiguracionTienda::waNumber() !== null;
    }
}
