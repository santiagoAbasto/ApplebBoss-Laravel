<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Un local de la tienda, cargado en Tienda online → Ubicaciones. Es el único lugar de la dirección, el horario, el
 * contacto y el mapa: la sección «Dónde estamos» del inicio muestra todos los encendidos, y el primero de la lista (el
 * principal) da la ciudad de la tienda, la dirección del pie de página y los datos que lee Google.
 */
class StoreLocation extends Model
{
    /** Los días de la semana, del lunes (1) al domingo (7). */
    public const DIAS = [1 => 'Lunes', 2 => 'Martes', 3 => 'Miércoles', 4 => 'Jueves', 5 => 'Viernes', 6 => 'Sábado', 7 => 'Domingo'];

    private const DIAS_GOOGLE = [1 => 'Monday', 2 => 'Tuesday', 3 => 'Wednesday', 4 => 'Thursday', 5 => 'Friday', 6 => 'Saturday', 7 => 'Sunday'];

    protected $fillable = [
        'name', 'address', 'city', 'country', 'phone', 'whatsapp',
        'hours', 'horarios', 'map_embed_url', 'map_link_url', 'description',
        'active', 'sort_order',
    ];

    protected $casts = ['active' => 'boolean', 'horarios' => 'array'];

    protected $attributes = ['city' => 'Cochabamba', 'country' => 'Bolivia', 'active' => true];

    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /** El local principal: el primero encendido de la lista. */
    public static function principal(): ?self
    {
        return self::active()->orderBy('sort_order')->orderBy('id')->first();
    }

    /** Los locales que dibuja la tienda, en el orden de la lista. Es la única consulta pública. */
    public static function paraLaTienda(): array
    {
        $whatsapp = self::whatsappDeLaTiendaActivo();

        return self::active()->orderBy('sort_order')->orderBy('id')->get()
            ->map(fn (self $l) => $l->publico($whatsapp))
            ->all();
    }

    /** El WhatsApp de cada local sigue al interruptor de la tienda (Configuración): apagado, no se muestra ninguno. */
    public static function whatsappDeLaTiendaActivo(): bool
    {
        return ConfiguracionTienda::get('whatsapp_enabled') === '1';
    }

    /** Lo que ve el cliente de este local. */
    /**
     * Los datos del local que ve la tienda.
     *
     * `$conGoogle` viene apagado a propósito: el JSON-LD del negocio lo imprime el
     * servidor en el <head> (App\Support\Seo\DatosEstructurados). Mandarlo también
     * acá declaraba la tienda dos veces y viajaba en cada página sin que nadie lo use.
     */
    public function publico(bool $whatsapp, bool $conGoogle = false): array
    {
        $datos = [
            'id'           => $this->id,
            'nombre'       => $this->name,
            'direccion'    => $this->address,
            'ciudad'       => $this->city,
            'pais'         => $this->country,
            'descripcion'  => $this->description,
            'horarios'     => $this->horariosAbiertos(),
            'horario_nota' => $this->hours,
            'telefono'     => $this->phone,
            'telefono_url' => $this->telefonoUrl(),
            'whatsapp'     => $whatsapp && filled($this->whatsapp) ? $this->whatsapp : null,
            'mapa'         => $this->map_embed_url,
            'como_llegar'  => $this->map_link_url,
        ];

        if ($conGoogle) {
            $datos['google'] = $this->datosParaGoogle($whatsapp);
        }

        return $datos;
    }

    /**
     * El horario de los siete días, del lunes al domingo, o una lista vacía si no hay ningún día abierto: un local sin
     * horario cargado no muestra «cerrado» todos los días.
     */
    public function horariosAbiertos(): array
    {
        $dias = collect($this->horarios ?? [])->keyBy('dia');

        if (! $dias->contains(fn ($d) => ($d['abierto'] ?? false) && ! empty($d['tramos']))) {
            return [];
        }

        // «9:00» y «09:00» son la misma hora: se leen siempre como HH:MM
        $hora = fn ($valor) => preg_match('/^(\d{1,2}):(\d{2})$/', trim((string) $valor), $m) ? str_pad($m[1], 2, '0', STR_PAD_LEFT) . ':' . $m[2] : null;

        return collect(self::DIAS)->keys()->map(function (int $dia) use ($dias, $hora) {
            $tramos = ($dias[$dia]['abierto'] ?? false)
                ? collect($dias[$dia]['tramos'] ?? [])
                    ->map(fn ($t) => ['abre' => $hora($t['abre'] ?? null), 'cierra' => $hora($t['cierra'] ?? null)])
                    ->filter(fn ($t) => $t['abre'] && $t['cierra'])
                    ->values()->all()
                : [];

            return ['dia' => $dia, 'abierto' => $tramos !== [], 'tramos' => $tramos];
        })->all();
    }

    /**
     * `tel:` para llamar desde el celular, en formato internacional cuando se puede (así lo pide Google): un número de
     * Bolivia sin código de país (8 dígitos, fijo o celular) se completa con +591.
     */
    public function telefonoUrl(): ?string
    {
        $digitos = preg_replace('/\D/', '', (string) $this->phone);

        if ($digitos === '') {
            return null;
        }

        if (str_starts_with(trim((string) $this->phone), '+') || (str_starts_with($digitos, '591') && strlen($digitos) > 8)) {
            return 'tel:+' . $digitos;
        }

        $boliviano = mb_strtolower(trim((string) $this->country)) === 'bolivia' && strlen($digitos) === 8;

        return 'tel:' . ($boliviano ? '+591' : '') . $digitos;
    }

    /** Lo que lee Google del local (schema.org `Store`), con el horario día por día. */
    public function datosParaGoogle(bool $whatsapp): array
    {
        $telefono = filled($this->phone)
            ? substr((string) $this->telefonoUrl(), 4)
            : ($whatsapp && filled($this->whatsapp) ? '+' . $this->whatsapp : null);

        return array_filter([
            '@type'       => 'Store',
            'name'        => $this->name,
            'description' => $this->description,
            'url'         => url('/'),
            'image'       => url('/images/logo-appleboss.png'),
            'telephone'   => $telefono,
            'hasMap'      => $this->map_link_url,
            'address'     => array_filter([
                '@type'           => 'PostalAddress',
                'streetAddress'   => $this->address,
                'addressLocality' => $this->city,
                'addressCountry'  => mb_strtolower((string) $this->country) === 'bolivia' ? 'BO' : $this->country,
            ]),
            'openingHoursSpecification' => $this->horarioParaGoogle() ?: null,
        ]);
    }

    /** Los días con el mismo tramo van juntos: «lunes a viernes, de 09:00 a 19:00». */
    public function horarioParaGoogle(): array
    {
        $grupos = [];

        foreach ($this->horariosAbiertos() as $dia) {
            foreach ($dia['tramos'] as $tramo) {
                $clave = $tramo['abre'] . '-' . $tramo['cierra'];
                $grupos[$clave] ??= ['@type' => 'OpeningHoursSpecification', 'dayOfWeek' => [], 'opens' => $tramo['abre'], 'closes' => $tramo['cierra']];
                $grupos[$clave]['dayOfWeek'][] = self::DIAS_GOOGLE[$dia['dia']];
            }
        }

        return array_values($grupos);
    }
}
