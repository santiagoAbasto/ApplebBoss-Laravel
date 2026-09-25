<?php

use App\Models\Faq;
use App\Models\StoreService;
use Database\Seeders\FaqSeeder;
use Illuminate\Database\Migrations\Migration;

/**
 * Las preguntas frecuentes y la tarjeta de envíos, al día con las tres entregas y Binance.
 *
 * Solo se reemplaza lo que sigue tal cual lo dejó la migración anterior: si alguien ya lo
 * editó desde el panel, se respeta.
 */
return new class extends Migration
{
    private const ANTERIORES = [
        '¿Hacen envíos a otras ciudades?' => 'Enviamos a Cochabamba, La Paz, Santa Cruz, Oruro, Sucre, Potosí, Tarija, Beni y Pando. Al elegir tu departamento en el checkout ves el costo y el plazo exactos antes de confirmar: en Cochabamba el envío no tiene costo y llega en 1 día hábil. Si no te aparece la opción de envío, escríbenos por WhatsApp y lo coordinamos.',
        '¿Qué métodos de pago aceptan?'   => 'Las que veas en el checkout, con el total ya calculado. Puedes pagar al retirar en nuestra tienda de Cochabamba, o por transferencia o QR: en ese caso te mostramos los datos, subes tu comprobante y confirmamos el pedido cuando verificamos el pago. Nunca te pedimos datos de tarjeta por WhatsApp ni por correo.',
    ];

    private const TARJETA_ANTERIOR = 'Enviamos a nueve departamentos. El costo y el plazo se calculan en el checkout, con tu departamento, antes de que confirmes.';
    private const TARJETA_NUEVA    = 'Envío sin costo por courier a los otros ocho departamentos y delivery propio en Cochabamba el mismo día.';

    public function up(): void
    {
        $nuevas = array_column(FaqSeeder::PREGUNTAS, 'answer', 'question');

        foreach (self::ANTERIORES as $pregunta => $anterior) {
            Faq::where('scope', 'general')->where('question', $pregunta)->where('answer', $anterior)
                ->update(['answer' => $nuevas[$pregunta]]);
        }

        StoreService::where('title', 'Envíos dentro de Bolivia')->where('description', self::TARJETA_ANTERIOR)
            ->update(['description' => self::TARJETA_NUEVA]);
    }

    public function down(): void
    {
        $nuevas = array_column(FaqSeeder::PREGUNTAS, 'answer', 'question');

        foreach (self::ANTERIORES as $pregunta => $anterior) {
            Faq::where('scope', 'general')->where('question', $pregunta)->where('answer', $nuevas[$pregunta])
                ->update(['answer' => $anterior]);
        }

        StoreService::where('title', 'Envíos dentro de Bolivia')->where('description', self::TARJETA_NUEVA)
            ->update(['description' => self::TARJETA_ANTERIOR]);
    }
};
