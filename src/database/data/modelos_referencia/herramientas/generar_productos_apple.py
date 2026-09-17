"""
Genera ../productos_apple.php: fichas de productos Apple (tipo «producto_apple», la categoría «Más Apple» de la
tienda): iPad, Apple Watch, AirPods, Apple Pencil y Magic Mouse. Esquema: App\\Support\\FichaTecnica\\EsquemaProductoApple;
textos de la ficha: TextosAccesorio (pasan tal cual); descripción de la publicación: ContenidoProductoApple.

Cada ficha es un modelo con su variante (iPad Wi‑Fi, Apple Watch GPS o GPS + Cellular, de aluminio o de titanio): la
unidad del inventario pone la capacidad, el color y la salud de la batería. Solo lo que hay o hubo en el inventario el
2026-09-16 y, si el nombre deja dudas, también la otra variante para que el admin elija. Si se vende, la ficha queda.

Reglas:
- Fuente: la ficha técnica de Apple de EE. UU. (support.apple.com/en-us/<id>), con los nombres en español de la de
  Latinoamérica (es-lamr). Si no coinciden, vale la de EE. UU.: el usuario importa desde allá.
- Lo que Apple no publica (la RAM del iPad A16 y del iPad mini, el sistema con el que salieron) se carga solo si
  fuentes independientes coinciden, y se anota en FUENTES. La ficha pública aclara que Apple no publica la RAM.
- Lo que Apple no ofrece en Bolivia (ECG, avisos de ritmo irregular y de apnea del sueño, salud auditiva) se dice
  así, con la lista de disponibilidad de Apple como fuente.
- `detectar`: expresiones regulares sobre el nombre del inventario en minúsculas, sin tildes y con las unidades
  pegadas («IWATCH SERIE 10 DE 46MM + LTE» → «iwatch serie 10 de 46mm lte»). `celular`: true o false si el modelo
  tiene las dos variantes (la unidad es Cellular si tiene IMEI en el inventario o su nombre dice LTE, Cellular o 5G);
  null si no aplica. Si coincide más de una ficha, no se elige: elige el admin.
- Lo que trae la caja (`contenido.incluye`) es lo que entrega Apple con un equipo nuevo: solo se copia a una
  publicación en condición Nuevo.
- Los precios NO van aquí: salen del inventario.

    python3 generar_productos_apple.py
"""
from pathlib import Path


def php(v, ind=0):
    """Mismo formato de salida que generar_accesorios.py."""
    sp = '    ' * ind
    if v is True: return 'true'
    if v is False: return 'false'
    if v is None: return 'null'
    if isinstance(v, int): return str(v)
    if isinstance(v, float): return repr(v)
    if isinstance(v, str): return "'" + v.replace('\\', '\\\\').replace("'", "\\'") + "'"
    if isinstance(v, list): return '[' + ', '.join(php(x) for x in v) + ']'
    if isinstance(v, dict):
        ancho = max(len(k) for k in v) + 2
        lineas = ['['] + [f"{sp}    {php(k).ljust(ancho)} => {php(x, ind + 1)}," for k, x in v.items()] + [sp + ']']
        return '\n'.join(lineas)
    raise TypeError(v)


EN = 'support.apple.com/en-us/{id}'
LAMR = 'support.apple.com/es-lamr/{id}'


def sistema(categoria, forma, detectar, excluir=(), anio=None, celular=None, video_h=False, colores=()):
    return {
        'anio': anio, 'categoria': categoria, 'forma': forma, 'detectar': list(detectar),
        'excluir': list(excluir) or False, 'celular': celular, 'video_h': video_h, 'colores': list(colores) or False,
    }


def contenido(resumen, parrafos, puntos, incluye):
    return {'resumen': resumen, 'parrafos': list(parrafos), 'puntos': list(puntos), 'incluye': list(incluye)}


def modelo(nombre, slug, familia, alias, sis, ficha, cont, visual=False, pendientes=()):
    return {'tipo': 'producto_apple', 'familia': familia, 'nombre': nombre, 'slug': slug, 'alias': list(alias),
            'pendientes': list(pendientes), 'datos': {'sistema': sis, 'ficha': ficha, 'contenido': cont, 'visual': visual}}


# ─── iPad ─────────────────────────────────────────────────────────────────────────────────────────────────────────
# Los iPad de la tienda son Wi‑Fi, salvo un iPad Pro de 11 pulgadas (M5) Wi‑Fi + Cellular (el usuario, 2026-09-16).
# `celular` separa las variantes: una unidad que diga LTE, Cellular o 5G (o tenga IMEI) toma la Wi‑Fi + Cellular, si
# existe; si no, ninguna (su peso, su red y su número de modelo son otros). La variante Wi‑Fi + Cellular suma la red, la
# SIM, la ubicación, la autonomía con datos móviles, el peso y el número de modelo, de la misma página de Apple.

SIN_IPAD_GRANDE = r'\b(air|pro|mini)\b'
UBICACION_WIFI = 'Brújula digital · Wi‑Fi · Microlocalización iBeacon'
UBICACION_CELULAR = 'GPS/GNSS · Brújula digital · Wi‑Fi · Red celular · Microlocalización iBeacon'
SOLO_ESIM = 'Solo eSIM (no acepta SIM física)'


def ipad(base, wifi, celular=None):
    """Las fichas de un iPad: `base` es lo común; `wifi` y `celular` (si la tienda la tiene), lo propio de cada variante."""
    fichas = []
    for es_celular, propio in ((False, wifi), (True, celular)):
        if propio is None:
            continue
        ficha = dict(base['ficha'])
        ficha.update(propio['ficha'])
        if es_celular:
            ficha['autonomia'] = f"{base['ficha']['autonomia']} · Hasta 9 h de navegación con datos móviles"
        orden = ['tamano_pantalla', 'pantalla', 'resolucion', 'brillo', 'funciones_pantalla', 'lapiz', 'chip', 'cpu_cores',
                 'gpu_cores', 'neural_engine', 'ram', 'ancho_banda', 'apple_intelligence', 'camara_principal', 'video',
                 'camara_frontal', 'audio', 'microfonos', 'autonomia', 'bateria_wh', 'carga', 'red', 'sim', 'wifi',
                 'bluetooth', 'thread', 'puerto', 'pantalla_externa', 'gps', 'biometria', 'material', 'dimensiones', 'peso',
                 'lanzamiento_so', 'ultimo_so', 'modelo', 'generacion']
        assert set(ficha) <= set(orden), set(ficha) - set(orden)
        sis = dict(base['sistema'], celular=es_celular)
        fichas.append(modelo(
            f"{base['nombre']} {'Wi‑Fi + Cellular' if es_celular else 'Wi‑Fi'}", f"{base['slug']}-{'wifi-cellular' if es_celular else 'wifi'}", 'ipad',
            propio['alias'], sis, {k: ficha[k] for k in orden if k in ficha}, base['contenido'], base['visual'],
            base.get('pendientes', ()),
        ))
    return fichas


# support.apple.com/en-us/122240 (iPad 11-inch (A16)). RAM: Apple no la publica.
IPAD_A16 = {
    'nombre': 'iPad (A16)', 'slug': 'ipad-a16',
    'sistema': sistema('iPad', 'tablet', [r'\bipad\b.*\ba16\b'], [SIN_IPAD_GRANDE], anio=2025, video_h=10,
                       colores=['Plata', 'Azul', 'Rosa', 'Amarillo']),
    'ficha': {
        'tamano_pantalla': '11 pulgadas (10,86 medida en diagonal como rectángulo)',
        'pantalla': 'Liquid Retina: Multi‑Touch retroiluminada por LED con tecnología IPS',
        'resolucion': '2.360 × 1.640 px a 264 ppi',
        'brillo': '500 nits',
        'funciones_pantalla': 'True Tone · Revestimiento oleofóbico resistente a las huellas',
        'lapiz': 'Apple Pencil (USB‑C) · Apple Pencil (1.ª generación), con el adaptador de USB‑C a Apple Pencil',
        'chip': 'A16',
        'cpu_cores': '5 núcleos',
        'gpu_cores': '4 núcleos',
        'neural_engine': '16 núcleos',
        'ram': '6 GB; Apple no la publica: la confirman fuentes independientes',
        'apple_intelligence': 'No compatible',
        'camara_principal': 'Gran angular de 12 MP, ƒ/1.8 · zoom digital de hasta 5x · HDR Inteligente 4',
        'video': '4K a 24, 25, 30 o 60 fps · cámara lenta 1080p a 120 o 240 fps · estabilización cinemática (1080p y 720p)',
        'camara_frontal': 'Center Stage de 12 MP en el borde horizontal, ƒ/2.4 · video 1080p hasta 60 fps',
        'audio': 'Parlantes estéreo en horizontal',
        'microfonos': 'Dos micrófonos para llamadas y grabación de audio y video',
        'autonomia': 'Hasta 10 h de navegación por Wi‑Fi o de reproducción de video',
        'bateria_wh': '28,93 Wh',
        'carga': 'Por USB‑C, con un adaptador de corriente o desde una computadora',
        'wifi': 'Wi‑Fi 6 (802.11ax) con MIMO 2x2',
        'bluetooth': '5.3',
        'puerto': 'USB‑C (USB 2, hasta 480 Mb/s) con carga y DisplayPort · Smart Connector para teclado',
        'pantalla_externa': 'Un monitor de hasta 4K a 60 Hz',
        'biometria': 'Touch ID en el botón superior',
        'material': 'Aluminio 100 % reciclado en la carcasa',
        'dimensiones': '248,6 × 179,5 × 7 mm',
        'lanzamiento_so': 'iPadOS 18',
        'ultimo_so': 'iPadOS 27',
        'generacion': '2025',
    },
    'contenido': contenido(
        'iPad de 11 pulgadas con chip A16, pantalla Liquid Retina y Touch ID: para estudiar, trabajar y disfrutar tu '
        'contenido favorito.',
        ['El iPad (A16) tiene una pantalla Liquid Retina de 11 pulgadas con True Tone, que ajusta el color a la luz del '
         'lugar, y el chip A16, con CPU de 5 núcleos y GPU de 4 núcleos, para estudiar, trabajar y jugar.',
         'La cámara frontal Center Stage de 12 MP está en el borde horizontal y te mantiene en cuadro en las '
         'videollamadas. Funciona con el Apple Pencil (USB‑C) y se desbloquea con Touch ID en el botón superior. No es '
         'compatible con Apple Intelligence.'],
        ['Chip A16', 'Pantalla Liquid Retina de 11 pulgadas con True Tone', 'Cámaras de 12 MP, la frontal con Center Stage',
         'Touch ID en el botón superior', 'Hasta 10 h de video o navegación por Wi‑Fi', 'Puerto USB‑C'],
        ['iPad', 'Cable de carga USB‑C (1 m)', 'Adaptador de corriente USB‑C de 20 W']),
    'visual': {'alto_mm': 248.6, 'ancho_mm': 179.5},
}

