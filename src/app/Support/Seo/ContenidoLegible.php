<?php

namespace App\Support\Seo;

use App\Support\FichaTecnica\Etiquetas;
use App\Support\TextoEnriquecido;

/**
 * El contenido de cada página pública escrito en HTML simple, sin JavaScript.
 *
 * La tienda es una SPA: el servidor entrega la página vacía y React la dibuja en el navegador. Google
 * ejecuta ese JavaScript, pero los buscadores de IA (ChatGPT, Claude, Perplexity), Bing en su primera
 * pasada y las redes sociales no: veían 0 palabras y 0 enlaces. Acá se imprime lo mismo que la página
 * muestra —títulos, precios, fichas, preguntas, enlaces— a partir de los mismos datos que recibe React.
 *
 * Regla: solo lo que la página ya muestra. Nada de texto extra para buscadores.
 */
class ContenidoLegible
{
    /** HTML legible de una página de Inertia, o '' si no es una página pública indexable. */
    public static function html(?array $page): string
    {
        $componente = (string) ($page['component'] ?? '');
        $p          = (array) ($page['props'] ?? []);
        $seo        = (array) ($p['seo'] ?? []);

        if (! str_starts_with($componente, 'Store/') || ! $seo || str_contains((string) ($seo['robots'] ?? ''), 'noindex')) {
            return '';
        }

        $tienda = (array) ($p['tienda'] ?? []);
        $nombre = (string) ($tienda['tienda_nombre'] ?? $seo['site_name'] ?? 'Apple Boss');

        $cuerpo = array_filter([
            self::titulo($p, $seo, $nombre),
            self::producto($p['product'] ?? null),
            self::pagina($p['page'] ?? null),
            self::novedad($p['novedad'] ?? null),
            self::comparativa($p),
            self::modelo($p),
            self::servicioTecnico($p['servicio'] ?? null),
            self::secciones($p['sections'] ?? null),
            self::lista('Destacados', $p['featured'] ?? null, empty($p['sections'])),
            self::lista('Productos disponibles', $p['products'] ?? null),
            self::lista('Nuevos', $p['nuevos'] ?? null),
            self::lista('Seminuevos', $p['usados'] ?? null),
            self::lista('Fundas y accesorios MYSKIN', is_array($p['myskin'] ?? null) ? $p['myskin'] : null),
            self::lista('También te puede interesar', array_merge((array) ($p['related'] ?? []), (array) ($p['crossSell'] ?? []))),
            self::fichas($p['fichas'] ?? null),
            self::categorias($p['categories'] ?? null),
            self::servicios($p['services'] ?? null),
            self::novedades($p['novedades'] ?? null),
            self::resenas($p['resenas'] ?? null),
            self::preguntas($p['faqs'] ?? null),
            self::locales($p['locations'] ?? null),
        ]);

        return '<header><p><a href="/">' . e($nombre) . '</a></p>' . self::menu($p['navMenu']['header'] ?? null) . '</header>'
            . '<main>' . implode('', $cuerpo) . '</main>'
            . '<footer>' . self::pie($p, $tienda) . '</footer>';
    }

    private static function titulo(array $p, array $seo, string $nombre): string
    {
        $h1 = $p['product']['name'] ?? $p['page']['title'] ?? $p['novedad']['title'] ?? $p['novedad']['titulo']
            ?? $p['modelo']['titulo'] ?? $p['familia']['titulo'] ?? $p['categoria']['name'] ?? $p['servicio']['titulo'] ?? null;

        // Sin título propio, el de la página sin el sufijo de la marca («Catálogo — Apple Boss Cochabamba»)
        $h1 = $h1 ?: trim(preg_split('/\s+[—|-]\s+' . preg_quote($nombre, '/') . '/u', (string) ($seo['title'] ?? $nombre))[0]) ?: $nombre;

        return '<h1>' . e($h1) . '</h1>' . (! empty($seo['description']) ? '<p>' . e($seo['description']) . '</p>' : '');
    }

