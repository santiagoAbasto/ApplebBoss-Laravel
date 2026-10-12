<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/** El titular de los textos legales con el nombre completo, como figura en la cuenta de la empresa. */
return new class extends Migration
{
    public function up(): void
    {
        foreach (DB::table('pages')->whereIn('slug', ['privacidad', 'terminos'])->get() as $pagina) {
            $nuevo = str_replace('Santiago Abasto (Apple Boss)', 'Santiago Alfredo Abasto Ortega (Apple Boss)', (string) $pagina->content);
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
