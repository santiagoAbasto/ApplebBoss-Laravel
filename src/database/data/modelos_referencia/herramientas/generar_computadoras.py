"""
Genera database/data/modelos_referencia/computadora.php (fichas de Mac para la tienda y la comparativa).

Uso:  python3 generar_computadoras.py
Después: php artisan modelos:verificar · php artisan db:seed --class=ModelosReferenciaSeeder

Solo los modelos que hay (o hubo) en el inventario, a pedido del usuario (2026-09-15); si un equipo se vende, su ficha
queda. Fuente principal: la ficha técnica oficial de Apple de cada modelo (support.apple.com/es-lamr/<id>), en español
de Latinoamérica. Lo que esa ficha no trae sale de otras páginas oficiales de Apple (listas de compatibilidad de macOS e
«Identificar el modelo») y, si no hay, de everymac.com. Cada fuente queda en FUENTES y en
docs/admin-ui/informes/computadoras-2026-09-15.md. Los precios NO van aquí: salen del inventario.
"""
from pathlib import Path


def php(v, ind=0):
    """Mismo formato de salida que generar_iphone.py (sin importarlo: ese script escribe al cargarse)."""
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


APPLE = 'https://support.apple.com/es-lamr/'
LAMR = 'Ficha técnica oficial de Apple (' + APPLE + '{id}).'

# ── Piezas comunes ──
MAGSAFE3 = 'Puerto de carga MagSafe 3'
JACK = 'Entrada de 3.5 mm para audífonos'
JACK_HI = 'Entrada de 3.5 mm para audífonos con compatibilidad avanzada para audífonos de alta impedancia'
TB4_2 = 'Dos puertos Thunderbolt 4 (USB‑C) con carga, DisplayPort, Thunderbolt 4 y USB 4 (hasta 40 Gb/s)'
TB_USB4_2 = 'Dos puertos Thunderbolt / USB 4 con carga, DisplayPort, Thunderbolt 3 y USB 4 (hasta 40 Gb/s)'
TB4_3 = 'Tres puertos Thunderbolt 4 (USB‑C) con carga, DisplayPort, Thunderbolt 4 y USB 4 (hasta 40 Gb/s)'
TB5_3 = 'Tres puertos Thunderbolt 5 (USB‑C) con carga, DisplayPort, Thunderbolt 5 y USB 4 (hasta 120 Gb/s)'
HDMI = 'Puerto HDMI'
SDXC = 'Ranura para tarjeta SDXC'
TB3_2 = 'Dos puertos Thunderbolt 3 (USB‑C) con carga, DisplayPort, Thunderbolt (hasta 40 Gb/s) y USB 3.1 de 2.ª generación (hasta 10 Gb/s)'

TECLADO_TOUCH_ID = 'Magic Keyboard retroiluminado con Touch ID y sensor de luz ambiental'
FORCE_TOUCH = 'Force Touch, con clics fuertes, trazos sensibles a la presión y gestos Multi‑Touch'
MICS_3 = 'Tres micrófonos con tecnología beamforming direccional (Aislamiento de Voz y Espectro Amplio)'
MICS_3_PRO = 'Tres micrófonos con calidad de estudio, alta relación señal/ruido y beamforming direccional'
AUDIO_4 = 'Cuatro parlantes con Audio Espacial al reproducir contenido Dolby Atmos'
AUDIO_6 = 'Seis parlantes con woofers con cancelación de fuerza y Audio Espacial (Dolby Atmos)'
AUDIO_6_PRO = 'Seis parlantes de alta fidelidad con woofers con cancelación de fuerza, amplio sonido estéreo y Audio Espacial (Dolby Atmos)'
CAM_12 = 'Cámara Center Stage de 12 MP con Vista del Escritorio (video en 1080p)'
CAM_1080 = 'Cámara FaceTime HD de 1080p'
COLORES_AIR_M3 = ['Plata', 'Blanco estelar', 'Gris espacial', 'Medianoche']
RECICLADO = 'Aluminio 100 % reciclado'
COLORES_AIR_M4 = ['Azul cielo', 'Plata', 'Blanco estelar', 'Medianoche']
COLORES_PRO = ['Negro espacial', 'Plata']
COLORES_IMAC = ['Azul', 'Morado', 'Rosa', 'Naranja', 'Amarillo', 'Verde', 'Plata']
PANTALLA_AIR = {'nombre': 'Liquid Retina', 'tecnologia': 'IPS', 'brillo_nits': 500, 'brillo_hdr_nits': False,
                'brillo_xdr_nits': False, 'contraste': False, 'promotion': False, 'colores': '1.000 millones de colores',
                'gama': 'P3', 'true_tone': True, 'nanotexturizado': False, 'diagonal_exacta': False}
PANTALLA_XDR = {'nombre': 'Liquid Retina XDR', 'tecnologia': False, 'brillo_hdr_nits': 1600, 'brillo_xdr_nits': 1000,
                'contraste': '1.000.000:1', 'promotion': True, 'colores': '1.000 millones de colores', 'gama': 'P3',
                'true_tone': True, 'diagonal_exacta': False}
SIN_BATERIA_EXTRA = {'magsafe': False}


def mac(**d):
    """Completa lo que casi todas las Mac con chip de Apple tienen igual; cada modelo pisa lo suyo."""
    base = {
        'pantalla': {},
        'rendimiento': {'arquitectura': 'apple', 'neural_engine_nucleos': 16, 'neural_accelerators': False, 'trazado_rayos': True,
                        'apple_intelligence': True},
        'bateria': {'magsafe': 'MagSafe 3'},
        'conectividad': {'ethernet': False, 'thread': False},
        'multimedia': {},
        'entrada': {'touch_bar': False},
        'diseno': {'formato': 'portatil', 'grosor_min_mm': False, 'alto_mm': False, 'base_ancho_mm': False, 'material': RECICLADO},
        'sistema': {'numero_modelo': None},
    }
    for seccion, valores in d.items():
        base.setdefault(seccion, {}).update(valores)
    return base