# support.apple.com/en-us/121456 (iPad mini (A17 Pro)). RAM: Apple no la publica.
IPAD_MINI_A17 = {
    'nombre': 'iPad mini (A17 Pro)', 'slug': 'ipad-mini-a17-pro',
    'sistema': sistema('iPad', 'tablet', [r'\bipad mini\b.*(\ba17\b|\b7 ?(ma|a|th|gen)?\b)'], anio=2024, video_h=10,
                       colores=['Azul', 'Morado', 'Blanco estelar', 'Gris espacial']),
    'ficha': {
        'tamano_pantalla': '8,3 pulgadas (medida en diagonal como rectángulo)',
        'pantalla': 'Liquid Retina: Multi‑Touch retroiluminada por LED con tecnología IPS',
        'resolucion': '2.266 × 1.488 px a 326 ppi',
        'brillo': '500 nits',
        'funciones_pantalla': 'Gama cromática amplia (P3) · True Tone · Totalmente laminada · Revestimiento antirreflejo · '
                              'Revestimiento oleofóbico resistente a las huellas',
        'lapiz': 'Apple Pencil Pro · Apple Pencil (USB‑C) · Puntero flotante del Apple Pencil',
        'chip': 'A17 Pro',
        'cpu_cores': '6 núcleos (2 de rendimiento y 4 de eficiencia)',
        'gpu_cores': '5 núcleos',
        'neural_engine': '16 núcleos',
        'ram': '8 GB; Apple no la publica: la confirman fuentes independientes',
        'apple_intelligence': 'Compatible',
        'camara_principal': 'Gran angular de 12 MP, ƒ/1.8 · flash True Tone · zoom digital de hasta 5x · HDR Inteligente 4',
        'video': '4K a 24, 25, 30 o 60 fps · cámara lenta 1080p a 120 o 240 fps · estabilización cinemática (4K, 1080p y 720p)',
        'camara_frontal': 'Center Stage de 12 MP, ƒ/2.4 · video 1080p hasta 60 fps',
        'audio': 'Parlantes estéreo en horizontal',
        'microfonos': 'Dos micrófonos para llamadas y grabación de audio y video',
        'autonomia': 'Hasta 10 h de navegación por Wi‑Fi o de reproducción de video',
        'bateria_wh': '19,3 Wh',
        'carga': 'Por USB‑C, con un adaptador de corriente o desde una computadora',
        'wifi': 'Wi‑Fi 6E (802.11ax) con MIMO 2x2',
        'bluetooth': '5.3',
        'puerto': 'USB‑C (USB 3, hasta 10 Gb/s) con carga y DisplayPort',
        'pantalla_externa': 'Un monitor de hasta 4K a 60 Hz',
        'biometria': 'Touch ID en el botón superior',
        'material': 'Aluminio 100 % reciclado en la carcasa',
        'dimensiones': '195,4 × 134,8 × 6,3 mm',
        'lanzamiento_so': 'iPadOS 18',
        'ultimo_so': 'iPadOS 27',
        'generacion': '2024',
    },
    'contenido': contenido(
        'El iPad más compacto: pantalla Liquid Retina de 8,3 pulgadas, chip A17 Pro y Apple Intelligence, en un equipo que '
        'cabe en una mano.',
        ['El iPad mini (A17 Pro) lleva una pantalla Liquid Retina de 8,3 pulgadas totalmente laminada, con gama cromática '
         'amplia (P3) y revestimiento antirreflejo, en un cuerpo de 6,3 mm que pesa menos de 300 g.',
         'El chip A17 Pro, con CPU de 6 núcleos y GPU de 5 núcleos, es compatible con Apple Intelligence. Funciona con el '
         'Apple Pencil Pro y el Apple Pencil (USB‑C), y su puerto USB‑C transfiere hasta 10 Gb/s.'],
        ['Chip A17 Pro, compatible con Apple Intelligence', 'Pantalla Liquid Retina de 8,3 pulgadas', 'Apple Pencil Pro y Apple Pencil (USB‑C)',
         'Wi‑Fi 6E', 'USB‑C de hasta 10 Gb/s', 'Touch ID en el botón superior'],
        ['iPad mini', 'Cable de carga USB‑C (1 m)', 'Adaptador de corriente USB‑C de 20 W']),
    'visual': {'alto_mm': 195.4, 'ancho_mm': 134.8},
}


def ipad_air_m4(pulgadas):
    """support.apple.com/en-us/126471 (11 pulgadas) y 126472 (13 pulgadas): solo cambian medidas, pantalla y batería."""
    once = pulgadas == 11
    return {
        'nombre': f'iPad Air de {pulgadas} pulgadas (M4)', 'slug': f'ipad-air-{pulgadas}-m4',
        # Sin el tamaño en el nombre del inventario hay dos candidatos: elige el admin
        'sistema': sistema('iPad', 'tablet', [rf'^(?=.*\bipad air\b)(?=.*\bm4\b)(?=.*\b{pulgadas}\b)'], anio=2026, video_h=10,
                           colores=['Azul', 'Morado', 'Blanco estelar', 'Gris espacial']),
        'ficha': {
            'tamano_pantalla': f"{pulgadas} pulgadas ({'10,86' if once else '12,9'} medida en diagonal como rectángulo)",
            'pantalla': 'Liquid Retina: Multi‑Touch retroiluminada por LED con tecnología IPS',
            'resolucion': '2.360 × 1.640 px a 264 ppi' if once else '2.732 × 2.048 px a 264 ppi',
            'brillo': '500 nits' if once else '600 nits',
            'funciones_pantalla': 'Gama cromática amplia (P3) · True Tone · Totalmente laminada · Revestimiento antirreflejo · '
                                  'Revestimiento oleofóbico resistente a las huellas',
            'lapiz': 'Apple Pencil Pro · Apple Pencil (USB‑C) · Puntero flotante del Apple Pencil',
            'chip': 'Apple M4',
            'cpu_cores': '8 núcleos (3 de rendimiento y 5 de eficiencia)',
            'gpu_cores': '9 núcleos · Trazado de rayos por hardware',
            'neural_engine': '16 núcleos',
            'ram': '12 GB de memoria unificada',
            'ancho_banda': '120 GB/s',
            'apple_intelligence': 'Compatible',
            'camara_principal': 'Gran angular de 12 MP, ƒ/1.8 · cubierta del lente de cristal de zafiro · zoom digital de hasta 5x · '
                                'HDR Inteligente 4',
            'video': '4K a 24, 25, 30 o 60 fps · cámara lenta 1080p a 120 o 240 fps · estabilización cinemática (4K, 1080p y 720p)',
            'camara_frontal': 'Center Stage de 12 MP en el borde horizontal, ƒ/2.0 · video 1080p hasta 60 fps',
            'audio': 'Parlantes estéreo en horizontal',
            'microfonos': 'Dos micrófonos para llamadas y grabación de audio y video',
            'autonomia': 'Hasta 10 h de navegación por Wi‑Fi o de reproducción de video',
            'bateria_wh': '28,93 Wh' if once else '36,59 Wh',
            'carga': 'Por USB‑C, con un adaptador de corriente o desde una computadora',
            'wifi': 'Wi‑Fi 7 (802.11be) con MIMO 2x2 · chip de conexión inalámbrica N1 de Apple',
            'bluetooth': '6',
            'thread': 'Sí',
            'puerto': 'USB‑C (USB 3, hasta 10 Gb/s) con carga y DisplayPort · Smart Connector para teclado',
            'pantalla_externa': 'Un monitor de hasta 6K a 60 Hz',
            'biometria': 'Touch ID en el botón superior',
            'material': 'Aluminio 100 % reciclado en la carcasa',
            'dimensiones': '247,6 × 178,5 × 6,1 mm' if once else '280,6 × 214,9 × 6,1 mm',
            'lanzamiento_so': 'iPadOS 26',
            'ultimo_so': 'iPadOS 27',
            'generacion': '2026',
        },
        'contenido': contenido(
            f'iPad Air de {pulgadas} pulgadas con chip M4, 12 GB de memoria unificada y Apple Intelligence, en un diseño de '
            '6,1 mm.',
            [f'El iPad Air de {pulgadas} pulgadas lleva el chip M4, con CPU de 8 núcleos, GPU de 9 núcleos con trazado de rayos '
             'por hardware y 12 GB de memoria unificada: rinde para editar video, dibujar y usar Apple Intelligence.',
             'Su pantalla Liquid Retina es totalmente laminada, con gama cromática amplia (P3) y revestimiento antirreflejo. '
             'Suma Wi‑Fi 7 y Bluetooth 6 con el chip N1 de Apple, y funciona con el Apple Pencil Pro y el Apple Pencil (USB‑C).'],
            ['Chip M4 con 12 GB de memoria unificada', f'Pantalla Liquid Retina de {pulgadas} pulgadas',
             'Compatible con Apple Intelligence', 'Wi‑Fi 7 y Bluetooth 6', 'Apple Pencil Pro y Apple Pencil (USB‑C)',
             'Touch ID en el botón superior'],
            ['iPad Air', 'Cable de carga USB‑C (1 m)', 'Adaptador de corriente USB‑C de 20 W']),
        'visual': {'alto_mm': 247.6, 'ancho_mm': 178.5} if once else {'alto_mm': 280.6, 'ancho_mm': 214.9},
    }



def ipad_pro(chip, pulgadas):
    """support.apple.com/en-us/119892 y 119891 (M4, 11 y 13 pulgadas); 125406 y 125407 (M5). Apple publica la memoria."""
    once, m5 = pulgadas == 11, chip == 'M5'
    ids = {('M4', 11): 119892, ('M4', 13): 119891, ('M5', 11): 125406, ('M5', 13): 125407}
    return {
        'nombre': f'iPad Pro de {pulgadas} pulgadas ({chip})', 'slug': f'ipad-pro-{pulgadas}-{chip.lower()}',
        # Sin el tamaño en el nombre del inventario («IPAD PRO M5») hay dos candidatos: elige quien publica
        'sistema': sistema('iPad', 'tablet', [rf'^(?=.*\bipad pro\b)(?=.*\b{chip.lower()}\b)(?=.*\b{pulgadas}\b)'],
                           anio=2025 if m5 else 2024, video_h=10, colores=['Plata', 'Negro espacial']),
        'ficha': {
            'tamano_pantalla': f'{pulgadas} pulgadas',
            'pantalla': 'Ultra Retina XDR: OLED en tándem con ProMotion (de 10 a 120 Hz)',
            'resolucion': '2.420 × 1.668 px a 264 ppi' if once else '2.752 × 2.064 px a 264 ppi',
            'brillo': '1.000 nits en SDR · 1.600 nits de pico en contenido HDR' + (' · Mínimo de 1 nit' if m5 else ''),
            'funciones_pantalla': 'Gama cromática amplia (P3) · True Tone · Totalmente laminada · Revestimiento antirreflejo · '
                                  'Revestimiento oleofóbico resistente a las huellas · Contraste de 2.000.000:1 · Opción de vidrio '
                                  'nanotexturizado en los modelos de 1 y 2 TB',
            'lapiz': 'Apple Pencil Pro · Apple Pencil (USB‑C) · Puntero flotante del Apple Pencil',
            'chip': f'Apple {chip}',
            'cpu_cores': ('9 núcleos (3 supernúcleos y 6 de eficiencia) con 256 o 512 GB · 10 núcleos (4 supernúcleos y 6 de '
                          'eficiencia) con 1 o 2 TB') if m5 else
                         ('9 núcleos (3 de rendimiento y 6 de eficiencia) con 256 o 512 GB · 10 núcleos (4 de rendimiento y 6 de '
                          'eficiencia) con 1 o 2 TB'),
            'gpu_cores': '10 núcleos con Neural Accelerators · Trazado de rayos por hardware' if m5 else '10 núcleos · Trazado de rayos por hardware',
            'neural_engine': '16 núcleos',
            'ram': ('12 GB de memoria unificada con 256 o 512 GB · 16 GB con 1 o 2 TB') if m5 else ('8 GB con 256 o 512 GB · 16 GB con 1 o 2 TB'),
            'ancho_banda': '153 GB/s' if m5 else '120 GB/s',
            'apple_intelligence': 'Compatible',
            'camara_principal': 'Gran angular de 12 MP, ƒ/1.8 · flash True Tone adaptable · escáner LiDAR · cubierta del lente de '
                                'cristal de zafiro · zoom digital de hasta 5x · HDR Inteligente 4',
            'video': '4K a 24, 25, 30 o 60 fps · ProRes hasta 4K a 30 fps (1080p a 30 fps con 256 GB) · cámara lenta 1080p a 120 o '
                     '240 fps · estabilización cinemática (4K, 1080p y 720p)',
            'camara_frontal': 'Center Stage de 12 MP en el borde horizontal, ƒ/2.0 · video 1080p hasta 60 fps',
            'audio': 'Cuatro parlantes',
            'microfonos': 'Cuatro micrófonos con calidad de estudio para llamadas y grabación de audio y video',
            'autonomia': 'Hasta 10 h de navegación por Wi‑Fi o de reproducción de video',
            'bateria_wh': '31,29 Wh' if once else '38,99 Wh',
            'carga': 'Por USB‑C, con un adaptador de corriente o desde una computadora'
                     + (' · Carga rápida: hasta 50 % en unos 30 minutos con un adaptador USB‑C de 60 W o más (se vende por '
                        'separado)' if m5 else ''),
            'wifi': 'Wi‑Fi 7 (802.11be) con MIMO 2x2 · chip de conexión inalámbrica N1 de Apple' if m5 else 'Wi‑Fi 6E (802.11ax) con MIMO 2x2',
            'bluetooth': '6' if m5 else '5.3',
            **({'thread': 'Sí'} if m5 else {}),
            'puerto': 'Thunderbolt / USB 4 (hasta 40 Gb/s) con carga y DisplayPort · Smart Connector para teclado',
            'pantalla_externa': 'Un monitor de hasta 6K a 60 Hz o de hasta 5K a 120 Hz' if m5 else 'Un monitor de hasta 6K a 60 Hz',
            'biometria': 'Face ID',
            'material': 'Aluminio 100 % reciclado en la carcasa',
            'dimensiones': '249,7 × 177,5 × 5,3 mm' if once else '281,6 × 215,5 × 5,1 mm',
            'lanzamiento_so': 'iPadOS 26' if m5 else 'iPadOS 17',
            'ultimo_so': 'iPadOS 27',
            'generacion': '2025' if m5 else '2024',
        },
        'contenido': contenido(
            f'iPad Pro de {pulgadas} pulgadas con chip {chip}, pantalla Ultra Retina XDR con ProMotion, Face ID y puerto '
            'Thunderbolt: para dibujar, editar video y trabajar.' if not m5 else
            f'iPad Pro de {pulgadas} pulgadas con chip M5, pantalla Ultra Retina XDR con ProMotion, Wi‑Fi 7 y carga rápida: '
            'para dibujar, editar video y usar Apple Intelligence.',
            [f'El iPad Pro de {pulgadas} pulgadas tiene una pantalla Ultra Retina XDR con OLED en tándem y ProMotion de hasta '
             f'120 Hz, que llega a 1.600 nits de pico en contenido HDR, en un diseño de {"5,3" if once else "5,1"} mm.',
             f'Lleva el chip {chip} con GPU de 10 núcleos y trazado de rayos por hardware, '
             + ('12 GB de memoria unificada (16 GB en los de 1 y 2 TB)' if m5 else '8 GB de memoria (16 GB en los de 1 y 2 TB)')
             + ', cuatro parlantes, Face ID y puerto Thunderbolt / USB 4. Funciona con el Apple Pencil Pro y con Apple '
             'Intelligence.'],
            ['Chip ' + chip, 'Pantalla Ultra Retina XDR con ProMotion', 'Compatible con Apple Intelligence',
             'Face ID y cuatro parlantes', 'Puerto Thunderbolt / USB 4', 'Apple Pencil Pro y Apple Pencil (USB‑C)'],
            ['iPad Pro', 'Cable de carga USB‑C (1 m)', 'Adaptador de corriente USB‑C de 20 W']),
        'visual': {'alto_mm': 249.7, 'ancho_mm': 177.5} if once else {'alto_mm': 281.6, 'ancho_mm': 215.5},
    }


