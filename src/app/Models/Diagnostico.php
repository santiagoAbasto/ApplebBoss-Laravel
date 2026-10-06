<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * El informe técnico de un equipo: lo que reporta el cliente, lo que probó el técnico y su conclusión.
 *
 * La firma y el sello de la tienda certifican lo que vio el técnico, no lo que cuenta el cliente: por eso el informe
 * sale firmado recién cuando tiene técnico, al menos una prueba hecha y conclusión. Antes es un borrador sin firma.
 */
class Diagnostico extends Model
{
    protected $table = 'diagnosticos';

    protected $fillable = [
        'codigo', 'fecha', 'cliente_nombre', 'cliente_telefono', 'cliente_correo', 'equipo', 'identificador',
        'falla_reportada', 'pruebas', 'conclusion', 'recomendacion', 'tecnico', 'user_id',
    ];

    protected $casts = [
        'fecha'   => 'date',
        'pruebas' => 'array',
    ];

    /** Lo que se suele probar en un celular, en el orden en que conviene. La lista no está cerrada. */
    public const PRUEBAS = [
        'Enciende y arranca', 'Pantalla', 'Táctil', 'Táctil mientras carga', 'Carga y puerto',
        'Batería (salud y temperatura)', 'Micrófono en llamada', 'Altavoz y auricular', 'Cámaras',
        'Face ID / Touch ID', 'Señal y chip', 'Wi-Fi y Bluetooth', 'Botones', 'Carcasa y chasis', 'Rendimiento',
    ];

    /** Ninguna prueba viene marcada: un informe que dice «funciona» sin que nadie lo probó no defiende a nadie. */
    public const RESULTADOS = ['ok' => 'Funciona', 'falla' => 'Presenta falla', 'nc' => 'No se pudo probar'];

    protected static function booted(): void
    {
        static::created(function (Diagnostico $diagnostico) {
            if (! $diagnostico->codigo) {
                $diagnostico->updateQuietly(['codigo' => 'AB-DG-' . str_pad((string) $diagnostico->id, 6, '0', STR_PAD_LEFT)]);
            }
        });
    }

    public function registradoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /** Solo las pruebas que tienen resultado: las que no se hicieron no se imprimen. */
    public function pruebasHechas(): array
    {
        return array_values(array_filter($this->pruebas ?? [], fn ($p) => isset(self::RESULTADOS[$p['resultado'] ?? ''])));
    }

    /** ¿Ya se puede entregar firmado? */
    public function listo(): bool
    {
        return filled($this->tecnico) && filled($this->conclusion) && $this->pruebasHechas() !== [];
    }

    /** Lo que le falta para salir firmado: «Faltan las pruebas, la conclusión y el técnico». Null si no falta nada. */
    public function queFalta(): ?string
    {
        $faltan = array_values(array_filter([
            $this->pruebasHechas() === [] ? 'las pruebas' : null,
            blank($this->conclusion) ? 'la conclusión' : null,
            blank($this->tecnico) ? 'el técnico' : null,
        ]));

        if ($faltan === []) {
            return null;
        }

        $ultimo = array_pop($faltan);

        return ($faltan ? 'Faltan ' . implode(', ', $faltan) . ' y ' : 'Falta ') . $ultimo;
    }
}
