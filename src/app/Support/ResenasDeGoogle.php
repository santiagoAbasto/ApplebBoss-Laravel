<?php

namespace App\Support;

use App\Models\ConfiguracionTienda;
use App\Models\Resena;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Las reseñas del perfil de Google de la tienda, por la API de Google Business Profile.
 *
 * La cuenta dueña del perfil autoriza una sola vez (Tienda online → Reseñas → Conectar Google) y se guarda su
 * refresh token cifrado. Una vez al día se traen todas: las nuevas entran sin publicar, como cualquier reseña, y
 * las que se borraron en Google se borran acá. El promedio y la cantidad son los oficiales de Google.
 * Las que solo tienen estrellas, sin texto, cuentan en el promedio de Google pero no se muestran.
 */
final class ResenasDeGoogle
{
    public const SCOPE = 'https://www.googleapis.com/auth/business.manage';

    private const ESTRELLAS = ['ONE' => 1, 'TWO' => 2, 'THREE' => 3, 'FOUR' => 4, 'FIVE' => 5];

    public static function conectado(): bool
    {
        return filled(ConfiguracionTienda::get('google_resenas_token'));
    }

    public static function conectar(string $refreshToken, ?string $cuenta): void
    {
        ConfiguracionTienda::set('google_resenas_token', Crypt::encryptString($refreshToken));
        ConfiguracionTienda::set('google_resenas_cuenta', $cuenta);
    }

    /** Se olvida la autorización; las reseñas que ya se trajeron quedan. */
    public static function desconectar(): void
    {
        foreach (['token', 'cuenta', 'ubicacion', 'error'] as $clave) {
            ConfiguracionTienda::set("google_resenas_{$clave}", null);
        }
    }

    /** Lo que muestra el panel. */
    public static function estado(): array
    {
        return [
            'conectado' => self::conectado(),
            'cuenta'    => ConfiguracionTienda::get('google_resenas_cuenta'),
            'ultima'    => ConfiguracionTienda::get('google_resenas_ultima'),
            'error'     => ConfiguracionTienda::get('google_resenas_error'),
        ] + (self::resumen() ?? ['promedio' => null, 'total' => null, 'enlace' => null]);
    }

    /** El promedio y la cantidad oficiales de Google, o null si nunca se trajeron o el perfil no tiene reseñas. */
    public static function resumen(): ?array
    {
        $total = (int) ConfiguracionTienda::get('google_resenas_total', 0);

        return $total < 1 ? null : [
            'fuente'   => 'google',
            'promedio' => round((float) ConfiguracionTienda::get('google_resenas_promedio'), 1),
            'total'    => $total,
            'enlace'   => ConfiguracionTienda::get('google_resenas_enlace'),
            // Abre directo el cuadro de Google para escribir una reseña
            'escribir' => ConfiguracionTienda::get('google_resenas_escribir'),
        ];
    }

    /**
     * Trae todas las reseñas y deja la tabla igual que Google. Devuelve cuántas entraron, cuántas se actualizaron y
     * cuántas se borraron. Si algo falla, no toca nada y guarda el error para mostrarlo en el panel.
     */
    public static function importar(): array
    {
        try {
            $acceso = self::tokenDeAcceso();
            [$ubicacion, $enlace, $escribir] = self::ubicacion($acceso);
            [$resenas, $promedio, $total] = self::resenas($acceso, $ubicacion);
        } catch (\Throwable $e) {
            ConfiguracionTienda::set('google_resenas_error', mb_substr($e->getMessage(), 0, 300));
            throw $e;
        }

        $cuenta = ['nuevas' => 0, 'actualizadas' => 0, 'borradas' => 0];

        DB::transaction(function () use ($resenas, $enlace, &$cuenta) {
            $orden = (int) Resena::max('orden');

            foreach ($resenas as $r) {
                $existente = Resena::where('google_id', $r['google_id'])->first();

                if ($existente) {
                    $existente->fill(['nombre' => $r['nombre'], 'calificacion' => $r['calificacion'], 'texto' => $r['texto'], 'fecha' => $r['fecha'], 'enlace' => $enlace]);
                    if ($existente->isDirty()) {
                        $existente->save();
                        $cuenta['actualizadas']++;
                    }
                    continue;
                }

                // Como cualquier reseña: entra sin publicar y la aprueba alguien del panel
                Resena::create($r + ['fuente' => 'google', 'enlace' => $enlace, 'publicada' => false, 'orden' => ++$orden]);
                $cuenta['nuevas']++;
            }

            // Las que el cliente borró en Google (o dejaron de tener texto) tampoco se muestran acá
            $cuenta['borradas'] = Resena::whereNotNull('google_id')
                ->whereNotIn('google_id', array_column($resenas, 'google_id'))
                ->delete();
        });

        ConfiguracionTienda::set('google_resenas_promedio', (string) $promedio);
        ConfiguracionTienda::set('google_resenas_total', (string) $total);
        ConfiguracionTienda::set('google_resenas_enlace', $enlace);
        ConfiguracionTienda::set('google_resenas_escribir', $escribir);
        ConfiguracionTienda::set('google_resenas_ultima', now()->toIso8601String());
        ConfiguracionTienda::set('google_resenas_error', null);

        return $cuenta;
    }

