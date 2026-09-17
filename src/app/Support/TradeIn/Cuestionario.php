<?php

namespace App\Support\TradeIn;

use Illuminate\Validation\Rule;

/**
 * El cuestionario de Trade-In: lo que se le pregunta al cliente según el tipo de equipo. Es la única fuente: el
 * formulario público lo recibe entero, el servidor valida con él y el panel arma el resumen, los puntos a revisar y el
 * grado sugerido con las mismas palabras. La tienda recibe equipos Apple y de otras marcas (celulares Android, laptops,
 * PC de escritorio, consolas y más): cada tipo ve solo lo que le corresponde.
 *
 * Los caminos de menú de los equipos salen de la ayuda de Apple para Latinoamérica (support.apple.com/es-lamr),
 * verificada el 2026-09-16:
 * - Condición de la batería del iPhone (101575): Configuración > Batería > Condición de la batería, «Capacidad máxima».
 * - Apple Watch (guía de watchOS apd24c6cb2dd): Configuración > Batería > Condición.
 * - Historial de piezas y servicios del iPhone (102658): Configuración > General > Información; «Original»,
 *   «Desconocida», «Sin verificar» y «Usada». Solo aparece si el iPhone tuvo una reparación (en-us/102658).
 * - Ciclos de la batería de una Mac portátil (102888): tecla Opción + menú Apple > Información del Sistema > Alimentación.
 * - Número de modelo (106343): Configuración > General > Información.
 *
 * Windows 11 (support.microsoft.com, «¿Qué versión del sistema operativo Windows tengo?», verificada el 2026-09-16):
 * Configuración > Sistema > Acerca de, con el procesador y la RAM en «Especificaciones del dispositivo». De Android no se
 * da un camino: cambia según la marca y la ayuda de Google no publica uno único.
 *
 * Niveles de una respuesta: `critico` (hay que revisarlo antes de cotizar: puede que no se reciba) y `revisar` (baja el
 * valor o hay que confirmarlo en la tienda).
 */
final class Cuestionario
{
    public const APPLE = ['iPhone', 'iPad', 'MacBook', 'Mac', 'Apple Watch', 'AirPods'];

    public const OTRAS_MARCAS = ['Celular Android', 'Laptop', 'PC de escritorio', 'Consola', 'Otro'];

    public const TIPOS = [...self::APPLE, ...self::OTRAS_MARCAS];

    public const AYUDA_TIPOS = [
        'iPhone'           => 'Cualquier modelo',
        'iPad'             => 'iPad, mini, Air o Pro',
        'MacBook'          => 'MacBook, Air o Pro',
        'Mac'              => 'iMac, Mac mini o Mac Studio',
        'Apple Watch'      => 'Cualquier serie',
        'AirPods'          => 'AirPods, Pro o Max',
        'Celular Android'  => 'Samsung, Xiaomi, Motorola y más',
        'Laptop'           => 'Windows, gamer o de trabajo',
        'PC de escritorio' => 'Gamer, armada o de marca',
        'Consola'          => 'PlayStation, Xbox o Nintendo',
        'Otro'             => 'Tablet, reloj, audífonos, cámara y más',
    ];

    /** Marcas para sugerir al escribir (se puede escribir cualquier otra). Los equipos Apple no la preguntan. */
    public const MARCAS = [
        'Celular Android'  => ['Samsung', 'Xiaomi', 'Motorola', 'Honor', 'Huawei', 'Google', 'OPPO', 'Realme', 'Infinix', 'Tecno'],
        'Laptop'           => ['Lenovo', 'HP', 'Dell', 'ASUS', 'Acer', 'MSI', 'Samsung', 'Huawei', 'Microsoft', 'Razer', 'Gigabyte'],
        'PC de escritorio' => ['Armada por partes', 'HP', 'Dell', 'Lenovo', 'ASUS', 'Acer', 'MSI'],
        'Consola'          => ['Sony PlayStation', 'Microsoft Xbox', 'Nintendo'],
        'Otro'             => [],
    ];

    public const PASOS = [
        'equipo'   => ['titulo' => 'Tu equipo', 'bajada' => 'Qué equipo es y cómo viene configurado.'],
        'cuenta'   => ['titulo' => 'Cuenta y bloqueos', 'bajada' => 'Lo primero que revisamos: que el equipo se pueda usar sin trabas.'],
        'funciona' => ['titulo' => 'Funcionamiento', 'bajada' => 'Prueba cada cosa antes de responder.'],
        'estado'   => ['titulo' => 'Estado físico', 'bajada' => 'Míralo con buena luz, también de costado.'],
        'historia' => ['titulo' => 'Batería y reparaciones', 'bajada' => 'Lo que no se ve a simple vista y cambia el valor.'],
        'contacto' => ['titulo' => 'Fotos y contacto', 'bajada' => 'Con fotos, la cotización se acerca más al valor que confirmamos en la tienda.'],
    ];

    /** Capacidades para elegir cuando el modelo no está en la base (con él, se usan las del modelo). */
    public const CAPACIDADES = [
        'iPhone'           => ['32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB', '2 TB'],
        'iPad'             => ['32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB', '2 TB'],
        'MacBook'          => ['128 GB', '256 GB', '512 GB', '1 TB', '2 TB', '4 TB', '8 TB'],
        'Mac'              => ['256 GB', '512 GB', '1 TB', '2 TB', '4 TB', '8 TB'],
        'Celular Android'  => ['32 GB', '64 GB', '128 GB', '256 GB', '512 GB', '1 TB'],
        'Laptop'           => ['128 GB', '256 GB', '512 GB', '1 TB', '2 TB', '4 TB'],
        'PC de escritorio' => ['256 GB', '512 GB', '1 TB', '2 TB', '4 TB', '8 TB'],
        'Consola'          => ['32 GB', '64 GB', '256 GB', '500 GB', '512 GB', '825 GB', '1 TB', '2 TB'],
    ];