# ─────────────────────────────── MacBook Air ───────────────────────────────
MBA13_M3 = mac(
    pantalla={**PANTALLA_AIR, 'pulgadas': 13.6, 'px_ancho': 2560, 'px_alto': 1664, 'ppi': 224},
    rendimiento={'chip': 'Apple M3', 'cpu': ['8 núcleos (4 de rendimiento y 4 de eficiencia)'], 'gpu': ['8 núcleos', '10 núcleos'],
                 'ancho_banda_gbs': 100, 'ram_gb': [8, 16, 24], 'ram_tipo': 'memoria unificada', 'almacenamiento_gb': [256, 512, 1024, 2048],
                 'pantallas_externas': 'Un monitor de hasta 6K a 60 Hz, o dos (6K y 5K a 60 Hz) con la tapa cerrada'},
    bateria={'wh': 52.6, 'video_h': 18, 'video_fuente': 'apple_tv', 'web_h': 15,
             'adaptador': 'USB‑C de 30 W (GPU de 8 núcleos) o compacto de 35 W con dos puertos USB‑C (GPU de 10 núcleos y 512 GB)',
             'carga_rapida': 'con el adaptador de corriente USB‑C de 70 W'},
    conectividad={'puertos': [MAGSAFE3, TB_USB4_2, JACK], 'wifi': 'Wi‑Fi 6E (802.11ax)', 'bluetooth': '5.3'},
    multimedia={'camara': CAM_1080, 'audio': AUDIO_4, 'microfonos': MICS_3},
    entrada={'teclado': TECLADO_TOUCH_ID, 'trackpad': FORCE_TOUCH, 'touch_id': 'Touch ID en el teclado'},
    diseno={'colores': COLORES_AIR_M3, 'grosor_mm': 11.3, 'ancho_mm': 304.1, 'profundidad_mm': 215.0, 'peso_kg': 1.24},
    sistema={'anio': 2024, 'macos_lanzamiento': 'macOS Sonoma 14', 'macos_maximo': 'macOS 27 Golden Gate', 'identificador': ['Mac15,12']},
)
MBA13_M4 = mac(
    pantalla={**PANTALLA_AIR, 'pulgadas': 13.6, 'px_ancho': 2560, 'px_alto': 1664, 'ppi': 224},
    rendimiento={'chip': 'Apple M4', 'cpu': ['10 núcleos (4 de rendimiento y 6 de eficiencia)'], 'gpu': ['8 núcleos', '10 núcleos'],
                 'ancho_banda_gbs': 120, 'ram_gb': [16, 24, 32], 'ram_tipo': 'memoria unificada', 'almacenamiento_gb': [256, 512, 1024, 2048],
                 'pantallas_externas': 'Hasta dos monitores de hasta 6K a 60 Hz'},
    bateria={'wh': 53.8, 'video_h': 18, 'video_fuente': 'streaming', 'web_h': 15,
             'adaptador': 'USB‑C de 30 W (GPU de 8 núcleos) o compacto de 35 W con dos puertos USB‑C (GPU de 10 núcleos)',
             'carga_rapida': 'con el adaptador de corriente USB‑C de 70 W'},
    conectividad={'puertos': [MAGSAFE3, TB4_2, JACK], 'wifi': 'Wi‑Fi 6E (802.11ax)', 'bluetooth': '5.3'},
    multimedia={'camara': CAM_12, 'audio': AUDIO_4, 'microfonos': MICS_3},
    entrada={'teclado': TECLADO_TOUCH_ID, 'trackpad': FORCE_TOUCH, 'touch_id': 'Touch ID en el teclado'},
    diseno={'colores': COLORES_AIR_M4, 'grosor_mm': 11.3, 'ancho_mm': 304.1, 'profundidad_mm': 215.0, 'peso_kg': 1.24},
    sistema={'anio': 2025, 'macos_lanzamiento': 'macOS Sequoia 15', 'macos_maximo': 'macOS 27 Golden Gate', 'identificador': ['Mac16,12']},
)
MBA15_M4 = mac(
    pantalla={**PANTALLA_AIR, 'pulgadas': 15.3, 'px_ancho': 2880, 'px_alto': 1864, 'ppi': 224},
    rendimiento={'chip': 'Apple M4', 'cpu': ['10 núcleos (4 de rendimiento y 6 de eficiencia)'], 'gpu': ['10 núcleos'],
                 'ancho_banda_gbs': 120, 'ram_gb': [16, 24, 32], 'ram_tipo': 'memoria unificada', 'almacenamiento_gb': [256, 512, 1024, 2048],
                 'pantallas_externas': 'Hasta dos monitores de hasta 6K a 60 Hz'},
    bateria={'wh': 66.5, 'video_h': 18, 'video_fuente': 'streaming', 'web_h': 15,
             'adaptador': 'compacto de 35 W con dos puertos USB‑C', 'carga_rapida': 'con el adaptador de corriente USB‑C de 70 W'},
    conectividad={'puertos': [MAGSAFE3, TB4_2, JACK], 'wifi': 'Wi‑Fi 6E (802.11ax)', 'bluetooth': '5.3'},
    multimedia={'camara': CAM_12, 'audio': AUDIO_6, 'microfonos': MICS_3},
    entrada={'teclado': TECLADO_TOUCH_ID, 'trackpad': FORCE_TOUCH, 'touch_id': 'Touch ID en el teclado'},
    diseno={'colores': COLORES_AIR_M4, 'grosor_mm': 11.5, 'ancho_mm': 340.4, 'profundidad_mm': 237.6, 'peso_kg': 1.51},
    sistema={'anio': 2025, 'macos_lanzamiento': 'macOS Sequoia 15', 'macos_maximo': 'macOS 27 Golden Gate', 'identificador': ['Mac16,13']},
)
M5_EXTERNAS = 'Hasta dos monitores de hasta 6K a 60 Hz o 4K a 144 Hz, o uno de hasta 8K a 60 Hz, 5K a 120 Hz o 4K a 240 Hz'
MBA13_M5 = mac(
    pantalla={**PANTALLA_AIR, 'pulgadas': 13.6, 'px_ancho': 2560, 'px_alto': 1664, 'ppi': 224},
    rendimiento={'chip': 'Apple M5', 'cpu': ['10 núcleos (4 supernúcleos y 6 de eficiencia)'], 'gpu': ['8 núcleos', '10 núcleos'],
                 'neural_accelerators': True, 'ancho_banda_gbs': 153, 'ram_gb': [16, 24, 32], 'ram_tipo': 'memoria unificada',
                 'almacenamiento_gb': [512, 1024, 2048, 4096], 'pantallas_externas': M5_EXTERNAS},
    bateria={'wh': 53.8, 'video_h': 18, 'video_fuente': 'streaming', 'web_h': 15,
             'adaptador': 'dinámico de 40 W con un máximo de 60 W', 'carga_rapida': 'con una fuente USB PD de 70 W o más'},
    conectividad={'puertos': [MAGSAFE3, TB4_2, JACK], 'wifi': 'Wi‑Fi 7 (802.11be), con el chip N1 de Apple', 'bluetooth': '6', 'thread': True},
    multimedia={'camara': CAM_12, 'audio': AUDIO_4, 'microfonos': MICS_3},
    entrada={'teclado': TECLADO_TOUCH_ID, 'trackpad': FORCE_TOUCH, 'touch_id': 'Touch ID en el teclado'},
    diseno={'colores': COLORES_AIR_M4, 'grosor_mm': 11.3, 'ancho_mm': 304.1, 'profundidad_mm': 215.0, 'peso_kg': 1.23},
    sistema={'anio': 2026, 'macos_lanzamiento': 'macOS Tahoe 26', 'macos_maximo': 'macOS 27 Golden Gate', 'identificador': ['Mac17,3']},
)
MBA15_M5 = mac(
    pantalla={**PANTALLA_AIR, 'pulgadas': 15.3, 'px_ancho': 2880, 'px_alto': 1864, 'ppi': 224},
    rendimiento={'chip': 'Apple M5', 'cpu': ['10 núcleos (4 supernúcleos y 6 de eficiencia)'], 'gpu': ['10 núcleos'],
                 'neural_accelerators': True, 'ancho_banda_gbs': 153, 'ram_gb': [16, 24, 32], 'ram_tipo': 'memoria unificada',
                 'almacenamiento_gb': [512, 1024, 2048, 4096], 'pantallas_externas': M5_EXTERNAS},
    bateria={'wh': 66.5, 'video_h': 18, 'video_fuente': 'streaming', 'web_h': 15,
             'adaptador': 'dinámico de 40 W con un máximo de 60 W', 'carga_rapida': 'con una fuente USB PD de 70 W o más'},
    conectividad={'puertos': [MAGSAFE3, TB4_2, JACK], 'wifi': 'Wi‑Fi 7 (802.11be), con el chip N1 de Apple', 'bluetooth': '6', 'thread': True},
    multimedia={'camara': CAM_12, 'audio': AUDIO_6, 'microfonos': MICS_3},
    entrada={'teclado': TECLADO_TOUCH_ID, 'trackpad': FORCE_TOUCH, 'touch_id': 'Touch ID en el teclado'},
    diseno={'colores': COLORES_AIR_M4, 'grosor_mm': 11.5, 'ancho_mm': 340.4, 'profundidad_mm': 237.6, 'peso_kg': 1.51},
    sistema={'anio': 2026, 'macos_lanzamiento': 'macOS Tahoe 26', 'macos_maximo': 'macOS 27 Golden Gate', 'identificador': ['Mac17,4']},
)