IPADS = [
    *ipad(IPAD_A16, {'alias': ['IPAD A16', 'IPAD A16 WIFI'], 'ficha': {'gps': UBICACION_WIFI, 'peso': '477 g', 'modelo': 'A3354'}}),
    *ipad(IPAD_MINI_A17,
          {'alias': ['IPAD MINI 7MA GEN.', 'IPAD MINI A17 PRO'], 'ficha': {'gps': UBICACION_WIFI, 'peso': '293 g', 'modelo': 'A2993'}}),
    *ipad(ipad_air_m4(11), {'alias': ['IPAD AIR 11 M4'], 'ficha': {'gps': UBICACION_WIFI, 'peso': '464 g', 'modelo': 'A3459'}}),
    *ipad(ipad_air_m4(13), {'alias': ['IPAD AIR 13 M4'], 'ficha': {'gps': UBICACION_WIFI, 'peso': '616 g', 'modelo': 'A3461'}}),
    # Pesos de la variante Wi‑Fi y números de modelo: support.apple.com/en-us/108043
    *ipad(ipad_pro('M4', 11), {'alias': ['IPAD PRO 11 M4'], 'ficha': {'gps': UBICACION_WIFI, 'peso': '444 g', 'modelo': 'A2836'}}),
    *ipad(ipad_pro('M4', 13), {'alias': ['IPAD PRO 13 M4'], 'ficha': {'gps': UBICACION_WIFI, 'peso': '579 g', 'modelo': 'A2925'}}),
    *ipad(ipad_pro('M5', 11), {'alias': ['IPAD PRO 11 M5'], 'ficha': {'gps': UBICACION_WIFI, 'peso': '444 g', 'modelo': 'A3357'}},
          # La única unidad Wi‑Fi + Cellular de la tienda (support.apple.com/en-us/125406: «Wi-Fi + Cellular models»)
          {'alias': ['IPAD PRO M5 11 INCH + LTE'], 'ficha': {
              'red': 'Módem C1X de Apple · 5G (sub‑6 GHz) y Gigabit LTE con MIMO 4x4 · solo datos · llamadas por Wi‑Fi',
              'sim': SOLO_ESIM, 'gps': UBICACION_CELULAR, 'peso': '446 g', 'modelo': 'A3358'}}),
    *ipad(ipad_pro('M5', 13), {'alias': ['IPAD PRO 13 M5'], 'ficha': {'gps': UBICACION_WIFI, 'peso': '579 g', 'modelo': 'A3360'}}),
]

# ─── Apple Watch ──────────────────────────────────────────────────────────────────────────────────────────────────
# support.apple.com/en-us/121202 (Series 10) y 108056 (identificar el modelo). Disponibilidad en Bolivia:
# apple.com/watchos/feature-availability (Bolivia no figura en ECG, ritmo irregular ni apnea del sueño; sí en
# Oxígeno en Sangre). Último watchOS: support.apple.com/en-us/108926.

S10 = r'^(?=.*\b(i?watch)\b)(?=.*\bseries? ?10\b)(?=.*\b46mm\b)'
TITANIO = r'\btitan(io|ium)?\b'
SALUD_S10 = ('App Frecuencia Cardiaca con avisos de ritmo alto y bajo · App Oxígeno en Sangre (la medición se calcula y '
             'se ve en el iPhone, en la app Salud) · App Sueño con fases del sueño · sensor de temperatura · App Control del '
             'Ciclo · App Medicamentos · App Atención Plena · App Ruido; La App ECG y los avisos de ritmo irregular y de '
             'apnea del sueño no están disponibles en Bolivia')


def watch_s10(nombre, slug, alias, material, celular, colores, peso, modelo_a, detectar, excluir):
    aluminio = material == 'aluminio'
    ficha = {
        'tamano_caja': '46 mm',
        'pantalla': 'Retina OLED LTPO3 siempre activa, con ángulo de visión amplio',
        'resolucion': '416 × 496 px a 326 ppi · 1.220 mm² de área visible',
        'brillo': 'Hasta 2.000 nits (mínimo de 1 nit)',
        'funciones_pantalla': 'Siempre activa · Hasta 40 % más brillante vista en ángulo · De borde a borde',
        'chip': 'S10 SiP con procesador de doble núcleo de 64 bits',
        'neural_engine': '4 núcleos',
        'capacidad': '64 GB',
        'apple_intelligence': 'Con un iPhone compatible con Apple Intelligence',
        'audio': 'Parlante para llamadas y reproducir música o podcasts',
        'microfonos': 'Micrófono con Aislamiento de Voz',
        'sensores': 'Sensor eléctrico y óptico (3.ª generación) de frecuencia cardiaca · Oxígeno en sangre · Temperatura · '
                    'Brújula · Altímetro siempre activo · Acelerómetro de alta fuerza g · Giroscopio · Luz ambiental · '
                    'Profundímetro · Temperatura del agua',
        'controles': 'Digital Crown con respuesta háptica · Botón lateral · Gesto de doble toque · Siri en el dispositivo',
        'salud': SALUD_S10,
        'seguridad': 'Emergencia SOS · Detección de Choques · Detección de Caídas',
        'resistencia': 'Resistente al agua hasta 50 m (para nadar) · Resistente al polvo IP6X',
        'autonomia': 'Hasta 18 h de uso normal (hasta 36 h con Ahorrar Batería)',
        'carga': 'Carga rápida: hasta 80 % en unos 30 minutos · 15 minutos dan hasta 8 h de uso normal',
        'red': 'LTE y UMTS; Necesita un plan de un operador compatible con el Apple Watch' if celular else None,
        'wifi': 'Wi‑Fi 4 (802.11n)',
        'bluetooth': '5.3',
        'gps': 'GPS (L1), GLONASS, Galileo, QZSS y BeiDou',
        'banda_ultraancha': 'Chip de segunda generación',
        'compatibilidad': 'iPhone 11 o posterior, o iPhone SE (2.ª generación) o posterior, con iOS 27 (para usar watchOS 27)',
        'material': ('Caja de aluminio 100 % reciclado · Vidrio frontal Ion‑X' if aluminio
                     else 'Caja de titanio (95 % reciclado) · Cristal frontal de zafiro'),
        'dimensiones': '46 × 39 × 9,7 mm',
        'peso': peso,
        'talla': 'Para muñecas de 140 a 245 mm',
        'lanzamiento_so': 'watchOS 11',
        'ultimo_so': 'watchOS 27',
        'modelo': modelo_a,
        'generacion': '2024',
    }
    ficha = {k: v for k, v in ficha.items() if v is not None}
    variante = 'GPS + Cellular' if celular else 'GPS'
    return modelo(
        nombre, slug, 'watch', alias,
        sistema('Apple Watch', 'reloj', detectar, excluir, anio=2024, celular=celular if aluminio else None, colores=colores),
        ficha,
        contenido(
            f'Apple Watch Series 10 de 46 mm, {variante}, con caja de {material}: pantalla OLED siempre activa con ángulo de '
            'visión amplio, sensores de salud y carga rápida.',
            ['El Series 10 tiene una pantalla Retina OLED LTPO3 siempre activa con ángulo de visión amplio, que se lee mejor '
             'de costado y llega a 2.000 nits, en una caja de 9,7 mm de grosor.',
             'Mide tu frecuencia cardiaca, el oxígeno en sangre y la temperatura, registra tu sueño y tus entrenamientos, y '
             'resiste el agua hasta 50 m para nadar. Carga hasta el 80 % en unos 30 minutos.'
             + (' Se conecta a la red móvil por su cuenta (LTE y UMTS) con un plan de un operador compatible con el Apple '
                'Watch.' if celular else ''),
             'La App ECG y los avisos de ritmo irregular y de apnea del sueño no están disponibles en Bolivia.'],
            ['Pantalla Retina OLED LTPO3 siempre activa', 'Chip S10 con 64 GB', 'Resistente al agua hasta 50 m',
             'Carga rápida: 80 % en unos 30 minutos', 'Detección de Choques y de Caídas',
             'LTE y UMTS con un plan compatible' if celular else 'GPS con GLONASS, Galileo, QZSS y BeiDou'],
            ['Apple Watch Series 10', 'Correa', 'Cable de carga magnética rápida con conector USB‑C para el Apple Watch (1 m)']),
        {'alto_mm': 46.0, 'ancho_mm': 39.0},
    )


RELOJES = [
    watch_s10('Apple Watch Series 10 (46 mm, aluminio, GPS + Cellular)', 'apple-watch-series-10-46-aluminio-gps-cellular',
              ['IWATCH SERIE 10 DE 46MM + LTE', 'IWATCH SERIES 10 46MM CON LTE'], 'aluminio', True,
              ['Negro azabache', 'Oro rosa', 'Plata'], '35,3 g', 'A3003', [S10], [TITANIO]),
    watch_s10('Apple Watch Series 10 (46 mm, aluminio, GPS)', 'apple-watch-series-10-46-aluminio-gps',
              ['IWATCH SERIE 10 DE 46MM'], 'aluminio', False, ['Negro azabache', 'Oro rosa', 'Plata'], '36,4 g', 'A2999',
              [S10], [TITANIO]),
    # El titanio solo existe en GPS + Cellular: se reconoce si el nombre dice titanio
    watch_s10('Apple Watch Series 10 (46 mm, titanio, GPS + Cellular)', 'apple-watch-series-10-46-titanio',
              ['IWATCH SERIE 10 46MM TITANIO'], 'titanio', True, ['Pizarra', 'Oro', 'Natural'], '41,7 g', 'A3003',
              [S10 + r'(?=.*' + TITANIO + ')'], []),
]

