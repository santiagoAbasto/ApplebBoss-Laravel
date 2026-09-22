<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Quién repara. Solo nombre y especialidad: de acá sale qué equipos puede recibir cada uno.
 * Lo que se le paga al técnico no vive en el sistema.
 */
class Tecnico extends Model
{
    protected $table = 'tecnicos';

    protected $fillable = ['nombre', 'especialidad', 'activo'];

    protected $casts = ['activo' => 'boolean'];

    public const APPLE = 'apple';

    public const ANDROID = 'android';

    public const AMBAS = 'ambas';

    public const ESPECIALIDADES = [
        self::APPLE   => 'iPhone y equipos Apple',
        self::ANDROID => 'Android',
        self::AMBAS   => 'Cualquier equipo',
    ];

    /** Los que pueden recibir un equipo de esta marca. «Otro» no lo cubre nadie en particular: cualquiera sirve. */
    public function scopeParaMarca(Builder $q, ?string $marca): Builder
    {
        if ($marca === null || $marca === ServicioTecnico::MARCA_OTRO) {
            return $q;
        }

        return $q->whereIn('especialidad', [$marca, self::AMBAS]);
    }

    /** ¿Este técnico puede recibir un equipo de esta marca? (se revalida en el servidor). */
    public function atiende(?string $marca): bool
    {
        if ($marca === null || $marca === ServicioTecnico::MARCA_OTRO) {
            return true;
        }

        return $this->especialidad === self::AMBAS || $this->especialidad === $marca;
    }
}