# ─────────────────────────────── MacBook Pro ───────────────────────────────
MBP14_M5 = mac(
    pantalla={**PANTALLA_XDR, 'pulgadas': 14.2, 'px_ancho': 3024, 'px_alto': 1964, 'ppi': 254, 'brillo_nits': 1000, 'nanotexturizado': True},
    rendimiento={'chip': 'Apple M5', 'cpu': ['10 núcleos (4 supernúcleos y 6 de eficiencia)'], 'gpu': ['10 núcleos'],
                 'neural_accelerators': True, 'ancho_banda_gbs': 153, 'ram_gb': [16, 24, 32], 'ram_tipo': 'memoria unificada',
                 'almacenamiento_gb': [512, 1024, 2048, 4096], 'pantallas_externas': M5_EXTERNAS},
    bateria={'wh': 72.4, 'video_h': 24, 'video_fuente': 'streaming', 'web_h': 16, 'adaptador': 'USB‑C de 70 W',
             'carga_rapida': 'con una fuente USB PD de 96 W o más'},
    conectividad={'puertos': [SDXC, HDMI, JACK, 'Puerto MagSafe 3', TB4_3], 'wifi': 'Wi‑Fi 6E (802.11ax)', 'bluetooth': '5.3'},
    multimedia={'camara': CAM_12, 'audio': AUDIO_6_PRO, 'microfonos': MICS_3_PRO},
    entrada={'teclado': TECLADO_TOUCH_ID, 'trackpad': FORCE_TOUCH, 'touch_id': 'Touch ID en el teclado'},
    diseno={'colores': COLORES_PRO, 'grosor_mm': 15.5, 'ancho_mm': 312.6, 'profundidad_mm': 221.2, 'peso_kg': 1.55},
    sistema={'anio': 2025, 'macos_lanzamiento': 'macOS Tahoe 26', 'macos_maximo': 'macOS 27 Golden Gate', 'identificador': ['Mac17,2']},
)
MBP14_M5PRO = mac(
    pantalla={**PANTALLA_XDR, 'pulgadas': 14.2, 'px_ancho': 3024, 'px_alto': 1964, 'ppi': 254, 'brillo_nits': 1000, 'nanotexturizado': True},
    rendimiento={'chip': 'Apple M5 Pro', 'cpu': ['15 núcleos (5 supernúcleos y 10 de rendimiento)', '18 núcleos (6 supernúcleos y 12 de rendimiento)'],
                 'gpu': ['16 núcleos', '20 núcleos'], 'neural_accelerators': True, 'ancho_banda_gbs': 307, 'ram_gb': [24, 48, 64],
                 'ram_tipo': 'memoria unificada', 'almacenamiento_gb': [1024, 2048, 4096],
                 'pantallas_externas': 'Hasta tres monitores de hasta 6K a 60 Hz o 4K a 144 Hz, o uno de hasta 8K a 60 Hz más otro de hasta 5K a 120 Hz'},
    bateria={'wh': 72.4, 'video_h': 22, 'video_fuente': 'streaming', 'web_h': 14,
             'adaptador': 'USB‑C de 70 W (CPU de 15 núcleos) o de 96 W (GPU de 20 núcleos)', 'carga_rapida': 'con una fuente USB PD de 96 W o más'},
    conectividad={'puertos': [SDXC, HDMI, JACK, 'Puerto MagSafe 3', TB5_3], 'wifi': 'Wi‑Fi 7 (802.11be), con el chip N1 de Apple',
                  'bluetooth': '6', 'thread': True},
    multimedia={'camara': CAM_12, 'audio': AUDIO_6_PRO, 'microfonos': MICS_3_PRO},
    entrada={'teclado': TECLADO_TOUCH_ID, 'trackpad': FORCE_TOUCH, 'touch_id': 'Touch ID en el teclado'},
    diseno={'colores': COLORES_PRO, 'grosor_mm': 15.5, 'ancho_mm': 312.6, 'profundidad_mm': 221.2, 'peso_kg': 1.60},
    sistema={'anio': 2026, 'macos_lanzamiento': 'macOS Tahoe 26', 'macos_maximo': 'macOS 27 Golden Gate', 'identificador': ['Mac17,7', 'Mac17,9']},
)
M3PRO_EXTERNAS = ('Hasta dos monitores de hasta 6K a 60 Hz por Thunderbolt, o uno de 6K por Thunderbolt y otro de hasta 4K a 144 Hz '
                  'por HDMI; o uno de 8K a 60 Hz o 4K a 240 Hz por HDMI')