# ─── AirPods ──────────────────────────────────────────────────────────────────────────────────────────────────────
# Tech Specs de cada modelo (ids en FUENTES) y support.apple.com/en-us/109525 (identificar los AirPods).
# Salud auditiva en Bolivia: apple.com/airpods-pro/feature-availability (Bolivia no figura).

AIRPODS_SIN_PRO_NI_MAX = r'\b(pro|max)\b'
COMPATIBLES_HOY = ('iPhone, iPad, Mac, Apple Watch, Apple TV y Apple Vision Pro con su software más reciente · Con equipos '
                   'anteriores o de otras marcas funcionan como audífonos Bluetooth, con menos funciones')
BLANCO = ['Blanco']
COLORES_MAX = ['Medianoche', 'Blanco estelar', 'Azul', 'Morado', 'Naranja']

AIRPODS = [
    # support.apple.com/en-us/125135
    modelo('AirPods Pro 3', 'airpods-pro-3', 'airpods',
           ['AIRPODS PRO 3', 'AIRPODS PRO 3RA GEN', 'AIRPODS PRO 3 GEN'],
           sistema('AirPods', 'audifonos', [r'\bairpods pro\b.*\b(3|3ra|3era|3a|3rd|tercera)\b'], anio=2025, colores=BLANCO),
           {
               'chip': 'H2 de Apple · chip de banda ultraancha de segunda generación en el estuche',
               'audio': 'Controlador de alta excursión diseñado por Apple · Amplificador exclusivo de alto rango dinámico',
               'cancelacion_ruido': 'Cancelación Activa de Ruido · Audio Adaptativo · Modo Ambiente · Reconocimiento de Conversación',
               'audio_espacial': 'Audio Espacial personalizado con seguimiento dinámico de la cabeza · Ecualización Adaptativa',
               'funciones': 'Aislamiento de Voz · Volumen Personalizado · Reducción de Ruidos Altos · Grabación de audio con '
                            'calidad de estudio',
               'traduccion': 'Con un iPhone compatible con Apple Intelligence y iOS 26 o posterior; Los idiomas dependen de la región',
               'salud_auditiva': 'Prueba de Audición, función de audífono y Protección Auditiva; Apple no las ofrece en Bolivia',
               'microfonos': 'Dos micrófonos con tecnología beamforming · Micrófono orientado hacia adentro',
               'sensores': 'Frecuencia cardiaca en los entrenamientos · Detección de piel · Acelerómetros de movimiento y de voz',
               'controles': 'Control táctil: presiona para reproducir, contestar o cambiar de modo y desliza para el volumen · '
                            'Siri con la voz',
               'resistencia': 'IP57 al polvo, al sudor y al agua (audífonos y estuche)',
               'autonomia': 'Hasta 8 h con Cancelación Activa de Ruido · Hasta 24 h con el estuche',
               'carga': '5 minutos en el estuche dan cerca de 1 h de audio',
               'estuche': 'Estuche de carga MagSafe (USB‑C) con parlante para la app Encontrar y enganche para correa · Carga con '
                          'MagSafe, el cargador del Apple Watch, cargadores Qi o USB‑C',
               'bluetooth': '5.3',
               'banda_ultraancha': 'Chip de segunda generación en el estuche de carga',
               'compatibilidad': COMPATIBLES_HOY,
               'dimensiones': 'Cada audífono: 30,9 × 19,2 × 27 mm · Estuche: 47,2 × 62,2 × 21,8 mm',
               'peso': 'Cada audífono: 5,55 g · Estuche: 43,99 g',
               'modelo': 'A3063, A3064 y A3065',
               'generacion': '2025',
           },
           contenido(
               'AirPods Pro 3 con Cancelación Activa de Ruido, Audio Espacial personalizado, sensor de frecuencia cardiaca y '
               'resistencia IP57.',
               ['Los AirPods Pro 3 combinan Cancelación Activa de Ruido con Audio Adaptativo y Modo Ambiente, para que decidas '
                'cuánto del exterior escuchas. El Audio Espacial personalizado con seguimiento de la cabeza te pone en medio '
                'de la música y las películas.',
                'Miden tu frecuencia cardiaca en los entrenamientos, resisten el polvo, el sudor y el agua (IP57) y duran '
                'hasta 8 h con una carga. Su estuche MagSafe tiene parlante para encontrarlo con la app Encontrar. La '
                'Prueba de Audición y la función de audífono no están disponibles en Bolivia.'],
               ['Cancelación Activa de Ruido y Audio Adaptativo', 'Audio Espacial personalizado', 'Sensor de frecuencia cardiaca',
                'IP57: audífonos y estuche', 'Hasta 8 h de audio (24 h con el estuche)', 'Estuche MagSafe con parlante'],
               ['AirPods Pro 3', 'Estuche de carga MagSafe (USB‑C)', 'Almohadillas de silicona en cinco tamaños (XXS, XS, S, M y L)',
                'Documentación']),
           {'variante': 'pro'}),

    # support.apple.com/en-us/111834. Solo si el nombre dice USB‑C: «AIRPODS PRO 2DA GEN.» sin conector lo elige quien publica.
    modelo('AirPods Pro 2 (USB‑C)', 'airpods-pro-2-usb-c', 'airpods',
           ['AIRPODS PRO 2 USB C', 'AIRPODS PRO 2DA GEN USB C'],
           sistema('AirPods', 'audifonos', [r'^(?=.*\bairpods pro\b)(?=.*\b(2|2da|2a|2nd|segunda)\b)(?=.*\b(usb ?c|type ?c|tipo ?c)\b)'],
                   anio=2023, colores=BLANCO),
           {
               'chip': 'H2 de Apple · chip U1 en el estuche de carga MagSafe (USB‑C)',
               'audio': 'Controlador de alta excursión diseñado por Apple · Amplificador exclusivo de alto rango dinámico',
               'cancelacion_ruido': 'Cancelación Activa de Ruido · Audio Adaptativo · Modo Ambiente · Reconocimiento de Conversación',
               'audio_espacial': 'Audio Espacial personalizado con seguimiento dinámico de la cabeza · Ecualización Adaptativa',
               'funciones': 'Aislamiento de Voz · Volumen Personalizado · Reducción de Ruidos Altos',
               'salud_auditiva': 'Prueba de Audición, función de audífono y Protección Auditiva; Apple no las ofrece en Bolivia',
               'microfonos': 'Dos micrófonos con tecnología beamforming · Micrófono orientado hacia adentro',
               'sensores': 'Detección de piel · Acelerómetros de movimiento y de voz · Control táctil',
               'controles': 'Presiona una vez para reproducir, pausar o contestar · Dos veces para avanzar · Tres veces para retroceder · '
                            'Mantén presionado para cambiar de modo de audio · Desliza para ajustar el volumen',
               'resistencia': 'IP54 al polvo, al sudor y al agua (audífonos y estuche)',
               'autonomia': 'Hasta 6 h de audio (5,5 h con Audio Espacial y seguimiento de la cabeza) · Hasta 30 h con el estuche',
               'carga': '5 minutos en el estuche dan cerca de 1 h de audio',
               'estuche': 'Estuche de carga MagSafe (USB‑C) con parlante y enganche para correa · Carga con MagSafe, el cargador del '
                          'Apple Watch, cargadores Qi o USB‑C',
               'bluetooth': '5.3',
               'banda_ultraancha': 'Chip U1 en el estuche de carga',
               'puerto': 'USB‑C en el estuche',
               'compatibilidad': COMPATIBLES_HOY,
               'dimensiones': 'Cada audífono: 30,9 × 21,8 × 24 mm · Estuche: 45,2 × 60,6 × 21,7 mm',
               'peso': 'Cada audífono: 5,3 g · Estuche: 50,8 g',
               'modelo': 'A3047, A3048 y A3049',
               'generacion': '2023',
           },
           contenido(
               'AirPods Pro 2 con estuche USB‑C: Cancelación Activa de Ruido, Audio Adaptativo, Audio Espacial personalizado y '
               'resistencia IP54.',
               ['Los AirPods Pro 2 con chip H2 combinan Cancelación Activa de Ruido, Audio Adaptativo y Modo Ambiente, y bajan el '
                'volumen solos cuando empiezas a hablar con alguien (Reconocimiento de Conversación).',
                'Duran hasta 6 h con una carga y hasta 30 h con el estuche MagSafe (USB‑C), que tiene parlante y enganche para '
                'correa. Resisten el polvo, el sudor y el agua (IP54). La Prueba de Audición y la función de audífono no están '
                'disponibles en Bolivia.'],
               ['Cancelación Activa de Ruido y Audio Adaptativo', 'Audio Espacial personalizado', 'IP54: audífonos y estuche',
                'Hasta 6 h de audio (30 h con el estuche)', 'Estuche MagSafe (USB‑C) con parlante'],
               ['AirPods Pro 2', 'Estuche de carga MagSafe (USB‑C)', 'Almohadillas de silicona en cuatro tamaños (XS, S, M y L)',
                'Cable de carga USB‑C', 'Documentación']),
           {'variante': 'pro'}),

    # support.apple.com/en-us/111851. Solo si el nombre dice Lightning.
    modelo('AirPods Pro 2 (Lightning)', 'airpods-pro-2-lightning', 'airpods',
           ['AIRPODS PRO 2 LIGHTNING'],
           sistema('AirPods', 'audifonos', [r'^(?=.*\bairpods pro\b)(?=.*\b(2|2da|2a|2nd|segunda)\b)(?=.*\b(lightning|ligthning|lighting)\b)'],
                   anio=2022, colores=BLANCO),
           {
               'chip': 'H2 de Apple · chip U1 en el estuche de carga MagSafe',
               'audio': 'Controlador de alta excursión diseñado por Apple · Amplificador exclusivo de alto rango dinámico',
               'cancelacion_ruido': 'Cancelación Activa de Ruido · Modo Ambiente adaptable',
               'audio_espacial': 'Audio Espacial personalizado con seguimiento dinámico de la cabeza · Ecualización Adaptativa',
               'salud_auditiva': 'Prueba de Audición, función de audífono y Protección Auditiva; Apple no las ofrece en Bolivia',
               'microfonos': 'Dos micrófonos con tecnología beamforming · Micrófono orientado hacia adentro',
               'sensores': 'Detección de piel · Acelerómetros de movimiento y de voz · Control táctil',
               'controles': 'Presiona una vez para reproducir, pausar o contestar · Dos veces para avanzar · Tres veces para retroceder · '
                            'Mantén presionado para cambiar entre la cancelación y el Modo Ambiente · Desliza para ajustar el volumen',
               'resistencia': 'IPX4 al sudor y al agua (audífonos y estuche)',
               'autonomia': 'Hasta 6 h de audio (5,5 h con Audio Espacial y seguimiento de la cabeza) · Hasta 30 h con el estuche',
               'carga': '5 minutos en el estuche dan cerca de 1 h de audio',
               'estuche': 'Estuche de carga MagSafe con parlante y enganche para correa · Carga con MagSafe, el cargador del Apple '
                          'Watch, cargadores Qi o Lightning',
               'bluetooth': '5.3',
               'banda_ultraancha': 'Chip U1 en el estuche de carga',
               'puerto': 'Lightning en el estuche',
               'compatibilidad': COMPATIBLES_HOY,
               'dimensiones': 'Cada audífono: 30,9 × 21,8 × 24 mm · Estuche: 45,2 × 60,6 × 21,7 mm',
               'peso': 'Cada audífono: 5,3 g · Estuche: 50,8 g',
               'modelo': 'A2931, A2699 y A2698',
               'generacion': '2022',
           },
           contenido(
               'AirPods Pro 2 con estuche Lightning: Cancelación Activa de Ruido, Modo Ambiente adaptable y Audio Espacial '
               'personalizado.',
               ['Los AirPods Pro 2 con chip H2 tienen Cancelación Activa de Ruido y Modo Ambiente adaptable, y Audio Espacial '
                'personalizado con seguimiento dinámico de la cabeza.',
                'Duran hasta 6 h con una carga y hasta 30 h con el estuche MagSafe, que se carga por Lightning y tiene parlante y '
                'enganche para correa. Resisten el sudor y el agua (IPX4). La Prueba de Audición y la función de audífono no '
                'están disponibles en Bolivia.'],
               ['Cancelación Activa de Ruido', 'Audio Espacial personalizado', 'IPX4: audífonos y estuche',
                'Hasta 6 h de audio (30 h con el estuche)', 'Estuche MagSafe con parlante'],
               ['AirPods Pro 2', 'Estuche de carga MagSafe con parlante y enganche para correa',
                'Almohadillas de silicona en cuatro tamaños (XS, S, M y L)', 'Cable de Lightning a USB‑C', 'Documentación']),
           {'variante': 'pro'}),

    # support.apple.com/en-us/121203. Sin «ANC» ni «cancelación» en el nombre son los AirPods 4 (sin cancelación).
    modelo('AirPods 4', 'airpods-4', 'airpods',
           ['AIRPODS 4TA GEN', 'AIRPODS 4'],
           sistema('AirPods', 'audifonos', [r'\bairpods\b.*\b(4|4ta|4a|4th|cuarta)\b'],
                   [AIRPODS_SIN_PRO_NI_MAX, r'\b(anc|cancelacion|noise|ruido)\b'], anio=2024, colores=BLANCO),
           {
               'chip': 'H2',
               'audio': 'Controlador de alta excursión diseñado por Apple · Amplificador exclusivo de alto rango dinámico',
               'cancelacion_ruido': 'No tiene',
               'audio_espacial': 'Audio Espacial personalizado con seguimiento dinámico de la cabeza · Ecualización Adaptativa',
               'funciones': 'Aislamiento de Voz · Interacciones de Siri: asiente o niega con la cabeza para contestar o no',
               'microfonos': 'Dos micrófonos con tecnología beamforming · Micrófono orientado hacia adentro',
               'sensores': 'Sensor óptico de uso · Acelerómetros de movimiento y de voz · Sensor de fuerza',
               'controles': 'Presiona una vez para reproducir, pausar o contestar · Dos veces para avanzar · Tres veces para retroceder · Mantén presionado para activar Siri',
               'resistencia': 'IP54 al polvo, al sudor y al agua (audífonos y estuche)',
               'autonomia': 'Hasta 5 h con una carga · Hasta 30 h con el estuche',
               'carga': '5 minutos en el estuche dan cerca de 1 h de audio',
               'estuche': 'Estuche de carga USB‑C · Carga por el conector USB‑C',
               'bluetooth': '5.3',
               'compatibilidad': COMPATIBLES_HOY,
               'dimensiones': 'Cada audífono: 30,2 × 18,3 × 18,1 mm · Estuche: 46,2 × 50,1 × 21,2 mm',
               'peso': 'Cada audífono: 4,3 g · Estuche: 32,3 g',
               'modelo': 'A3053, A3050 y A3054',
               'generacion': '2024',
           },
           contenido(
               'AirPods 4 con chip H2, Audio Espacial personalizado y estuche USB‑C: diseño abierto, cómodo y resistente al '
               'polvo, al sudor y al agua.',
               ['Los AirPods 4 tienen un diseño abierto, sin almohadillas, con el chip H2 y Audio Espacial personalizado '
                'con seguimiento dinámico de la cabeza. El Aislamiento de Voz se enfoca en tu voz en las llamadas.',
                'Duran hasta 5 h con una carga y hasta 30 h con el estuche USB‑C, y resisten el polvo, el sudor y el agua '
                '(IP54). No tienen cancelación activa de ruido: esa función es de los AirPods 4 con cancelación activa de ruido.'],
               ['Chip H2', 'Audio Espacial personalizado', 'Aislamiento de Voz en llamadas', 'IP54: audífonos y estuche',
                'Hasta 30 h de audio con el estuche', 'Estuche de carga USB‑C'],
               ['AirPods 4', 'Estuche de carga (USB‑C)', 'Documentación']),
           {'variante': 'abiertos'}),

    # support.apple.com/en-us/121204. Solo si el nombre dice ANC o cancelación.
    modelo('AirPods 4 con cancelación activa de ruido', 'airpods-4-anc', 'airpods',
           ['AIRPODS 4 ANC'],
           sistema('AirPods', 'audifonos', [r'^(?=.*\bairpods\b)(?=.*\b(4|4ta|4a|4th|cuarta)\b)(?=.*\b(anc|cancelacion|noise|ruido)\b)'],
                   [AIRPODS_SIN_PRO_NI_MAX], anio=2024, colores=BLANCO),
           {
               'chip': 'H2',
               'audio': 'Controlador de alta excursión diseñado por Apple · Amplificador exclusivo de alto rango dinámico',
               'cancelacion_ruido': 'Cancelación Activa de Ruido · Audio Adaptativo · Modo Ambiente · Reconocimiento de Conversación',
               'audio_espacial': 'Audio Espacial personalizado con seguimiento dinámico de la cabeza · Ecualización Adaptativa',
               'funciones': 'Aislamiento de Voz · Interacciones de Siri: asiente o niega con la cabeza para contestar o no',
               'traduccion': 'Con un iPhone compatible con Apple Intelligence y iOS 26 o posterior; Los idiomas dependen de la región',
               'microfonos': 'Dos micrófonos con tecnología beamforming · Micrófono orientado hacia adentro',
               'sensores': 'Sensor óptico de uso · Acelerómetros de movimiento y de voz · Sensor de fuerza',
               'controles': 'Presiona una vez para reproducir, pausar o contestar · Dos veces para avanzar · Tres veces para retroceder · Mantén presionado para activar Siri',
               'resistencia': 'IP54 al polvo, al sudor y al agua (audífonos y estuche)',
               'autonomia': 'Hasta 4 h con Cancelación Activa de Ruido (5 h sin ella) · Hasta 20 h con el estuche (30 h sin ella)',
               'carga': '5 minutos en el estuche dan cerca de 1 h de audio',
               'estuche': 'Estuche de carga USB‑C con parlante para la app Encontrar · Carga con USB‑C, el cargador del Apple Watch '
                          'o cargadores Qi',
               'bluetooth': '5.3',
               'compatibilidad': COMPATIBLES_HOY,
               'dimensiones': 'Cada audífono: 30,2 × 18,3 × 18,1 mm · Estuche: 46,2 × 50,1 × 21,2 mm',
               'peso': 'Cada audífono: 4,3 g · Estuche: 34,7 g',
               'modelo': 'A3056, A3055 y A3057',
               'generacion': '2024',
           },
           contenido(
               'AirPods 4 con Cancelación Activa de Ruido, Audio Adaptativo y estuche con carga inalámbrica: diseño abierto '
               'con menos ruido alrededor.',
               ['Estos AirPods 4 suman Cancelación Activa de Ruido, Audio Adaptativo y Modo Ambiente a un diseño abierto, sin '
                'almohadillas, con el chip H2 y Audio Espacial personalizado.',
                'Duran hasta 4 h con la cancelación activa (5 h sin ella) y su estuche USB‑C carga también con el cargador del '
                'Apple Watch o cargadores Qi, y tiene parlante para encontrarlo con la app Encontrar.'],
               ['Cancelación Activa de Ruido y Audio Adaptativo', 'Chip H2', 'Audio Espacial personalizado',
                'IP54: audífonos y estuche', 'Estuche con carga inalámbrica y parlante', 'Hasta 20 h con el estuche y la cancelación activa'],
               ['AirPods 4 con cancelación activa de ruido', 'Estuche de carga inalámbrica (USB‑C)', 'Documentación']),
           {'variante': 'abiertos'}),

    # support.apple.com/en-us/126620. El nombre «MAX 2» es el modelo de 2026; el de 2024 es AirPods Max (USB‑C).
    modelo('AirPods Max 2', 'airpods-max-2', 'airpods',
           ['AIRPODS MAX 2 TYPE C', 'AIRPODS MAX 2'],
           sistema('AirPods', 'audifonos_diadema', [r'\bairpods max\b.*\b(2|2da|2nd|segunda)\b'], anio=2026, colores=COLORES_MAX),
           {
               'chip': 'H2 de Apple en cada audífono',
               'audio': 'Controlador dinámico diseñado por Apple · Amplificador exclusivo de alto rango dinámico',
               'cancelacion_ruido': 'Cancelación Activa de Ruido · Audio Adaptativo · Modo Ambiente · Reconocimiento de Conversación',
               'audio_espacial': 'Audio Espacial personalizado con seguimiento dinámico de la cabeza · Ecualización Adaptativa',
               'funciones': 'Aislamiento de Voz · Volumen Personalizado · Reducción de Ruidos Altos · Grabación de audio con '
                            'calidad de estudio',
               'traduccion': 'Con un iPhone compatible con Apple Intelligence y iOS 26.4 o posterior; Los idiomas dependen de la región',
               'microfonos': 'Nueve micrófonos: ocho para la Cancelación Activa de Ruido y tres para la voz (dos compartidos)',
               'sensores': 'Sensor óptico, de posición y detector de funda en cada audífono · Acelerómetros · Giroscopio',
               'controles': 'Digital Crown para el volumen, reproducir y contestar · Botón para cambiar de modo de audio',
               'autonomia': 'Hasta 20 h de audio con Cancelación Activa de Ruido',
               'carga': 'Por USB‑C · 5 minutos de carga dan cerca de 1,5 h de audio',
               'estuche': 'Smart Case: guardados en ella entran en un modo de consumo ultrabajo que conserva la carga',
               'bluetooth': '5.3',
               'puerto': 'USB‑C para cargar y para escuchar audio Lossless y con latencia ultrabaja por cable',
               'compatibilidad': COMPATIBLES_HOY,
               'dimensiones': '168,6 × 83,4 × 187,3 mm (ancho, profundidad y alto, con almohadillas)',
               'peso': '386,2 g · Smart Case: 134,5 g',
               'modelo': 'A3454',
               'generacion': '2026',
           },
           contenido(
               'AirPods Max 2 con chip H2, Cancelación Activa de Ruido, Audio Adaptativo y audio Lossless por USB‑C: sonido de '
               'alta fidelidad con diadema.',
               ['Los AirPods Max 2 llevan el chip H2 en cada audífono, con Cancelación Activa de Ruido, Audio Adaptativo y Modo '
                'Ambiente. El Audio Espacial personalizado con seguimiento dinámico de la cabeza envuelve la música y las '
                'películas.',
                'Por cable USB‑C reproducen audio Lossless y con latencia ultrabaja. Duran hasta 20 h con la cancelación activa, '
                'y la Digital Crown controla el volumen y la reproducción.'],
               ['Chip H2 en cada audífono', 'Cancelación Activa de Ruido y Audio Adaptativo', 'Audio Lossless por USB‑C',
                'Audio Espacial personalizado', 'Hasta 20 h de audio', 'Smart Case incluida'],
               ['AirPods Max 2', 'Smart Case', 'Cable de carga USB‑C', 'Documentación']),
           False),

    # support.apple.com/en-us/121205. Solo si el nombre dice USB‑C sin «2».
    modelo('AirPods Max (USB‑C)', 'airpods-max-usb-c', 'airpods',
           ['AIRPODS MAX USB C'],
           sistema('AirPods', 'audifonos_diadema', [r'\bairpods max\b.*\b(usb ?c|type ?c|tipo ?c)\b'],
                   [r'\bmax (2|2da|2nd|segunda)\b'], anio=2024, colores=COLORES_MAX),
           {
               'chip': 'H1 de Apple en cada audífono',
               'audio': 'Controlador dinámico diseñado por Apple',
               'cancelacion_ruido': 'Cancelación Activa de Ruido · Modo Ambiente',
               'audio_espacial': 'Audio Espacial personalizado con seguimiento dinámico de la cabeza · Ecualización Adaptativa',
               'microfonos': 'Nueve micrófonos: ocho para la Cancelación Activa de Ruido y tres para la voz (dos compartidos)',
               'sensores': 'Sensor óptico, de posición y detector de funda en cada audífono · Acelerómetros · Giroscopio',
               'controles': 'Digital Crown para el volumen, reproducir y contestar · Botón para cambiar entre cancelación y Modo Ambiente',
               'autonomia': 'Hasta 20 h de audio o de películas con Cancelación Activa de Ruido',
               'carga': 'Por USB‑C · 5 minutos de carga dan cerca de 1,5 h de audio',
               'estuche': 'Smart Case: guardados en ella entran en un modo de consumo ultrabajo que conserva la carga',
               'bluetooth': '5.0',
               'puerto': 'USB‑C para cargar y para escuchar audio Lossless por cable',
               'compatibilidad': COMPATIBLES_HOY,
               'dimensiones': '168,6 × 83,4 × 187,3 mm (ancho, profundidad y alto, con almohadillas)',
               'peso': '386,2 g · Smart Case: 134,5 g',
               'modelo': 'A3184',
               'generacion': '2024',
           },
           contenido(
               'AirPods Max con puerto USB‑C: Cancelación Activa de Ruido, Audio Espacial personalizado y audio Lossless por '
               'cable, con diadema.',
               ['Los AirPods Max (USB‑C) tienen el chip H1 en cada audífono, Cancelación Activa de Ruido y Modo Ambiente, y Audio '
                'Espacial personalizado con seguimiento dinámico de la cabeza.',
                'Se cargan por USB‑C y, con cable USB‑C, reproducen audio Lossless. Duran hasta 20 h con la cancelación activa.'],
               ['Cancelación Activa de Ruido y Modo Ambiente', 'Audio Espacial personalizado', 'Audio Lossless por USB‑C',
                'Digital Crown', 'Hasta 20 h de audio', 'Smart Case incluida'],
               ['AirPods Max', 'Smart Case', 'Cable de carga USB‑C', 'Documentación']),
           False),

    # support.apple.com/en-us/111855 (AirPods 1, 2016)
    modelo('AirPods (1.ª generación)', 'airpods-1', 'airpods',
           ['AIRPODS 1RA GEN.', 'AIRPODS 1'],
           sistema('AirPods', 'audifonos', [r'\bairpods\b.*\b(1|1ra|1era|1a|1st|primera)\b'], [AIRPODS_SIN_PRO_NI_MAX], anio=2016,
                   colores=BLANCO),
           {
               'chip': 'W1 de Apple',
               'funciones': 'Se encienden y se conectan solos al sacarlos del estuche · Pausan al quitártelos · Cambian de un '
                            'equipo Apple a otro',
               'microfonos': 'Dos micrófonos con tecnología beamforming',
               'sensores': 'Dos sensores ópticos · Acelerómetros de movimiento y de voz',
               'controles': 'Dos toques para activar Siri',
               'autonomia': 'Hasta 5 h con una carga · Más de 24 h con el estuche',
               'carga': '15 minutos en el estuche dan 3 h de audio',
               'estuche': 'Estuche de carga con conector Lightning',
               'bluetooth': 'Sí',
               'compatibilidad': 'iPhone y iPad con iOS 10 o posterior, Apple Watch con watchOS 3 o posterior y Mac con macOS Sierra '
                                 'o posterior',
               'dimensiones': 'Cada audífono: 16,5 × 18 × 40,5 mm · Estuche: 44,3 × 21,3 × 53,5 mm',
               'peso': 'Cada audífono: 4 g · Estuche: 38 g',
               'modelo': 'A1523 y A1722',
               'generacion': '2016',
           },
           contenido(
               'AirPods de primera generación con chip W1: se conectan solos a tu iPhone y duran más de 24 h con el estuche de '
               'carga.',
               ['Los AirPods de primera generación se encienden y se conectan a tu iPhone apenas los sacas del estuche, y la '
                'música se pausa cuando te los quitas. Con dos toques activas a Siri.',
                'El chip W1 cuida la batería: hasta 5 h de audio con una carga y más de 24 h con el estuche, que se carga por '
                'Lightning.'],
               ['Chip W1', 'Conexión automática con equipos Apple', 'Hasta 5 h de audio (más de 24 h con el estuche)',
                'Estuche con conector Lightning', 'Dos toques para Siri'],
               ['AirPods', 'Estuche de carga', 'Cable de Lightning a USB', 'Documentación']),
           {'variante': 'abiertos'}),
]