    /** Memoria (RAM): cambia mucho el valor de una computadora o de un celular Android. */
    public const MEMORIAS = [
        'MacBook'          => ['4 GB', '8 GB', '16 GB', '18 GB', '24 GB', '32 GB', '36 GB', '48 GB', '64 GB', '96 GB', '128 GB'],
        'Mac'              => ['8 GB', '16 GB', '24 GB', '32 GB', '36 GB', '48 GB', '64 GB', '96 GB', '128 GB', '192 GB'],
        'Celular Android'  => ['2 GB', '3 GB', '4 GB', '6 GB', '8 GB', '12 GB', '16 GB'],
        'Laptop'           => ['4 GB', '8 GB', '12 GB', '16 GB', '24 GB', '32 GB', '64 GB'],
        'PC de escritorio' => ['8 GB', '16 GB', '32 GB', '64 GB', '128 GB'],
    ];

    public const ESTADOS_COMPONENTE = ['funciona' => 'Funciona', 'falla' => 'Falla', 'no_probado' => 'No lo probé'];

    /** Grado sugerido para cotizar parejo, de mejor a peor. Sale solo de lo que declaró el cliente. */
    public const GRADOS = [
        'como_nuevo' => 'Como nuevo',
        'muy_bueno'  => 'Muy buen estado',
        'bueno'      => 'Buen estado, con uso visible',
        'detalles'   => 'Con fallas o daños',
        'revisar'    => 'Revisar antes de cotizar',
    ];