MBP14_M3PRO = mac(
    pantalla={**PANTALLA_XDR, 'pulgadas': 14.2, 'px_ancho': 3024, 'px_alto': 1964, 'ppi': 254, 'brillo_nits': 600, 'nanotexturizado': False},
    rendimiento={'chip': 'Apple M3 Pro', 'cpu': ['11 núcleos (5 de rendimiento y 6 de eficiencia)', '12 núcleos (6 de rendimiento y 6 de eficiencia)'],
                 'gpu': ['14 núcleos', '18 núcleos'], 'ancho_banda_gbs': 150, 'ram_gb': [18, 36], 'ram_tipo': 'memoria unificada',
                 'almacenamiento_gb': [512, 1024, 2048, 4096], 'pantallas_externas': M3PRO_EXTERNAS},
    bateria={'wh': 72.4, 'video_h': 18, 'video_fuente': 'apple_tv', 'web_h': 12,
             'adaptador': 'USB‑C de 70 W (CPU de 11 núcleos) o de 96 W (CPU de 12 núcleos)', 'carga_rapida': 'con el adaptador de corriente USB‑C de 96 W'},
    conectividad={'puertos': [SDXC, HDMI, JACK, 'Puerto MagSafe 3', TB4_3], 'wifi': 'Wi‑Fi 6E (802.11ax)', 'bluetooth': '5.3'},
    multimedia={'camara': CAM_1080, 'audio': AUDIO_6_PRO, 'microfonos': MICS_3_PRO},
    entrada={'teclado': TECLADO_TOUCH_ID, 'trackpad': FORCE_TOUCH, 'touch_id': 'Touch ID en el teclado'},
    diseno={'colores': COLORES_PRO, 'grosor_mm': 15.5, 'ancho_mm': 312.6, 'profundidad_mm': 221.2, 'peso_kg': 1.61},
    sistema={'anio': 2023, 'macos_lanzamiento': 'macOS Sonoma 14', 'macos_maximo': 'macOS 27 Golden Gate',
             'identificador': ['Mac15,6', 'Mac15,8', 'Mac15,10']},
)
MBP16_M3PRO = mac(
    pantalla={**PANTALLA_XDR, 'pulgadas': 16.2, 'px_ancho': 3456, 'px_alto': 2234, 'ppi': 254, 'brillo_nits': 600, 'nanotexturizado': False},
    rendimiento={'chip': 'Apple M3 Pro', 'cpu': ['12 núcleos (6 de rendimiento y 6 de eficiencia)'], 'gpu': ['18 núcleos'],
                 'ancho_banda_gbs': 150, 'ram_gb': [18, 36], 'ram_tipo': 'memoria unificada', 'almacenamiento_gb': [512, 1024, 2048, 4096],
                 'pantallas_externas': M3PRO_EXTERNAS},
    bateria={'wh': 100.0, 'video_h': 22, 'video_fuente': 'apple_tv', 'web_h': 15, 'adaptador': 'USB‑C de 140 W',
             'carga_rapida': 'con el adaptador de corriente USB‑C de 140 W incluido'},
    conectividad={'puertos': [SDXC, HDMI, JACK, 'Puerto MagSafe 3', TB4_3], 'wifi': 'Wi‑Fi 6E (802.11ax)', 'bluetooth': '5.3'},
    multimedia={'camara': CAM_1080, 'audio': AUDIO_6_PRO, 'microfonos': MICS_3_PRO},
    entrada={'teclado': TECLADO_TOUCH_ID, 'trackpad': FORCE_TOUCH, 'touch_id': 'Touch ID en el teclado'},
    diseno={'colores': COLORES_PRO, 'grosor_mm': 16.8, 'ancho_mm': 355.7, 'profundidad_mm': 248.1, 'peso_kg': 2.14},
    sistema={'anio': 2023, 'macos_lanzamiento': 'macOS Sonoma 14', 'macos_maximo': 'macOS 27 Golden Gate',
             'identificador': ['Mac15,7', 'Mac15,9', 'Mac15,11']},
)

