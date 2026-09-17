<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Support\Permisos;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Sistema → Usuarios y roles: quién entra al panel y qué parte puede abrir.
 *
 * El rol de cada persona se guarda en `users.rol` (la misma columna de siempre) y cada rol dice, en la tabla
 * `roles`, qué módulos del panel abre. `PermisoMiddleware` lo hace cumplir en el servidor, así que lo que no se ve
 * en el menú tampoco se abre escribiendo la dirección.
 *
 * Tres barandas que no se pueden saltar:
 * - Nadie se cambia el rol a sí mismo ni se borra a sí mismo.
 * - Siempre queda al menos un administrador.
 * - La contraseña solo se escribe, nunca se lee ni se muestra.
 */
class UsuarioController extends Controller
{
    public function index(Request $request): Response
    {
        $q      = trim((string) $request->string('q'));
        $filtro = (string) $request->string('rol', 'todos');

        $usuarios = User::query()
            ->when($filtro !== 'todos', fn ($qb) => $qb->where('rol', $filtro))
            ->when($q !== '', function ($qb) use ($q) {
                $like = '%' . NewsletterCampaignController::escaparLike($q) . '%';
                $qb->where(fn ($w) => $w
                    ->whereRaw('LOWER(name) LIKE ?', [$like])
                    ->orWhereRaw('LOWER(email) LIKE ?', [$like]));
            })
            ->orderByRaw("case when rol = 'admin' then 0 else 1 end")
            ->orderBy('name')
            ->get();

        $roles = Role::orderBy('orden')->orderBy('id')->get();
        $porRol = User::selectRaw('rol, count(*) as total')->groupBy('rol')->pluck('total', 'rol');

        return Inertia::render('Admin/Usuarios/Index', [
            'usuarios' => $usuarios->map(fn (User $u) => $this->paraElPanel($u, $roles))->values(),
            'roles'    => $roles->map(fn (Role $r) => [
                'id'          => $r->id,
                'clave'       => $r->clave,
                'nombre'      => $r->nombre,
                'descripcion' => $r->descripcion,
                'permisos'    => $r->permisosReales(),
                'del_sistema'  => $r->del_sistema,
                'panel_propio' => $r->panel_propio,
                'activo'       => $r->activo,
                'usuarios'    => (int) ($porRol[$r->clave] ?? 0),
                'todo'        => in_array(Permisos::TODO, $r->permisosReales(), true),
            ])->values(),
            'permisos' => Permisos::porGrupo(),
            'filtros'  => ['q' => $q, 'rol' => $filtro],
            'yo'       => $request->user()->id,
            'resumen'  => [
                'usuarios' => $usuarios->count(),
                'total'    => User::count(),
                'admins'   => User::where('rol', 'admin')->count(),
                'roles'    => $roles->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:120'],
            'email'    => ['required', 'email:rfc', 'max:191', 'unique:users,email'],
            'rol'      => ['required', 'string', Rule::exists('roles', 'clave')->where('activo', true)],
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
            'meta_mensual' => ['nullable', 'numeric', 'min:0', 'max:99999999.99'],
        ], $this->mensajes());

        $user = new User();
        $user->name  = strip_tags($data['name']);
        $user->email = Str::lower($data['email']);
        $user->password = Hash::make($data['password']);
        // El rol nunca se asigna en masa: se escribe acá, después de validarlo
        $user->rol = $data['rol'];
        // Meta del mes que ve en su panel; 0 = sin meta
        $user->meta_mensual = round((float) ($data['meta_mensual'] ?? 0), 2);
        $user->email_verified_at = now();
        $user->save();

        return back()->with('success', $user->name . ' ya puede entrar al panel.');
    }

    public function update(Request $request, User $usuario): RedirectResponse
    {
        $esYo = $request->user()->id === $usuario->id;

        $data = $request->validate([
            'name'     => ['required', 'string', 'max:120'],
            'email'    => ['required', 'email:rfc', 'max:191', Rule::unique('users', 'email')->ignore($usuario->id)],
            'rol'      => ['required', 'string', Rule::exists('roles', 'clave')->where('activo', true)],
            'password' => ['nullable', 'confirmed', Password::min(8)->letters()->numbers()],
            'meta_mensual' => ['nullable', 'numeric', 'min:0', 'max:99999999.99'],
        ], $this->mensajes());

        if ($esYo && $data['rol'] !== $usuario->rol) {
            return back()->withErrors(['rol' => 'No puedes cambiarte el rol a ti mismo. Pídeselo a otro administrador.']);
        }

        if (! $esYo && $usuario->rol === 'admin' && $data['rol'] !== 'admin' && $this->ultimoAdmin($usuario)) {
            return back()->withErrors(['rol' => 'Es el único administrador: si le cambias el rol, nadie podría entrar a configurar la tienda.']);
        }

        $usuario->name  = strip_tags($data['name']);
        $usuario->email = Str::lower($data['email']);
        $usuario->rol   = $data['rol'];
        $usuario->meta_mensual = round((float) ($data['meta_mensual'] ?? 0), 2);

        if (filled($data['password'] ?? null)) {
            $usuario->password = Hash::make($data['password']);
        }

        $usuario->save();

        return back()->with('success', 'Los datos de ' . $usuario->name . ' quedaron guardados.');
    }

    public function destroy(Request $request, User $usuario): RedirectResponse
    {
        if ($request->user()->id === $usuario->id) {
            return back()->withErrors(['usuario' => 'No puedes borrar tu propia cuenta.']);
        }

        if ($usuario->rol === 'admin' && $this->ultimoAdmin($usuario)) {
            return back()->withErrors(['usuario' => 'Es el único administrador: no se puede borrar.']);
        }

        $nombre = $usuario->name;
        $usuario->delete();

        return back()->with('success', $nombre . ' ya no tiene acceso al panel.');
    }

    private function ultimoAdmin(User $usuario): bool
    {
        return User::where('rol', 'admin')->where('id', '!=', $usuario->id)->doesntExist();
    }

    private function paraElPanel(User $u, $roles): array
    {
        $rol = $roles->firstWhere('clave', $u->rol);

        return [
            'id'          => $u->id,
            'name'        => $u->name,
            'email'       => $u->email,
            'rol'         => $u->rol,
            'rol_nombre'  => $rol?->nombre ?? $u->rol,
            'rol_activo'  => (bool) ($rol?->activo ?? false),
            'panel_propio' => (bool) ($rol?->panel_propio ?? false),
            'meta_mensual' => (float) $u->meta_mensual,
            'created_at'  => $u->created_at?->toIso8601String(),
        ];
    }

    private function mensajes(): array
    {
        return [
            'name.required'      => 'Escribe el nombre de la persona: es el que se ve en el panel.',
            'email.required'     => 'El correo es con el que entra al panel.',
            'email.email'        => 'Escribe un correo válido.',
            'email.unique'       => 'Ya hay una cuenta con ese correo.',
            'rol.required'       => 'Elige qué rol tiene.',
            'rol.exists'         => 'Ese rol no existe o está apagado.',
            'password.required'  => 'Escribe una contraseña para que pueda entrar.',
            'password.confirmed' => 'Las dos contraseñas no son iguales.',
            'password.min'       => 'La contraseña necesita al menos :min caracteres.',
            'password.letters'   => 'La contraseña tiene que tener letras y números.',
            'password.numbers'   => 'La contraseña tiene que tener letras y números.',
            'meta_mensual.numeric' => 'Escribe la meta del mes en números, sin puntos ni letras.',
            'meta_mensual.min'     => 'La meta no puede ser negativa.',
            'meta_mensual.max'     => 'Esa meta es demasiado grande.',
        ];
    }
}
