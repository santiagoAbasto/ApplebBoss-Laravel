<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * La dirección oficial es la del perfil de Google (y Bing Places, que lo copia): «Edificio Fidel Anze, sobre la
 * Av. Melchor Urquidi, entre Fidel Anze y América». La web decía «entre C. Fidel Anze y Av. Julio Rodríguez», y los
 * buscadores penalizan que el negocio tenga dos direcciones. Se cambia en el local (Ubicaciones) y en las páginas.
 */
return new class extends Migration
{
    public const NUEVA = 'Edificio Fidel Anze, sobre la Av. Melchor Urquidi, entre Fidel Anze y América';

    public function up(): void
    {
        DB::table('store_locations')->where('address', 'like', 'Av. Melchor Urquidi%')->update(['address' => self::NUEVA, 'updated_at' => now()]);

        $viejas = [
            'Av. Melchor Urquidi, entre C. Fidel Anze y Av. Julio Rodríguez' => self::NUEVA,
            'Av. Melchor Urquidi, entre C. Fidel Anze y Av. Julio Rodriguez' => self::NUEVA,
        ];
        foreach (DB::table('pages')->whereIn('slug', ['privacidad', 'terminos', 'garantia', 'nosotros', 'envios', 'cookies'])->get() as $pagina) {
            $nuevo = strtr((string) $pagina->content, $viejas);
            if ($nuevo !== $pagina->content) {
                DB::table('pages')->where('id', $pagina->id)->update(['content' => $nuevo, 'updated_at' => now()]);
            }
        }
    }

    public function down(): void
    {
        // La dirección queda.
    }
};