# ─────────────────────────────── MacBook Neo ───────────────────────────────
NEO = mac(
    pantalla={**PANTALLA_AIR, 'pulgadas': 13.0, 'px_ancho': 2408, 'px_alto': 1506, 'ppi': 219, 'gama': 'sRGB', 'true_tone': False},
    rendimiento={'chip': 'Apple A18 Pro', 'cpu': ['6 núcleos (2 de rendimiento y 4 de eficiencia)'], 'gpu': ['5 núcleos'],
                 'ancho_banda_gbs': 60, 'ram_gb': [8], 'ram_tipo': 'memoria unificada', 'almacenamiento_gb': [256, 512],
                 'pantallas_externas': 'Un monitor de hasta 4K a 60 Hz (por el puerto USB 3)'},
    bateria={'wh': 36.5, 'video_h': 16, 'video_fuente': 'streaming', 'web_h': 11, 'adaptador': 'USB‑C de 20 W', 'carga_rapida': False,
             'magsafe': False},
    conectividad={'puertos': ['Un puerto USB 3 (USB‑C) con carga, DisplayPort y USB 3 (hasta 10 Gb/s)',
                              'Un puerto USB 2 (USB‑C) con carga y USB 2 (hasta 480 Mb/s)', JACK],
                  'wifi': 'Wi‑Fi 6E (802.11ax)', 'bluetooth': '6'},
    multimedia={'camara': CAM_1080, 'audio': 'Dos parlantes con Audio Espacial al reproducir contenido Dolby Atmos',
                'microfonos': 'Dos micrófonos con tecnología beamforming direccional (Aislamiento de Voz y Espectro Amplio)'},
    entrada={'teclado': 'Magic Keyboard (con Touch ID en el modelo de 512 GB)',
             'trackpad': 'Multi‑Touch, con control preciso del cursor y gestos', 'touch_id': 'Solo en el modelo de 512 GB'},
    diseno={'colores': ['Plata', 'Rosa rubor', 'Amarillo cítrico', 'Índigo'], 'grosor_mm': 12.7, 'ancho_mm': 297.5,
            'profundidad_mm': 206.4, 'peso_kg': 1.23, 'material': 'Aluminio 90 % reciclado'},
    sistema={'anio': 2026, 'macos_lanzamiento': 'macOS Tahoe 26', 'macos_maximo': 'macOS 27 Golden Gate', 'identificador': None},
)

# ─────────────────────────────── iMac ───────────────────────────────
PANTALLA_IMAC = {'pulgadas': 24.0, 'diagonal_exacta': 23.5, 'nombre': 'Retina 4.5K', 'tecnologia': False, 'px_ancho': 4480, 'px_alto': 2520,
                 'ppi': 218, 'brillo_nits': 500, 'brillo_hdr_nits': False, 'brillo_xdr_nits': False, 'contraste': False, 'promotion': False,
                 'colores': '1.000 millones de colores', 'gama': 'P3', 'true_tone': True}
IMAC_BATERIA = {'wh': False, 'video_h': False, 'video_fuente': False, 'web_h': False, 'adaptador': 'Adaptador de corriente de 143 W',
                'carga_rapida': False, 'magsafe': False}
# La ficha da ancho, alto y la base (profundidad y ancho), no el grosor de la pantalla: queda en null.
IMAC_DISENO = {'formato': 'escritorio', 'colores': COLORES_IMAC, 'grosor_mm': None, 'ancho_mm': 547.0, 'profundidad_mm': 147.0,
               'alto_mm': 461.0, 'base_ancho_mm': 130.0}
IMAC_2P = mac(
    pantalla={**PANTALLA_IMAC, 'nanotexturizado': False},
    rendimiento={'chip': 'Apple M4', 'cpu': ['8 núcleos (4 de rendimiento y 4 de eficiencia)'], 'gpu': ['8 núcleos'],
                 'ancho_banda_gbs': 120, 'ram_gb': [16, 24], 'ram_tipo': 'memoria unificada', 'almacenamiento_gb': [256, 512, 1024],
                 'pantallas_externas': 'Un monitor de hasta 6K a 60 Hz'},
    bateria=IMAC_BATERIA,
    conectividad={'puertos': ['Dos puertos Thunderbolt / USB 4 con Thunderbolt 4, USB 4 (hasta 40 Gb/s), USB 3.1 de 2.ª generación y DisplayPort',
                              JACK_HI], 'wifi': 'Wi‑Fi 6E (802.11ax)', 'bluetooth': '5.3', 'ethernet': 'Gigabit Ethernet opcional'},
    multimedia={'camara': CAM_12, 'audio': AUDIO_6_PRO, 'microfonos': MICS_3_PRO},
    entrada={'teclado': 'Magic Keyboard (con Touch ID y teclado numérico, opcional)', 'trackpad': 'Magic Mouse (Magic Trackpad opcional)',
             'touch_id': 'Opcional, con el Magic Keyboard con Touch ID'},
    diseno={**IMAC_DISENO, 'peso_kg': 4.42},
    sistema={'anio': 2024, 'macos_lanzamiento': 'macOS Sequoia 15', 'macos_maximo': 'macOS 27 Golden Gate', 'identificador': ['Mac16,2']},
)
IMAC_4P = mac(
    pantalla={**PANTALLA_IMAC, 'nanotexturizado': True},
    rendimiento={'chip': 'Apple M4', 'cpu': ['10 núcleos (4 de rendimiento y 6 de eficiencia)'], 'gpu': ['10 núcleos'],
                 'ancho_banda_gbs': 120, 'ram_gb': [16, 24, 32], 'ram_tipo': 'memoria unificada', 'almacenamiento_gb': [256, 512, 1024, 2048],
                 'pantallas_externas': 'Hasta dos monitores de hasta 6K a 60 Hz, o uno de hasta 8K a 60 Hz'},
    bateria=IMAC_BATERIA,
    conectividad={'puertos': ['Cuatro puertos Thunderbolt 4 con Thunderbolt 4, USB 4 (hasta 40 Gb/s), USB 3.1 de 2.ª generación y DisplayPort',
                              JACK_HI], 'wifi': 'Wi‑Fi 6E (802.11ax)', 'bluetooth': '5.3', 'ethernet': 'Gigabit Ethernet'},
    multimedia={'camara': CAM_12, 'audio': AUDIO_6_PRO, 'microfonos': MICS_3_PRO},
    entrada={'teclado': 'Magic Keyboard con Touch ID (teclado numérico opcional)', 'trackpad': 'Magic Mouse (Magic Trackpad opcional)',
             'touch_id': 'Touch ID en el Magic Keyboard'},
    diseno={**IMAC_DISENO, 'peso_kg': 4.44},
    sistema={'anio': 2024, 'macos_lanzamiento': 'macOS Sequoia 15', 'macos_maximo': 'macOS 27 Golden Gate', 'identificador': ['Mac16,3']},
)