    private static function producto(mixed $x): string
    {
        if (! is_array($x) || empty($x['name'])) {
            return '';
        }

        $datos = array_filter([
            'Precio'           => self::precio($x),
            'Condición'        => $x['condition'] ?? null,
            'Disponibilidad'   => ($x['available'] ?? true) ? 'Disponible en Apple Boss, Cochabamba' : 'Vendido',
            'Categoría'        => $x['category_label'] ?? null,
            'Marca'            => $x['marca'] ?? null,
            'Salud de batería' => isset($x['battery']) && is_numeric($x['battery']) ? $x['battery'] . ' %' : null,
            'Garantía'         => is_string($x['garantia'] ?? null) ? $x['garantia'] : null,
        ]);

        $html = self::definiciones($datos);

        foreach (['subtitulo', 'summary', 'description', 'que_incluye', 'observaciones'] as $campo) {
            if (is_string($x[$campo] ?? null) && trim($x[$campo]) !== '') {
                $html .= TextoEnriquecido::aHtml($x[$campo]);
            }
        }

        if (! empty($x['atributos']) && is_array($x['atributos'])) {
            $html .= '<h2>Ficha técnica</h2>' . self::definiciones(self::conEtiquetas($x['atributos']));
        }

        if (! empty($x['compatibilidades']) && is_array($x['compatibilidades'])) {
            // Vienen agrupadas por familia: [familia => [[name => …], …]]
            $nombres = [];
            array_walk_recursive($x['compatibilidades'], function ($valor, $clave) use (&$nombres) {
                if (in_array($clave, ['name', 'nombre'], true) && is_string($valor)) {
                    $nombres[] = $valor;
                }
            });
            $html .= $nombres ? '<h2>Compatible con</h2><p>' . e(implode(', ', $nombres)) . '</p>' : '';
        }

        if (! empty($x['comparar_modelo']['url'])) {
            $html .= '<p><a href="' . e($x['comparar_modelo']['url']) . '">Comparar ' . e($x['comparar_modelo']['nombre'] ?? 'este modelo') . ' con otros modelos</a></p>';
        }

        return $html;
    }

    private static function pagina(mixed $x): string
    {
        return is_array($x) && ! empty($x['content']) ? (string) TextoEnriquecido::limpiar((string) $x['content']) : '';
    }

    private static function novedad(mixed $x): string
    {
        if (! is_array($x)) {
            return '';
        }

        $cuerpo = $x['content'] ?? $x['contenido'] ?? $x['body'] ?? $x['html'] ?? null;

        return is_string($cuerpo) ? (string) TextoEnriquecido::limpiar($cuerpo) : '';
    }

    /** Comparadores: la ficha de cada modelo elegido y la lista de todos los que se pueden comparar. */
    private static function comparativa(array $p): string
    {
        $html = '';

        foreach ((array) ($p['seleccion'] ?? []) as $m) {
            if (! is_array($m) || empty($m['nombre'])) {
                continue;
            }
            $html .= '<h2>' . e($m['nombre']) . (! empty($m['anio']) ? ' (' . e($m['anio']) . ')' : '') . '</h2>';
            if (! empty($m['oferta']['desde'])) {
                $html .= '<p>En Apple Boss desde ' . self::bs($m['oferta']['desde'])
                    . (! empty($m['oferta']['condiciones']) ? ' (' . e(implode(', ', (array) $m['oferta']['condiciones'])) . ')' : '')
                    . (! empty($m['oferta']['url']) ? '. <a href="' . e($m['oferta']['url']) . '">Ver disponible</a>' : '') . '</p>';
            }
            $html .= self::definiciones(self::conEtiquetas((array) ($m['specs'] ?? [])));
        }

        $base     = isset($p['familia']['slug']) ? '/comparar/' . $p['familia']['slug'] : null;
        $opciones = array_filter((array) ($p['opciones'] ?? []), fn ($o) => is_array($o) && ! empty($o['nombre']) && ! empty($o['slug']));

        if ($base && $opciones) {
            $html .= '<h2>Modelos que puedes comparar</h2><ul>';
            foreach ($opciones as $o) {
                $html .= '<li><a href="' . e($base . '?modelos=' . $o['slug']) . '">' . e($o['nombre']) . '</a>'
                    . (! empty($o['anio']) ? ' (' . e($o['anio']) . ')' : '') . (! empty($o['en_tienda']) ? ', disponible en la tienda' : '') . '</li>';
            }
            $html .= '</ul>';
        }

        return $html;
    }