    public static function preguntas(): array
    {
        $cuentaApple = ['iPhone', 'iPad', 'MacBook', 'Mac', 'Apple Watch'];
        $conPantallaApple = ['iPhone', 'iPad', 'MacBook', 'Mac', 'Apple Watch'];
        $celulares = ['iPhone', 'Celular Android'];
        $computadoras = ['Laptop', 'PC de escritorio'];
        $conBateria = [...self::APPLE, 'Celular Android', 'Laptop', 'Otro'];
        $liquido = '¿Le cayó agua u otro líquido alguna vez?';
        $noSe = ['valor' => 'no_se', 'texto' => 'No sé'];

        return [
            // ─── Tu equipo (además de marca, modelo, almacenamiento, memoria y color) ─
            [
                'id' => 'procesador', 'paso' => 'equipo', 'tipo' => 'texto', 'para' => $computadoras, 'max' => 120,
                'pregunta' => 'Procesador', 'placeholder' => 'Ej.: Intel Core i7-12700H o AMD Ryzen 7 5800H',
                'ayuda' => 'En Windows 11: Configuración > Sistema > Acerca de, en «Especificaciones del dispositivo». Si no lo encuentras, escribe «No sé».',
            ],
            [
                'id' => 'grafica', 'paso' => 'equipo', 'tipo' => 'texto', 'para' => $computadoras, 'max' => 120, 'requerida' => false,
                'pregunta' => 'Tarjeta gráfica', 'placeholder' => 'Ej.: NVIDIA GeForce RTX 4060',
                'ayuda' => 'Si no tiene una aparte, escribe «Integrada».',
            ],

            // ─── Cuenta y bloqueos ─────────────────────────────────────────────
            [
                'id' => 'cuenta_apple', 'paso' => 'cuenta', 'tipo' => 'opcion', 'para' => $cuentaApple,
                'pregunta' => '¿El equipo todavía tiene tu cuenta de Apple?',
                'ayuda' => 'Si la cuenta sigue en el equipo, hay que cerrar sesión antes de entregarlo. Al final te explicamos cómo.',
                'opciones' => [
                    ['valor' => 'cerrada', 'texto' => 'No, ya cerré sesión'],
                    ['valor' => 'mia', 'texto' => 'Sí, la mía', 'detalle' => 'Y puedo cerrar sesión antes de entregarlo'],
                    ['valor' => 'sin_clave', 'texto' => 'Sí, pero no recuerdo la contraseña', 'nivel' => 'critico', 'alerta' => 'No recuerda la contraseña de su cuenta de Apple'],
                    ['valor' => 'otra', 'texto' => 'Tiene la cuenta de otra persona', 'nivel' => 'critico', 'alerta' => 'Tiene la cuenta de Apple de otra persona'],
                ],
            ],
            [
                'id' => 'cuenta_google', 'paso' => 'cuenta', 'tipo' => 'opcion', 'para' => ['Celular Android'],
                'pregunta' => '¿El celular todavía tiene tu cuenta de Google o la de la marca?',
                'ayuda' => 'Por ejemplo, tu cuenta de Google o la de Samsung. Si sigue en el celular, hay que quitarla antes de entregarlo.',
                'opciones' => [
                    ['valor' => 'cerrada', 'texto' => 'No, ya la quité'],
                    ['valor' => 'mia', 'texto' => 'Sí, la mía', 'detalle' => 'Y puedo quitarla antes de entregarlo'],
                    ['valor' => 'sin_clave', 'texto' => 'Sí, pero no recuerdo la contraseña', 'nivel' => 'critico', 'alerta' => 'No recuerda la contraseña de su cuenta de Google o de la marca'],
                    ['valor' => 'otra', 'texto' => 'Tiene la cuenta de otra persona', 'nivel' => 'critico', 'alerta' => 'Tiene la cuenta de Google o de la marca de otra persona'],
                ],
            ],
            [
                'id' => 'bypass', 'paso' => 'cuenta', 'tipo' => 'opcion', 'para' => [...$cuentaApple, 'Celular Android'],
                'pregunta' => '¿Tiene bypass o se desbloqueó con un programa?',
                'ayuda' => 'Un bypass salta la cuenta de Apple de un dueño anterior sin quitarla. Respóndelo con sinceridad: igual lo revisamos en la tienda.',
                'ayuda_tipo' => [
                    'Celular Android' => 'Un bypass salta la cuenta de Google de un dueño anterior sin quitarla (también le dicen «quitar FRP»). Respóndelo con sinceridad: igual lo revisamos en la tienda.',
                ],
                'opciones' => [
                    ['valor' => 'no', 'texto' => 'No, nunca'],
                    ['valor' => 'si', 'texto' => 'Sí, tiene bypass', 'nivel' => 'critico', 'alerta' => 'Tiene bypass'],
                    ['valor' => 'no_se', 'texto' => 'No sé', 'detalle' => 'Por ejemplo, si lo compré usado', 'nivel' => 'revisar', 'alerta' => 'No sabe si tiene bypass'],
                ],
            ],
            [
                'id' => 'operador', 'paso' => 'cuenta', 'tipo' => 'opcion', 'para' => $celulares,
                'pregunta' => '¿Funciona con el chip de cualquier operador?',
                'ayuda' => 'Si solo toma señal con una compañía, está bloqueado a ese operador.',
                'opciones' => [
                    ['valor' => 'liberado', 'texto' => 'Sí, está liberado'],
                    ['valor' => 'bloqueado', 'texto' => 'No, solo con un operador', 'nivel' => 'revisar', 'alerta' => 'Bloqueado a un operador'],
                    ['valor' => 'no_probado', 'texto' => 'No lo probé', 'nivel' => 'revisar', 'alerta' => 'No probó si está liberado'],
                ],
            ],
            [
                'id' => 'imei', 'paso' => 'cuenta', 'tipo' => 'opcion', 'para' => $celulares,
                'pregunta' => '¿Tiene algún reporte o bloqueo de IMEI?',
                'ayuda' => 'Por ejemplo, si se reportó como perdido o robado, o si no toma señal por un bloqueo.',
                'opciones' => [
                    ['valor' => 'no', 'texto' => 'No'],
                    ['valor' => 'si', 'texto' => 'Sí', 'nivel' => 'critico', 'alerta' => 'Tiene un reporte o bloqueo de IMEI'],
                    [...$noSe, 'nivel' => 'revisar', 'alerta' => 'No sabe si tiene un bloqueo de IMEI'],
                ],
            ],
            [
                'id' => 'bloqueo_pc', 'paso' => 'cuenta', 'tipo' => 'opcion', 'para' => $computadoras,
                'pregunta' => '¿Tiene contraseña de BIOS o algún bloqueo que no puedas quitar?',
                'ayuda' => 'Por ejemplo, una contraseña al encender que no sabes o un bloqueo de quien la vendió.',
                'opciones' => [
                    ['valor' => 'no', 'texto' => 'No'],
                    ['valor' => 'si', 'texto' => 'Sí', 'nivel' => 'critico', 'alerta' => 'Tiene contraseña de BIOS o un bloqueo'],
                    [...$noSe, 'nivel' => 'revisar', 'alerta' => 'No sabe si tiene contraseña de BIOS o un bloqueo'],
                ],
            ],
            [
                'id' => 'empresa', 'paso' => 'cuenta', 'tipo' => 'opcion', 'para' => ['iPhone', 'iPad', 'MacBook', 'Mac', 'Celular Android', ...$computadoras],
                'pregunta' => '¿Es o fue un equipo de una empresa o institución?',
                'ayuda' => 'Los equipos de empresas pueden tener administración remota: la empresa tiene que liberarlo antes de venderlo.',
                'opciones' => [
                    ['valor' => 'no', 'texto' => 'No, es personal'],
                    ['valor' => 'si', 'texto' => 'Sí', 'nivel' => 'revisar', 'alerta' => 'Fue de una empresa: puede tener administración remota'],
                    [...$noSe, 'nivel' => 'revisar', 'alerta' => 'No sabe si fue de una empresa'],
                ],
            ],
            [
                'id' => 'cuenta_consola', 'paso' => 'cuenta', 'tipo' => 'opcion', 'para' => ['Consola'],
                'pregunta' => '¿Ya desvinculaste tu cuenta de la consola?',
                'ayuda' => 'Tu cuenta de PlayStation, Xbox o Nintendo. Si sigue en la consola, hay que desvincularla antes de entregarla.',
                'opciones' => [
                    ['valor' => 'cerrada', 'texto' => 'Sí, ya la desvinculé'],
                    ['valor' => 'mia', 'texto' => 'Todavía no', 'detalle' => 'La desvinculo antes de entregarla'],
                    ['valor' => 'no_puedo', 'texto' => 'No puedo desvincularla', 'detalle' => 'Es de otra persona o no recuerdo la contraseña', 'nivel' => 'critico', 'alerta' => 'No puede desvincular la cuenta de la consola'],
                ],
            ],
            [
                'id' => 'baneo', 'paso' => 'cuenta', 'tipo' => 'opcion', 'para' => ['Consola'],
                'pregunta' => '¿La consola tiene un baneo o bloqueo para jugar en línea?',
                'opciones' => [
                    ['valor' => 'no', 'texto' => 'No, juega en línea normal'],
                    ['valor' => 'si', 'texto' => 'Sí', 'nivel' => 'critico', 'alerta' => 'Tiene un baneo o bloqueo para jugar en línea'],
                    [...$noSe, 'detalle' => 'Por ejemplo, si nunca la conecté a internet', 'nivel' => 'revisar', 'alerta' => 'No sabe si tiene un baneo'],
                ],
            ],
            [
                'id' => 'modificada', 'paso' => 'cuenta', 'tipo' => 'opcion', 'para' => ['Consola'],
                'pregunta' => '¿Está modificada?',
                'ayuda' => 'Por ejemplo, con chip, con el sistema alterado o con piezas que no son de fábrica.',
                'opciones' => [
                    ['valor' => 'no', 'texto' => 'No, está de fábrica'],
                    ['valor' => 'si', 'texto' => 'Sí', 'nivel' => 'revisar', 'alerta' => 'Consola modificada'],
                    [...$noSe, 'nivel' => 'revisar', 'alerta' => 'No sabe si la consola está modificada'],
                ],
            ],
            [
                'id' => 'bloqueo_otro', 'paso' => 'cuenta', 'tipo' => 'opcion', 'para' => ['Otro'],
                'pregunta' => '¿Tiene alguna cuenta, contraseña o bloqueo que no puedas quitar?',
                'opciones' => [
                    ['valor' => 'no', 'texto' => 'No'],
                    ['valor' => 'si', 'texto' => 'Sí', 'nivel' => 'critico', 'alerta' => 'Tiene una cuenta, contraseña o bloqueo que no puede quitar'],
                    [...$noSe, 'nivel' => 'revisar', 'alerta' => 'No sabe si tiene un bloqueo'],
                ],
            ],

            // ─── Funcionamiento ────────────────────────────────────────────────
            [
                'id' => 'funcionamiento', 'paso' => 'funciona', 'tipo' => 'componentes',
                'pregunta' => '¿Qué funciona y qué no?',
                'ayuda' => 'Si no pudiste probar algo, elige «No lo probé»: es mejor que adivinar.',
                'componentes' => [
                    ['id' => 'enciende', 'texto' => 'Enciende y responde normal', 'critico' => true],
                    ['id' => 'tactil', 'texto' => 'La pantalla táctil responde en toda la superficie', 'para' => ['iPhone', 'iPad', 'Apple Watch', 'Celular Android']],
                    ['id' => 'imagen', 'texto' => 'La imagen se ve bien, sin manchas, líneas ni puntos', 'para' => [...$conPantallaApple, 'Celular Android', 'Laptop']],
                    ['id' => 'imagen', 'texto' => 'Da imagen en el monitor o la tele, sin cortes, líneas ni manchas', 'para' => ['PC de escritorio', 'Consola']],
                    ['id' => 'biometria', 'texto' => 'Face ID o Touch ID', 'para' => ['iPhone', 'iPad', 'MacBook']],
                    ['id' => 'biometria', 'texto' => 'Huella o desbloqueo facial', 'para' => ['Celular Android']],
                    ['id' => 'camaras', 'texto' => 'Cámaras traseras: enfocan y sacan fotos nítidas', 'para' => ['iPhone', 'iPad', 'Celular Android']],
                    ['id' => 'camara_frontal', 'texto' => 'Cámara frontal', 'para' => ['iPhone', 'iPad', 'MacBook', 'Mac', 'Celular Android']],
                    ['id' => 'camara_frontal', 'texto' => 'Cámara web', 'para' => ['Laptop']],
                    ['id' => 'sonido', 'texto' => 'Altavoces y micrófono', 'para' => [...$conPantallaApple, 'Celular Android', 'Laptop']],
                    ['id' => 'senal', 'texto' => 'Señal y llamadas con chip', 'para' => $celulares],
                    ['id' => 'conexiones', 'texto' => 'Wi‑Fi y Bluetooth', 'para' => [...$conPantallaApple, 'Celular Android', 'Laptop', 'Consola']],
                    ['id' => 'conexiones', 'texto' => 'Internet por cable o Wi‑Fi', 'para' => ['PC de escritorio']],
                    ['id' => 'carga', 'texto' => 'Carga correctamente', 'para' => [...$conPantallaApple, 'Celular Android', 'Laptop']],
                    ['id' => 'inalambrica', 'texto' => 'Carga inalámbrica o MagSafe', 'para' => ['iPhone']],
                    ['id' => 'botones', 'texto' => 'Botones: volumen, lateral y silencio o Acción', 'para' => ['iPhone']],
                    ['id' => 'botones_ipad', 'texto' => 'Botones de volumen y de encendido', 'para' => ['iPad', 'Celular Android']],
                    ['id' => 'corona', 'texto' => 'Digital Crown y botón lateral', 'para' => ['Apple Watch']],
                    ['id' => 'vibracion', 'texto' => 'Vibración', 'para' => $celulares],
                    ['id' => 'teclado', 'texto' => 'Todas las teclas del teclado', 'para' => ['MacBook', 'Laptop']],
                    ['id' => 'trackpad', 'texto' => 'Trackpad y clic', 'para' => ['MacBook']],
                    ['id' => 'trackpad', 'texto' => 'Touchpad y clic', 'para' => ['Laptop']],
                    ['id' => 'puertos', 'texto' => 'Puertos (USB-C, Thunderbolt o USB)', 'para' => ['MacBook', 'Mac']],
                    ['id' => 'puertos', 'texto' => 'Puertos (USB, HDMI y los demás)', 'para' => [...$computadoras, 'Consola']],
                    ['id' => 'controles', 'texto' => 'Controles: todos los botones responden y los joysticks no se mueven solos', 'para' => ['Consola']],
                    ['id' => 'ventiladores', 'texto' => 'Ventiladores sin ruidos raros', 'para' => [...$computadoras, 'Consola']],
                    ['id' => 'estabilidad', 'texto' => 'Estable con juegos o programas pesados: sin reinicios, pantallazos ni apagones', 'para' => $computadoras],
                    ['id' => 'estabilidad', 'texto' => 'Estable al jugar: sin reinicios, cuelgues ni apagones', 'para' => ['Consola']],
                    ['id' => 'sensores', 'texto' => 'Sensores de la parte de abajo (ritmo cardíaco)', 'para' => ['Apple Watch']],
                    ['id' => 'auriculares', 'texto' => 'Los dos auriculares suenan bien', 'para' => ['AirPods']],
                    ['id' => 'estuche', 'texto' => 'El estuche carga y cierra bien', 'para' => ['AirPods']],
                    ['id' => 'microfono', 'texto' => 'Micrófono en llamadas', 'para' => ['AirPods']],
                    ['id' => 'funciones', 'texto' => 'Todas sus funciones y botones responden', 'para' => ['Otro']],
                ],
            ],
            [
                'id' => 'lectora', 'paso' => 'funciona', 'tipo' => 'opcion', 'para' => ['Consola'],
                'pregunta' => '¿Cómo funciona la lectora de discos?',
                'opciones' => [
                    ['valor' => 'funciona', 'texto' => 'Lee y expulsa los discos bien'],
                    ['valor' => 'falla', 'texto' => 'Falla o no lee', 'nivel' => 'revisar', 'alerta' => 'La lectora de discos falla'],
                    ['valor' => 'sin_lectora', 'texto' => 'No tiene lectora', 'detalle' => 'Edición digital o Nintendo Switch'],
                    ['valor' => 'no_probado', 'texto' => 'No la probé', 'nivel' => 'revisar', 'alerta' => 'No probó la lectora de discos'],
                ],
            ],

            // ─── Estado físico ─────────────────────────────────────────────────
            [
                'id' => 'pantalla', 'paso' => 'estado', 'tipo' => 'opcion', 'para' => [...$conPantallaApple, 'Celular Android', 'Laptop', 'Consola', 'Otro'],
                'pregunta' => '¿Cómo está el vidrio de la pantalla?',
                'pregunta_tipo' => ['Laptop' => '¿Cómo está la pantalla?', 'Consola' => '¿Cómo está la pantalla?', 'Otro' => '¿Cómo está la pantalla?'],
                'opciones' => [
                    ['valor' => 'impecable', 'texto' => 'Impecable', 'detalle' => 'Sin rayas, ni mirándola de costado'],
                    ['valor' => 'leve', 'texto' => 'Rayas leves', 'detalle' => 'Solo se ven apagada o de costado'],
                    ['valor' => 'visible', 'texto' => 'Rayas visibles', 'detalle' => 'Se notan con la pantalla encendida'],
                    ['valor' => 'rota', 'texto' => 'Fisurada o rota', 'detalle' => 'Tiene una grieta, aunque sea pequeña', 'nivel' => 'revisar', 'alerta' => 'Pantalla fisurada o rota'],
                    ['valor' => 'sin_pantalla', 'texto' => 'No tiene pantalla', 'detalle' => 'Mac mini o Mac Studio', 'para' => ['Mac']],
                    ['valor' => 'sin_pantalla', 'texto' => 'No tiene pantalla', 'detalle' => 'PlayStation o Xbox', 'para' => ['Consola']],
                    ['valor' => 'sin_pantalla', 'texto' => 'No tiene pantalla', 'para' => ['Otro']],
                ],
            ],
            [
                'id' => 'cuerpo', 'paso' => 'estado', 'tipo' => 'opcion',
                'pregunta' => '¿Cómo están los bordes y la carcasa?',
                'pregunta_tipo' => ['AirPods' => '¿Cómo está el estuche?', 'PC de escritorio' => '¿Cómo está el gabinete?'],
                'opciones' => [
                    ['valor' => 'impecable', 'texto' => 'Impecable', 'detalle' => 'Sin marcas'],
                    ['valor' => 'leve', 'texto' => 'Marcas leves', 'detalle' => 'Roces pequeños que casi no se ven'],
                    ['valor' => 'visible', 'texto' => 'Golpes o raspones visibles', 'detalle' => 'Se notan a simple vista'],
                    ['valor' => 'deformado', 'texto' => 'Doblado, hundido o con partes rotas', 'nivel' => 'revisar', 'alerta' => 'Carcasa doblada, hundida o rota'],
                ],
            ],
            [
                'id' => 'trasera', 'paso' => 'estado', 'tipo' => 'opcion', 'para' => $celulares,
                'pregunta' => '¿Cómo está la parte de atrás?',
                'opciones' => [
                    ['valor' => 'impecable', 'texto' => 'Impecable', 'detalle' => 'Sin rayas'],
                    ['valor' => 'leve', 'texto' => 'Rayas leves', 'detalle' => 'Solo se ven de costado'],
                    ['valor' => 'visible', 'texto' => 'Rayas visibles', 'detalle' => 'Se notan a simple vista'],
                    ['valor' => 'rota', 'texto' => 'Tapa o vidrio trasero roto', 'nivel' => 'revisar', 'alerta' => 'Tapa o vidrio trasero roto'],
                ],
            ],
            [
                'id' => 'lentes', 'paso' => 'estado', 'tipo' => 'opcion', 'para' => ['iPhone', 'iPad', 'Celular Android'],
                'pregunta' => '¿Cómo están los vidrios de las cámaras?',
                'opciones' => [
                    ['valor' => 'sanos', 'texto' => 'Sin rayas ni fisuras'],
                    ['valor' => 'rayados', 'texto' => 'Rayados'],
                    ['valor' => 'rotos', 'texto' => 'Fisurados o rotos', 'nivel' => 'revisar', 'alerta' => 'Vidrio de una cámara roto'],
                ],
            ],
            [
                'id' => 'agua', 'paso' => 'estado', 'tipo' => 'opcion',
                'pregunta' => '¿Se mojó o cayó al agua alguna vez?',
                'pregunta_tipo' => ['MacBook' => $liquido, 'Mac' => $liquido, 'Laptop' => $liquido, 'PC de escritorio' => $liquido, 'Consola' => $liquido],
                'opciones' => [
                    ['valor' => 'no', 'texto' => 'No'],
                    ['valor' => 'si', 'texto' => 'Sí', 'nivel' => 'revisar', 'alerta' => 'Se mojó'],
                    [...$noSe, 'detalle' => 'Por ejemplo, si lo compré usado'],
                ],
            ],

            // ─── Batería y reparaciones ────────────────────────────────────────
            [
                'id' => 'bateria', 'paso' => 'historia', 'tipo' => 'numero', 'para' => ['iPhone', 'Apple Watch'], 'requerida' => false,
                'pregunta' => 'Capacidad máxima de la batería', 'sufijo' => '%', 'min' => 1, 'max' => 100,
                'ayuda' => 'Déjalo vacío si no la encuentras.',
                'ayuda_tipo' => [
                    'iPhone'      => 'En tu iPhone: Configuración > Batería > Condición de la batería. Copia el número de «Capacidad máxima».',
                    'Apple Watch' => 'En tu Apple Watch: Configuración > Batería > Condición.',
                ],
            ],
            [
                'id' => 'ciclos', 'paso' => 'historia', 'tipo' => 'numero', 'para' => ['MacBook'], 'requerida' => false,
                'pregunta' => 'Número de ciclos de la batería', 'sufijo' => 'ciclos', 'min' => 0, 'max' => 5000,
                'ayuda' => 'Mantén presionada la tecla Opción, haz clic en el menú Apple y elige Información del Sistema. En Hardware, selecciona Alimentación: el número está en «Información de la batería».',
            ],
            [
                'id' => 'duracion', 'paso' => 'historia', 'tipo' => 'opcion', 'para' => ['Celular Android'],
                'pregunta' => '¿Cuánto te dura la batería?',
                'opciones' => [
                    ['valor' => 'buena', 'texto' => 'Aguanta el día con uso normal'],
                    ['valor' => 'media', 'texto' => 'Hay que cargarlo más de una vez al día'],
                    ['valor' => 'mala', 'texto' => 'Dura muy poco o se apaga sola', 'nivel' => 'revisar', 'alerta' => 'La batería dura muy poco o se apaga sola'],
                    $noSe,
                ],
            ],
            [
                'id' => 'duracion', 'paso' => 'historia', 'tipo' => 'opcion', 'para' => ['Laptop'],
                'pregunta' => '¿Cuánto te dura la batería sin el cargador?',
                'opciones' => [
                    ['valor' => 'buena', 'texto' => 'Varias horas'],
                    ['valor' => 'media', 'texto' => 'Poco: hay que enchufarla seguido'],
                    ['valor' => 'mala', 'texto' => 'Casi nada o solo funciona enchufada', 'nivel' => 'revisar', 'alerta' => 'La batería casi no dura o solo funciona enchufada'],
                    $noSe,
                ],
            ],
            [
                'id' => 'piezas', 'paso' => 'historia', 'tipo' => 'opcion', 'para' => ['iPhone'],
                'pregunta' => '¿Qué dice el historial de piezas?',
                'ayuda' => 'Está en Configuración > General > Información, en «Historial de piezas y servicios». Solo aparece si el iPhone tuvo una reparación.',
                'opciones' => [
                    ['valor' => 'no_aparece', 'texto' => 'No aparece'],
                    ['valor' => 'original', 'texto' => 'Todas las piezas dicen «Original»'],
                    ['valor' => 'otra', 'texto' => 'Alguna dice «Desconocida», «Sin verificar» o «Usada»', 'nivel' => 'revisar', 'alerta' => 'Piezas desconocidas, sin verificar o usadas'],
                    ['valor' => 'no_revisado', 'texto' => 'No lo revisé', 'nivel' => 'revisar', 'alerta' => 'No revisó el historial de piezas'],
                ],
            ],
            [
                'id' => 'reparaciones', 'paso' => 'historia', 'tipo' => 'multiple',
                'pregunta' => '¿Se cambió o reparó alguna pieza?',
                'ayuda' => 'Elige todas las que correspondan.',
                'opciones' => [
                    ['valor' => 'ninguna', 'texto' => 'Nunca se reparó', 'exclusiva' => true],
                    ['valor' => 'pantalla', 'texto' => 'Pantalla', 'para' => [...$conPantallaApple, 'Celular Android', 'Laptop', 'Otro'], 'nivel' => 'revisar', 'alerta' => 'Pantalla cambiada'],
                    ['valor' => 'bateria', 'texto' => 'Batería', 'para' => $conBateria, 'nivel' => 'revisar', 'alerta' => 'Batería cambiada'],
                    ['valor' => 'camara', 'texto' => 'Cámara', 'para' => ['iPhone', 'iPad', 'Celular Android'], 'nivel' => 'revisar', 'alerta' => 'Cámara cambiada'],
                    ['valor' => 'carcasa', 'texto' => 'Carcasa, tapa o vidrio trasero', 'para' => [...$conPantallaApple, 'Celular Android', 'Laptop', 'Consola', 'Otro'], 'nivel' => 'revisar', 'alerta' => 'Carcasa, tapa o vidrio trasero cambiados'],
                    ['valor' => 'lectora', 'texto' => 'Lectora de discos', 'para' => ['Consola'], 'nivel' => 'revisar', 'alerta' => 'Lectora de discos cambiada'],
                    ['valor' => 'placa', 'texto' => 'Placa o chip', 'para' => [...$cuentaApple, 'Celular Android', 'Laptop', 'Consola'], 'nivel' => 'critico', 'alerta' => 'Placa o chip reparados'],
                    ['valor' => 'placa', 'texto' => 'Placa madre', 'para' => ['PC de escritorio'], 'nivel' => 'revisar', 'alerta' => 'Placa madre reparada'],
                    ['valor' => 'mejoras', 'texto' => 'Le cambié o mejoré piezas', 'detalle' => 'Por ejemplo, RAM, disco o tarjeta gráfica', 'para' => $computadoras],
                    ['valor' => 'otra', 'texto' => 'Otra pieza', 'nivel' => 'revisar', 'alerta' => 'Otra pieza reparada'],
                    ['valor' => 'no_se', 'texto' => 'No sé', 'detalle' => 'Lo compré usado', 'exclusiva' => true, 'nivel' => 'revisar', 'alerta' => 'No sabe si se reparó'],
                ],
            ],
            [
                'id' => 'garantia', 'paso' => 'historia', 'tipo' => 'opcion',
                'pregunta' => '¿Todavía tiene garantía?',
                'opciones' => [
                    ['valor' => 'no', 'texto' => 'No'],
                    ['valor' => 'apple', 'texto' => 'Sí, de Apple', 'para' => self::APPLE],
                    ['valor' => 'marca', 'texto' => 'Sí, de la marca', 'para' => self::OTRAS_MARCAS],
                    ['valor' => 'tienda', 'texto' => 'Sí, de la tienda donde lo compré'],
                    $noSe,
                ],
            ],
            [
                'id' => 'controles', 'paso' => 'historia', 'tipo' => 'numero', 'para' => ['Consola'], 'requerida' => false,
                'pregunta' => '¿Cuántos controles entregas?', 'sufijo' => 'controles', 'min' => 0, 'max' => 8,
                'ayuda' => 'Déjalo vacío si no entregas ninguno.',
            ],
            [
                'id' => 'incluye', 'paso' => 'historia', 'tipo' => 'multiple',
                'pregunta' => '¿Qué entregas junto con el equipo?',
                'ayuda' => 'Elige todo lo que traes.',
                'opciones' => [
                    ['valor' => 'caja', 'texto' => 'Caja original'],
                    ['valor' => 'cable', 'texto' => 'Cable de carga', 'para' => [...self::APPLE, 'Celular Android', 'Otro']],
                    ['valor' => 'cargador', 'texto' => 'Adaptador de corriente', 'para' => [...$conPantallaApple, 'Celular Android', 'Otro']],
                    ['valor' => 'cargador', 'texto' => 'Cargador', 'para' => ['Laptop']],
                    ['valor' => 'cables', 'texto' => 'Cables de corriente y HDMI', 'para' => ['Consola']],
                    ['valor' => 'cables', 'texto' => 'Cable de corriente', 'para' => ['PC de escritorio']],
                    ['valor' => 'perifericos', 'texto' => 'Monitor, teclado o mouse', 'para' => ['PC de escritorio']],
                    ['valor' => 'juegos', 'texto' => 'Juegos en disco o cartucho', 'para' => ['Consola']],
                    ['valor' => 'correa', 'texto' => 'Correa', 'para' => ['Apple Watch']],
                    ['valor' => 'factura', 'texto' => 'Factura o comprobante de compra'],
                    ['valor' => 'solo', 'texto' => 'Solo el equipo', 'exclusiva' => true],
                ],
            ],
        ];
    }