# ─────────────────────────────── Intel ───────────────────────────────
def intel(**d):
    base = mac(**d)
    base['rendimiento'].update({'arquitectura': 'intel', 'neural_engine_nucleos': False, 'trazado_rayos': False, 'apple_intelligence': False,
                                'ancho_banda_gbs': False})
    base['diseno'].setdefault('material', 'Aluminio')
    if base['diseno']['material'] == RECICLADO:   # las fichas de las Intel dicen «aluminio altamente reciclable»
        base['diseno']['material'] = 'Aluminio'
    return base


RETINA_13 = {'nombre': 'Retina', 'tecnologia': 'IPS', 'pulgadas': 13.3, 'px_ancho': 2560, 'px_alto': 1600, 'ppi': 227, 'brillo_nits': 500,
             'brillo_hdr_nits': False, 'brillo_xdr_nits': False, 'contraste': False, 'promotion': False, 'colores': 'millones de colores',
             'gama': 'P3', 'nanotexturizado': False, 'diagonal_exacta': False}
MBP13_2019 = intel(
    pantalla={**RETINA_13, 'true_tone': True},
    rendimiento={'chip': 'Intel Core i5 o i7 de 4 núcleos (8.ª generación)',
                 'cpu': ['Intel Core i5 de 4 núcleos a 1.4 GHz (Turbo Boost hasta 3.9 GHz)', 'Intel Core i7 de 4 núcleos a 1.7 GHz (Turbo Boost hasta 4.5 GHz)'],
                 'gpu': ['Intel Iris Plus Graphics 645'], 'ram_gb': [8, 16], 'ram_tipo': 'LPDDR3 a 2133 MHz', 'almacenamiento_gb': [128, 256, 512, 1024, 2048],
                 'pantallas_externas': 'Un monitor 5K a 60 Hz o dos 4K a 60 Hz'},
    bateria={'wh': 58.2, 'video_h': 10, 'video_fuente': 'itunes', 'web_h': 10, 'adaptador': 'USB‑C de 61 W', 'carga_rapida': False, 'magsafe': False},
    conectividad={'puertos': [TB3_2, JACK], 'wifi': 'Wi‑Fi 5 (802.11ac)', 'bluetooth': '5.0'},
    multimedia={'camara': 'Cámara FaceTime HD de 720p', 'audio': 'Parlantes estéreo con alto rango dinámico', 'microfonos': 'Tres micrófonos'},
    entrada={'teclado': 'Teclado retroiluminado con Touch Bar y Touch ID', 'trackpad': FORCE_TOUCH, 'touch_id': 'Touch ID en la Touch Bar',
             'touch_bar': True},
    diseno={'colores': ['Plata', 'Gris espacial'], 'grosor_mm': 14.9, 'ancho_mm': 304.1, 'profundidad_mm': 212.4, 'peso_kg': 1.37},
    sistema={'anio': 2019, 'macos_lanzamiento': 'macOS Mojave 10.14', 'macos_maximo': 'macOS Sequoia 15', 'identificador': ['MacBookPro15,4'],
             'numero_modelo': 'A2159'},
)
MBP13_2017 = intel(
    pantalla={**RETINA_13, 'true_tone': False},
    rendimiento={'chip': 'Intel Core i5 o i7 de doble núcleo (7.ª generación)',
                 'cpu': ['Intel Core i5 de doble núcleo a 2.3 GHz (Turbo Boost hasta 3.6 GHz)', 'Intel Core i7 de doble núcleo a 2.5 GHz (Turbo Boost hasta 4.0 GHz)'],
                 'gpu': ['Intel Iris Plus Graphics 640'], 'ram_gb': [8, 16], 'ram_tipo': 'LPDDR3 a 2133 MHz', 'almacenamiento_gb': [128, 256, 512, 1024],
                 'pantallas_externas': 'Un monitor 5K a 60 Hz o dos 4K a 60 Hz'},
    bateria={'wh': 54.5, 'video_h': 10, 'video_fuente': 'itunes', 'web_h': 10, 'adaptador': 'USB‑C de 61 W', 'carga_rapida': False, 'magsafe': False},
    conectividad={'puertos': [TB3_2, JACK], 'wifi': 'Wi‑Fi 5 (802.11ac)', 'bluetooth': '4.2'},
    multimedia={'camara': 'Cámara FaceTime HD de 720p', 'audio': 'Parlantes estéreo con amplio rango dinámico', 'microfonos': 'Dos micrófonos'},
    entrada={'teclado': 'Teclado retroiluminado de tamaño completo, con 12 teclas de función', 'trackpad': FORCE_TOUCH, 'touch_id': False},
    diseno={'colores': ['Plata', 'Gris espacial'], 'grosor_mm': 14.9, 'ancho_mm': 304.1, 'profundidad_mm': 212.4, 'peso_kg': 1.37},
    sistema={'anio': 2017, 'macos_lanzamiento': 'macOS Sierra 10.12', 'macos_maximo': 'macOS Ventura 13', 'identificador': ['MacBookPro14,1'],
             'numero_modelo': 'A1708'},
)
MACBOOK12_2017 = intel(
    pantalla={'nombre': 'Retina', 'tecnologia': 'IPS', 'pulgadas': 12.0, 'px_ancho': 2304, 'px_alto': 1440, 'ppi': 226, 'brillo_nits': None,
              'brillo_hdr_nits': False, 'brillo_xdr_nits': False, 'contraste': False, 'promotion': False, 'colores': 'millones de colores',
              'gama': False, 'true_tone': False, 'nanotexturizado': False, 'diagonal_exacta': False},
    rendimiento={'chip': 'Intel Core m3, i5 o i7 de doble núcleo (7.ª generación)',
                 'cpu': ['Intel Core m3 de doble núcleo a 1.2 GHz (Turbo Boost hasta 3.0 GHz)', 'Intel Core i5 de doble núcleo a 1.3 GHz (Turbo Boost hasta 3.2 GHz)',
                         'Intel Core i7 de doble núcleo a 1.4 GHz (Turbo Boost hasta 3.6 GHz)'],
                 'gpu': ['Intel HD Graphics 615'], 'ram_gb': [8, 16], 'ram_tipo': 'LPDDR3 a 1866 MHz', 'almacenamiento_gb': [256, 512],
                 'pantallas_externas': 'Un monitor de hasta 4096 × 2304 a 60 Hz'},
    bateria={'wh': 41.4, 'video_h': 12, 'video_fuente': 'itunes', 'web_h': 10, 'adaptador': 'USB‑C de 30 W', 'carga_rapida': False, 'magsafe': False},
    conectividad={'puertos': ['Un puerto USB‑C con carga, USB 3.1 de 1.ª generación (hasta 5 Gb/s) y DisplayPort 1.2', JACK],
                  'wifi': 'Wi‑Fi 5 (802.11ac)', 'bluetooth': '4.2'},
    multimedia={'camara': 'Cámara FaceTime de 480p', 'audio': 'Parlantes estéreo', 'microfonos': 'Dos micrófonos'},
    entrada={'teclado': 'Teclado retroiluminado de tamaño estándar, con 12 teclas de función', 'trackpad': FORCE_TOUCH, 'touch_id': False},
    diseno={'colores': ['Oro rosa', 'Gris espacial', 'Oro', 'Plata'], 'grosor_mm': 13.1, 'grosor_min_mm': 3.5, 'ancho_mm': 280.5,
            'profundidad_mm': 196.5, 'peso_kg': 0.92},
    sistema={'anio': 2017, 'macos_lanzamiento': 'macOS Sierra 10.12', 'macos_maximo': 'macOS Ventura 13', 'identificador': ['MacBook10,1'],
             'numero_modelo': 'A1534'},
)
MBA13_2014 = intel(
    pantalla={'nombre': 'Widescreen retroiluminada por LED', 'tecnologia': False, 'pulgadas': 13.3, 'px_ancho': 1440, 'px_alto': 900, 'ppi': None,
              'brillo_nits': None, 'brillo_hdr_nits': False, 'brillo_xdr_nits': False, 'contraste': False, 'promotion': False,
              'colores': 'millones de colores', 'gama': False, 'true_tone': False, 'nanotexturizado': False, 'diagonal_exacta': False},
    rendimiento={'chip': 'Intel Core i5 o i7 de doble núcleo (4.ª generación)',
                 'cpu': ['Intel Core i5 de doble núcleo a 1.4 GHz (Turbo Boost hasta 2.7 GHz)', 'Intel Core i7 de doble núcleo a 1.7 GHz (Turbo Boost hasta 3.3 GHz)'],
                 'gpu': ['Intel HD Graphics 5000'], 'ram_gb': [4, 8], 'ram_tipo': 'LPDDR3 a 1600 MHz', 'almacenamiento_gb': [128, 256, 512],
                 'pantallas_externas': 'Un monitor de hasta 2560 × 1600'},
    bateria={'wh': 54.0, 'video_h': 12, 'video_fuente': 'itunes', 'web_h': 12, 'adaptador': 'MagSafe 2 de 45 W', 'carga_rapida': False,
             'magsafe': 'MagSafe 2'},
    conectividad={'puertos': ['Puerto de corriente MagSafe 2', 'Dos puertos USB 3 (hasta 5 Gb/s)', 'Puerto Thunderbolt (hasta 10 Gb/s)', SDXC,
                              'Salida para audífonos'], 'wifi': 'Wi‑Fi 5 (802.11ac)', 'bluetooth': '4.0'},
    multimedia={'camara': 'Cámara FaceTime HD de 720p', 'audio': 'Parlantes estéreo', 'microfonos': 'Dos micrófonos'},
    entrada={'teclado': 'Teclado retroiluminado de tamaño completo, con 12 teclas de función y sensor de luz ambiental',
             'trackpad': 'Multi‑Touch, con desplazamiento inercial, pellizco, rotación y gestos', 'touch_id': False},
    # Su ficha no lista acabados: los colores quedan en null (no se inventan).
    diseno={'colores': None, 'grosor_mm': 17.0, 'grosor_min_mm': 3.0, 'ancho_mm': 325.0, 'profundidad_mm': 227.0, 'peso_kg': 1.35},
    sistema={'anio': 2014, 'macos_lanzamiento': 'OS X Mavericks 10.9', 'macos_maximo': 'macOS Big Sur 11', 'identificador': ['MacBookAir6,2'],
             'numero_modelo': 'A1466'},
)

