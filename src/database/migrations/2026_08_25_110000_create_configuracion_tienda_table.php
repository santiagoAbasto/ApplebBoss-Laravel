<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('configuracion_tienda', function (Blueprint $table) {
            $table->id();
            $table->string('clave', 100)->unique();
            $table->text('valor')->nullable();
            $table->string('tipo', 30)->default('texto'); // texto, numero, booleano, json
            $table->string('grupo', 60)->default('general');
            $table->string('etiqueta', 200)->nullable();
            $table->timestamps();
        });

        // Seed valores por defecto
        $ahora = now();
        DB::table('configuracion_tienda')->insert([
            ['clave' => 'whatsapp_numero',      'valor' => '59178000000',                    'tipo' => 'texto',  'grupo' => 'contacto',  'etiqueta' => 'Número de WhatsApp (con código de país)',   'created_at' => $ahora, 'updated_at' => $ahora],
            ['clave' => 'whatsapp_mensaje',      'valor' => 'Hola Apple Boss, quiero consultar sobre sus productos.', 'tipo' => 'texto', 'grupo' => 'contacto', 'etiqueta' => 'Mensaje por defecto de WhatsApp', 'created_at' => $ahora, 'updated_at' => $ahora],
            ['clave' => 'tienda_nombre',         'valor' => 'Apple Boss',                     'tipo' => 'texto',  'grupo' => 'tienda',    'etiqueta' => 'Nombre de la tienda',                       'created_at' => $ahora, 'updated_at' => $ahora],
            ['clave' => 'tienda_direccion',      'valor' => 'Cochabamba, Bolivia',             'tipo' => 'texto',  'grupo' => 'tienda',    'etiqueta' => 'Dirección de la tienda',                    'created_at' => $ahora, 'updated_at' => $ahora],
            ['clave' => 'tienda_ciudad',         'valor' => 'Cochabamba',                     'tipo' => 'texto',  'grupo' => 'tienda',    'etiqueta' => 'Ciudad',                                    'created_at' => $ahora, 'updated_at' => $ahora],
            ['clave' => 'tienda_pais',           'valor' => 'Bolivia',                        'tipo' => 'texto',  'grupo' => 'tienda',    'etiqueta' => 'País',                                      'created_at' => $ahora, 'updated_at' => $ahora],
            ['clave' => 'tienda_horario',        'valor' => 'Lunes a sábado de 9:00 a 19:00', 'tipo' => 'texto',  'grupo' => 'tienda',    'etiqueta' => 'Horario de atención',                       'created_at' => $ahora, 'updated_at' => $ahora],
            ['clave' => 'hero_titulo',           'valor' => 'El iPhone que buscás, disponible hoy.', 'tipo' => 'texto', 'grupo' => 'home', 'etiqueta' => 'Título del hero',                         'created_at' => $ahora, 'updated_at' => $ahora],
            ['clave' => 'hero_subtitulo',        'valor' => 'Equipos Apple revisados, listos para usar. Consultá directamente con nuestro equipo en Cochabamba.', 'tipo' => 'texto', 'grupo' => 'home', 'etiqueta' => 'Subtítulo del hero', 'created_at' => $ahora, 'updated_at' => $ahora],
            ['clave' => 'anuncio_barra',         'valor' => 'Equipos revisados · Stock real · Atención en Bolivia', 'tipo' => 'texto', 'grupo' => 'home', 'etiqueta' => 'Texto barra de anuncio', 'created_at' => $ahora, 'updated_at' => $ahora],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('configuracion_tienda');
    }
};