    /** ¿La pregunta, la opción o la pieza corresponde a este tipo de equipo? */
    public static function aplica(array $item, string $tipo): bool
    {
        return empty($item['para']) || in_array($tipo, $item['para'], true);
    }

    /** Las preguntas de un tipo de equipo, con solo sus opciones y sus piezas. */
    public static function paraTipo(string $tipo): array
    {
        return collect(self::preguntas())
            ->filter(fn (array $p) => self::aplica($p, $tipo))
            ->map(function (array $p) use ($tipo) {
                if (isset($p['opciones'])) {
                    $p['opciones'] = array_values(array_map(
                        fn (array $o) => array_diff_key($o, ['para' => 1]),
                        array_filter($p['opciones'], fn (array $o) => self::aplica($o, $tipo)),
                    ));
                }
                if (isset($p['componentes'])) {
                    $p['componentes'] = array_values(array_map(
                        fn (array $c) => array_diff_key($c, ['para' => 1]),
                        array_filter($p['componentes'], fn (array $c) => self::aplica($c, $tipo)),
                    ));
                }
                $p['pregunta'] = $p['pregunta_tipo'][$tipo] ?? $p['pregunta'];
                $p['ayuda'] = $p['ayuda_tipo'][$tipo] ?? ($p['ayuda'] ?? null);
                $p['requerida'] = $p['requerida'] ?? true;

                return array_diff_key($p, ['para' => 1, 'pregunta_tipo' => 1, 'ayuda_tipo' => 1]);
            })
            ->values()
            ->all();
    }