# De dónde sale cada modelo (ficha técnica oficial) y lo que se completó con otras fuentes.
FUENTES = {
    'macbook-air-13-m3-2024': [LAMR.format(id=118551)], 'macbook-air-13-m4-2025': [LAMR.format(id=122209)],
    'macbook-air-15-m4-2025': [LAMR.format(id=122210)], 'macbook-air-13-m5': [LAMR.format(id=126320)],
    'macbook-air-15-m5': [LAMR.format(id=126321)], 'macbook-pro-14-m5': [LAMR.format(id=125405)],
    'macbook-pro-14-m5-pro': [LAMR.format(id=126318)], 'macbook-pro-14-m3-pro-2023': [LAMR.format(id=117736)],
    'macbook-pro-16-m3-pro-2023': [LAMR.format(id=117737)], 'macbook-neo': [LAMR.format(id=126322),
    'Touch ID solo en el modelo de 512 GB: macrumors.com (2026-03-04) y Apple Newsroom (2026-03).'],
    'imac-24-2024-dos-puertos': [LAMR.format(id=121556)], 'imac-24-2024-cuatro-puertos': [LAMR.format(id=121557)],
    'macbook-pro-13-2019-dos-puertos': [LAMR.format(id=111945), 'Sistema de fábrica y número de modelo: everymac.com.'],
    'macbook-pro-13-2017-dos-puertos': [LAMR.format(id=111951), 'Sistema de fábrica y número de modelo: everymac.com.'],
    'macbook-12-2017': [LAMR.format(id=111986), 'Sistema de fábrica y número de modelo: everymac.com.'],
    'macbook-air-13-2014': [LAMR.format(id=111944), 'Número de modelo: everymac.com.'],
}
COMUNES = ('Último macOS: listas oficiales de compatibilidad (support.apple.com/en-us/127255, 122867, 120282, 102861 y 103111) y '
           '«Identificar el modelo» (support.apple.com/en-us/102869, 108052, 108054 y 103257), que también da el identificador.')


