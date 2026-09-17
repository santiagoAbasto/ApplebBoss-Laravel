<?php

use App\Models\Faq;
use Illuminate\Database\Migrations\Migration;

/**
 * Las preguntas de la ficha del producto, de la página de iPhone y de la de Seminuevos estaban escritas dentro del
 * código: se veían en la tienda pero no se podían editar desde el panel. Pasan a la base tal cual estaban, para que
 * el administrador sea dueño de todo lo que lee el cliente.
 */
return new class extends Migration
{
    private const PREGUNTAS = [
        'producto' => [
            ['¿Puedo ver el equipo antes de comprarlo?', 'Sí. Puedes coordinar una visita a nuestra tienda en Cochabamba para revisar el equipo en persona.'],
            ['¿Cómo funciona el proceso de reserva?', 'Al agregar al carrito y consultar por WhatsApp confirmamos disponibilidad y acordamos la entrega o recojo.'],
            ['¿Los precios incluyen todo?', 'Sí. El precio publicado es el precio final en bolivianos. No hay costos adicionales ocultos.'],
            ['¿Aceptan permuta o parte de pago?', 'En algunos casos sí. Escríbenos por WhatsApp con los detalles del equipo que tienes.'],
        ],
        'iphone' => [
            ['¿Los iPhones nuevos tienen caja original?', 'Cada publicación especifica si incluye caja, accesorios u otros. Revisa el apartado "¿Qué incluye?" en el producto.'],
            ['¿Qué es un iPhone Seminuevo?', 'Son equipos usados en buen estado, revisados por nuestro equipo técnico. El estado de batería y condición cosmética se informan en cada publicación.'],
            ['¿Qué garantía tienen?', 'La garantía varía por equipo. Está indicada en cada publicación. Los equipos nuevos pueden incluir garantía de distribuidor.'],
            ['¿Realizan envíos?', 'Consúltanos por WhatsApp para coordinar la entrega o el retiro en tienda en Cochabamba.'],
        ],
        'seminuevos' => [
            ['¿Qué diferencia hay entre Seminuevo y Open Box?', 'Un Seminuevo es un equipo usado en buen estado. Un Open Box es un equipo que fue abierto pero tiene uso mínimo o nulo, con posible faltante de accesorios originales.'],
            ['¿Los seminuevos tienen garantía?', 'Depende del equipo. La garantía está indicada en cada publicación.'],
            ['¿Puedo ver el estado de batería antes de comprar?', 'Sí. Para iPhones, el estado de batería se incluye en la publicación cuando está disponible.'],
            ['¿Puedo probarlo antes de comprarlo?', 'Puedes visitar nuestra tienda en Cochabamba para verlo en persona.'],
        ],
    ];

    public function up(): void
    {
        foreach (self::PREGUNTAS as $lugar => $preguntas) {
            // Si ya hay algo cargado en ese lugar, no se toca
            if (Faq::where('scope', $lugar)->exists()) {
                continue;
            }

            foreach ($preguntas as $i => [$pregunta, $respuesta]) {
                Faq::create([
                    'scope'      => $lugar,
                    'question'   => $pregunta,
                    'answer'     => $respuesta,
                    'active'     => true,
                    'sort_order' => $i,
                ]);
            }
        }

        // El alcance «categoria» nunca se mostró en ninguna parte
        Faq::where('scope', 'categoria')->delete();
    }

    public function down(): void
    {
        Faq::whereIn('scope', ['producto', 'iphone', 'seminuevos'])->delete();
    }
};
