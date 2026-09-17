<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable;

    /**
     * Atributos asignables masivamente.
     * ⚠️  'rol' NO está aquí a propósito: el rol SOLO
     *      se puede cambiar con asignación directa ($user->rol = …)
     *      desde el servidor, nunca desde el cliente.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * Atributos ocultos en serialización JSON.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Casts de atributos.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
            'meta_mensual'      => 'decimal:2',
        ];
    }

    /* ─── Helpers de rol ─── */

    public function isAdmin(): bool
    {
        return $this->rol === 'admin';
    }

    public function isVendedor(): bool
    {
        return $this->rol === 'vendedor';
    }

    /** Meta de ventas del mes que le cargó el administrador. 0 = todavía no le pusieron ninguna. */
    public function metaMensual(): float
    {
        return max(0, (float) ($this->meta_mensual ?? 0));
    }

    /* ─── Relaciones ─── */

    public function clientes()
    {
        return $this->hasMany(Cliente::class);
    }

    public function automationReportViews()
    {
        return $this->hasMany(AutomationReportView::class);
    }
}
