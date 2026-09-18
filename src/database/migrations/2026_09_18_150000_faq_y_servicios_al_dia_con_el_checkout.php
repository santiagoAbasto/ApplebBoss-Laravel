<?php

use App\Models\Faq;
use App\Models\StoreService;
use Database\Seeders\FaqSeeder;
use Illuminate\Database\Migrations\Migration;

/**
 * Pone las preguntas frecuentes y la tarjeta de envíos al día con la tienda en línea.
 *
 * Antes decían «escríbenos por WhatsApp para el envío» y «aceptamos transferencias y
 * efectivo», que era verdad cuando la compra se cerraba por WhatsApp. Ahora hay checkout,
 * envío a nueve departamentos con costo y plazo propios, y seguimiento con código.
 *
 * Regla de esta migración: **solo cambia lo que siga teniendo el texto original**. Si la
 * tienda ya editó una respuesta desde el panel, se respeta y no se toca.
 */
return new class extends Migration
{
    /** Respuestas originales que esta migración puede reemplazar sin pisar trabajo ajeno. */
    private const RESPUESTAS_ORIGINALES = [
        '¿Puedo ver el equipo antes de comprarlo?' => 'Por supuesto. Atendemos de forma presencial en Cochabamba. Coordinamos una visita por WhatsApp.',
        '¿Hacen envíos a otras ciudades?'          => 'Escríbenos por WhatsApp y te contamos las opciones de envío disponibles para tu ciudad.',
        '¿Qué métodos de pago aceptan?'            => 'Aceptamos transferencias bancarias y efectivo. Confirmamos el pago antes de reservar el equipo.',
        '¿Puedo reservar un equipo?'               => 'Sí, una vez confirmado el pago o una señal, el equipo queda reservado a tu nombre hasta coordinar la entrega.',
    ];

    public function up(): void
    {
        foreach (FaqSeeder::PREGUNTAS as $orden => $nueva) {
            $fila = Faq::where('scope', 'general')->where('question', $nueva['question'])->first();

            // Pregunta nueva: se agrega
            if (! $fila) {
                Faq::create($nueva + ['scope' => 'general', 'active' => true, 'sort_order' => $orden]);
                continue;
            }

            // El orden se reacomoda siempre: no es contenido escrito por nadie
            $fila->sort_order = $orden;

            // La respuesta, solo si sigue siendo la original
            $original = self::RESPUESTAS_ORIGINALES[$nueva['question']] ?? null;
            if ($original !== null && $fila->answer === $original) {
                $fila->answer = $nueva['answer'];
            }

            $fila->save();
        }

        // La tarjeta de «Envíos a coordinar» ya no describe lo que hace la tienda
        StoreService::where('title', 'Envíos a coordinar')
            ->where('description', 'Si estás en otra ciudad, coordinamos contigo por WhatsApp cómo hacerte llegar tu equipo.')
            ->update([
                'icon'        => 'truck',
                'title'       => 'Envíos dentro de Bolivia',
                'description' => 'Enviamos a nueve departamentos. El costo y el plazo se calculan en el checkout, con tu departamento, antes de que confirmes.',
            ]);
    }

    public function down(): void
    {
        // Contenido: se revierten solo las respuestas que esta migración reemplazó
        foreach (self::RESPUESTAS_ORIGINALES as $pregunta => $original) {
            Faq::where('scope', 'general')->where('question', $pregunta)->update(['answer' => $original]);
        }

        Faq::where('scope', 'general')->whereIn('question', [
            '¿Cómo compro por la web?',
            '¿Cuánto tiempo me guardan el equipo?',
            '¿Cuándo me dan el IMEI y el número de serie?',
            '¿Cómo sigo mi pedido?',
        ])->delete();

        StoreService::where('title', 'Envíos dentro de Bolivia')->update([
            'icon'        => 'package',
            'title'       => 'Envíos a coordinar',
            'description' => 'Si estás en otra ciudad, coordinamos contigo por WhatsApp cómo hacerte llegar tu equipo.',
        ]);
    }
};