    /** Lo que necesita el formulario público (sin los niveles internos). */
    public static function paraFormulario(): array
    {
        $publica = function (array $p) {
            if (isset($p['opciones'])) {
                $p['opciones'] = array_map(fn (array $o) => array_diff_key($o, ['nivel' => 1, 'alerta' => 1]), $p['opciones']);
            }
            if (isset($p['componentes'])) {
                $p['componentes'] = array_map(fn (array $c) => array_diff_key($c, ['critico' => 1]), $p['componentes']);
            }

            return $p;
        };

        return [
            'tipos'       => array_map(fn (string $t) => [
                'valor'   => $t,
                'detalle' => self::AYUDA_TIPOS[$t],
                'grupo'   => in_array($t, self::APPLE, true) ? 'Apple' : 'Otras marcas',
            ], self::TIPOS),
            'marcas'      => self::MARCAS,
            'pasos'       => collect(self::PASOS)->map(fn (array $p, string $id) => ['id' => $id] + $p)->values()->all(),
            'preguntas'   => collect(self::TIPOS)->mapWithKeys(fn (string $t) => [$t => array_map($publica, self::paraTipo($t))])->all(),
            'estados'     => self::ESTADOS_COMPONENTE,
            'capacidades' => self::CAPACIDADES,
            'memorias'    => self::MEMORIAS,
        ];
    }

