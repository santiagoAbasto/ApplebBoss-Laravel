<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Los textos legales de la tienda: privacidad, términos y cookies (Tienda online → Páginas, editables desde ahí).
 *
 * Describen lo que la tienda hace hoy: si cambia el sistema (otro proveedor, otra cookie, otro medio de pago), cambia
 * el texto. Solo reemplaza los textos que siguen siendo el borrador corto del inicio; lo que ya se haya escrito en el
 * panel no se toca. Mientras tengan un «[DATO POR CONFIRMAR…]» son borradores: se ven, pero no se indexan (Page).
 * Solo usan las etiquetas que acepta el editor del panel (TextoEnriquecido): p, h2, h3, ul, li, strong, a.
 */
return new class extends Migration
{
    private const FECHA = '11 de octubre de 2026';

    public function up(): void
    {
        $vigencia = '<p><strong>Última actualización y entrada en vigor:</strong> ' . self::FECHA . '</p>';
        $titular = '<ul>'
            . '<li><strong>Titular:</strong> Apple Boss — [DATO POR CONFIRMAR: nombre completo o razón social del titular]</li>'
            . '<li><strong>NIT:</strong> [DATO POR CONFIRMAR: NIT]</li>'
            . '<li><strong>Domicilio:</strong> Av. Melchor Urquidi, entre C. Fidel Anze y Av. Julio Rodríguez, Cochabamba, Bolivia</li>'
            . '<li><strong>Contacto:</strong> <a href="mailto:ventas@appleboss.com.bo">ventas@appleboss.com.bo</a> o WhatsApp <a href="https://wa.me/59175904313">+591 75904313</a></li>'
            . '</ul>';

        $textos = [
            'privacidad' => [
                'title' => 'Política de privacidad',
                'meta'  => 'Qué datos personales trata Apple Boss al comprar, crear una cuenta o pedir un servicio, para qué, dónde quedan y cómo pedir que los corrijamos o eliminemos.',
                'sort'  => 4,
                'html'  => $vigencia . $this->privacidad($titular),
            ],
            'terminos' => [
                'title' => 'Términos y condiciones',
                'meta'  => 'Las condiciones para comprar en Apple Boss: precios en bolivianos, reserva y pago del pedido, entregas, garantía, Trade-In y servicio técnico.',
                'sort'  => 5,
                'html'  => $vigencia . $this->terminos($titular),
            ],
            'cookies' => [
                'title' => 'Política de cookies',
                'meta'  => 'Qué cookies y qué almacenamiento del navegador usa appleboss.com.bo, para qué sirve cada uno, cuánto dura y cómo cambiar tu elección.',
                'sort'  => 6,
                'html'  => $vigencia . $this->cookies(),
            ],
        ];

        foreach ($textos as $slug => $t) {
            $actual = DB::table('pages')->where('slug', $slug)->first();
            $datos = ['title' => $t['title'], 'content' => $t['html'], 'meta_description' => $t['meta'], 'updated_at' => now()];

            if (! $actual) {
                DB::table('pages')->insert($datos + ['slug' => $slug, 'active' => true, 'sort_order' => $t['sort'], 'created_at' => now()]);
            } elseif (mb_strlen(strip_tags((string) $actual->content)) < 1500) {
                // Todavía es el borrador corto del inicio: se reemplaza. Un texto ya trabajado en el panel no se toca.
                DB::table('pages')->where('id', $actual->id)->update($datos);
            }
        }
    }

    public function down(): void
    {
        // Los textos quedan: borrarlos dejaría a la tienda sin política de privacidad.
    }

    private function privacidad(string $titular): string
    {
        return <<<HTML
<p>Esta política explica qué datos personales trata la tienda appleboss.com.bo, para qué, dónde quedan, quién los ve y cómo pedir que los corrijamos o eliminemos. Describe lo que la tienda hace hoy; si eso cambia, actualizamos el texto y su fecha.</p>
<h2>Quién es responsable</h2>
{$titular}
<h2>Si solo navegas</h2>
<p>No hace falta darnos ningún dato para recorrer la tienda, ver precios o comparar equipos. Mientras navegas registramos solo las estadísticas propias que se explican más abajo, sin cookies. Si la tienda usa Google Analytics o Microsoft Clarity, solo se cargan si aceptas el aviso de cookies.</p>
<h2>Datos que nos das</h2>
<h3>Al comprar</h3>
<ul>
<li><strong>Qué pedimos:</strong> nombre, correo, teléfono o WhatsApp, cómo quieres recibir el pedido y el medio de pago. Para un envío o un delivery, además, la dirección, la referencia, quién recibe y su teléfono; para el delivery en Cochabamba, el punto que marcas en el mapa (si lo permites, el navegador te ubica para marcarlo más rápido; esa ubicación no se guarda por separado).</li>
<li><strong>Para qué:</strong> reservarte el equipo, confirmar el pago, entregarte el pedido, emitir la nota de venta y atender la garantía.</li>
<li><strong>Comprobante de pago:</strong> si pagas por transferencia, QR o Binance y subes la captura, la guardamos en un espacio privado del servidor (no se publica) para verificar el pago.</li>
<li><strong>Datos del equipo:</strong> el IMEI y el número de serie de la unidad que compraste aparecen en tu pedido recién cuando el pago está confirmado.</li>
</ul>
<h3>Tu cuenta</h3>
<ul>
<li>Si creas una cuenta guardamos tu nombre, tu correo, tu teléfono y tu contraseña, que no se guarda en claro sino como un código cifrado (hash).</li>
<li>Si entras con Google, Google nos comparte tu nombre, tu correo y un identificador de tu cuenta de Google. No recibimos tu contraseña de Google.</li>
<li>La cuenta sirve para ver tus pedidos y calificar tus compras.</li>
</ul>
<h3>Reseñas</h3>
<p>Si calificas un pedido que recibiste, guardamos tu calificación y tu comentario. Si lo publicamos, aparece con tu nombre y la inicial de tu apellido, nunca con tu nombre completo ni con datos del pedido. También mostramos reseñas que la tienda recibió en su perfil de Google; esas las escribiste en Google y las rige su política.</p>
<h3>Trade-In y servicio técnico</h3>
<ul>
<li><strong>Trade-In:</strong> tus datos de contacto, tu ciudad y lo que nos cuentas de tu equipo, para cotizarlo. Mientras llenas el formulario, el borrador queda guardado en tu propio navegador (ver la política de cookies) hasta que lo envías.</li>
<li><strong>Solicitud de servicio técnico:</strong> tus datos de contacto, el equipo y la falla, para responderte con un diagnóstico.</li>
<li><strong>Equipos que dejas en la tienda:</strong> registramos tus datos, el equipo, su estado al recibirlo y, si nos lo das, el código de desbloqueo, que usamos solo para revisarlo y repararlo.</li>
</ul>
<h3>Newsletter</h3>
<p>Solo tu correo, para enviarte novedades y ofertas. Cada correo trae un enlace para darte de baja sin preguntas. Hoy no pedimos confirmar la suscripción desde tu casilla: si recibiste un correo nuestro sin haberte suscrito, usa el enlace de baja o escríbenos y eliminamos tu correo.</p>
<h2>Estadísticas propias</h2>
<p>Para saber qué partes de la tienda sirven usamos una medición propia, sin cookies y sin guardar nada en tu dispositivo. Los registros quedan en nuestra base de datos.</p>
<ul>
<li><strong>Qué se registra:</strong> la página visitada y algunas acciones (agregar un producto al carrito, buscar, tocar un botón de WhatsApp, hacer un pedido o enviar una solicitud). De un pedido o una solicitud solo queda que existió y el medio de pago o el tipo de equipo, nunca quién lo hizo. Lo que escribes en el buscador se guarda solo si no parece un dato personal (un correo o un número de teléfono).</li>
<li><strong>Con qué contexto:</strong> país (si lo informa nuestro proveedor de red), tipo de dispositivo, navegador, idioma y el sitio desde el que llegaste (solo su dominio).</li>
<li><strong>Identificador seudónimo:</strong> para contar visitantes sin repetirlos, el servidor calcula con tu dirección IP y los datos de tu navegador un identificador que cambia todos los días. No guardamos la IP ni el navegador en claro. Ese identificador no nos permite saber quién eres y no lo relacionamos con tus pedidos ni con tu cuenta.</li>
</ul>
<h2>Correos que enviamos</h2>
<p>Los avisos de tu pedido (recibido, pago confirmado, en camino), las respuestas a tus consultas y, si te suscribiste, el newsletter. No agregamos píxeles de seguimiento a los correos.</p>
<h2>WhatsApp y enlaces externos</h2>
<p>Los botones de WhatsApp son enlaces: abren WhatsApp con un mensaje sugerido. La tienda no le envía ningún dato tuyo a WhatsApp; lo que escribas ahí queda sujeto a las condiciones de ese servicio. Lo mismo vale para nuestras redes sociales.</p>
<h2>Dónde quedan los datos y quién accede</h2>
<ul>
<li>Todo lo que cargas en la tienda se guarda en nuestra base de datos, alojada en un servidor privado de Hostinger ubicado en Estados Unidos. Es decir: tus datos se almacenan fuera de Bolivia.</li>
<li>Acceden solo las personas del equipo de Apple Boss con cuenta en el panel, y cada una ve únicamente la parte que su rol necesita (ventas, pedidos, servicio técnico).</li>
</ul>
<h2>Con quién compartimos datos</h2>
<p>No vendemos tus datos ni los cedemos a terceros con fines comerciales. Solo intervienen los proveedores necesarios para que la tienda funcione, y cada uno recibe lo mínimo:</p>
<ul>
<li><strong>Alojamiento:</strong> Hostinger aloja la tienda y la base de datos en Estados Unidos.</li>
<li><strong>Red y seguridad:</strong> Cloudflare recibe cada visita antes de que llegue a nuestro servidor, para protegerla y acelerarla. Procesa tu dirección IP y puede crear cookies técnicas de seguridad. También mide de forma agregada la velocidad de la tienda.</li>
<li><strong>Correo:</strong> nuestras casillas y el envío de correos de la tienda son de Google Workspace. Google recibe el correo del destinatario, el asunto y el contenido de cada mensaje.</li>
<li><strong>Entrar con Google:</strong> solo si eliges esa opción, Google interviene en el inicio de sesión.</li>
<li><strong>Pagos:</strong> si pagas por transferencia o QR, el pago lo procesa tu banco; si pagas con Binance, lo procesa Binance. Nosotros no recibimos ni guardamos datos de tarjetas ni contraseñas bancarias.</li>
<li><strong>Envíos:</strong> para un envío al interior, la empresa de transporte recibe el nombre, el teléfono y la dirección de quien recibe.</li>
<li><strong>Mapas y tipografías:</strong> el mapa de nuestra ubicación lo muestra Google Maps y el mapa del delivery usa OpenStreetMap; las tipografías se cargan desde Bunny Fonts y Google Fonts. Para mostrarlos, esos servicios reciben tu dirección IP.</li>
<li><strong>Google Analytics y Microsoft Clarity:</strong> solo si la tienda los activa y tú aceptas las cookies de analítica; si no, no se cargan. Los configuramos sin funciones publicitarias. El detalle está en la <a href="/paginas/cookies">política de cookies</a>.</li>
</ul>
<p>Si incorporamos otro proveedor que reciba datos personales, lo agregamos a esta lista.</p>
<h2>Cuánto tiempo los conservamos</h2>
<ul>
<li><strong>Pedidos, ventas y comprobantes:</strong> el tiempo que nos exige la normativa comercial y tributaria de Bolivia, al menos cinco años desde la venta, y lo necesario para atender la garantía.</li>
<li><strong>Cuenta:</strong> mientras la tengas. Si pides eliminarla, borramos tus datos de la cuenta, salvo lo que la ley nos obliga a conservar de tus compras.</li>
<li><strong>Pedidos sin pagar:</strong> se cancelan solos a las dos horas; el registro queda como pedido cancelado.</li>
<li><strong>Solicitudes de Trade-In y de servicio técnico:</strong> mientras dure la atención y luego como historial del servicio.</li>
<li><strong>Newsletter:</strong> mientras sigas suscrito.</li>
<li><strong>Estadísticas propias:</strong> 14 meses; se borran solas.</li>
<li><strong>Sesión en la tienda:</strong> el registro de la sesión (con la dirección IP y el navegador, como lo guarda cualquier sesión web) se elimina al vencer, a las dos horas sin uso.</li>
</ul>
<h2>Tus derechos</h2>
<p>Puedes pedirnos en cualquier momento:</p>
<ul>
<li><strong>Acceso:</strong> saber qué datos tuyos tenemos y recibir una copia.</li>
<li><strong>Corrección:</strong> que corrijamos un dato equivocado.</li>
<li><strong>Eliminación:</strong> que borremos tus datos, salvo lo que la ley nos obligue a conservar.</li>
<li><strong>Retirar tu consentimiento:</strong> que dejemos de usar tus datos para algo que aceptaste, como el newsletter o las cookies de analítica.</li>
</ul>
<p>Escríbenos a <a href="mailto:ventas@appleboss.com.bo">ventas@appleboss.com.bo</a> desde el mismo correo con el que compraste o te registraste, para poder ubicar tus datos. Te respondemos en un máximo de 15 días hábiles. Si el caso requiere más tiempo, te avisamos antes, te explicamos el motivo y te damos una fecha, que no supera otros 10 días hábiles.</p>
<h2>Seguridad</h2>
<ul>
<li>La tienda se sirve solo por conexión cifrada (HTTPS).</li>
<li>Las contraseñas se guardan como hash, nunca en claro, y la sesión usa una cookie que el código de la página no puede leer.</li>
<li>El panel del equipo está separado de la tienda y cada persona entra con su propio usuario.</li>
</ul>
<p>Aun así, ningún sistema es infalible y no podemos garantizar una seguridad absoluta.</p>
<h2>Cambios en esta política</h2>
<p>Si cambia lo que hace la tienda o cambia esta política, publicamos la nueva versión en esta página y actualizamos la fecha del inicio.</p>
HTML;
    }

    private function terminos(string $titular): string
    {
        return <<<HTML
<p>Estos términos regulan el uso de la tienda appleboss.com.bo y las compras que hagas en ella. Si la usas, los aceptas; si no estás de acuerdo, te pedimos que no la uses.</p>
<h2>Quién opera la tienda</h2>
{$titular}
<h2>Uso de la tienda</h2>
<p>Puedes usar la tienda para informarte, comparar equipos, comprar y pedir un servicio. No está permitido:</p>
<ul>
<li>intentar entrar al panel del equipo o a datos que no son tuyos;</li>
<li>hacer pedidos o enviar formularios de forma automatizada, con datos falsos o con datos de otra persona sin su permiso;</li>
<li>interferir con el funcionamiento de la tienda.</li>
</ul>
<h2>Productos</h2>
<ul>
<li>Cada producto indica si es nuevo o seminuevo. En un seminuevo publicamos su estado y, cuando corresponde, la salud de la batería.</li>
<li>La tienda muestra el stock real: lo que se vende deja de publicarse. Las fotos de un modelo pueden ser de referencia; la unidad exacta es la que se describe en su publicación.</li>
<li>iPhone, iPad, Mac, Apple Watch, AirPods y Apple son marcas de Apple Inc. Su mención solo identifica los productos que vendemos.</li>
</ul>
<h2>Precios y medios de pago</h2>
<ul>
<li>Los precios están en bolivianos (Bs) e incluyen lo que se cobra por el producto. El precio que vale es el que muestra el pedido al confirmarlo.</li>
<li>El equivalente en USDT es una referencia calculada con el dólar paralelo y se actualiza solo. Si pagas en USDT, el monto queda fijo al abrir la pantalla de pago y vale mientras dure la reserva.</li>
<li>Si un precio publicado tiene un error evidente, te avisamos antes de cobrar y puedes cancelar el pedido sin costo.</li>
</ul>
<h2>Pedido, reserva y pago</h2>
<ul>
<li>Al hacer el pedido te reservamos el equipo por dos horas. Si el pago no llega en ese tiempo, el pedido se cancela solo y el equipo vuelve a la tienda.</li>
<li>Un pedido se confirma cuando verificamos el pago. Si pagas por transferencia, QR o Binance, lo verificamos con el comprobante que subes; si avisaste el pago dentro del plazo, el pedido no se cancela mientras lo revisamos.</li>
<li>Si pagas al retirar en la tienda, el equipo queda apartado hasta que lo retires en el plazo que coordinemos contigo.</li>
</ul>
<h2>Entregas</h2>
<p>Puedes retirar en la tienda, recibir un envío al interior o pedir delivery en Cochabamba, en los plazos y condiciones publicados en <a href="/paginas/envios">Envíos y entrega</a>.</p>
<h2>Garantía, cambios y devoluciones</h2>
<ul>
<li>La garantía de cada producto es la que figura en su publicación y en tu nota de venta, según lo publicado en <a href="/paginas/garantia">Garantía</a>.</li>
<li>[DATO POR CONFIRMAR: política de cambios y devoluciones — en qué casos, en qué plazo y en qué estado se recibe un producto, y cómo se devuelve el dinero]</li>
</ul>
<h2>Trade-In</h2>
<p>La cotización que recibes por un equipo usado es orientativa: se basa en lo que nos cuentas y se confirma al revisar el equipo en la tienda. El valor final puede cambiar si el estado real es distinto.</p>
<h2>Servicio técnico</h2>
<p>Cada reparación se rige por la nota de servicio que firmas al dejar el equipo, con su diagnóstico, su presupuesto y su garantía. El presupuesto se aprueba antes de reparar.</p>
<h2>Tu cuenta</h2>
<p>Eres responsable de cuidar tu contraseña y de lo que se haga con tu cuenta. Si crees que alguien entró sin permiso, escríbenos.</p>
<h2>Reseñas</h2>
<p>Solo puede calificar un pedido quien lo recibió. Revisamos cada reseña antes de publicarla y no publicamos insultos, datos personales ni contenido ajeno a la compra.</p>
<h2>Propiedad intelectual</h2>
<p>El nombre y el logotipo de Apple Boss, y los textos, fotografías propias y diseño de esta tienda pertenecen a Apple Boss o se usan con permiso de sus titulares. Puedes compartir enlaces y citar fragmentos breves mencionando la fuente. Las marcas de terceros pertenecen a sus respectivos titulares.</p>
<h2>Responsabilidad</h2>
<p>Trabajamos para que la tienda esté disponible y su información sea correcta, pero no garantizamos que esté libre de errores o interrupciones. Esto no limita las responsabilidades que la ley no permite excluir ni la garantía de los productos que vendemos.</p>
<h2>Datos personales</h2>
<p>El tratamiento de tus datos se explica en la <a href="/paginas/privacidad">política de privacidad</a> y en la <a href="/paginas/cookies">política de cookies</a>.</p>
<h2>Cambios</h2>
<p>Podemos actualizar estos términos. La versión vigente es la publicada en esta página, con su fecha. Un pedido ya confirmado se rige por los términos vigentes al momento de hacerlo.</p>
<h2>Ley aplicable y jurisdicción</h2>
<p>Estos términos se rigen por las leyes del Estado Plurinacional de Bolivia. Si surge una diferencia, primero intentamos resolverla de forma directa y de buena fe: escríbenos a <a href="mailto:ventas@appleboss.com.bo">ventas@appleboss.com.bo</a>. Si no llegamos a un acuerdo, la controversia se somete a los jueces y tribunales ordinarios de la ciudad de Cochabamba, Bolivia.</p>
<p>Esto no limita los derechos que te reconoce la Ley N.º 453, General de los Derechos de las Usuarias y los Usuarios y de las Consumidoras y los Consumidores, ni tu derecho a reclamar ante la autoridad competente.</p>
HTML;
    }

    private function cookies(): string
    {
        return <<<HTML
<p>Esta página detalla qué cookies y qué almacenamiento del navegador usa appleboss.com.bo, para qué sirve cada uno, cuánto dura y cuándo se crea.</p>
<h2>En resumen</h2>
<p>Usamos solo las cookies necesarias para que la tienda funcione (tu sesión y la seguridad de los formularios). Las de analítica de terceros, si la tienda las activa, se crean solo si aceptas el aviso. No usamos cookies de publicidad.</p>
<h2>Cookies necesarias</h2>
<ul>
<li><strong>apple_boss_session</strong> — Propia. Mantiene tu sesión mientras navegas: lo que llenas al comprar, tu cuenta si entraste, los avisos de la pantalla. Se borra a las dos horas sin uso.</li>
<li><strong>XSRF-TOKEN</strong> — Propia. Protege los formularios contra envíos falsificados desde otros sitios. Dura lo mismo que la sesión.</li>
<li><strong>remember_web_…</strong> — Propia. Mantiene tu cuenta iniciada para no pedirte la contraseña en cada visita. Se crea solo si entras con tu cuenta y dura hasta que cierres sesión o hasta unos 400 días.</li>
<li><strong>Cookies de Cloudflare</strong> (por ejemplo <strong>__cf_bm</strong>) — Las crea Cloudflare, nuestro proveedor de red, para distinguir visitas reales de tráfico automatizado. Duran alrededor de 30 minutos.</li>
</ul>
<h2>Cookies de analítica (opcionales)</h2>
<p>Solo existen si la tienda activa estas herramientas y tú pulsas «Aceptar» en el aviso:</p>
<ul>
<li><strong>_ga</strong> y <strong>_ga_&lt;ID&gt;</strong> — Google Analytics 4. Distinguen visitantes y mantienen la sesión en las estadísticas de Google. Duran hasta 2 años.</li>
<li><strong>_clck</strong> y <strong>_clsk</strong> — Microsoft Clarity. <strong>_clck</strong> guarda el identificador que Clarity te asigna y dura 1 año; <strong>_clsk</strong> une las páginas de una misma visita y dura 1 día.</li>
<li><strong>Cookies de Microsoft en sus propios dominios</strong> (como MUID, en clarity.ms y bing.com) — Las crea Microsoft al cargar Clarity. No las leemos ni las controlamos; se borran desde tu navegador.</li>
</ul>
<h2>Cookies de terceros al ver el mapa</h2>
<p>El mapa con nuestra ubicación lo muestra Google Maps. Al cargarlo, Google puede crear sus propias cookies en sus dominios, según su política de privacidad.</p>
<h2>Almacenamiento local del navegador</h2>
<p>Estos datos quedan en tu navegador y no se envían a nuestro servidor salvo cuando tú haces la acción:</p>
<ul>
<li><strong>appleboss-cart-v2</strong> — Tu carrito: qué productos agregaste. No vence; se vacía al terminar la compra.</li>
<li><strong>ab_compare</strong> — Los equipos que elegiste para comparar.</li>
<li><strong>ab-busquedas</strong> — Tus búsquedas recientes, para sugerirlas.</li>
<li><strong>ab-trade-in-borrador</strong> — El borrador del formulario de Trade-In, con los datos de contacto que ya escribiste, para no perderlos si cierras la página. Se borra al enviar el formulario.</li>
<li><strong>ab-wa-saludo</strong> (almacenamiento de sesión) — Recuerda que ya viste el saludo del botón de WhatsApp. Se borra al cerrar la pestaña.</li>
<li><strong>appleboss:consentimiento</strong> — Recuerda si aceptaste o rechazaste las cookies de analítica, para no preguntarte en cada visita.</li>
</ul>
<h2>El aviso de cookies</h2>
<p>Cuando la tienda usa analítica de terceros, en tu primera visita aparece un aviso con dos botones, «Aceptar» y «Rechazar». Ninguna herramienta de analítica se carga hasta que aceptes, y puedes seguir comprando sin elegir.</p>
<h2>Cómo cambiar tu elección</h2>
<p>Al final de esta página está el botón «Cambiar mi elección de cookies»: borra tu decisión y las cookies propias de Google Analytics y Clarity, y el aviso vuelve a preguntarte. También puedes borrar las cookies y los datos de la tienda desde la configuración de tu navegador.</p>
<h2>Estadísticas sin cookies</h2>
<p>Aparte de lo anterior, la tienda lleva estadísticas propias que no usan cookies ni guardan nada en tu dispositivo. Cómo funcionan está explicado en la <a href="/paginas/privacidad">política de privacidad</a>.</p>
<h2>Cambios</h2>
<p>Si agregamos o quitamos cookies, actualizamos esta página y su fecha.</p>
HTML;
    }
};
