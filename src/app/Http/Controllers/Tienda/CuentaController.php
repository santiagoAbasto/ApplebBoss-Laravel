<?php

namespace App\Http\Controllers\Tienda;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Symfony\Component\HttpFoundation\Response as SymfonyResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

/**
 * La cuenta de quien compra en la tienda.
 *
 * Es un `User` con `rol = 'cliente'`, no una tabla aparte: `RolMiddleware` compara contra una
 * lista blanca, así que un cliente queda fuera de /admin y /vendedor sin guard adicional.
 * La tabla `clientes` es otra cosa —el CRM de mostrador que llevan los vendedores— y no se toca.
 *
 * El rol NUNCA viene del formulario: se fija acá, en el servidor.
 */
class CuentaController extends Controller
{
    public function crear(Request $request): Response
    {
        return Inertia::render('Store/Cuenta/Crear', [
            // Si llegó acá desde el checkout, se lo decimos para que sepa por qué le pedimos la cuenta
            'desdeCheckout' => str_contains((string) $request->session()->get('url.intended'), '/checkout'),
        ]);
    }

    public function registrar(Request $request): SymfonyResponse
    {
        $datos = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:100', 'regex:/^[\pL\s\-\'\.]+$/u'],
            'email' => ['required', 'string', 'lowercase', 'email:rfc,dns', 'max:255', 'unique:users,email'],
            'telefono' => ['required', 'string', 'max:30', 'regex:/^\+?[\d\s\-().]{7,30}$/'],
            // Largo + revisión de filtraciones, sin reglas de composición: es lo que recomienda
            // el NIST (SP 800-63B) y da más seguridad real que exigir un símbolo.
            'password' => ['required', 'confirmed', Rules\Password::min(10)->uncompromised()],
        ], [
            'name.regex'             => 'El nombre solo puede tener letras, espacios, guiones y puntos.',
            'email.email'            => 'Ingresa un correo válido.',
            'email.unique'           => 'Ese correo ya tiene una cuenta. Inicia sesión.',
            'telefono.regex'         => 'Ingresa un teléfono válido.',
            'password.confirmed'     => 'Las contraseñas no coinciden.',
            'password.min'           => 'La contraseña debe tener al menos 10 caracteres.',
            'password.uncompromised' => 'Esa contraseña apareció en filtraciones públicas. Elige otra.',
        ]);

        // Se arma y se guarda de una sola vez. Con User::create() la fila nacería con el rol
        // por defecto ('vendedor') y recién después bajaría a 'cliente': si ese segundo guardado
        // fallara, quedaría una cuenta de vendedor creada desde un formulario público.
        $user = new User();
        $user->name     = strip_tags(trim($datos['name']));
        $user->email    = $datos['email'];
        $user->password = Hash::make($datos['password']);
        $user->telefono = $datos['telefono'];
        $user->rol      = 'cliente';   // fuera de $fillable a propósito: nunca llega del formulario
        $user->save();

        event(new Registered($user));   // manda el correo de verificación
        Auth::login($user);
        $request->session()->regenerate();

        // Recarga completa: acaba de nacer una sesión y la lista de rutas del navegador
        // todavía es la de invitado (ver AuthenticatedSessionController::store).
        return Inertia::location(redirect()->intended(route('cuenta.index'))->getTargetUrl());
    }

    /** «Mi cuenta»: los pedidos de esta persona, sin tener que buscar ningún código. */
    public function index(Request $request): Response
    {
        $pedidos = $request->user()->pedidos()
            ->with('items:id,pedido_id,nombre,cantidad')
            ->paginate(10)
            ->through(fn ($p) => [
                'codigo'    => $p->codigo,
                'token'     => $p->token_seguimiento,
                'estado'    => $p->estado,
                'etiqueta'  => $p->etiqueta(),
                'total'     => (float) $p->total,
                'articulos' => $p->items->pluck('nombre')->all(),
                'creado_en' => $p->created_at?->toIso8601String(),
                'pago_confirmado' => $p->pagoConfirmado(),
            ]);

        return Inertia::render('Store/Cuenta/Index', [
            'pedidos' => $pedidos,
            'perfil'  => [
                'nombre'    => $request->user()->name,
                'email'     => $request->user()->email,
                'verificado' => $request->user()->hasVerifiedEmail(),
            ],
        ]);
    }
}