def modelo(nombre, slug, alias, datos, pendientes=()):
    return {'tipo': 'computadora', 'familia': 'mac', 'nombre': nombre, 'slug': slug, 'alias': alias,
            'pendientes': list(pendientes), 'datos': datos}


PENDIENTE_NEO = [{'campo': 'sistema.identificador', 'tipo': 'falta',
                  'detalle': 'Identificador del modelo (MacXX,X): Apple todavía no incluye al MacBook Neo en «Identificar el modelo».',
                  'fuente': 'support.apple.com (Identificar el modelo de MacBook) o everymac.com'}]

MODELOS = [
    modelo('MacBook Air (13 pulgadas, M5)', 'macbook-air-13-m5', ['MacBook Air 13 M5'], MBA13_M5),
    modelo('MacBook Air (15 pulgadas, M5)', 'macbook-air-15-m5', ['MacBook Air 15 M5'], MBA15_M5),
    modelo('MacBook Pro (14 pulgadas, M5 Pro)', 'macbook-pro-14-m5-pro', ['MacBook Pro 14 M5 Pro'], MBP14_M5PRO),
    modelo('MacBook Neo (13 pulgadas, A18 Pro)', 'macbook-neo', ['MacBook Neo'], NEO, PENDIENTE_NEO),
    modelo('MacBook Pro (14 pulgadas, M5)', 'macbook-pro-14-m5', ['MacBook Pro 14 M5'], MBP14_M5),
    modelo('MacBook Air (13 pulgadas, M4, 2025)', 'macbook-air-13-m4-2025', ['MacBook Air 13 M4'], MBA13_M4),
    modelo('MacBook Air (15 pulgadas, M4, 2025)', 'macbook-air-15-m4-2025', ['MacBook Air 15 M4'], MBA15_M4),
    modelo('iMac (24 pulgadas, 2024, dos puertos)', 'imac-24-2024-dos-puertos', ['iMac 24 M4 dos puertos'], IMAC_2P),
    modelo('iMac (24 pulgadas, 2024, cuatro puertos)', 'imac-24-2024-cuatro-puertos', ['iMac 24 M4 cuatro puertos'], IMAC_4P),
    modelo('MacBook Air (13 pulgadas, M3, 2024)', 'macbook-air-13-m3-2024', ['MacBook Air 13 M3'], MBA13_M3),
    modelo('MacBook Pro (14 pulgadas, M3 Pro, noviembre de 2023)', 'macbook-pro-14-m3-pro-2023', ['MacBook Pro 14 M3 Pro'], MBP14_M3PRO),
    modelo('MacBook Pro (16 pulgadas, M3 Pro, noviembre de 2023)', 'macbook-pro-16-m3-pro-2023', ['MacBook Pro 16 M3 Pro'], MBP16_M3PRO),
    modelo('MacBook Pro (13 pulgadas, 2019, dos puertos Thunderbolt 3)', 'macbook-pro-13-2019-dos-puertos', ['MacBook Pro 13 2019'], MBP13_2019),
    modelo('MacBook Pro (13 pulgadas, 2017, dos puertos Thunderbolt 3)', 'macbook-pro-13-2017-dos-puertos', ['MacBook Pro 13 2017'], MBP13_2017),
    modelo('MacBook (Retina, 12 pulgadas, 2017)', 'macbook-12-2017', ['MacBook Retina 12 2017'], MACBOOK12_2017),
    modelo('MacBook Air (13 pulgadas, principios de 2014)', 'macbook-air-13-2014', ['MacBook Air 13 2014'], MBA13_2014),
]

cabecera = """<?php

/*
 * Fichas de Mac para la tienda y la comparativa (/comparar/mac).
 *
 * - Solo los modelos que hay o hubo en el inventario (si un equipo se vende, su ficha queda).
 * - `datos` es la única fuente: números, sí/no y `false` cuando el modelo NO tiene algo. `null` solo donde
 *   Apple no publica el dato o mientras esperan su fuente en `pendientes`.
 * - Textos de la ficha: App\\Support\\FichaTecnica\\TextosComputadora. Esquema: App\\Support\\FichaTecnica\\EsquemaComputadora.
 *     php artisan modelos:verificar   ·   php artisan db:seed --class=ModelosReferenciaSeeder
 * - Fuente: la ficha técnica oficial de Apple de cada modelo (support.apple.com/es-lamr); el último macOS, de las
 *   listas oficiales de compatibilidad. Detalle: docs/admin-ui/informes/computadoras-2026-09-15.md.
 * - Los precios NO van aquí: salen del inventario de la tienda.
 * - Generado con herramientas/generar_computadoras.py: no se edita a mano.
 */

return """

if __name__ == '__main__':
    for m in MODELOS:
        faltan = [s for s in m['datos'] if not m['datos'][s]]
        assert not faltan, f"{m['nombre']}: secciones vacías {faltan}"
        assert m['slug'] in FUENTES, f"{m['slug']} sin fuente"
    salida = cabecera + '[\n' + ''.join('    ' + php(m, 1) + ',\n' for m in MODELOS) + '];\n'
    (Path(__file__).resolve().parents[1] / 'computadora.php').write_text(salida)
    print(len(MODELOS), 'modelos escritos')