    public static function reglas(string $tipo): array
    {
        $reglas = ['respuestas' => ['required', 'array']];

        foreach (self::paraTipo($tipo) as $p) {
            $clave = "respuestas.{$p['id']}";
            $valores = array_column($p['opciones'] ?? [], 'valor');

            switch ($p['tipo']) {
                case 'opcion':
                    $reglas[$clave] = [$p['requerida'] ? 'required' : 'nullable', Rule::in($valores)];
                    break;
                case 'multiple':
                    $reglas[$clave] = [$p['requerida'] ? 'required' : 'nullable', 'array', 'min:1'];
                    $reglas["{$clave}.*"] = [Rule::in($valores)];
                    break;
                case 'numero':
                    $reglas[$clave] = ['nullable', 'integer', "min:{$p['min']}", "max:{$p['max']}"];
                    break;
                case 'texto':
                    $reglas[$clave] = [$p['requerida'] ? 'required' : 'nullable', 'string', "max:{$p['max']}"];
                    break;
                case 'componentes':
                    $reglas[$clave] = ['required', 'array'];
                    foreach ($p['componentes'] as $c) {
                        $reglas["{$clave}.{$c['id']}"] = ['required', Rule::in(array_keys(self::ESTADOS_COMPONENTE))];
                    }
                    break;
            }
        }

        return $reglas;
    }