    /** La página de un modelo: lo que hay hoy, su ficha técnica completa y los enlaces a la comparativa y a los modelos vecinos. */
    private static function modelo(array $p): string
    {
        $m = $p['modelo'] ?? null;
        if (! is_array($m) || empty($m['nombre'])) {
            return '';
        }

        $html = ! empty($m['oferta']['desde'])
            ? '<p>Hoy en Apple Boss: ' . e((string) $m['oferta']['unidades']) . ' ' . ($m['oferta']['unidades'] == 1 ? 'disponible' : 'disponibles')
                . ', desde ' . self::bs($m['oferta']['desde'])
                . (! empty($m['oferta']['condiciones']) ? ' (' . e(implode(', ', (array) $m['oferta']['condiciones'])) . ')' : '') . '.</p>'
            : '<p>Hoy no tenemos ' . e($m['nombre']) . ' en stock. Escríbenos y te decimos si lo podemos conseguir.</p>';

        $html .= '<h2>Ficha técnica del ' . e($m['nombre']) . '</h2>' . self::definiciones(self::conEtiquetas((array) ($m['specs'] ?? [])));

        if (! empty($p['comparar']) && is_string($p['comparar'])) {
            $html .= '<p><a href="' . e($p['comparar']) . '">Comparar ' . e($m['nombre']) . ' con otros modelos</a></p>';
        }

        $otros = array_filter((array) ($p['otros'] ?? []), fn ($o) => is_array($o) && ! empty($o['nombre']) && ! empty($o['url']));
        if ($otros) {
            $html .= '<h2>Otros modelos</h2><ul>';
            foreach ($otros as $o) {
                $html .= '<li><a href="' . e($o['url']) . '">' . e($o['nombre']) . '</a>' . (! empty($o['en_tienda']) ? ', disponible en la tienda' : '') . '</li>';
            }
            $html .= '</ul>';
        }

        return $html;
    }

    /** La página de servicio técnico: qué se atiende, cómo es el proceso y cómo pedir la revisión. Los textos son los mismos que dibuja la página. */
    private static function servicioTecnico(mixed $x): string
    {
        if (! is_array($x)) {
            return '';
        }

        $html = '';
        foreach ((array) ($x['bloques'] ?? []) as $bloque) {
            if (! is_array($bloque) || empty($bloque['titulo'])) {
                continue;
            }
            $html .= '<h2>' . e($bloque['titulo']) . '</h2>' . (! empty($bloque['texto']) ? '<p>' . e($bloque['texto']) . '</p>' : '');
            $items = array_filter((array) ($bloque['items'] ?? []), 'is_array');
            if ($items) {
                $html .= '<ul>';
                foreach ($items as $i) {
                    $html .= '<li><strong>' . e($i['titulo'] ?? '') . '</strong>' . (! empty($i['texto']) ? ': ' . e($i['texto']) : '') . '</li>';
                }
                $html .= '</ul>';
            }
        }

        return $html . '<p><a href="#solicitud">Pedir la revisión de tu equipo</a></p>';
    }

    /** Las secciones del inicio que muestran productos, con su título. */
    private static function secciones(mixed $secciones): string
    {
        $html = '';

        foreach ((array) $secciones as $s) {
            if (is_array($s) && ! empty($s['products'])) {
                $html .= self::lista((string) (($s['settings']['titulo'] ?? '') ?: ($s['label'] ?? 'Productos')), $s['products']);
            }
        }

        return $html;
    }

