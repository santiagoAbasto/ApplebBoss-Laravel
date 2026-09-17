<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

/**
 * Los datos generales de la tienda que se editan en Tienda online → Configuración.
 *
 * Acá vive solo lo que no es de otro módulo: el WhatsApp con el que escribe el cliente y la identidad de la tienda
 * (nombre, descripción corta y la frase del pie). La dirección, el horario, el contacto y el mapa se cargan en
 * Ubicaciones; el título y la descripción de cada página, en «Google y redes sociales»; el hero y el orden del
 * inicio, en Portada.
 *
 * La tabla también guarda las claves de esos otros módulos (`seo_*`, `newsletter_*`), que ellos leen y escriben.
 */
class ConfiguracionTienda extends Model
{
    protected $table = 'configuracion_tienda';

    /** Lo que se edita en Tienda online → Configuración, con su valor por defecto. */
    public const CLAVES = [
        'whatsapp_enabled'   => '0',
        'whatsapp_numero'    => null,
        'whatsapp_mensaje'   => null,
        'tienda_nombre'      => 'Apple Boss',
        'tienda_descripcion' => null,
        'footer_tagline'     => null,
        'anuncio_barra'      => null,
    ];

    public const NOMBRE_POR_DEFECTO = 'Apple Boss';

    protected $fillable = ['clave', 'valor', 'tipo', 'grupo', 'etiqueta'];

    public static function get(string $clave, mixed $default = null): mixed
    {
        return Cache::remember("cfg_{$clave}", 300, fn () =>
            static::where('clave', $clave)->value('valor') ?? $default
        );
    }

    public static function set(string $clave, mixed $valor): void
    {
        static::updateOrCreate(['clave' => $clave], ['valor' => $valor]);
        Cache::forget("cfg_{$clave}");
    }

    public static function grupo(string $grupo): array
    {
        return Cache::remember("cfg_grupo_{$grupo}", 300, fn () =>
            static::where('grupo', $grupo)->pluck('valor', 'clave')->toArray()
        );
    }

    public static function todosParaAdmin(): array
    {
        return static::orderBy('grupo')->orderBy('clave')->get()->groupBy('grupo')->toArray();
    }

    public static function flushGrupo(string $grupo): void
    {
        $claves = static::where('grupo', $grupo)->pluck('clave');
        foreach ($claves as $clave) {
            Cache::forget("cfg_{$clave}");
        }
        Cache::forget("cfg_grupo_{$grupo}");
    }

    /** Invalida todo el cache de configuración pública (usar después de cualquier guardado). */
    public static function clearAllCache(): void
    {
        $claves = static::pluck('clave');
        foreach ($claves as $clave) {
            Cache::forget("cfg_{$clave}");
        }
        foreach (static::distinct()->pluck('grupo') as $grupo) {
            Cache::forget("cfg_grupo_{$grupo}");
        }
    }

    /** El nombre de la tienda: el del panel o «Apple Boss» mientras no se cambie. Nunca queda vacío. */
    public static function nombre(): string
    {
        $nombre = trim((string) static::get('tienda_nombre'));

        return $nombre !== '' ? $nombre : self::NOMBRE_POR_DEFECTO;
    }

    /** Con qué arranca todo mensaje de WhatsApp que la tienda le arma al cliente. */
    public static function saludoWhatsapp(): string
    {
        return 'Hola ' . static::nombre() . ',';
    }

    /**
     * Lo que la tienda necesita de Configuración, en un solo lugar (lo comparte `HandleInertiaRequests`).
     * El número solo sale si el WhatsApp está encendido: apagado, no se filtra a la página.
     */
    public static function paraLaTienda(): array
    {
        $activo = static::waEnabled();

        return [
            'whatsapp_enabled'   => $activo,
            'whatsapp_numero'    => $activo ? static::waNumber() : null,
            'whatsapp_mensaje'   => static::get('whatsapp_mensaje'),
            'tienda_nombre'      => static::nombre(),
            'tienda_descripcion' => static::get('tienda_descripcion'),
            'footer_tagline'     => static::get('footer_tagline'),
            'anuncio_barra'      => static::get('anuncio_barra'),
        ];
    }

    public static function waEnabled(): bool
    {
        return static::get('whatsapp_enabled') === '1' || static::get('whatsapp_enabled') === 'true';
    }

    public static function waNumber(): ?string
    {
        $num = static::get('whatsapp_numero');
        if (empty($num)) return null;
        // Normalizar: quitar espacios, guiones, paréntesis, +
        $normalized = preg_replace('/[^0-9]/', '', $num);
        return $normalized ?: null;
    }
}