    public static function mensajes(string $tipo): array
    {
        $mensajes = ['respuestas.required' => 'Responde las preguntas sobre tu equipo.'];

        foreach (self::paraTipo($tipo) as $p) {
            $clave = "respuestas.{$p['id']}";
            $mensajes["{$clave}.required"] = $p['tipo'] === 'texto' ? "Escribe: {$p['pregunta']}." : "Responde: {$p['pregunta']}";
            if ($p['tipo'] === 'texto') {
                $mensajes["{$clave}.max"] = "{$p['pregunta']}: puede tener hasta {$p['max']} letras.";
            }
            $mensajes["{$clave}.in"] = "Elige una de las opciones de: {$p['pregunta']}";
            $mensajes["{$clave}.*.in"] = "Elige una de las opciones de: {$p['pregunta']}";
            if ($p['tipo'] === 'numero') {
                $mensajes["{$clave}.integer"] = "{$p['pregunta']}: escribe solo el número.";
                $mensajes["{$clave}.min"] = "{$p['pregunta']}: el número no puede ser menor a {$p['min']}.";
                $mensajes["{$clave}.max"] = "{$p['pregunta']}: el número no puede ser mayor a {$p['max']}.";
            }
            foreach ($p['componentes'] ?? [] as $c) {
                $mensajes["{$clave}.{$c['id']}.required"] = "Dinos si funciona: {$c['texto']}.";
                $mensajes["{$clave}.{$c['id']}.in"] = "Dinos si funciona: {$c['texto']}.";
            }
        }

        return $mensajes;
    }