    private static function lista(string $titulo, mixed $productos, bool $mostrar = true): string
    {
        $productos = array_filter((array) $productos, fn ($x) => is_array($x) && ! empty($x['name']) && ! empty($x['url']));

        if (! $mostrar || ! $productos) {
            return '';
        }

        $html = '<h2>' . e($titulo) . '</h2><ul>';
        foreach ($productos as $x) {
            $detalle = array_filter([self::precio($x), $x['condition'] ?? null, ...array_filter((array) ($x['specs'] ?? []), 'is_string')]);
            $html .= '<li><a href="' . e($x['url']) . '">' . e($x['name']) . '</a>' . ($detalle ? ': ' . e(implode(', ', $detalle)) : '') . '</li>';
        }

        return $html . '</ul>';
    }

    /** Los modelos de la familia con su página propia (los hubs de iPhone y de Mac). */
    private static function fichas(mixed $fichas): string
    {
        $fichas = array_filter((array) $fichas, fn ($f) => is_array($f) && ! empty($f['nombre']) && ! empty($f['url']));
        if (! $fichas) {
            return '';
        }

        $html = '<h2>Todos los modelos</h2><ul>';
        foreach ($fichas as $f) {
            $html .= '<li><a href="' . e($f['url']) . '">' . e($f['nombre']) . '</a></li>';
        }

        return $html . '</ul>';
    }

    private static function categorias(mixed $categorias): string
    {
        $categorias = array_filter((array) $categorias, fn ($c) => is_array($c) && ! empty($c['name']) && ! empty($c['url']));
        if (! $categorias) {
            return '';
        }

        $html = '<h2>Categorías</h2><ul>';
        foreach ($categorias as $c) {
            $html .= '<li><a href="' . e($c['url']) . '">' . e($c['name']) . '</a>' . (! empty($c['description']) ? ': ' . e($c['description']) : '') . '</li>';
        }

        return $html . '</ul>';
    }

    private static function servicios(mixed $servicios): string
    {
        $servicios = array_filter((array) $servicios, fn ($s) => is_array($s) && ! empty($s['title']));
        if (! $servicios) {
            return '';
        }

        $html = '<h2>Servicios</h2><ul>';
        foreach ($servicios as $s) {
            $html .= '<li><strong>' . e($s['title']) . '</strong>' . (! empty($s['description']) ? ': ' . e($s['description']) : '') . '</li>';
        }

        return $html . '</ul>';
    }

    private static function novedades(mixed $novedades): string
    {
        $novedades = array_filter((array) $novedades, fn ($n) => is_array($n) && ! empty($n['url']) && (! empty($n['title']) || ! empty($n['titulo'])));
        if (! $novedades) {
            return '';
        }

        $html = '<h2>Novedades</h2><ul>';
        foreach ($novedades as $n) {
            $html .= '<li><a href="' . e($n['url']) . '">' . e($n['title'] ?? $n['titulo']) . '</a></li>';
        }

        return $html . '</ul>';
    }

    /** Solo reseñas reales ya aprobadas: las mismas que muestra la portada. */
    private static function resenas(mixed $resenas): string
    {
        $resenas = array_filter((array) $resenas, fn ($r) => is_array($r) && is_string($r['texto'] ?? $r['comentario'] ?? null));
        if (! $resenas) {
            return '';
        }

        $html = '<h2>Lo que dicen nuestros clientes</h2><ul>';
        foreach ($resenas as $r) {
            $html .= '<li>«' . e($r['texto'] ?? $r['comentario']) . '»' . (! empty($r['nombre']) ? ' ' . e($r['nombre']) : '') . '</li>';
        }

        return $html . '</ul>';
    }

    private static function preguntas(mixed $faqs): string
    {
        $faqs = array_filter((array) $faqs, fn ($f) => is_array($f) && ! empty($f['question']) && ! empty($f['answer']));
        if (! $faqs) {
            return '';
        }

        $html = '<h2>Preguntas frecuentes</h2>';
        foreach ($faqs as $f) {
            $html .= '<h3>' . e($f['question']) . '</h3><p>' . e(TextoEnriquecido::aTexto((string) $f['answer'])) . '</p>';
        }

        return $html;
    }