# ─── Accesorios de Apple ──────────────────────────────────────────────────────────────────────────────────────────

ACCESORIOS_APPLE = [
    # support.apple.com/en-us/121318 y compatibilidad: support.apple.com/en-us/108937
    modelo('Apple Pencil (USB‑C)', 'apple-pencil-usb-c', 'accesorio_apple',
           ['PENCIL USB C', 'PENCIL USB -C', 'APPLE PENCIL USB - C'],
           sistema('Accesorios Apple', 'lapiz', [r'\bpencil\b.*\b(usb ?c|type ?c|tipo ?c)\b'], [r'\bpro\b'], anio=2023, colores=BLANCO),
           {
               'funciones': 'Precisión al píxel · Baja latencia · Sensibilidad a la inclinación · Se adhiere con imanes al costado del '
                            'iPad para guardarlo · Puntero flotante con los iPad Pro (M4 y M5), el iPad Pro de 11 pulgadas '
                            '(4.ª generación), el de 12,9 pulgadas (6.ª generación) y los iPad Air (M2 y M3)',
               'carga': 'Se enlaza y se carga con un cable USB‑C (el cable no viene en la caja)',
               'bluetooth': 'Sí',
               'puerto': 'USB‑C',
               'compatibilidad': 'iPad (A16) y (10.ª generación) · iPad mini (A17 Pro) y (6.ª generación) · iPad Air de 11 y 13 '
                                 'pulgadas (M2, M3 y M4) y (4.ª y 5.ª generación) · iPad Pro de 11 y 13 pulgadas (M4 y M5), de '
                                 '11 pulgadas (1.ª a 4.ª generación) y de 12,9 pulgadas (3.ª a 6.ª generación) · Con iPadOS 17.1.1 o '
                                 'posterior',
               'dimensiones': '155 mm de largo · 8,9 mm de diámetro',
               'peso': '20,5 g',
               'generacion': '2023',
           },
           contenido(
               'Apple Pencil (USB‑C): precisión al píxel y baja latencia para tomar notas, dibujar y marcar documentos en tu iPad.',
               ['El Apple Pencil (USB‑C) escribe con precisión al píxel, baja latencia y sensibilidad a la inclinación: se siente '
                'natural para tomar apuntes, dibujar, marcar documentos o llevar un diario.',
                'Se enlaza y se carga con un cable USB‑C, que no viene en la caja, y se guarda pegado con imanes al costado del '
                'iPad. Funciona con el iPad (A16), el iPad mini (A17 Pro), los iPad Air y los iPad Pro compatibles.'],
               ['Precisión al píxel y baja latencia', 'Sensibilidad a la inclinación', 'Se guarda con imanes en el iPad',
                'Se enlaza y carga por USB‑C', 'Compatible con iPad (A16), iPad mini (A17 Pro), iPad Air y iPad Pro'],
               ['Apple Pencil (USB‑C)']),
           False),

    # support.apple.com/en-us/120123
    modelo('Apple Pencil Pro', 'apple-pencil-pro', 'accesorio_apple',
           ['PENCIL PRO', 'APPLE PENCIL PRO'],
           sistema('Accesorios Apple', 'lapiz', [r'\bpencil pro\b'], anio=2024, colores=BLANCO),
           {
               'funciones': 'Apretar para abrir la paleta de herramientas · Girar para controlar la pluma y el pincel · Respuesta '
                            'háptica · Puntero flotante · Doble toque para cambiar de herramienta · Se encuentra con la app Encontrar',
               'carga': 'Se adhiere, se enlaza y se carga con imanes al costado del iPad',
               'bluetooth': 'Sí',
               'compatibilidad': 'iPad Pro de 11 y 13 pulgadas (M4 y M5) · iPad Air de 11 y 13 pulgadas (M2, M3 y M4) · iPad mini '
                                 '(A17 Pro) · Con iPadOS 17.5 o posterior',
               'dimensiones': '166 mm de largo · 8,9 mm de diámetro',
               'peso': '19,15 g',
               'generacion': '2024',
           },
           contenido(
               'Apple Pencil Pro: apretar, girar y respuesta háptica para dibujar y tomar notas con más control en tu iPad.',
               ['Al apretar el Apple Pencil Pro aparece una paleta para cambiar de herramienta, grosor y color; al girarlo, su '
                'giroscopio controla la forma de la pluma y el pincel, y una respuesta háptica confirma cada acción.',
                'Con el puntero flotante ves dónde va a tocar antes de apoyarlo. Se adhiere, se enlaza y se carga con imanes al '
                'costado del iPad, y si lo pierdes, lo encuentras con la app Encontrar.'],
               ['Apretar y girar', 'Respuesta háptica', 'Puntero flotante', 'Se carga con imanes en el iPad',
                'Se encuentra con la app Encontrar'],
               ['Apple Pencil Pro']),
           False),

    # support.apple.com/en-us/111889
    modelo('Apple Pencil (2.ª generación)', 'apple-pencil-2', 'accesorio_apple',
           ['PENCIL 2DA GEN', 'APPLE PENCIL 2DA GEN.'],
           sistema('Accesorios Apple', 'lapiz', [r'\bpencil\b.*\b(2|2da|2a|2nd|segunda)\b'], [r'\b(pro|usb ?c|type ?c|tipo ?c)\b'],
                   anio=2018, colores=BLANCO),
           {
               'funciones': 'Precisión al píxel · Baja latencia · Doble toque para cambiar de herramienta · Puntero flotante con el '
                            'iPad Pro de 11 pulgadas (4.ª generación) y el de 12,9 pulgadas (6.ª generación)',
               'carga': 'Se adhiere, se enlaza y se carga con imanes al costado del iPad',
               'bluetooth': 'Sí',
               'compatibilidad': 'iPad Pro de 11 pulgadas (1.ª a 4.ª generación) · iPad Pro de 12,9 pulgadas (3.ª a 6.ª generación) · '
                                 'iPad Air (4.ª y 5.ª generación) · iPad mini (6.ª generación)',
               'dimensiones': '166 mm de largo · 8,9 mm de diámetro',
               'peso': '18,2 g',
               'generacion': '2018',
           },
           contenido(
               'Apple Pencil (2.ª generación): precisión al píxel, baja latencia y doble toque para cambiar de herramienta.',
               ['El Apple Pencil (2.ª generación) escribe con precisión al píxel y baja latencia: sirve para dibujar, colorear, '
                'tomar apuntes y marcar PDF.',
                'Con un doble toque cambias de herramienta sin soltarlo, y se adhiere, se enlaza y se carga con imanes al costado '
                'del iPad. Funciona con los iPad Pro de 11 pulgadas (1.ª a 4.ª generación) y de 12,9 pulgadas (3.ª a 6.ª '
                'generación), los iPad Air de 4.ª y 5.ª generación y el iPad mini de 6.ª generación.'],
               ['Precisión al píxel y baja latencia', 'Doble toque para cambiar de herramienta', 'Se carga con imanes en el iPad'],
               ['Apple Pencil (2.ª generación)']),
           False),

    # support.apple.com/en-us/121931. Solo si el nombre dice USB‑C.
    modelo('Magic Mouse (USB‑C)', 'magic-mouse-usb-c', 'accesorio_apple',
           ['MAGIC MOUSE USB C'],
           sistema('Accesorios Apple', 'mouse', [r'\bmagic mouse\b.*\b(usb ?c|type ?c|tipo ?c)\b'], anio=2024, colores=['Blanco', 'Negro']),
           {
               'funciones': 'Superficie Multi‑Touch: desliza entre páginas y desplázate por documentos con gestos · Inalámbrico y '
                            'recargable',
               'autonomia': 'Un mes o más con una carga',
               'carga': 'Se enlaza y se carga con el cable USB‑C que viene en la caja',
               'bluetooth': 'Sí',
               'puerto': 'USB‑C',
               'compatibilidad': 'Mac con macOS 15.1 o posterior · iPad con iPadOS 18.1 o posterior',
               'dimensiones': '2,16 × 5,71 × 11,35 cm (alto, ancho y profundidad)',
               'peso': '99 g',
               'generacion': '2024',
           },
           contenido(
               'Magic Mouse con puerto USB‑C: inalámbrico, recargable y con superficie Multi‑Touch para moverte con gestos.',
               ['El Magic Mouse tiene una superficie Multi‑Touch para deslizar entre páginas web y desplazarte por documentos '
                'con gestos simples, y una base que se desliza suave sobre el escritorio.',
                'Su batería dura un mes o más con una carga. Se enlaza y se carga con un cable USB‑C, que viene en la caja, y se '
                'conecta solo a tu Mac. También funciona con iPad con iPadOS 18.1 o posterior.'],
               ['Superficie Multi‑Touch', 'Puerto USB‑C', 'Batería de un mes o más', 'Cable USB‑C incluido',
                'Para Mac y iPad'],
               ['Magic Mouse', 'Cable de carga USB‑C']),
           False),

    # support.apple.com/en-us/111885 (Magic Mouse con Lightning; Apple lo llamó Magic Mouse 2). Solo si el nombre dice
    # Lightning o «2».
    modelo('Magic Mouse (Lightning)', 'magic-mouse-lightning', 'accesorio_apple',
           ['MAGIC MOUSE 2'],
           sistema('Accesorios Apple', 'mouse', [r'\bmagic mouse\b.*\b(lightning|ligthning|lighting|2)\b'], [r'\b(usb ?c|type ?c|tipo ?c)\b'], anio=2015,
                   colores=['Blanco', 'Negro']),
           {
               'funciones': 'Superficie Multi‑Touch: desliza entre páginas y desplázate por documentos con gestos · Inalámbrico y '
                            'recargable',
               'autonomia': 'Un mes o más con una carga',
               'carga': 'Se enlaza y se carga con un cable de USB‑C a Lightning',
               'bluetooth': 'Sí',
               'puerto': 'Lightning',
               'compatibilidad': 'Mac con Bluetooth y OS X 10.11 o posterior · iPad con iPadOS 13.4 o posterior',
               'dimensiones': '2,16 × 5,71 × 11,35 cm (alto, ancho y profundidad)',
               'peso': '99 g',
               'generacion': '2015',
           },
           contenido(
               'Magic Mouse con puerto Lightning: inalámbrico, recargable y con superficie Multi‑Touch para moverte con gestos.',
               ['El Magic Mouse tiene una superficie Multi‑Touch para deslizar entre páginas web y desplazarte por documentos '
                'con gestos simples, y una base que se desliza suave sobre el escritorio.',
                'Su batería dura un mes o más con una carga y se carga por Lightning. Funciona con Mac con Bluetooth y con iPad '
                'con iPadOS 13.4 o posterior.'],
               ['Superficie Multi‑Touch', 'Puerto Lightning', 'Batería de un mes o más', 'Para Mac y iPad'],
               ['Magic Mouse', 'Cable de USB‑C a Lightning']),
           False),
]