    private static function tokenDeAcceso(): string
    {
        $cifrado = ConfiguracionTienda::get('google_resenas_token');
        if (blank($cifrado)) {
            throw new RuntimeException('Google no está conectado.');
        }

        $r = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id'     => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'refresh_token' => Crypt::decryptString($cifrado),
            'grant_type'    => 'refresh_token',
        ]);

        if ($r->json('error') === 'invalid_grant') {
            throw new RuntimeException('Google retiró el permiso. Vuelve a conectar la cuenta dueña del perfil.');
        }

        return (string) $r->throw()->json('access_token');
    }

    /**
     * El perfil de la tienda: el primero cuyo nombre dice «Apple Boss», o el único que haya. Se busca en cada
     * importación (son dos consultas al día) para que el enlace al perfil y el de «escribir una reseña» sigan al día.
     */
    private static function ubicacion(string $acceso): array
    {
        $perfiles = [];
        $cuentas = Http::withToken($acceso)->get('https://mybusinessaccountmanagement.googleapis.com/v1/accounts')->throw()->json('accounts') ?? [];

        foreach ($cuentas as $cuenta) {
            $ubicaciones = Http::withToken($acceso)
                ->get("https://mybusinessbusinessinformation.googleapis.com/v1/{$cuenta['name']}/locations", ['readMask' => 'name,title,metadata', 'pageSize' => 100])
                ->throw()->json('locations') ?? [];

            foreach ($ubicaciones as $u) {
                $lugar = $u['metadata']['placeId'] ?? null;
                $perfiles[] = [
                    'ruta'     => "{$cuenta['name']}/{$u['name']}",
                    'titulo'   => $u['title'] ?? '',
                    'enlace'   => $u['metadata']['mapsUri'] ?? null,
                    'escribir' => $u['metadata']['newReviewUri'] ?? ($lugar ? "https://search.google.com/local/writereview?placeid={$lugar}" : null),
                ];
            }
        }

        $perfil = collect($perfiles)->first(fn ($p) => str_contains(mb_strtolower($p['titulo']), 'apple boss')) ?? $perfiles[0] ?? null;
        if (! $perfil) {
            throw new RuntimeException('La cuenta conectada no administra ningún perfil de Google. Conecta la cuenta dueña del perfil de la tienda.');
        }

        ConfiguracionTienda::set('google_resenas_ubicacion', $perfil['ruta']);

        return [$perfil['ruta'], $perfil['enlace'], $perfil['escribir']];
    }

    /** Todas las páginas de reseñas, ya con la forma de la tabla. */
    private static function resenas(string $acceso, string $ubicacion): array
    {
        $resenas = [];
        $pagina = null;
        $promedio = 0.0;
        $total = 0;

        do {
            $r = Http::withToken($acceso)
                ->get("https://mybusiness.googleapis.com/v4/{$ubicacion}/reviews", array_filter(['pageSize' => 50, 'pageToken' => $pagina]))
                ->throw();

            $promedio = (float) $r->json('averageRating', 0);
            $total = (int) $r->json('totalReviewCount', 0);

            foreach ($r->json('reviews') ?? [] as $g) {
                $texto = self::textoOriginal((string) ($g['comment'] ?? ''));
                if (mb_strlen($texto) < 3 || ! isset(self::ESTRELLAS[$g['starRating'] ?? ''])) {
                    continue; // solo estrellas: cuenta en el promedio de Google, pero no hay nada que mostrar
                }

                $nombre = ($g['reviewer']['isAnonymous'] ?? false) ? '' : trim(strip_tags((string) ($g['reviewer']['displayName'] ?? '')));

                $resenas[] = [
                    'google_id'    => (string) $g['reviewId'],
                    'nombre'       => mb_substr($nombre ?: 'Cliente de Google', 0, 80),
                    'calificacion' => self::ESTRELLAS[$g['starRating']],
                    'texto'        => mb_substr($texto, 0, 1000),
                    'fecha'        => Carbon::parse($g['createTime'] ?? 'now')->timezone(config('app.timezone'))->toDateString(),
                ];
            }

            $pagina = $r->json('nextPageToken');
        } while ($pagina);

        return [$resenas, $promedio, $total];
    }

    /**
     * Google agrega su traducción automática al comentario: «(Translated by Google) … (Original) …» o al revés.
     * Se queda solo lo que escribió el cliente.
     */
    public static function textoOriginal(string $comentario): string
    {
        if (str_contains($comentario, '(Original)')) {
            $comentario = substr($comentario, strpos($comentario, '(Original)') + strlen('(Original)'));
        } elseif (str_contains($comentario, '(Translated by Google)')) {
            $comentario = substr($comentario, 0, strpos($comentario, '(Translated by Google)'));
        }

        return trim(strip_tags($comentario));
    }
}