    private static function locales(mixed $locales): string
    {
        $html = '';

        foreach ((array) $locales as $l) {
            if (! is_array($l) || empty($l['nombre'])) {
                continue;
            }

            $horario = [];
            foreach ((array) ($l['horarios'] ?? []) as $h) {
                if (is_array($h) && ! empty($h['abierto']) && ! empty($h['tramos'])) {
                    $horario[] = (\App\Models\StoreLocation::DIAS[$h['dia'] ?? 0] ?? '') . ' '
                        . implode(' y ', array_map(fn ($t) => ($t['abre'] ?? '') . ' a ' . ($t['cierra'] ?? ''), (array) $h['tramos']));
                }
            }

            $html .= '<h2>' . e($l['nombre']) . '</h2>' . (! empty($l['descripcion']) ? '<p>' . e($l['descripcion']) . '</p>' : '')
                . self::definiciones(array_filter([
                    'Dirección' => $l['direccion'] ?? null,
                    'Teléfono'  => $l['telefono'] ?? null,
                    'WhatsApp'  => is_string($l['whatsapp'] ?? null) ? $l['whatsapp'] : null,
                    'Horario'   => implode('; ', array_filter($horario)) ?: ($l['horario_nota'] ?? null),
                ]))
                . (! empty($l['como_llegar']) && is_string($l['como_llegar']) ? '<p><a href="' . e($l['como_llegar']) . '">Cómo llegar</a></p>' : '');
        }

        return $html;
    }

    private static function menu(mixed $items): string
    {
        $enlaces = [];

        foreach ((array) $items as $item) {
            foreach ([$item, ...(array) ($item['items'] ?? [])] as $x) {
                if (is_array($x) && ! empty($x['label']) && ! empty($x['href'])) {
                    $enlaces[$x['href']] ??= '<li><a href="' . e($x['href']) . '">' . e($x['label']) . '</a></li>';
                }
            }
        }

        return $enlaces ? '<nav><ul>' . implode('', $enlaces) . '</ul></nav>' : '';
    }

    private static function pie(array $p, array $tienda): string
    {
        $paginas = array_map(fn ($x) => ['label' => $x['title'] ?? null, 'href' => $x['href'] ?? null], array_filter((array) ($p['paginas'] ?? []), 'is_array'));

        return (! empty($tienda['tienda_descripcion']) ? '<p>' . e($tienda['tienda_descripcion']) . '</p>' : '')
            . self::menu(array_merge((array) ($p['navMenu']['footer'] ?? []), $paginas))
            . (! empty($tienda['whatsapp_enabled']) && ! empty($tienda['whatsapp_numero'])
                ? '<p><a href="https://wa.me/' . e(preg_replace('/\D/', '', (string) $tienda['whatsapp_numero'])) . '">Escribir por WhatsApp</a></p>' : '');
    }

    private static function definiciones(array $pares): string
    {
        $html = '';
        foreach ($pares as $rotulo => $valor) {
            $valor = is_bool($valor) ? ($valor ? 'Sí' : 'No') : (is_array($valor) ? implode(', ', array_filter($valor, 'is_scalar')) : (string) $valor);
            if (trim($valor) !== '') {
                $html .= '<dt>' . e($rotulo) . '</dt><dd>' . e($valor) . '</dd>';
            }
        }

        return $html === '' ? '' : '<dl>' . $html . '</dl>';
    }

    private static function conEtiquetas(array $atributos): array
    {
        $salida = [];
        foreach ($atributos as $clave => $valor) {
            if ($valor !== null && $valor !== '' && $valor !== [] && is_string($clave)) {
                $salida[Etiquetas::de($clave)] = $valor;
            }
        }

        return $salida;
    }

    private static function precio(array $x): ?string
    {
        $precio = $x['promo_price'] ?? null ?: ($x['price'] ?? null);

        return is_numeric($precio) && $precio > 0 ? self::bs($precio) : null;
    }

    private static function bs(mixed $monto): string
    {
        return 'Bs ' . number_format((float) $monto, 0, ',', '.');
    }
}