# ─── Otras marcas cargadas en «Productos Apple» ──────────────────────────────────────────────────────────────────
# Casos puntuales del inventario (el usuario, 2026-09-16): tienen su ficha para publicarse bien, pero NO entran en la
# comparativa de productos Apple (familia «otra_marca», excluida en ComparadorModelosController). Fuente: la página de la
# marca; si la marca no publica el producto en su sitio, su publicación oficial en Amazon; si no se puede saber el modelo
# exacto, solo lo que dice su nombre, con lo demás como «falta».

OTRAS_MARCAS = [
    # samsung.com/levant … sm-x910nzaamea (tabla «Specifications» del modelo Wi‑Fi de 256 GB)
    modelo('Samsung Galaxy Tab S9 Ultra Wi‑Fi', 'samsung-galaxy-tab-s9-ultra-wifi', 'otra_marca',
           ['SAMSUNG GALAXY TAB S9 ULTRA', 'GALAXY TAB S9 ULTRA'],
           sistema('Otras marcas', 'tablet', [r'\bgalaxy tab s9 ultra\b'], celular=False, colores=['Grafito', 'Beige']),
           {
               'tamano_pantalla': '14,6 pulgadas (369,9 mm)',
               'pantalla': 'Dynamic AMOLED 2X',
               'resolucion': '2.960 × 1.848 px (WQXGA+)',
               'funciones_pantalla': 'Hasta 120 Hz · HDR10+',
               'chip': 'Snapdragon 8 Gen 2 for Galaxy',
               'cpu_cores': 'Ocho núcleos (3,36 GHz, 2,8 GHz y 2 GHz)',
               'ram': '12 GB',
               'camara_principal': '13 MP y ultra gran angular de 8 MP · autoenfoque · flash',
               'video': '4K (3840 × 2160) a 30 fps',
               'camara_frontal': '12 MP y ultra gran angular de 12 MP',
               'audio': 'Cuatro parlantes AKG con Dolby Atmos',
               'funciones': 'S Pen incluido, resistente al agua y al polvo (IP68) · Memoria ampliable con microSD de hasta 1 TB',
               'resistencia': 'IP68 (tablet y S Pen); Probado sumergido hasta 1,5 m en agua dulce por 30 minutos; no se recomienda para playa ni piscina',
               'autonomia': 'Hasta 16 h de reproducción de video · Hasta 10 h de navegación por Wi‑Fi',
               'bateria_wh': '11.200 mAh',
               'wifi': 'Wi‑Fi 802.11 a/b/g/n/ac/ax en 2,4, 5 y 6 GHz',
               'bluetooth': '5.3',
               'puerto': 'USB‑C (USB 3.2 Gen 1)',
               'gps': 'GPS, GLONASS, BeiDou, Galileo y QZSS',
               'biometria': 'Sensor de huellas',
               'material': 'Marco de Armor Aluminum',
               'dimensiones': '326,4 × 208,6 × 5,5 mm',
               'peso': '732 g',
               'modelo': 'SM-X910',
               'fabricante': 'Samsung',
           },
           contenido(
               'Samsung Galaxy Tab S9 Ultra Wi‑Fi: pantalla Dynamic AMOLED 2X de 14,6 pulgadas a 120 Hz, Snapdragon 8 Gen 2 y '
               'S Pen incluido, con resistencia IP68.',
               ['La Galaxy Tab S9 Ultra tiene una pantalla Dynamic AMOLED 2X de 14,6 pulgadas con HDR10+ y hasta 120 Hz, cuatro '
                'parlantes AKG con Dolby Atmos y el procesador Snapdragon 8 Gen 2 for Galaxy con 12 GB de RAM.',
                'Resiste el agua y el polvo (IP68), igual que el S Pen que viene en la caja, tiene marco de Armor Aluminum y '
                'una batería de 11.200 mAh con hasta 16 h de video.'],
               ['Pantalla de 14,6 pulgadas a 120 Hz', 'Snapdragon 8 Gen 2 for Galaxy con 12 GB de RAM', 'S Pen incluido',
                'Resistencia IP68', 'Batería de 11.200 mAh', 'Cuatro parlantes AKG'],
               ['Galaxy Tab S9 Ultra', 'S Pen']),
           {'alto_mm': 326.4, 'ancho_mm': 208.6}),

    # samsung.com/uk … sm-x406bzareub (tabla «Specifications» del 5G de 128 GB) y samsung.com/us/tablets/galaxy-tab-s10-lite
    modelo('Samsung Galaxy Tab S10 Lite 5G', 'samsung-galaxy-tab-s10-lite-5g', 'otra_marca',
           ['SAMSUNG GALAXY TAB S10 LITE 5G'],
           sistema('Otras marcas', 'tablet', [r'\bgalaxy tab s10 lite\b'], celular=True, colores=['Gris', 'Plata', 'Coralred']),
           {
               'tamano_pantalla': '10,9 pulgadas (277 mm)',
               'pantalla': 'TFT',
               'resolucion': '2.112 × 1.320 px (WUXGA+)',
               'funciones_pantalla': '90 Hz · Reducción de luz azul con certificación SGS',
               'chip': 'Exynos 1380',
               'cpu_cores': 'Ocho núcleos (2,4 GHz y 2 GHz)',
               'ram': '6 GB con 128 GB · 8 GB con 256 GB',
               'camara_principal': '8 MP con autoenfoque',
               'video': 'Full HD (1920 × 1080) a 30 fps',
               'camara_frontal': '5 MP',
               'funciones': 'S Pen incluido · Memoria ampliable con microSD de hasta 2 TB · Hasta 7 generaciones de Android y 7 años de '
                            'parches de seguridad desde su lanzamiento mundial',
               'autonomia': 'Hasta 16 h de reproducción de video',
               'bateria_wh': '8.000 mAh',
               'carga': 'Carga súper rápida',
               'red': '5G (sub‑6), 4G LTE, 3G y 2G',
               'sim': 'Una SIM',
               'wifi': 'Wi‑Fi 802.11 a/b/g/n/ac/ax en 2,4 y 5 GHz',
               'bluetooth': '5.3',
               'puerto': 'USB‑C (USB 2.0)',
               'gps': 'GPS, GLONASS, BeiDou, Galileo y QZSS',
               'dimensiones': '254,3 × 165,8 × 6,6 mm',
               'peso': '524 g',
               'modelo': 'SM-X406B',
               'fabricante': 'Samsung',
           },
           contenido(
               'Samsung Galaxy Tab S10 Lite 5G: pantalla de 10,9 pulgadas a 90 Hz, S Pen incluido, batería de 8.000 mAh y '
               'conexión 5G.',
               ['La Galaxy Tab S10 Lite tiene una pantalla de 10,9 pulgadas a 90 Hz con reducción de luz azul certificada por SGS, '
                'el procesador Exynos 1380 y 6 GB de RAM con 128 GB (8 GB con 256 GB), ampliables con microSD de hasta 2 TB.',
                'Trae el S Pen en la caja, se conecta a redes 5G con una SIM y su batería de 8.000 mAh da hasta 16 h de video. '
                'Samsung le promete hasta 7 generaciones de Android y 7 años de parches de seguridad desde su lanzamiento mundial.'],
               ['Pantalla de 10,9 pulgadas a 90 Hz', 'S Pen incluido', '5G con una SIM', 'Batería de 8.000 mAh',
                'microSD de hasta 2 TB', 'Hasta 7 generaciones de Android'],
               ['Galaxy Tab S10 Lite', 'S Pen', 'Cable de datos USB‑C', 'Pin para la bandeja de SIM y microSD']),
           {'alto_mm': 254.3, 'ancho_mm': 165.8}),

    # K&F Concept no publica el M5 en su sitio: amazon.com/dp/B0GGBH368Y (publicación oficial de K&F CONCEPT)
    modelo('K&F Concept M5: monitor selfie inalámbrico de 5 pulgadas', 'kf-concept-m5', 'otra_marca',
           ['K&F CONCEPT MONITOR PORTÁTIL 5" M5', 'K&F Monitor Portatil 5"'],
           sistema('Otras marcas', 'monitor', [r'^(?=.*\bk ?f\b)(?=.*\b(m5|monitor)\b)']),
           {
               'tamano_pantalla': '5 pulgadas',
               'pantalla': 'IPS táctil con dos dedos (deslizar y pellizcar para hacer zoom)',
               'resolucion': '1.920 × 1.080 px (Full HD)',
               'funciones': 'Muestra lo que ve la cámara trasera del celular para grabarte con ella · Espejo inalámbrico P2P en 2,4 y 5,8 GHz '
                            'sin usar el Wi‑Fi del celular · Control remoto por Bluetooth hasta 164 ft (unos 50 m) · 8 idiomas',
               'autonomia': 'Hasta 4,5 h transmitiendo · Hasta 6,5 h solo como monitor; La duración cambia con la temperatura',
               'bateria_wh': '2.600 mAh',
               'carga': 'Se puede usar mientras carga',
               'bluetooth': '5.4',
               'compatibilidad': 'iPhone y celulares Android (según la marca, no es compatible con los celulares Google)',
               'material': 'Cuerpo de aluminio mecanizado CNC · 17 + 2 imanes N52 (9,8 N) para pegarse al celular o a su funda',
               'peso': '150 g',
               'modelo': 'M5',
               'fabricante': 'K&F Concept',
           },
           contenido(
               'Monitor selfie K&F Concept M5 de 5 pulgadas: se pega con imanes al celular y te muestra lo que graba la cámara '
               'trasera, sin cables.',
               ['El K&F Concept M5 es una pantalla táctil Full HD de 5 pulgadas que se pega con imanes al celular y muestra lo '
                'que ve la cámara trasera: así te grabas con la mejor cámara y ves el encuadre.',
                'Se conecta sin cables por P2P en 2,4 y 5,8 GHz, sin usar el Wi‑Fi del celular, y su batería de 2.600 mAh dura '
                'hasta 4,5 h transmitiendo. Funciona con iPhone y Android; según la marca, no con los celulares Google.'],
               ['Pantalla táctil Full HD de 5 pulgadas', 'Se pega con imanes al celular', 'Conexión inalámbrica P2P',
                'Batería de 2.600 mAh', 'Cuerpo de aluminio de 150 g'],
               ['Monitor de 5 pulgadas', 'Cable de carga', 'Anillo magnético', 'Manual']),
           False),

    # Torras COOLiTE, modelo FG2 (el usuario, 2026-09-16: serie FG2X…). En coolify.torraslife.com el FG2 negro es el
    # «COOLiTE - Black», pero su página ya no está publicada: los datos salen de la publicación oficial de TORRAS en Amazon
    # (amazon.com/dp/B0GM5YCTC5, «Model Number: FG2»). El peso sale de la caja de la unidad: esa página dice 10,4 y 10,9 oz.
    modelo('Torras COOLiTE: ventilador portátil de cuello', 'torras-coolite-fg2', 'otra_marca',
           ['TORRAS COOLITE VENTILADOR PORTÁTIL DE CUELLO', 'TORRAS VENTILADOR PORTÁTIL DE CUELLO'],
           sistema('Otras marcas', 'ventilador_cuello', [r'^(?=.*\btorras\b)(?=.*\b(ventilador|fan|coolite)\b)']),
           {
               'funciones': '4 ventiladores de hasta 8.450 rpm · Dos modos (los 2 ventiladores delanteros o los 4) con 3 velocidades cada '
                            'uno · Sin aspas a la vista: la malla evita que se enrede el pelo · Plegable a la mitad de su tamaño',
               'autonomia': 'Hasta 14 h en el modo más suave · De 2,5 a 4 h a máxima potencia',
               'bateria_wh': '4.000 mAh',
               'carga': 'Carga rápida por USB‑C',
               'peso': '321 g',
               'modelo': 'FG2',
               'fabricante': 'Torras',
           },
           contenido(
               'Torras COOLiTE: ventilador de cuello con 4 ventiladores, batería de 4.000 mAh de hasta 14 h y diseño plegable.',
               ['El Torras COOLiTE se lleva colgado del cuello y tiene 4 ventiladores de hasta 8.450 rpm: puedes usar solo los dos '
                'delanteros o los cuatro, con 3 velocidades en cada modo. La malla sin aspas a la vista evita que se enrede el pelo.',
                'Su batería de 4.000 mAh dura hasta 14 h en el modo más suave y de 2,5 a 4 h a máxima potencia, y se carga rápido '
                'por USB‑C. Se pliega a la mitad de su tamaño para llevarlo en la mochila.'],
               ['4 ventiladores de hasta 8.450 rpm', 'Hasta 14 h de batería', 'Carga rápida por USB‑C', 'Sin aspas a la vista',
                'Plegable'],
               ['Ventilador de cuello Torras COOLiTE']),
           False),
]

