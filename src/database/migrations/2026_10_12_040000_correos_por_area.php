<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Cada página pública muestra la casilla de su área (alias de Google Workspace creados el 11-10-2026):
 * info@ para contacto general, privacidad@ para datos personales, soporte@ para garantía. ventas@ queda para la
 * boleta y las cotizaciones. Solo toca páginas que todavía dicen ventas@.
 */
return new class extends Migration
{
    public function up(): void
    {
        $derechos = 'desde el mismo correo con el que compraste';
        $porPagina = [
            'privacidad' => [
                '<a href="mailto:ventas@appleboss.com.bo">ventas@appleboss.com.bo</a> ' . $derechos => '<a href="mailto:privacidad@appleboss.com.bo">privacidad@appleboss.com.bo</a> ' . $derechos,
                'ventas@appleboss.com.bo' => 'info@appleboss.com.bo',
            ],
            'cookies'  => ['ventas@appleboss.com.bo' => 'privacidad@appleboss.com.bo'],
            'terminos' => ['ventas@appleboss.com.bo' => 'info@appleboss.com.bo'],
            'nosotros' => ['ventas@appleboss.com.bo' => 'info@appleboss.com.bo'],
            'garantia' => ['ventas@appleboss.com.bo' => 'soporte@appleboss.com.bo'],
        ];

        foreach ($porPagina as $slug => $cambios) {
            $pagina = DB::table('pages')->where('slug', $slug)->first();
            if (! $pagina) {
                continue;
            }
            $nuevo = strtr((string) $pagina->content, $cambios); // strtr: la clave más larga primero y sin volver a pasar
            if ($nuevo !== $pagina->content) {
                DB::table('pages')->where('id', $pagina->id)->update(['content' => $nuevo, 'updated_at' => now()]);
            }
        }
    }

    public function down(): void
    {
        // El texto queda.
    }
};
