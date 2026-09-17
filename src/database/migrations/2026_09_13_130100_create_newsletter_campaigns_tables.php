<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // Token de baja por suscriptor (link obligatorio en cada correo) + nombre opcional
        Schema::table('newsletter_subscribers', function (Blueprint $table) {
            $table->string('nombre', 120)->nullable()->after('email');
            $table->string('token', 64)->nullable()->unique()->after('nombre');
        });
        DB::table('newsletter_subscribers')->whereNull('token')->orderBy('id')->each(function ($row) {
            DB::table('newsletter_subscribers')->where('id', $row->id)->update(['token' => Str::random(48)]);
        });

        Schema::create('newsletter_campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('asunto', 191);
            $table->string('preheader', 191)->nullable();
            $table->json('bloques');                       // contenido estructurado, el HTML lo arma el servidor
            $table->string('destino', 20)->default('todos'); // todos | seleccion
            $table->json('seleccion')->nullable();         // ids de suscriptores si destino = seleccion
            $table->boolean('adjuntar_imagenes')->default(false);
            $table->string('estado', 20)->default('borrador'); // borrador | enviando | enviada | cancelada
            $table->unsignedInteger('total')->default(0);
            $table->unsignedInteger('enviados')->default(0);
            $table->unsignedInteger('fallidos')->default(0);
            $table->timestamp('iniciada_at')->nullable();
            $table->timestamp('finalizada_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('newsletter_campaign_recipients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('campaign_id')->constrained('newsletter_campaigns')->cascadeOnDelete();
            $table->foreignId('subscriber_id')->nullable()->constrained('newsletter_subscribers')->nullOnDelete();
            $table->string('email', 191);
            $table->string('estado', 20)->default('pendiente'); // pendiente | enviado | fallido | omitido
            $table->string('error', 500)->nullable();
            $table->timestamp('enviado_at')->nullable();
            $table->timestamps();
            $table->unique(['campaign_id', 'email']);
            $table->index(['campaign_id', 'estado']);
        });

        // Ajustes del newsletter (sin credenciales: el SMTP vive solo en .env)
        $now = now();
        foreach ([
            ['newsletter_enabled',          '1',                                                      'Mostrar formulario de suscripción en el sitio'],
            ['newsletter_titulo',           'Ofertas exclusivas para suscriptores',                   'Título del formulario'],
            ['newsletter_subtitulo',        'Novedades, precios especiales y lanzamientos. Sin spam.', 'Subtítulo del formulario'],
            ['newsletter_boton',            'Suscribirme',                                            'Texto del botón'],
            ['newsletter_remitente_nombre', 'Apple Boss',                                             'Nombre del remitente'],
            ['newsletter_responder_a',      '',                                                       'Correo para respuestas (Reply-To)'],
            ['newsletter_pie',              'Apple Boss · Cochabamba, Bolivia',                       'Pie de los correos'],
            ['newsletter_lote_por_minuto',  '20',                                                     'Correos enviados por minuto'],
        ] as [$clave, $valor, $etiqueta]) {
            DB::table('configuracion_tienda')->insertOrIgnore([
                'clave' => $clave, 'valor' => $valor, 'tipo' => 'texto', 'grupo' => 'newsletter', 'etiqueta' => $etiqueta,
                'created_at' => $now, 'updated_at' => $now,
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('newsletter_campaign_recipients');
        Schema::dropIfExists('newsletter_campaigns');
        Schema::table('newsletter_subscribers', function (Blueprint $table) {
            $table->dropColumn(['nombre', 'token']);
        });
        DB::table('configuracion_tienda')->where('grupo', 'newsletter')->delete();
    }
};