MODELOS = IPADS + RELOJES + AIRPODS + ACCESORIOS_APPLE + OTRAS_MARCAS

# De dónde sale cada ficha. «RAM» y «Salió con» del iPad: Apple no los publica; coinciden las fuentes citadas.
RAM_A16 = ('RAM de 6 GB (Apple no la publica): coinciden macrumors.com/roundup/ipad («The iPad 11 has 6GB RAM»), el infobox de '
           'Wikipedia «iPad (11th generation)» y everymac.com (A3354: «third-party software analysis has determined that iPad '
           'A16 models have 6 GB of RAM»).')
RAM_MINI = ('RAM de 8 GB (Apple no la publica): coinciden macrumors.com/roundup/ipad-mini («The iPad mini 7 has 8GB RAM»), el '
            'infobox de Wikipedia «iPad Mini (A17 Pro)», everymac.com (A2993) y 9to5mac.com (primeros benchmarks, 2024-10-18).')
SALIO_CON = 'Sistema con el que salió: Wikipedia (infobox) y everymac.com («Pre-Installed OS») coinciden en la versión principal.'
IPADOS_27 = 'Último iPadOS: support.apple.com/guide/ipad/ipad213a25b2 (iPad compatibles con iPadOS 27, 2026-09-14).'
AI = 'Apple Intelligence: support.apple.com/en-us/121115 (lista de equipos compatibles; el iPad (A16) no figura).'
WATCH = ['Último watchOS y iPhone necesario: support.apple.com/en-us/108926.',
         'watchOS con el que salió: apple.com/newsroom/2024/09/introducing-apple-watch-series-10.',
         'Disponibilidad en Bolivia: apple.com/watchos/feature-availability (Bolivia figura en Oxígeno en Sangre; no en ECG, '
         'ritmo irregular ni apnea del sueño).',
         'Números de modelo: support.apple.com/en-us/108056.']