    /** Deja solo lo que corresponde al tipo. En las múltiples, una opción exclusiva («Nunca se reparó») no va con otras. */
    public static function limpiar(string $tipo, array $respuestas): array
    {
        $limpias = [];

        foreach (self::paraTipo($tipo) as $p) {
            $valor = $respuestas[$p['id']] ?? null;

            switch ($p['tipo']) {
                case 'multiple':
                    $elegidas = array_values(array_intersect(array_column($p['opciones'], 'valor'), (array) $valor));
                    $exclusivas = array_column(array_filter($p['opciones'], fn (array $o) => $o['exclusiva'] ?? false), 'valor');
                    $otras = array_values(array_diff($elegidas, $exclusivas));
                    $valor = $otras ?: array_slice(array_values(array_intersect($elegidas, $exclusivas)), 0, 1);
                    break;
                case 'componentes':
                    $valor = collect($p['componentes'])
                        ->mapWithKeys(fn (array $c) => [$c['id'] => $valor[$c['id']] ?? 'no_probado'])
                        ->all();
                    break;
                case 'numero':
                    $valor = $valor === null || $valor === '' ? null : (int) $valor;
                    break;
                case 'texto':
                    $valor = trim(preg_replace('/\s+/u', ' ', strip_tags((string) $valor))) ?: null;
                    break;
            }

            if ($valor !== null && $valor !== []) {
                $limpias[$p['id']] = $valor;
            }
        }

        return $limpias;
    }

    /** Lo que baja el valor o hay que confirmar en la tienda, lo más grave primero. */
    public static function alertas(string $tipo, array $respuestas): array
    {
        $alertas = [];

        foreach (self::paraTipo($tipo) as $p) {
            $valor = $respuestas[$p['id']] ?? null;
            if ($valor === null) {
                continue;
            }

            foreach ($p['opciones'] ?? [] as $o) {
                if (isset($o['nivel']) && in_array($o['valor'], (array) $valor, true)) {
                    $alertas[] = ['nivel' => $o['nivel'], 'texto' => $o['alerta'] ?? $o['texto']];
                }
            }

            foreach ($p['componentes'] ?? [] as $c) {
                $estado = $valor[$c['id']] ?? null;
                if ($estado === 'falla') {
                    $alertas[] = ['nivel' => ($c['critico'] ?? false) ? 'critico' : 'revisar', 'texto' => "Falla: {$c['texto']}"];
                } elseif ($estado === 'no_probado') {
                    $alertas[] = ['nivel' => 'info', 'texto' => "Sin probar: {$c['texto']}"];
                }
            }

            if ($p['id'] === 'bateria' && is_int($valor) && $valor < 80) {
                $alertas[] = ['nivel' => 'revisar', 'texto' => "Batería al {$valor} %"];
            }
        }

        $orden = ['critico' => 0, 'revisar' => 1, 'info' => 2];
        usort($alertas, fn (array $a, array $b) => $orden[$a['nivel']] <=> $orden[$b['nivel']]);

        return $alertas;
    }

    /** El grado que sugieren las respuestas. El valor final lo da la revisión del equipo. */
    public static function grado(string $tipo, array $respuestas): string
    {
        if (collect(self::alertas($tipo, $respuestas))->contains('nivel', 'critico')) {
            return 'revisar';
        }

        $r = $respuestas;
        $bateria = is_int($r['bateria'] ?? null) ? $r['bateria'] : null;
        $algunoEs = fn (array $valores) => collect(['pantalla', 'cuerpo', 'trasera', 'lentes'])
            ->contains(fn (string $id) => in_array($r[$id] ?? null, $valores, true));

        $duracion = $r['duracion'] ?? null;

        if (in_array('falla', $r['funcionamiento'] ?? [], true) || ($r['lectora'] ?? null) === 'falla' || $algunoEs(['rota', 'rotos', 'deformado'])) {
            return 'detalles';
        }
        if ($algunoEs(['visible', 'rayados']) || ($bateria !== null && $bateria < 80) || $duracion === 'mala') {
            return 'bueno';
        }
        if ($algunoEs(['leve']) || ($bateria !== null && $bateria < 90) || $duracion === 'media') {
            return 'muy_bueno';
        }

        return 'como_nuevo';
    }

    /** Las respuestas en palabras, por paso, para el panel. */
    public static function resumen(string $tipo, array $respuestas): array
    {
        $pasos = [];

        foreach (self::paraTipo($tipo) as $p) {
            $valor = $respuestas[$p['id']] ?? null;

            if ($p['tipo'] === 'componentes') {
                $filas = array_map(function (array $c) use ($valor) {
                    $estado = $valor[$c['id']] ?? null;

                    return [
                        'pregunta'  => $c['texto'],
                        'respuesta' => self::ESTADOS_COMPONENTE[$estado] ?? 'Sin responder',
                        'nivel'     => match ($estado) {
                            'funciona' => 'ok',
                            'falla'    => ($c['critico'] ?? false) ? 'critico' : 'revisar',
                            default    => 'info',
                        },
                    ];
                }, $p['componentes']);
            } else {
                $filas = [[
                    'pregunta'  => $p['pregunta'],
                    'respuesta' => self::textoDe($p, $valor),
                    'nivel'     => self::nivelDe($p, $valor),
                ]];
            }

            $pasos[$p['paso']] ??= ['id' => $p['paso'], 'titulo' => self::PASOS[$p['paso']]['titulo'], 'filas' => []];
            array_push($pasos[$p['paso']]['filas'], ...$filas);
        }

        return array_values($pasos);
    }

    private static function textoDe(array $p, mixed $valor): string
    {
        if ($valor === null || $valor === []) {
            return in_array($p['tipo'], ['numero', 'texto'], true) ? 'No lo indicó' : 'Sin responder';
        }

        if ($p['tipo'] === 'numero') {
            return $valor . ($p['sufijo'] === '%' ? ' %' : " {$p['sufijo']}");
        }
        if ($p['tipo'] === 'texto') {
            return (string) $valor;
        }

        $textos = array_column($p['opciones'], 'texto', 'valor');

        return collect((array) $valor)->map(fn ($v) => $textos[$v] ?? $v)->implode(' · ');
    }

    private static function nivelDe(array $p, mixed $valor): ?string
    {
        if ($p['id'] === 'bateria') {
            return is_int($valor) && $valor < 80 ? 'revisar' : null;
        }

        $niveles = collect($p['opciones'] ?? [])
            ->filter(fn (array $o) => isset($o['nivel']) && in_array($o['valor'], (array) $valor, true))
            ->pluck('nivel');

        return $niveles->contains('critico') ? 'critico' : ($niveles->contains('revisar') ? 'revisar' : null);
    }
}