AIRPODS_ID = 'Números de modelo: support.apple.com/en-us/109525.'


def fuentes_ipad(slug, id_, extra):
    return {f'{slug}-wifi': [EN.format(id=id_), LAMR.format(id=id_), *extra, 'Números de modelo: support.apple.com/en-us/108043.']}


FUENTES = {
    **fuentes_ipad('ipad-a16', 122240, [RAM_A16, SALIO_CON, IPADOS_27, AI, 'Pantalla de 11 pulgadas: apple.com/ipad-11/specs.']),
    **fuentes_ipad('ipad-mini-a17-pro', 121456, [RAM_MINI, SALIO_CON, IPADOS_27]),
    **fuentes_ipad('ipad-air-11-m4', 126471, [SALIO_CON, IPADOS_27]),
    **fuentes_ipad('ipad-air-13-m4', 126472, [SALIO_CON, IPADOS_27]),
    'apple-watch-series-10-46-aluminio-gps-cellular': [EN.format(id=121202), LAMR.format(id=121202), *WATCH],
    'apple-watch-series-10-46-aluminio-gps': [EN.format(id=121202), LAMR.format(id=121202), *WATCH],
    'apple-watch-series-10-46-titanio': [EN.format(id=121202), LAMR.format(id=121202), *WATCH],
    'airpods-pro-3': [EN.format(id=125135), LAMR.format(id=125135), AIRPODS_ID,
                      'Salud auditiva en Bolivia: apple.com/airpods-pro/feature-availability (Bolivia no figura).',
                      'Traducción en Vivo: apple.com/ios/feature-availability (idiomas).'],
    'airpods-4': [EN.format(id=121203), LAMR.format(id=121203), AIRPODS_ID],
    'airpods-4-anc': [EN.format(id=121204), LAMR.format(id=121204), AIRPODS_ID],
    'airpods-max-2': [EN.format(id=126620), LAMR.format(id=126620), AIRPODS_ID],
    'airpods-max-usb-c': [EN.format(id=121205), LAMR.format(id=121205), AIRPODS_ID,
                          'Peso: 386,2 g en EE. UU. y 384,8 g en es-lamr; vale el de EE. UU.'],
    'airpods-1': [EN.format(id=111855), LAMR.format(id=111855), AIRPODS_ID],
    'apple-pencil-usb-c': [EN.format(id=121318), LAMR.format(id=121318), 'Compatibilidad: support.apple.com/en-us/108937.'],
    'apple-pencil-pro': [EN.format(id=120123), LAMR.format(id=120123)],
    'apple-pencil-2': [EN.format(id=111889), LAMR.format(id=111889)],
    'airpods-pro-2-usb-c': [EN.format(id=111834), LAMR.format(id=111834), AIRPODS_ID,
                            'Salud auditiva en Bolivia: apple.com/airpods-pro/feature-availability (Bolivia no figura).'],
    'airpods-pro-2-lightning': [EN.format(id=111851), LAMR.format(id=111851), AIRPODS_ID,
                                'Salud auditiva en Bolivia: apple.com/airpods-pro/feature-availability (Bolivia no figura).'],
    **{f'ipad-pro-{p}-{c.lower()}-wifi': [EN.format(id=i), LAMR.format(id=i), SALIO_CON, IPADOS_27, 'Números de modelo: support.apple.com/en-us/108043.']
       for (c, p), i in {('M4', 11): 119892, ('M4', 13): 119891, ('M5', 11): 125406, ('M5', 13): 125407}.items()},
    'magic-mouse-usb-c': [EN.format(id=121931), LAMR.format(id=121931)],
    'magic-mouse-lightning': [EN.format(id=111885), LAMR.format(id=111885)],
    'ipad-pro-11-m5-wifi-cellular': [EN.format(id=125406), LAMR.format(id=125406), SALIO_CON, IPADOS_27, 'Números de modelo: support.apple.com/en-us/108043.'],
    'samsung-galaxy-tab-s9-ultra-wifi': ['samsung.com/levant/tablets/galaxy-tab-s/galaxy-tab-s9-ultra-wi-fi-graphite-256gb-sm-x910nzaamea (tabla Specifications, IP68, AKG, Armor Aluminum)'],
    'samsung-galaxy-tab-s10-lite-5g': ['samsung.com/uk/tablets/galaxy-tab-s/galaxy-tab-s10-lite-grey-128gb-5g-sm-x406bzareub (tabla Specifications, 90 Hz y SGS)',
                                       'samsung.com/us/tablets/galaxy-tab-s10-lite (Exynos 1380, 8 GB con 256 GB, qué trae la caja, carga súper rápida y actualizaciones)'],
    'kf-concept-m5': ['amazon.com/dp/B0GGBH368Y (publicación oficial de K&F CONCEPT; la marca no lo publica en kentfaith.com)'],
    'torras-coolite-fg2': ['amazon.com/dp/B0GM5YCTC5 (publicación oficial de TORRAS, «Model Number: FG2»)',
                           'coolify.torraslife.com (el FG2 negro figura como «COOLiTE - Black»; su página ya no está publicada)',
                           'Peso: 321 g, impreso en la caja de la unidad (lo leyó el usuario el 2026-09-16; Amazon dice 10,4 y 10,9 oz).'],
}

cabecera = """<?php

/*
 * Fichas de productos Apple para la tienda (categoría «Más Apple»): iPad, Apple Watch, AirPods, Apple Pencil y Magic Mouse.
 *
 * - Solo los modelos que hay o hubo en el inventario, y la otra variante cuando el nombre deja dudas (si un equipo se
 *   vende, su ficha queda). La capacidad, el color y la batería salen de cada unidad.
 * - Fuente: la ficha técnica de Apple de EE. UU. (support.apple.com/en-us) con los nombres de la de Latinoamérica; lo que
 *   Apple no publica, de fuentes independientes que coinciden. Detalle: docs/admin-ui/informes/productos-apple-2026-09-16.md.
 * - Esquema: App\\Support\\FichaTecnica\\EsquemaProductoApple. Textos: TextosAccesorio. Descripción: ContenidoProductoApple.
 *     php artisan modelos:verificar   ·   php artisan db:seed --class=ModelosReferenciaSeeder
 * - Los precios NO van aquí: salen del inventario de la tienda.
 * - Generado con herramientas/generar_productos_apple.py: no se edita a mano.
 */

return """

if __name__ == '__main__':
    slugs = [m['slug'] for m in MODELOS]
    assert len(slugs) == len(set(slugs)), 'slugs repetidos'
    for m in MODELOS:
        assert m['slug'] in FUENTES, f"{m['slug']} sin fuente"
        assert len(m['datos']['contenido']['resumen']) <= 240, f"{m['slug']}: resumen largo"
    salida = cabecera + '[\n' + ''.join('    ' + php(m, 1) + ',\n' for m in MODELOS) + '];\n'
    (Path(__file__).resolve().parents[1] / 'productos_apple.php').write_text(salida)
    print(len(MODELOS), 'modelos escritos')
