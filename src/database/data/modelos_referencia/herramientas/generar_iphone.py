"""
Genera database/data/modelos_referencia/iphone.php (fichas de iPhone para la tienda, la comparativa y el recomendador).

Uso:  python3 generar_iphone.py
Después: php artisan modelos:verificar · php artisan db:seed --class=ModelosReferenciaSeeder · php artisan modelos:pendientes --markdown
Cada generación hereda de la anterior con mezclar(); los campos nuevos se agregan a la base X como False («no tiene»).
Todo dato que no salga de la página oficial pegada se anota en pendientes como verificar. La RAM y la capacidad de batería, que
Apple no publica, salen de fuentes externas que coinciden (RAM_GB y BATERIA_MAH); lo que ninguna confirma queda como falta.
"""
import copy
from pathlib import Path

def php(v, ind=0):
    sp = '    ' * ind
    if v is True: return 'true'
    if v is False: return 'false'
    if v is None: return 'null'
    if isinstance(v, bool): return 'true' if v else 'false'
    if isinstance(v, int): return str(v)
    if isinstance(v, float): return repr(v)
    if isinstance(v, str): return "'" + v.replace('\\', '\\\\').replace("'", "\\'") + "'"
    if isinstance(v, list):
        return '[' + ', '.join(php(x) for x in v) + ']'
    if isinstance(v, dict):
        lineas = ['[']
        ancho = max(len(k) for k in v) + 2
        for k, x in v.items():
            lineas.append(f"{sp}    {php(k).ljust(ancho)} => {php(x, ind + 1)},")
        lineas.append(sp + ']')
        return '\n'.join(lineas)
    raise TypeError(v)

def mezclar(base, cambios):
    r = copy.deepcopy(base)
    for k, v in cambios.items():
        if isinstance(v, dict):
            r[k] = mezclar(r.get(k, {}), v)
        else:
            r[k] = v
    return r

FLASH = 'True Tone con sincronización lenta'
OIS = 'Estabilización óptica de imagen'
DOIS = 'Doble estabilización óptica de imagen'
CP = 'Modo Retrato con Control de Profundidad'
DUAL_SIM = 'Doble SIM (nano-SIM y eSIM)'
ESTILOS = 'Estilos Fotográficos'
FRONTAL_12 = {'mp': 12, 'nombre': 'TrueDepth', 'video': '4K hasta 60 fps', 'dolby_vision_fps': 0, 'camara_lenta': '1080p a 120 fps',
              'modo_noche': False, 'deep_fusion': False, 'hdr_fotos': 'HDR Inteligente 2', 'retrato': CP, 'quicktake': True,
              'estabilizacion_cine': '4K, 1080p y 720p'}

# ── iPhone X: base de la generación 2017-2018 ──
X = {
    'pantalla': {'pulgadas': 5.8, 'nombre': 'Super Retina HD', 'tecnologia': 'OLED', 'hdr': True, 'px_largo': 2436, 'px_corto': 1125,
                 'ppi': 458, 'contraste': '1.000.000:1', 'true_tone': True, 'gama_p3': True, 'respuesta_tactil': '3D Touch',
                 'brillo_nits': 625, 'brillo_hdr_nits': None, 'brillo_exteriores_nits': False, 'frecuencia_hz': 60, 'promotion': False,
                 'dynamic_island': False, 'siempre_activa': False, 'brillo_minimo_nits': False,
                 'plegable': False, 'nanotexturizado': False, 'exterior_pulgadas': False, 'exterior_px_largo': False, 'exterior_px_corto': False,
                 'exterior_ppi': False, 'apple_pencil': False},
    'rendimiento': {'chip': 'A11 Bionic', 'cpu_nucleos': 6, 'cpu_rendimiento': 2, 'cpu_eficiencia': 4, 'gpu_nucleos': 3, 'neural_engine_nucleos': 2,
                    'trazado_rayos': False, 'gpu_neural_accelerators': False, 'supernucleos': False, 'neural_engine_doble': False,
                    'ram_gb': None},   # sale de RAM_GB (Apple no la publica)
    'camaras': {'principal_mp': 12, 'ultra_mp': False, 'tele_mp': 12, 'zoom_optico_min': 1.0, 'zoom_optico_max': 2.0, 'zoom_opciones': None, 'estabilizacion': DOIS,
                'flash': FLASH, 'modo_noche': False, 'deep_fusion': False, 'proraw': False, 'lidar': False, 'hdr_fotos': 'HDR Automático',
                'retrato': 'Modo Retrato', 'iluminacion_retrato_efectos': 5, 'estilos_fotograficos': False, 'macro': False, 'photonic_engine': False,
                'superalta_resolucion_mp': False, 'fotos_espaciales': False, 'fusion': False, 'ultra_fusion': False, 'tele_fusion': False,
                'estabilizacion_tele': False, 'apertura_variable': False, 'controles_pro': False, 'enfoque_inteligente': False, 'otras_funciones': False},
    'video': {'resolucion_max': '4K hasta 60 fps', 'dolby_vision_fps': 0, 'camara_lenta': '1080p a 240 fps', 'quicktake': False,
              'audio_estereo': False, 'estabilizacion': DOIS, 'modo_cine': False, 'modo_accion': False, 'prores': False,
              'espacial': False, 'apple_log': False, 'aces': False, 'captura_dual': False,
              'prores_raw': False, 'genlock': False, 'efectos_cine': False, 'poca_luz': False, 'time_lapse': False,
              'audio_espacial': False, 'reduccion_viento': False, 'mezcla_audio': False, 'microfonos_estudio': False},
    'frontal': {'mp': 7, 'nombre': 'TrueDepth', 'video': '1080p hasta 30 fps', 'dolby_vision_fps': 0, 'camara_lenta': False,
                'modo_noche': False, 'deep_fusion': False, 'hdr_fotos': 'HDR Automático', 'retrato': 'Modo Retrato', 'quicktake': False,
                'estabilizacion_cine': False, 'estilos_fotograficos': False, 'modo_cine': False, 'photonic_engine': False, 'prores': False,
                'encuadre_centrado': False, 'video_ultraestabilizado': False, 'enfoque_inteligente': False, 'poca_luz': False,
                'efectos_cine': False, 'time_lapse': False, 'otras_funciones': False, 'bajo_pantalla': False},
    'bateria': {'video_h': 13, 'streaming_h': None, 'carga_rapida': '50 % en 30 min', 'carga_rapida_w': 20, 'qi': True, 'qi_w': 7.5,
                'magsafe_w': 0, 'qi2': False, 'carga_rapida_magsafe': False, 'carga_rapida_magsafe_w': False,
                'carga_rapida_voltaje_ajustable': False, 'doble': False, 'video_exterior_h': False, 'streaming_exterior_h': False,
                'capacidad_mah': None, 'capacidad_mah_solo_esim': False},   # salen de BATERIA_MAH (Apple no la publica)
    'conectividad': {'cinco_g': False, 'lte': '4G LTE Advanced', 'wifi': 'Wi‑Fi 5', 'bluetooth': '5.0', 'nfc': 'NFC con modo lectura',
                     'uwb': False, 'gnss': 'GPS/GNSS', 'volte': True, 'llamadas_wifi': True, 'sim': 'Nano-SIM', 'esim': False,
                     'conector': 'Lightning', 'usb': 'USB 2', 'tarjetas_expres': 'Sí', 'thread': False},
    'seguridad': {'biometria': 'Face ID', 'emergencia_sos': True, 'sos_satelite': False, 'deteccion_accidentes': False},
    'diseno': {'estructura': 'Acero inoxidable', 'frente': 'vidrio', 'dorso': 'vidrio', 'ip': 'IP67', 'ip_metros': 1, 'ip_minutos': 30,
               'alto_mm': 143.6, 'ancho_mm': 70.9, 'grosor_mm': 7.7, 'abierto_ancho_mm': False, 'abierto_grosor_mm': False,
               'peso_g': 174, 'colores': ['Plata', 'Gris espacial'], 'capacidades_gb': [64, 256], 'boton_accion': False, 'control_camara': False},
    'sistema': {'anio': 2017, 'ios_lanzamiento': 'iOS 11', 'ios_maximo': 'iOS 16', 'numeros_modelo': ['A1865', 'A1901'], 'apple_intelligence': False},
}

GEN_2018 = {
    'rendimiento': {'chip': 'A12 Bionic', 'gpu_nucleos': 4, 'neural_engine_nucleos': 8},
    'camaras': {'hdr_fotos': 'HDR Inteligente', 'retrato': CP, 'iluminacion_retrato_efectos': 6},
    'video': {'audio_estereo': True},
    'frontal': {'video': '1080p hasta 60 fps', 'hdr_fotos': 'HDR Inteligente', 'retrato': CP, 'estabilizacion_cine': '1080p y 720p'},
    'conectividad': {'sim': DUAL_SIM, 'esim': True, 'tarjetas_expres': 'Con reserva de batería'},
    'sistema': {'ios_lanzamiento': 'iOS 12', 'ios_maximo': 'iOS 18', 'numeros_modelo': None},
}

XS = mezclar(mezclar(X, GEN_2018), {
    'bateria': {'video_h': 14},
    'conectividad': {'lte': 'LTE de clase Gigabit'},
    'diseno': {'ip': 'IP68', 'ip_metros': 2, 'peso_g': 177, 'colores': ['Plata', 'Gris espacial', 'Oro'], 'capacidades_gb': [64, 256, 512]},
    'sistema': {'anio': 2018},
})
XS_MAX = mezclar(XS, {
    'pantalla': {'pulgadas': 6.5, 'px_largo': 2688, 'px_corto': 1242},
    'bateria': {'video_h': 15},
    'diseno': {'alto_mm': 157.5, 'ancho_mm': 77.4, 'grosor_mm': 7.7, 'peso_g': 208},
})
XR = mezclar(mezclar(X, GEN_2018), {
    'pantalla': {'pulgadas': 6.1, 'nombre': 'Liquid Retina HD', 'tecnologia': 'LCD', 'hdr': False, 'px_largo': 1792, 'px_corto': 828, 'ppi': 326,
                 'contraste': '1.400:1', 'respuesta_tactil': 'Respuesta háptica'},
    'camaras': {'tele_mp': False, 'zoom_optico_max': 1.0, 'estabilizacion': OIS, 'iluminacion_retrato_efectos': 3},
    'video': {'estabilizacion': OIS},
    'bateria': {'video_h': 16},
    'diseno': {'estructura': 'Aluminio', 'alto_mm': 150.9, 'ancho_mm': 75.7, 'grosor_mm': 8.3, 'peso_g': 194,
               'colores': ['Azul', 'Blanco', 'Negro', 'Amarillo', 'Coral', '(PRODUCT)RED'], 'capacidades_gb': [64, 128, 256]},
    'sistema': {'anio': 2018},
})

GEN_A13 = {
    'rendimiento': {'chip': 'A13 Bionic', 'gpu_nucleos': 4, 'neural_engine_nucleos': 8},
    'camaras': {'hdr_fotos': 'HDR Inteligente 2'},
    'video': {'quicktake': True},
    'conectividad': {'lte': 'LTE de clase Gigabit', 'wifi': 'Wi‑Fi 6'},
    'sistema': {'ios_lanzamiento': 'iOS 13', 'ios_maximo': None},
}

SE2 = mezclar(mezclar(XR, GEN_A13), {
    'pantalla': {'pulgadas': 4.7, 'nombre': 'Retina HD', 'px_largo': 1334, 'px_corto': 750},
    'camaras': {'iluminacion_retrato_efectos': 6},
    'frontal': {'nombre': 'FaceTime HD', 'video': '1080p hasta 30 fps', 'hdr_fotos': 'HDR Automático', 'quicktake': True},
    'bateria': {'video_h': 13, 'streaming_h': 8},
    'seguridad': {'biometria': 'Touch ID (2.ª generación) en el botón de inicio'},
    'diseno': {'alto_mm': 138.4, 'ancho_mm': 67.3, 'grosor_mm': 7.3, 'peso_g': 148, 'colores': ['Negro', 'Blanco', '(PRODUCT)RED'], 'capacidades_gb': [64, 128, 256]},
    'sistema': {'anio': 2020},
})
ONCE = mezclar(mezclar(XR, GEN_A13), {
    'camaras': {'ultra_mp': 12, 'zoom_optico_min': 0.5, 'modo_noche': True, 'deep_fusion': True, 'iluminacion_retrato_efectos': 6},
    'frontal': FRONTAL_12,
    'bateria': {'video_h': 17, 'streaming_h': 10},
    'conectividad': {'uwb': 'Chip de banda ultraancha de primera generación'},
    'diseno': {'ip': 'IP68', 'ip_metros': 2, 'colores': ['Malva', 'Amarillo', 'Verde', 'Negro', 'Blanco', '(PRODUCT)RED'], 'capacidades_gb': [64, 128, 256]},
    'sistema': {'anio': 2019},
})
ONCE_PRO = mezclar(ONCE, {
    'pantalla': {'pulgadas': 5.8, 'nombre': 'Super Retina XDR', 'tecnologia': 'OLED', 'hdr': True, 'px_largo': 2436, 'px_corto': 1125, 'ppi': 458,
                 'contraste': '2.000.000:1', 'brillo_nits': 800, 'brillo_hdr_nits': 1200},
    'camaras': {'tele_mp': 12, 'zoom_optico_max': 2.0, 'estabilizacion': DOIS},
    'video': {'estabilizacion': DOIS},
    'bateria': {'video_h': 18, 'streaming_h': 11, 'carga_rapida_w': 18},
    'conectividad': {'lte': 'LTE Gigabit'},
    'diseno': {'dorso': 'vidrio mate texturizado', 'estructura': 'Acero inoxidable', 'ip_metros': 4, 'alto_mm': 144.0, 'ancho_mm': 71.4, 'grosor_mm': 8.1, 'peso_g': 188,
               'colores': ['Verde noche', 'Plata', 'Gris espacial', 'Oro'], 'capacidades_gb': [64, 256, 512]},
})
ONCE_PRO_MAX = mezclar(ONCE_PRO, {
    'pantalla': {'pulgadas': 6.5, 'px_largo': 2688, 'px_corto': 1242},
    'bateria': {'video_h': 20, 'streaming_h': 12, 'carga_rapida': '50 % en 35 min'},
    'diseno': {'alto_mm': 158.0, 'ancho_mm': 77.8, 'grosor_mm': 8.1, 'peso_g': 226},
})
DOCE = mezclar(ONCE, {
    'pantalla': {'nombre': 'Super Retina XDR', 'tecnologia': 'OLED', 'hdr': True, 'px_largo': 2532, 'px_corto': 1170, 'ppi': 460,
                 'contraste': '2.000.000:1', 'brillo_nits': 625, 'brillo_hdr_nits': 1200},
    'rendimiento': {'chip': 'A14 Bionic', 'neural_engine_nucleos': 16},
    'camaras': {'hdr_fotos': 'HDR Inteligente 3'},
    'video': {'dolby_vision_fps': 30},
    'frontal': {'dolby_vision_fps': 30, 'modo_noche': True, 'deep_fusion': True, 'hdr_fotos': 'HDR Inteligente 3'},
    'bateria': {'video_h': 17, 'streaming_h': 11, 'magsafe_w': 15, 'qi2': True},
    'conectividad': {'cinco_g': '5G (sub-6 GHz) con MIMO 4x4', 'lte': 'LTE Gigabit', 'gnss': 'GPS, GLONASS, Galileo, QZSS y BeiDou'},
    'diseno': {'frente': 'Ceramic Shield', 'ip_metros': 6, 'alto_mm': 146.7, 'ancho_mm': 71.5, 'grosor_mm': 7.4, 'peso_g': 164,
               'colores': ['Púrpura', 'Azul', 'Verde', '(PRODUCT)RED', 'Blanco', 'Negro'], 'capacidades_gb': [64, 128, 256]},
    'sistema': {'anio': 2020, 'ios_lanzamiento': 'iOS 14'},
})
DOCE_MINI = mezclar(DOCE, {
    'pantalla': {'pulgadas': 5.4, 'px_largo': 2340, 'px_corto': 1080, 'ppi': 476},
    'bateria': {'video_h': 15, 'streaming_h': 10, 'magsafe_w': 12},
    'diseno': {'alto_mm': 131.5, 'ancho_mm': 64.2, 'grosor_mm': 7.4, 'peso_g': 135},
})
DOCE_PRO = mezclar(DOCE, {
    'pantalla': {'brillo_nits': 800},
    'camaras': {'tele_mp': 12, 'zoom_optico_max': 2.0, 'estabilizacion': DOIS, 'proraw': True, 'lidar': True},
    'video': {'dolby_vision_fps': 60, 'estabilizacion': DOIS},
    'diseno': {'estructura': 'Acero inoxidable', 'dorso': 'vidrio mate texturizado', 'peso_g': 189,
               'colores': ['Azul pacífico', 'Oro', 'Grafito', 'Plata'], 'capacidades_gb': [128, 256, 512]},
})
SENSOR = 'Estabilización óptica por desplazamiento del sensor (cámara principal)'
DOCE_PRO_MAX = mezclar(DOCE_PRO, {
    'pantalla': {'pulgadas': 6.7, 'px_largo': 2778, 'px_corto': 1284, 'ppi': 458},
    'camaras': {'zoom_optico_max': 2.5, 'estabilizacion': SENSOR},
    'video': {'estabilizacion': SENSOR},
    'bateria': {'video_h': 20, 'streaming_h': 12},
    'diseno': {'alto_mm': 160.8, 'ancho_mm': 78.1, 'grosor_mm': 7.4, 'peso_g': 228},
})


# ── Generación A15 (2021-2022) ──
CINE = '1080p a 30 fps con Dolby Vision'
CP_ENFOQUE = 'Modo Retrato con Control de Profundidad y Enfoque'
DOBLE_ESIM = 'Doble SIM (dos eSIM activas o nano-SIM y eSIM)'
GNSS_COMPLETO = 'GPS, GLONASS, Galileo, QZSS y BeiDou'

TRECE = mezclar(DOCE, {
    'pantalla': {'brillo_nits': 800},
    'rendimiento': {'chip': 'A15 Bionic'},
    'camaras': {'estabilizacion': SENSOR, 'hdr_fotos': 'HDR Inteligente 4', 'retrato': CP_ENFOQUE, 'estilos_fotograficos': ESTILOS},
    'video': {'dolby_vision_fps': 60, 'modo_cine': CINE, 'estabilizacion': SENSOR},
    'frontal': {'dolby_vision_fps': 60, 'hdr_fotos': 'HDR Inteligente 4', 'retrato': CP_ENFOQUE, 'estilos_fotograficos': ESTILOS, 'modo_cine': CINE},
    'bateria': {'video_h': 19, 'streaming_h': 15, 'magsafe_w': 15},
    'conectividad': {'sim': DOBLE_ESIM},
    'diseno': {'grosor_mm': 7.65, 'peso_g': 174, 'colores': ['Verde', 'Rosa', 'Azul', 'Medianoche', 'Blanco estrella', '(PRODUCT)RED'],
               'capacidades_gb': [128, 256, 512]},
    'sistema': {'anio': 2021, 'ios_lanzamiento': 'iOS 15', 'ios_maximo': None, 'numeros_modelo': None},
})
TRECE_MINI = mezclar(TRECE, {
    'pantalla': {'pulgadas': 5.4, 'px_largo': 2340, 'px_corto': 1080, 'ppi': 476},
    'bateria': {'video_h': 17, 'streaming_h': 13, 'magsafe_w': 12},
    'diseno': {'alto_mm': 131.5, 'ancho_mm': 64.2, 'grosor_mm': 7.65, 'peso_g': 141},
})
SE3 = mezclar(SE2, {
    'rendimiento': {'chip': 'A15 Bionic', 'neural_engine_nucleos': 16},
    'camaras': {'deep_fusion': True, 'hdr_fotos': 'HDR Inteligente 4', 'estilos_fotograficos': ESTILOS},
    'frontal': {'deep_fusion': True, 'hdr_fotos': 'HDR Inteligente 4', 'estilos_fotograficos': ESTILOS},
    'bateria': {'video_h': 15, 'streaming_h': 10},
    'conectividad': {'cinco_g': '5G (sub-6 GHz) con MIMO 2x2', 'lte': '4G LTE Advanced', 'gnss': GNSS_COMPLETO, 'sim': DOBLE_ESIM},
    'diseno': {'peso_g': 144, 'colores': ['Medianoche', 'Blanco estrella', '(PRODUCT)RED'], 'capacidades_gb': [64, 128, 256]},
    'sistema': {'anio': 2022, 'ios_lanzamiento': 'iOS 15.4'},
})


# ── 13 Pro y generación 14 ──
PRORES = 'hasta 4K a 30 fps (1080p a 30 fps en los modelos de 128 GB)'
TRECE_PRO = mezclar(TRECE, {
    'pantalla': {'brillo_nits': 1000, 'frecuencia_hz': 120, 'promotion': True},
    'rendimiento': {'gpu_nucleos': 5},
    'camaras': {'tele_mp': 12, 'zoom_optico_max': 3.0, 'proraw': True, 'lidar': True, 'macro': True},
    'video': {'prores': PRORES},
    'frontal': {'prores': PRORES},
    'bateria': {'video_h': 22, 'streaming_h': 20},
    'diseno': {'estructura': 'Acero inoxidable', 'dorso': 'vidrio mate texturizado', 'peso_g': 204,
               'colores': ['Verde alpino', 'Plata', 'Oro', 'Grafito', 'Azul alpino'],
               'capacidades_gb': [128, 256, 512, 1024]},
})
TRECE_PRO_MAX = mezclar(TRECE_PRO, {
    'pantalla': {'pulgadas': 6.7, 'px_largo': 2778, 'px_corto': 1284, 'ppi': 458},
    'bateria': {'video_h': 28, 'streaming_h': 25, 'carga_rapida': '50 % en 35 min'},
    'diseno': {'alto_mm': 160.8, 'ancho_mm': 78.1, 'grosor_mm': 7.65, 'peso_g': 240},
})
CINE_4K = 'hasta 4K a 30 fps con Dolby Vision'
ACCION = 'hasta 2,8K a 60 fps con Dolby Vision'
CATORCE_PLUS = mezclar(TRECE, {
    'pantalla': {'pulgadas': 6.7, 'px_largo': 2778, 'px_corto': 1284, 'ppi': 458, 'brillo_nits': 800},
    'rendimiento': {'gpu_nucleos': 5},
    'camaras': {'flash': 'True Tone', 'photonic_engine': True},
    'video': {'modo_cine': CINE_4K, 'modo_accion': ACCION},
    'frontal': {'modo_cine': CINE_4K, 'photonic_engine': True},
    'bateria': {'video_h': 26, 'streaming_h': 20, 'carga_rapida': '50 % en 35 min'},
    'conectividad': {'bluetooth': '5.3'},
    'seguridad': {'sos_satelite': True, 'deteccion_accidentes': True},
    'diseno': {'alto_mm': 160.8, 'ancho_mm': 78.1, 'grosor_mm': 7.8, 'peso_g': 203,
               'colores': ['Azul', 'Púrpura', 'Amarillo', 'Medianoche', 'Blanco estrella', '(PRODUCT)RED'], 'capacidades_gb': [128, 256, 512]},
    'sistema': {'anio': 2022, 'ios_lanzamiento': 'iOS 16'},
})

CATORCE = mezclar(CATORCE_PLUS, {
    'pantalla': {'pulgadas': 6.1, 'px_largo': 2532, 'px_corto': 1170, 'ppi': 460},
    'bateria': {'video_h': 20, 'streaming_h': 16, 'carga_rapida': '50 % en 30 min'},
    'diseno': {'alto_mm': 146.7, 'ancho_mm': 71.5, 'grosor_mm': 7.8, 'peso_g': 172},
})
SENSOR_2 = 'Estabilización óptica por desplazamiento del sensor de segunda generación (cámara principal)'
CATORCE_PRO = mezclar(TRECE_PRO, {
    'pantalla': {'px_largo': 2556, 'px_corto': 1179, 'ppi': 460, 'brillo_hdr_nits': 1600, 'brillo_exteriores_nits': 2000,
                 'dynamic_island': True, 'siempre_activa': True},
    'rendimiento': {'chip': 'A16 Bionic'},
    'camaras': {'principal_mp': 48, 'superalta_resolucion_mp': [48], 'zoom_opciones': [0.5, 1.0, 2.0, 3.0], 'estabilizacion': SENSOR_2,
                'flash': 'True Tone adaptativo', 'photonic_engine': True},
    'video': {'modo_cine': CINE_4K, 'modo_accion': ACCION, 'estabilizacion': SENSOR_2},
    'frontal': {'modo_cine': CINE_4K, 'photonic_engine': True},
    'bateria': {'video_h': 23, 'streaming_h': 20},
    'conectividad': {'bluetooth': '5.3', 'gnss': 'GPS de doble frecuencia y alta precisión (GPS, GLONASS, Galileo, QZSS y BeiDou)'},
    'seguridad': {'sos_satelite': True, 'deteccion_accidentes': True},
    'diseno': {'alto_mm': 147.5, 'ancho_mm': 71.5, 'grosor_mm': 7.85, 'peso_g': 206, 'colores': ['Morado oscuro', 'Oro', 'Plata', 'Negro espacial']},
    'sistema': {'anio': 2022, 'ios_lanzamiento': 'iOS 16'},
})
CATORCE_PRO_MAX = mezclar(CATORCE_PRO, {
    'pantalla': {'pulgadas': 6.7, 'px_largo': 2796, 'px_corto': 1290},
    'bateria': {'video_h': 29, 'streaming_h': 25, 'carga_rapida': '50 % en 35 min'},
    'diseno': {'alto_mm': 160.7, 'ancho_mm': 77.6, 'peso_g': 240},
})

# ── Generación 15 (2023): USB-C y Dynamic Island en todos; titanio, Botón Acción, A17 Pro y Apple Intelligence en los Pro ──
HDR5 = 'HDR Inteligente 5'
RETRATOS = 'Retratos de última generación con Control de Profundidad y Enfoque'
UWB_2 = 'Chip de banda ultraancha de segunda generación'
PRORES_EXTERNO = 'hasta 4K a 60 fps con grabación externa'

QUINCE = mezclar(CATORCE, {
    'pantalla': {'px_largo': 2556, 'px_corto': 1179, 'brillo_nits': 1000, 'brillo_hdr_nits': 1600, 'brillo_exteriores_nits': 2000,
                 'dynamic_island': True},
    'rendimiento': {'chip': 'A16 Bionic'},
    'camaras': {'principal_mp': 48, 'zoom_optico_max': 2.0, 'zoom_opciones': [0.5, 1.0, 2.0], 'superalta_resolucion_mp': [24, 48],
                'hdr_fotos': HDR5, 'retrato': RETRATOS},
    'frontal': {'hdr_fotos': HDR5, 'retrato': RETRATOS},
    'conectividad': {'uwb': UWB_2, 'conector': 'USB-C'},
    'diseno': {'dorso': 'vidrio tintado en masa', 'alto_mm': 147.6, 'ancho_mm': 71.6, 'grosor_mm': 7.8, 'peso_g': 171,
               'colores': ['Rosa', 'Amarillo', 'Verde', 'Azul', 'Negro']},
    'sistema': {'anio': 2023, 'ios_lanzamiento': 'iOS 17'},
})
QUINCE_PLUS = mezclar(QUINCE, {
    'pantalla': {'pulgadas': 6.7, 'px_largo': 2796, 'px_corto': 1290},
    'bateria': {'video_h': 26, 'streaming_h': 20, 'carga_rapida': '50 % en 35 min'},
    'diseno': {'alto_mm': 160.9, 'ancho_mm': 77.8, 'grosor_mm': 7.8, 'peso_g': 201},
})
QUINCE_PRO = mezclar(CATORCE_PRO, {
    'rendimiento': {'chip': 'A17 Pro', 'gpu_nucleos': 6, 'trazado_rayos': True},
    'camaras': {'superalta_resolucion_mp': [24, 48], 'hdr_fotos': HDR5, 'retrato': RETRATOS, 'fotos_espaciales': True},
    'video': {'prores': PRORES_EXTERNO, 'espacial': '1080p a 30 fps', 'apple_log': 'Apple Log', 'aces': True},
    'frontal': {'hdr_fotos': HDR5, 'retrato': RETRATOS, 'prores': PRORES_EXTERNO},
    'conectividad': {'wifi': X['conectividad']['wifi'].replace('5', '6E'), 'uwb': UWB_2, 'thread': True, 'conector': 'USB-C',
                     'usb': 'USB 3 hasta 10 Gb/s', 'gnss': 'GPS de doble frecuencia y alta precisión (GPS, GLONASS, Galileo, QZSS, BeiDou y NavIC)'},
    'diseno': {'estructura': 'Titanio', 'alto_mm': 146.6, 'ancho_mm': 70.6, 'grosor_mm': 8.25, 'peso_g': 187,
               'colores': ['Titanio natural', 'Titanio azul', 'Titanio blanco', 'Titanio negro'], 'boton_accion': True},
    'sistema': {'anio': 2023, 'ios_lanzamiento': 'iOS 17', 'apple_intelligence': True},
})
# 15 Pro Max: confirmado con la comparación 15 Pro Max / 16e / 16 Plus.
QUINCE_PRO_MAX = mezclar(QUINCE_PRO, {
    'pantalla': {'pulgadas': 6.7, 'px_largo': 2796, 'px_corto': 1290},
    'camaras': {'zoom_optico_max': 5.0, 'zoom_opciones': [0.5, 1.0, 2.0, 5.0]},
    'bateria': {'video_h': 29, 'streaming_h': 25, 'carga_rapida': '50 % en 35 min'},
    'diseno': {'alto_mm': 159.9, 'ancho_mm': 76.7, 'grosor_mm': 8.25, 'peso_g': 221, 'capacidades_gb': [256, 512, 1024]},
})


# ── Generación 16 (2024-2025): A18 y Botón Acción en todos; Control de Cámara y cámara Fusion con ultra gran angular en el 16 Plus;
#    el 16e con una sola cámara Fusion, sin Dynamic Island, MagSafe ni banda ultraancha ──
ESTILOS_2 = 'Estilos Fotográficos 2'
DIECISEIS_PLUS = mezclar(QUINCE_PLUS, {
    'pantalla': {'brillo_minimo_nits': 1},
    'rendimiento': {'chip': 'A18', 'gpu_nucleos': 5, 'trazado_rayos': True},
    'camaras': {'fusion': True, 'macro': True, 'fotos_espaciales': True, 'estilos_fotograficos': ESTILOS_2},
    'video': {'espacial': '1080p a 30 fps', 'audio_espacial': True, 'reduccion_viento': True, 'mezcla_audio': True},
    'frontal': {'estilos_fotograficos': ESTILOS_2},
    # En la generación 16, la carga rápida con MagSafe tarda lo mismo que por cable (la página lo dice en una sola fila).
    'bateria': {'video_h': 27, 'streaming_h': 24, 'magsafe_w': 25, 'qi_w': None, 'carga_rapida_magsafe': '50 % en 35 min', 'carga_rapida_magsafe_w': 30},
    'conectividad': {'wifi': X['conectividad']['wifi'].replace('5', '7'), 'thread': True},
    'diseno': {'alto_mm': 160.9, 'ancho_mm': 77.8, 'grosor_mm': 7.8, 'peso_g': 199, 'boton_accion': True, 'control_camara': True,
               'colores': ['Azul ultramar', 'Verde azulado', 'Rosa', 'Blanco', 'Negro']},
    'sistema': {'anio': 2024, 'ios_lanzamiento': 'iOS 18', 'apple_intelligence': True},
})
DIECISEIS_E = mezclar(DIECISEIS_PLUS, {
    'pantalla': {'pulgadas': 6.1, 'px_largo': 2532, 'px_corto': 1170, 'brillo_nits': 800, 'brillo_hdr_nits': 1200,
                 'brillo_exteriores_nits': False, 'brillo_minimo_nits': False, 'dynamic_island': False},
    'rendimiento': {'gpu_nucleos': 4},
    'camaras': {'ultra_mp': False, 'zoom_optico_min': 1.0, 'zoom_opciones': [1.0, 2.0], 'estabilizacion': OIS, 'retrato': CP,
                'macro': False, 'fotos_espaciales': False, 'estilos_fotograficos': ESTILOS},
    'video': {'modo_cine': False, 'modo_accion': False, 'espacial': False, 'estabilizacion': OIS},
    'frontal': {'retrato': CP, 'modo_cine': False, 'estilos_fotograficos': ESTILOS},
    'bateria': {'video_h': 26, 'streaming_h': 21, 'carga_rapida': '50 % en 30 min', 'magsafe_w': 0, 'qi2': False, 'qi_w': 7.5,
                'carga_rapida_magsafe': False, 'carga_rapida_magsafe_w': False},
    'conectividad': {'wifi': X['conectividad']['wifi'].replace('5', '6'), 'uwb': False, 'thread': False,
                     'gnss': 'GPS, GLONASS, Galileo, QZSS, BeiDou y NavIC'},
    'diseno': {'dorso': 'vidrio', 'alto_mm': 146.7, 'ancho_mm': 71.5, 'grosor_mm': 7.8, 'peso_g': 167, 'control_camara': False,
               'colores': ['Blanco', 'Negro']},
    'sistema': {'anio': 2025, 'ios_lanzamiento': 'iOS 18.3'},
})


# ── iPhone 16, 16 Pro y 16 Pro Max (2024): los Pro suman ultra gran angular de 48 MP, teleobjetivo 5x con estabilización 3D,
#    video 4K a 120 fps, ProRes a 120 fps y cuatro micrófonos de estudio ──
DIECISEIS = mezclar(DIECISEIS_PLUS, {
    'pantalla': {'pulgadas': 6.1, 'px_largo': 2556, 'px_corto': 1179},
    'bateria': {'video_h': 22, 'streaming_h': 18, 'carga_rapida': '50 % en 30 min', 'magsafe_w': 25, 'qi_w': None, 'carga_rapida_magsafe': '50 % en 30 min'},
    'diseno': {'alto_mm': 147.6, 'ancho_mm': 71.6, 'grosor_mm': 7.8, 'peso_g': 170},
})
SENSOR_2_3D = 'Estabilización óptica por desplazamiento del sensor de segunda generación (cámara principal) y en 3D (teleobjetivo)'
DIECISEIS_PRO = mezclar(QUINCE_PRO, {
    'pantalla': {'pulgadas': 6.3, 'px_largo': 2622, 'px_corto': 1206, 'brillo_minimo_nits': 1},
    'rendimiento': {'chip': 'A18 Pro'},
    'camaras': {'fusion': True, 'ultra_mp': 48, 'zoom_optico_max': 5.0, 'zoom_opciones': [0.5, 1.0, 2.0, 5.0],
                'estabilizacion_tele': 'Estabilización óptica por desplazamiento del sensor en 3D', 'estilos_fotograficos': ESTILOS_2},
    'video': {'resolucion_max': '4K hasta 120 fps (cámara principal Fusion) y hasta 60 fps (ultra gran angular y teleobjetivo)',
              'dolby_vision_fps': 120,
              'camara_lenta': '1080p hasta 240 fps y en 4K con Dolby Vision hasta 120 fps (cámara principal Fusion)',
              'prores': 'hasta 4K a 120 fps con grabación externa', 'estabilizacion': SENSOR_2_3D,
              'audio_espacial': True, 'microfonos_estudio': True, 'reduccion_viento': True, 'mezcla_audio': True},
    'frontal': {'estilos_fotograficos': ESTILOS_2},
    'bateria': {'video_h': 27, 'streaming_h': 22, 'magsafe_w': 25, 'carga_rapida_magsafe': '50 % en 30 min', 'carga_rapida_magsafe_w': 30},
    'conectividad': {'wifi': X['conectividad']['wifi'].replace('5', '7')},
    'diseno': {'alto_mm': 149.6, 'ancho_mm': 71.5, 'grosor_mm': 8.25, 'peso_g': 199, 'control_camara': True,
               'colores': ['Titanio color desierto', 'Titanio natural', 'Titanio blanco', 'Titanio negro']},
    'sistema': {'anio': 2024, 'ios_lanzamiento': 'iOS 18'},
})
DIECISEIS_PRO_MAX = mezclar(DIECISEIS_PRO, {
    'pantalla': {'pulgadas': 6.9, 'px_largo': 2868, 'px_corto': 1320},
    'bateria': {'video_h': 33, 'streaming_h': 29, 'carga_rapida': '50 % en 35 min', 'magsafe_w': 25, 'carga_rapida_magsafe': '50 % en 35 min'},
    'diseno': {'alto_mm': 163.0, 'ancho_mm': 77.6, 'grosor_mm': 8.25, 'peso_g': 227, 'capacidades_gb': [256, 512, 1024]},
})


# ── Generación 17 (2025-2026): A19 con GPU con Neural Accelerators, frente Ceramic Shield 2 y Bluetooth 6; cámara frontal Center Stage
#    de 18 MP con Encuadre Centrado, Captura Dual y video ultraestabilizado. El 17 suma ProMotion, pantalla siempre activa, ultra gran
#    angular Fusion de 48 MP y carga del 50 % en 20 min con 40 W; el Air (titanio, 5,64 mm) tiene una sola cámara y solo eSIM;
#    el 17e sigue con una cámara y sin Dynamic Island, pero suma MagSafe de 15 W ──
CERAMIC_2 = 'Ceramic Shield 2'
CAPTURA_DUAL = 'hasta 4K a 30 fps con Dolby Vision'
FRONTAL_18 = {'mp': 18, 'nombre': 'Center Stage', 'encuadre_centrado': True, 'video_ultraestabilizado': True}
GNSS_DOBLE = 'GPS de doble frecuencia y alta precisión (GPS, GLONASS, Galileo, QZSS, BeiDou y NavIC)'
SENSOR_UNICA = 'Estabilización óptica por desplazamiento del sensor'   # el Air tiene una sola cámara
SOLO_ESIM = 'Doble eSIM (dos eSIM activas; no admite tarjetas SIM físicas)'

DIECISIETE = mezclar(DIECISEIS, {
    'pantalla': {'pulgadas': 6.3, 'px_largo': 2622, 'px_corto': 1206, 'brillo_exteriores_nits': 3000, 'frecuencia_hz': 120,
                 'promotion': True, 'siempre_activa': True},
    'rendimiento': {'chip': 'A19', 'gpu_neural_accelerators': True},
    'camaras': {'ultra_mp': 48, 'ultra_fusion': True},
    'video': {'captura_dual': CAPTURA_DUAL},
    'frontal': FRONTAL_18,
    # Por cable llega al 50 % en 20 min (40 W); con MagSafe, en 30 min (30 W): la página los da en filas separadas.
    'bateria': {'video_h': 30, 'streaming_h': 27, 'carga_rapida': '50 % en 20 min', 'carga_rapida_w': 40, 'magsafe_w': 25, 'qi_w': None,
                'carga_rapida_magsafe': '50 % en 30 min', 'carga_rapida_magsafe_w': 30},
    'conectividad': {'bluetooth': '6', 'gnss': GNSS_DOBLE},
    'diseno': {'frente': CERAMIC_2, 'alto_mm': 149.6, 'ancho_mm': 71.5, 'grosor_mm': 7.95, 'peso_g': 177,
               'colores': ['Lavanda', 'Verde salvia', 'Azul neblina', 'Blanco', 'Negro'], 'capacidades_gb': [256, 512]},
    'sistema': {'anio': 2025, 'ios_lanzamiento': 'iOS 26'},
})
AIR = mezclar(DIECISIETE, {
    'pantalla': {'pulgadas': 6.5, 'px_largo': 2736, 'px_corto': 1260},
    'rendimiento': {'chip': 'A19 Pro'},
    'camaras': {'ultra_mp': False, 'ultra_fusion': False, 'zoom_optico_min': 1.0, 'zoom_opciones': [1.0, 2.0], 'estabilizacion': SENSOR_UNICA,
                'macro': False, 'fotos_espaciales': False},
    'video': {'modo_cine': False, 'espacial': False, 'estabilizacion': SENSOR_UNICA},
    'frontal': {'modo_cine': False},
    'bateria': {'video_h': 27, 'streaming_h': 22, 'carga_rapida': '50 % en 30 min', 'carga_rapida_w': 20, 'magsafe_w': 20,
                'carga_rapida_magsafe': '50 % en 30 min', 'carga_rapida_magsafe_w': 30},
    'conectividad': {'sim': SOLO_ESIM},
    'diseno': {'estructura': 'Titanio', 'dorso': 'Ceramic Shield', 'alto_mm': 156.2, 'ancho_mm': 74.7, 'grosor_mm': 5.64, 'peso_g': 165,
               'colores': ['Azul cielo', 'Dorado claro', 'Blanco nube', 'Negro espacial'], 'capacidades_gb': [256, 512, 1024]},
})
DIECISIETE_E = mezclar(DIECISEIS_E, {
    'rendimiento': {'chip': 'A19', 'gpu_neural_accelerators': True},
    'camaras': {'retrato': RETRATOS},
    'frontal': {'retrato': RETRATOS},
    'bateria': {'magsafe_w': 15, 'qi2': True, 'qi_w': None},
    'diseno': {'frente': CERAMIC_2, 'peso_g': 170, 'colores': ['Rosa palo', 'Blanco', 'Negro'], 'capacidades_gb': [256, 512]},
    'sistema': {'anio': 2026, 'ios_lanzamiento': 'iOS 26'},
})

# ── 17 Pro y 17 Pro Max (2025): unibody de aluminio con dorso Ceramic Shield; sistema Pro Fusion de 48 MP con teleobjetivo Fusion
#    (zoom hasta 8x), ProRes RAW, Apple Log 2 y Genlock; carga del 50 % en 20 min con 40 W ──
DIECISIETE_PRO = mezclar(DIECISEIS_PRO, {
    'pantalla': {'brillo_exteriores_nits': 3000},
    'rendimiento': {'chip': 'A19 Pro', 'gpu_neural_accelerators': True},
    'camaras': {'ultra_fusion': True, 'tele_mp': 48, 'tele_fusion': True, 'zoom_optico_max': 8.0, 'zoom_opciones': [0.5, 1.0, 2.0, 4.0, 8.0]},
    'video': {'resolucion_max': '4K hasta 120 fps (cámara principal Fusion) y hasta 60 fps (ultra gran angular Fusion y teleobjetivo Fusion)',
              'apple_log': 'Apple Log 2', 'prores_raw': True, 'genlock': True, 'captura_dual': CAPTURA_DUAL},
    'frontal': FRONTAL_18,
    'bateria': {'video_h': 31, 'streaming_h': 28, 'carga_rapida': '50 % en 20 min', 'carga_rapida_w': 40, 'magsafe_w': 25, 'qi_w': None,
                'carga_rapida_magsafe': '50 % en 30 min', 'carga_rapida_magsafe_w': 30},
    'conectividad': {'bluetooth': '6', 'gnss': GNSS_DOBLE},
    'diseno': {'estructura': 'Unibody de aluminio', 'frente': CERAMIC_2, 'dorso': 'Ceramic Shield', 'alto_mm': 150.0, 'ancho_mm': 71.9,
               'grosor_mm': 8.75, 'peso_g': 204, 'colores': ['Naranja cósmico', 'Azul oscuro', 'Plata'], 'capacidades_gb': [256, 512, 1024]},
    'sistema': {'anio': 2025, 'ios_lanzamiento': 'iOS 26'},
})
DIECISIETE_PRO_MAX = mezclar(DIECISIETE_PRO, {
    'pantalla': {'pulgadas': 6.9, 'px_largo': 2868, 'px_corto': 1320},
    'bateria': {'video_h': 37, 'streaming_h': 33},
    'diseno': {'alto_mm': 163.4, 'ancho_mm': 78.0, 'peso_g': 231, 'capacidades_gb': [256, 512, 1024, 2048]},
})


# ── 18 Pro, 18 Pro Max y Duo (2026): A20 Pro con supernúcleos y doble Neural Engine, Estilos Fotográficos 3, enfoque con seguimiento
#    inteligente, efectos del modo Cine, mejores videos con poca luz y time-lapse estabilizado. Los Pro suman apertura variable,
#    Controles Pro y carga del 50 % en unos 15 min con 60 W. El Duo es plegable (pantalla interior de 7,6" y exterior de 5,4"),
#    con doble batería, Touch ID, solo eSIM, dos cámaras traseras y una cámara FaceTime bajo la pantalla ──
ESTILOS_3 = 'Estilos Fotográficos 3'
TIME_LAPSE = 'hasta 4K con Dolby Vision'
DIECIOCHO_PRO = mezclar(DIECISIETE_PRO, {
    'rendimiento': {'chip': 'A20 Pro', 'gpu_nucleos': 7, 'supernucleos': True, 'neural_engine_doble': True},
    'camaras': {'apertura_variable': 'ƒ/1,48, ƒ/1,8, ƒ/2,8 o ƒ/4,0', 'controles_pro': True, 'enfoque_inteligente': True,
                'estilos_fotograficos': ESTILOS_3},
    'video': {'modo_cine': 'hasta 4K a 60 fps con Dolby Vision', 'efectos_cine': True, 'poca_luz': True, 'time_lapse': TIME_LAPSE,
              'camara_lenta': '1080p hasta 240 fps y 4K con Dolby Vision hasta 120 fps (cámara principal Fusion)'},
    'frontal': {'estilos_fotograficos': ESTILOS_3, 'enfoque_inteligente': True, 'poca_luz': True, 'efectos_cine': True, 'time_lapse': TIME_LAPSE},
    'bateria': {'video_h': 34, 'streaming_h': 31, 'carga_rapida': '50 % en unos 15 min', 'carga_rapida_w': 60,
                'carga_rapida_voltaje_ajustable': True, 'carga_rapida_magsafe': '50 % en 30 min', 'carga_rapida_magsafe_w': 35},
    'diseno': {'grosor_mm': 8.75, 'peso_g': 211, 'colores': ['Burdeos', 'Azul glacial', 'Plata', 'Negro'], 'capacidades_gb': [256, 512, 1024, 2048]},
    'sistema': {'anio': 2026, 'ios_lanzamiento': 'iOS 27'},
})
DIECIOCHO_PRO_MAX = mezclar(DIECIOCHO_PRO, {
    'pantalla': {'pulgadas': 6.9, 'px_largo': 2868, 'px_corto': 1320},
    'bateria': {'video_h': 43, 'streaming_h': 38},
    'diseno': {'alto_mm': 163.4, 'ancho_mm': 78.0, 'peso_g': 249},
})
DUO = mezclar(DIECIOCHO_PRO, {
    'pantalla': {'pulgadas': 7.6, 'px_largo': 2670, 'px_corto': 1878, 'ppi': 430, 'plegable': True, 'nanotexturizado': True,
                 'exterior_pulgadas': 5.4, 'exterior_px_largo': 2034, 'exterior_px_corto': 1398, 'exterior_ppi': 460,
                 'apple_pencil': 'Apple Pencil (USB-C), con una actualización prevista para más adelante en 2026'},
    'camaras': {'tele_mp': False, 'tele_fusion': False, 'zoom_optico_max': 2.0, 'zoom_opciones': [0.5, 1.0, 2.0], 'estabilizacion': SENSOR,
                'estabilizacion_tele': False, 'apertura_variable': False, 'controles_pro': False, 'flash': 'True Tone', 'lidar': False,
                'proraw': False, 'fotos_espaciales': False, 'otras_funciones': ['Captura Inteligente', 'Duo Preview']},
    'video': {'resolucion_max': '4K hasta 120 fps (cámara principal Fusion) y hasta 60 fps (ultra gran angular Fusion)', 'estabilizacion': SENSOR,
              'espacial': False, 'prores': False, 'prores_raw': False, 'aces': False, 'apple_log': False, 'genlock': False,
              'microfonos_estudio': False},
    'frontal': {'mp': 12, 'enfoque_inteligente': False, 'prores': False, 'otras_funciones': ['Captura Inteligente', 'Animación Infantil'],
                'bajo_pantalla': 'video en 1080p, Encuadre Centrado para videollamadas, Duo FaceTime y video ultraestabilizado'},
    'bateria': {'video_h': 31, 'streaming_h': 26, 'video_exterior_h': 44, 'streaming_exterior_h': 37, 'doble': True,
                'carga_rapida': '50 % en unos 20 min', 'carga_rapida_voltaje_ajustable': False, 'carga_rapida_magsafe': '50 % en unos 30 min'},
    'conectividad': {'sim': SOLO_ESIM},
    'seguridad': {'biometria': 'Touch ID (sensor de huella en el botón lateral)'},
    'diseno': {'estructura': 'Titanio', 'alto_mm': 117.8, 'ancho_mm': 84.1, 'grosor_mm': 11.3, 'abierto_ancho_mm': 164.6,
               'abierto_grosor_mm': 5.2, 'peso_g': 254, 'colores': ['Blanco estelar', 'Cielo nocturno'], 'boton_accion': False},
})


# ── Pendientes: lo que falta (campo vacío) o hay que verificar (cargado, pero sin fuente que lo confirme) ──
# El informe del 2026-09-15 (docs/admin-ui/informes/) cerró lo que traía una página oficial de Apple que respalda el dato;
# lo que citaba mal (otra página, otro modelo o una cita que no dice el dato) sigue aquí, con lo que falta confirmar.
FUENTE_SPECS = 'Apple Soporte: especificaciones técnicas del {modelo}.'
FUENTE_IOS = 'Apple Soporte: listas de modelos compatibles con iOS 17, iOS 26 e iOS 27.'
FUENTE_MODELOS = 'Apple Soporte: «Identificar el modelo de iPhone» (support.apple.com/108044).'
INFORME = 'El informe del 2026-09-15'

def pendiente(campo, tipo, detalle, fuente=FUENTE_SPECS):
    return {'campo': campo, 'tipo': tipo, 'detalle': detalle, 'fuente': fuente}

# Sin pendientes abiertos: la segunda ronda del 2026-09-15 cerró los últimos con Apple EE. UU. y, para el 18 Pro, el 18 Pro Max
# y el Duo, con las fichas de Apple de cada país y fuentes externas (docs/admin-ui/informes/verificacion-apple-2026-09-15.md).

# Números de modelo verificados el 2026-09-15 en «Identificar el modelo de iPhone» (support.apple.com/es-es/108044 y en-us/108044).
# El informe tenía errores: le faltaban las variantes de Rusia del 13 y el 14, y cruzaba o inventaba los del 16 Pro, 16 Pro Max,
# 16e, 17, Air y 17 Pro. El 18 Pro, el 18 Pro Max y el Duo todavía no figuran.
NUMEROS = {
    'iPhone X': ['A1865', 'A1901', 'A1902'],
    'iPhone XR': ['A1984', 'A2105', 'A2106', 'A2107', 'A2108'],
    'iPhone XS': ['A1920', 'A2097', 'A2098', 'A2099', 'A2100'],
    'iPhone XS Max': ['A1921', 'A2101', 'A2102', 'A2103', 'A2104'],
    'iPhone 11': ['A2111', 'A2221', 'A2223'],
    'iPhone 11 Pro': ['A2160', 'A2215', 'A2217'],
    'iPhone 11 Pro Max': ['A2161', 'A2218', 'A2220'],
    'iPhone SE (2.ª generación)': ['A2275', 'A2296', 'A2298'],
    'iPhone 12': ['A2172', 'A2402', 'A2403', 'A2404'],
    'iPhone 12 mini': ['A2176', 'A2398', 'A2399', 'A2400'],
    'iPhone 12 Pro': ['A2341', 'A2406', 'A2407', 'A2408'],
    'iPhone 12 Pro Max': ['A2342', 'A2410', 'A2411', 'A2412'],
    'iPhone 13 mini': ['A2481', 'A2626', 'A2628', 'A2629', 'A2630'],
    'iPhone 13': ['A2482', 'A2631', 'A2633', 'A2634', 'A2635'],
    'iPhone SE (3.ª generación)': ['A2595', 'A2782', 'A2783', 'A2784', 'A2785'],
    'iPhone 13 Pro': ['A2483', 'A2636', 'A2638', 'A2639', 'A2640'],
    'iPhone 13 Pro Max': ['A2484', 'A2641', 'A2643', 'A2644', 'A2645'],
    'iPhone 14': ['A2649', 'A2881', 'A2882', 'A2883', 'A2884'],
    'iPhone 14 Plus': ['A2632', 'A2885', 'A2886', 'A2887', 'A2888'],
    'iPhone 14 Pro': ['A2650', 'A2889', 'A2890', 'A2891', 'A2892'],
    'iPhone 14 Pro Max': ['A2651', 'A2893', 'A2894', 'A2895', 'A2896'],
    'iPhone 15': ['A2846', 'A3089', 'A3090', 'A3092'],
    'iPhone 15 Plus': ['A2847', 'A3093', 'A3094', 'A3096'],
    'iPhone 15 Pro': ['A2848', 'A3101', 'A3102', 'A3104'],
    'iPhone 15 Pro Max': ['A2849', 'A3105', 'A3106', 'A3108'],
    'iPhone 16': ['A3081', 'A3286', 'A3287', 'A3288'],
    'iPhone 16 Plus': ['A3082', 'A3289', 'A3290', 'A3291'],
    'iPhone 16 Pro': ['A3083', 'A3292', 'A3293', 'A3294'],
    'iPhone 16 Pro Max': ['A3084', 'A3295', 'A3296', 'A3297'],
    'iPhone 16e': ['A3212', 'A3408', 'A3409', 'A3410'],
    'iPhone 17': ['A3258', 'A3519', 'A3520', 'A3521'],
    'iPhone Air': ['A3260', 'A3516', 'A3517', 'A3518'],
    'iPhone 17e': ['A3575', 'A3634', 'A3635'],
    'iPhone 17 Pro': ['A3256', 'A3522', 'A3523', 'A3524'],
    'iPhone 17 Pro Max': ['A3257', 'A3525', 'A3526', 'A3527'],
    # Aún no figuran en support.apple.com/108044: EE. UU., Canadá y Reino Unido salen de la ficha de Apple de cada país
    # (apple.com, apple.com/ca y apple.com/uk); China, de apple.com.cn. Los cuatro coinciden con gsmarena.com.
    'iPhone 18 Pro': ['A3472', 'A3713', 'A3714', 'A3715'],
    'iPhone 18 Pro Max': ['A3473', 'A3716', 'A3717', 'A3718'],
    'iPhone Duo': ['A3447', 'A3719', 'A3720', 'A3721'],
}

# Lo que se confirmó fuera de la página pegada, con su fuente: el auditor no lo marca. Detalle en docs/admin-ui/informes/.
CONFIRMADO = {}

def confirmar(campo, modelos, fuente):
    for nombre in modelos:
        CONFIRMADO[(nombre, campo)] = 'Informe del 2026-09-15: ' + fuente

HASTA_16E = ['iPhone XR', 'iPhone XS', 'iPhone XS Max', 'iPhone 11', 'iPhone 11 Pro', 'iPhone 11 Pro Max', 'iPhone SE (2.ª generación)',
             'iPhone 12', 'iPhone 12 mini', 'iPhone 12 Pro', 'iPhone 12 Pro Max', 'iPhone 13 mini', 'iPhone 13', 'iPhone SE (3.ª generación)',
             'iPhone 13 Pro', 'iPhone 13 Pro Max', 'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max', 'iPhone 15',
             'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max',
             'iPhone 16e']
DEL_12_AL_16 = [m for m in HASTA_16E[7:28] if 'SE' not in m]   # el informe no cubrió al SE (3.ª generación)
confirmar('sistema.ios_lanzamiento', HASTA_16E, 'Apple Newsroom, anuncio de cada modelo.')
confirmar('diseno.dorso', DEL_12_AL_16 + ['iPhone 16e', 'iPhone 17', 'iPhone 17e'], 'ficha técnica y support.apple.com/es-es/108044.')
confirmar('bateria.carga_rapida_magsafe_w', ['iPhone Air'], 'support.apple.com/es-es/125092.')
confirmar('diseno.frente', ['iPhone 17 Pro', 'iPhone 17 Pro Max'], 'support.apple.com/es-es/125090 y 125091.')
confirmar('diseno.grosor_mm', ['iPhone 16 Pro'], 'support.apple.com/es-lamr/121031, «Grosor: 8.25 mm».')

def verificado(campo, modelos, fuente):
    for nombre in modelos:
        CONFIRMADO[(nombre, campo)] = 'Verificado en Apple el 2026-09-15: ' + fuente

DESDE_17 = ['iPhone 17', 'iPhone Air', 'iPhone 17e', 'iPhone 17 Pro', 'iPhone 17 Pro Max', 'iPhone 18 Pro', 'iPhone 18 Pro Max', 'iPhone Duo']

# Último iOS: el X figura hasta iOS 16, el XR y los XS hasta iOS 18, y desde el 11 (con el SE de 2.ª generación) están en la lista
# de iOS 27. El Duo aún no figura en esa lista, pero su ficha técnica dice que trae iOS 27.
IOS_MAXIMO = {'iPhone X': 'iOS 16', 'iPhone XR': 'iOS 18', 'iPhone XS': 'iOS 18', 'iPhone XS Max': 'iOS 18',
              **{nombre: 'iOS 27' for nombre in HASTA_16E[3:] + DESDE_17}}
verificado('sistema.ios_maximo', list(IOS_MAXIMO),
           'listas de modelos compatibles con iOS 16, 17, 18, 26 y 27 (support.apple.com/guide/iphone/iphe3fa5df43); el Duo, por su ficha técnica.')
verificado('sistema.numeros_modelo', list(NUMEROS), 'support.apple.com/es-es/108044 y en-us/108044.')
verificado('sistema.ios_lanzamiento', ['iPhone 17e'], 'Apple Newsroom (2026-03), «iPhone 17e comes with iOS 26».')
verificado('sistema.ios_lanzamiento', ['iPhone 18 Pro', 'iPhone 18 Pro Max', 'iPhone Duo'],
           'fichas técnicas (apple.com/es/iphone-18-pro/specs y apple.com/es/iphone-duo/specs), «iOS 27».')
verificado('conectividad.uwb', HASTA_16E[3:6] + DEL_12_AL_16[:12], 'support.apple.com/en-us/109512, «first-generation Ultra Wideband chip».')
verificado('bateria.qi_w', [m for m in DEL_12_AL_16 if m not in ('iPhone 16', 'iPhone 16 Plus')],
           'fichas técnicas en inglés (support.apple.com/en-us), «Qi wireless charging up to 7.5W».')
verificado('diseno.grosor_mm', ['iPhone 13 mini', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Pro Max',
           'iPhone 15 Pro', 'iPhone 15 Pro Max', 'iPhone 16 Pro Max', 'iPhone 17', 'iPhone Air', 'iPhone 17 Pro', 'iPhone 17 Pro Max',
           'iPhone 18 Pro', 'iPhone 18 Pro Max', 'iPhone Duo'], 'fichas técnicas en inglés, con el grosor en milímetros.')
verificado('diseno.dorso', ['iPhone 11 Pro', 'iPhone 11 Pro Max'], 'support.apple.com/es-es/108044, «La parte trasera es de vidrio mate texturizado».')
verificado('diseno.capacidades_gb', ['iPhone 11', 'iPhone SE (2.ª generación)'], 'support.apple.com/en-us/111865 y kb/SP820, «64GB, 128GB, 256GB».')
verificado('seguridad.sos_satelite', HASTA_16E[16:] + DESDE_17,
           'support.apple.com/es-es/101573: disponible en 20 países (entre ellos EE. UU., Canadá, México y España); Bolivia y Sudamérica no figuran.')

# SIM según el país de venta (support.apple.com/es-es/108044, verificado el 2026-09-15). Decisión del usuario: la ficha avisa qué
# unidades son solo eSIM, sin usar la procedencia de cada equipo. El Air y el Duo son solo eSIM en todo el mundo (ya lo dice su SIM);
# el 18 Pro y el 18 Pro Max todavía no figuran en esa página, así que no llevan aviso.
SOLO_ESIM_EN = {**{nombre: 'EE. UU.' for nombre in HASTA_16E[16:]},
                **{nombre: 'EE. UU., Canadá, México, Japón y otros 9 territorios'
                   for nombre in ['iPhone 17', 'iPhone 17e', 'iPhone 17 Pro', 'iPhone 17 Pro Max']},
                'iPhone 18 Pro': 'EE. UU. y Canadá', 'iPhone 18 Pro Max': 'EE. UU. y Canadá'}
verificado('conectividad.solo_esim_en', list(SOLO_ESIM_EN),
           'support.apple.com/es-es/108044, «En los Estados Unidos no tiene bandeja SIM» (del 14 al 16e) y «No hay bandeja SIM en '
           'Estados Unidos, Puerto Rico, Bahréin, Canadá, Guam, Japón, Kuwait, México, Omán, Qatar, Arabia Saudita, Emiratos Árabes '
           'Unidos y las Islas Vírgenes de EE. UU.» (familia 17).')

# Segunda ronda (2026-09-15). El usuario importa desde EE. UU.: ante dos fuentes de Apple, vale la de EE. UU.
IOS_LANZAMIENTO = {'iPhone Duo': 'iOS 27.1'}
verificado('conectividad.solo_esim_en', ['iPhone 18 Pro', 'iPhone 18 Pro Max'],
           'apple.com/iphone-18-pro/specs y apple.com/ca/iphone-18-pro/specs, «not compatible with physical SIM cards».')
verificado('sistema.numeros_modelo', ['iPhone 18 Pro', 'iPhone 18 Pro Max', 'iPhone Duo'],
           'fichas de Apple de EE. UU., Canadá y Reino Unido («Model A####») y apple.com.cn; coinciden con gsmarena.com.')
verificado('sistema.ios_lanzamiento', ['iPhone 17', 'iPhone Air', 'iPhone 17 Pro', 'iPhone 17 Pro Max'],
           'fuentes externas: macrumors.com (2025-09-18, «All four iPhones have iOS 26 pre-installed», compilación 23A330) y Wikipedia.')
verificado('sistema.ios_lanzamiento', ['iPhone Duo'], 'Apple Newsroom (2026-09), «iPhone Duo will be available with iOS 27.1».')
verificado('pantalla.apple_pencil', ['iPhone Duo'],
           'apple.com/iphone-duo/specs («Coming later this year») y Apple Newsroom («Later this year, iPhone Duo will support Apple Pencil with USB-C»).')
verificado('bateria.magsafe_w', ['iPhone 16', 'iPhone 16 Pro'],
           'apple.com/iphone-16/specs y support.apple.com/en-us/121031, «MagSafe wireless charging up to 25W» (la comparación de Apple España decía 22 W).')
verificado('bateria.qi_w', ['iPhone 16', 'iPhone 16 Plus'],
           'apple.com/iphone-16/specs solo lista MagSafe y Qi2 de hasta 25 W: Apple ya no publica la potencia de Qi (queda vacía).')

# 5G mmWave (verificado el 2026-09-15). Las fichas de Apple EE. UU. dicen «5G (sub-6 GHz and mmWave)» y listan «5G NR mmWave (Bands
# n258, n260, n261)» bajo el número de modelo de EE. UU.; las de España, solo «sub-6 GHz» (lo que tiene `cinco_g`). Decisión del
# usuario: avisarlo en la ficha, como la SIM. El SE (3.ª generación), el 16e, el Air y el 17e no tienen mmWave ni en EE. UU.
MMWAVE_EN = {nombre: 'EE. UU.' for nombre in [
    'iPhone 12', 'iPhone 12 mini', 'iPhone 12 Pro', 'iPhone 12 Pro Max', 'iPhone 13 mini', 'iPhone 13', 'iPhone 13 Pro', 'iPhone 13 Pro Max',
    'iPhone 14', 'iPhone 14 Plus', 'iPhone 14 Pro', 'iPhone 14 Pro Max', 'iPhone 15', 'iPhone 15 Plus', 'iPhone 15 Pro', 'iPhone 15 Pro Max',
    'iPhone 16', 'iPhone 16 Plus', 'iPhone 16 Pro', 'iPhone 16 Pro Max', 'iPhone 17', 'iPhone 17 Pro', 'iPhone 17 Pro Max',
    'iPhone 18 Pro', 'iPhone 18 Pro Max', 'iPhone Duo']}
verificado('conectividad.mmwave_en', list(MMWAVE_EN),
           'fichas técnicas de Apple EE. UU. (support.apple.com/kb/SP829, SP830, SP831, SP832, SP847, SP848, SP851, SP852, SP873, SP874, '
           'SP875 y SP876; support.apple.com/en-us/111828, 111829, 111830, 111831, 121029, 121030, 121031, 121032, 125090 y 125091; '
           'apple.com/iphone-17/specs, iphone-18-pro/specs e iphone-duo/specs), «5G (sub-6 GHz and mmWave)».')
verificado('conectividad.mmwave_en', ['iPhone SE (3.ª generación)', 'iPhone 16e', 'iPhone Air', 'iPhone 17e'],
           'support.apple.com/kb/SP867, support.apple.com/en-us/122208, apple.com/iphone-air/specs y apple.com/iphone-17e/specs, '
           'solo «5G (sub-6 GHz)».')

# RAM y capacidad de batería (2026-09-15). Apple no publica ninguna de las dos en sus fichas; decisión del usuario: cargarlas con
# fuentes externas que las confirmen. Cada valor coincide en gsmarena.com y en el infobox de Wikipedia (que cita a MacRumors con
# Xcode, iFixit y registros de certificación); donde no coincidían, decidió una tercera fuente (9to5Mac o MacRumors). Desde el 17,
# Apple publica la batería en sus etiquetas de energía de la UE. Lo que ninguna fuente confirma queda en `pendientes`.
# Detalle y enlaces: docs/admin-ui/informes/ram-bateria-2026-09-15.md
def externo(campo, modelos, fuente):
    for nombre in modelos:
        CONFIRMADO[(nombre, campo)] = 'Fuentes externas (Apple no lo publica), 2026-09-15: ' + fuente

RAM_GB = {
    'iPhone X': 3, 'iPhone XR': 3, 'iPhone XS': 4, 'iPhone XS Max': 4, 'iPhone 11': 4, 'iPhone 11 Pro': 4, 'iPhone 11 Pro Max': 4,
    'iPhone SE (2.ª generación)': 3, 'iPhone 12': 4, 'iPhone 12 mini': 4, 'iPhone 12 Pro': 6, 'iPhone 12 Pro Max': 6,
    'iPhone 13 mini': 4, 'iPhone 13': 4, 'iPhone SE (3.ª generación)': 4, 'iPhone 13 Pro': 6, 'iPhone 13 Pro Max': 6,
    'iPhone 14': 6, 'iPhone 14 Plus': 6, 'iPhone 14 Pro': 6, 'iPhone 14 Pro Max': 6, 'iPhone 15': 6, 'iPhone 15 Plus': 6,
    'iPhone 15 Pro': 8, 'iPhone 15 Pro Max': 8, 'iPhone 16': 8, 'iPhone 16 Plus': 8, 'iPhone 16 Pro': 8, 'iPhone 16 Pro Max': 8,
    'iPhone 16e': 8, 'iPhone 17': 8, 'iPhone Air': 12, 'iPhone 17e': 8, 'iPhone 17 Pro': 12, 'iPhone 17 Pro Max': 12,
    'iPhone 18 Pro': 12, 'iPhone 18 Pro Max': 12,
    # El Duo queda pendiente: Xcode 27 todavía no lo reconoce y nadie lo confirmó (MacRumors solo supone 12 GB por su chip).
}
externo('rendimiento.ram_gb', list(RAM_GB), 'gsmarena.com y Wikipedia coinciden en todos (Wikipedia cita a MacRumors, que la '
        'toma de Xcode); el 17e (macrumors.com, 2026-03-05) y el 18 Pro y el 18 Pro Max (macrumors.com, 2026-09-09), según Xcode.')

# La batería de la versión con bandeja SIM, o la única cuando no hay variantes.
BATERIA_MAH = {
    'iPhone X': 2716, 'iPhone XR': 2942, 'iPhone XS': 2658, 'iPhone XS Max': 3174, 'iPhone 11': 3110, 'iPhone 11 Pro': 3046,
    'iPhone 11 Pro Max': 3969, 'iPhone SE (2.ª generación)': 1821, 'iPhone 12': 2815, 'iPhone 12 mini': 2227, 'iPhone 12 Pro': 2815,
    'iPhone 12 Pro Max': 3687, 'iPhone 13 mini': 2406, 'iPhone 13': 3227, 'iPhone SE (3.ª generación)': 2018, 'iPhone 13 Pro': 3095,
    'iPhone 13 Pro Max': 4352, 'iPhone 14': 3279, 'iPhone 14 Plus': 4325, 'iPhone 14 Pro': 3200, 'iPhone 14 Pro Max': 4323,
    'iPhone 15': 3349, 'iPhone 15 Plus': 4383, 'iPhone 15 Pro': 3274, 'iPhone 15 Pro Max': 4422, 'iPhone 16': 3561,
    'iPhone 16 Plus': 4674, 'iPhone 16 Pro': 3582, 'iPhone 16 Pro Max': 4685, 'iPhone 16e': 4005, 'iPhone 17': 3692,
    'iPhone Air': 3149, 'iPhone 17e': 4005, 'iPhone 17 Pro': 3988, 'iPhone 17 Pro Max': 4823, 'iPhone 18 Pro': 4056,
    'iPhone 18 Pro Max': 5391,
    # El Duo queda pendiente: Apple no publica su doble batería y las cifras que circulan no coinciden.
}
# Las unidades solo eSIM del 17 Pro y el 17 Pro Max traen una batería más grande (ocupa el lugar de la bandeja SIM). En el 18 Pro
# y el 18 Pro Max todavía no está confirmada: queda pendiente.
BATERIA_MAH_SOLO_ESIM = {'iPhone 17 Pro': 4252, 'iPhone 17 Pro Max': 5088, 'iPhone 18 Pro': None, 'iPhone 18 Pro Max': None}
externo('bateria.capacidad_mah', [m for m in BATERIA_MAH if m not in ('iPhone 13 mini', 'iPhone 13', 'iPhone 14 Plus',
        'iPhone 15 Pro Max', 'iPhone 17 Pro', 'iPhone 17e', 'iPhone 17', 'iPhone Air', 'iPhone 17 Pro Max', 'iPhone 18 Pro',
        'iPhone 18 Pro Max')], 'gsmarena.com y Wikipedia coinciden; hasta el 15, también 9to5mac.com (2023-11-21).')
externo('bateria.capacidad_mah', ['iPhone 13 mini', 'iPhone 13', 'iPhone 14 Plus', 'iPhone 15 Pro Max'],
        'Wikipedia y 9to5mac.com (2023-11-21) coinciden; gsmarena.com daba cifras de antes del lanzamiento (2.438, 3.240, 4.323 y 4.441).')
externo('bateria.capacidad_mah', ['iPhone 17', 'iPhone Air', 'iPhone 17 Pro', 'iPhone 17 Pro Max'],
        'etiquetas de energía de Apple en la UE y desmontajes (macrumors.com, 2025-09-09 y 2025-09-19), Wikipedia y gsmarena.com '
        '(que daba 3.998 en el 17 Pro con SIM).')
externo('bateria.capacidad_mah', ['iPhone 17e'], 'etiqueta de energía de Apple en la UE (macrumors.com, 2026-03-02), gsmarena.com y Wikipedia.')
externo('bateria.capacidad_mah', ['iPhone 18 Pro', 'iPhone 18 Pro Max'],
        'etiquetas de energía de Apple en la UE, versión con bandeja SIM (macrumors.com, 2026-09-09), gsmarena.com y Wikipedia.')
externo('bateria.capacidad_mah_solo_esim', ['iPhone 17 Pro', 'iPhone 17 Pro Max'],
        'desmontajes (macrumors.com, 2025-09-19), Wikipedia y gsmarena.com.')

def modelo(nombre, slug, alias, datos, pendientes):
    datos = copy.deepcopy(datos)
    cam = datos['camaras']
    if cam['zoom_opciones'] is None:   # por omisión: el mínimo, 1x y el máximo
        cam['zoom_opciones'] = sorted({cam['zoom_optico_min'], 1.0, cam['zoom_optico_max']})
    if nombre in NUMEROS:
        datos['sistema']['numeros_modelo'] = NUMEROS[nombre]
    if nombre in IOS_MAXIMO:
        datos['sistema']['ios_maximo'] = IOS_MAXIMO[nombre]
    datos['conectividad']['solo_esim_en'] = SOLO_ESIM_EN.get(nombre, False)
    datos['conectividad']['mmwave_en'] = MMWAVE_EN.get(nombre, False)
    if nombre in IOS_LANZAMIENTO:
        datos['sistema']['ios_lanzamiento'] = IOS_LANZAMIENTO[nombre]
    datos['rendimiento']['ram_gb'] = RAM_GB.get(nombre)
    datos['bateria']['capacidad_mah'] = BATERIA_MAH.get(nombre)
    datos['bateria']['capacidad_mah_solo_esim'] = BATERIA_MAH_SOLO_ESIM.get(nombre, False)
    pendientes = [{**p, 'fuente': p['fuente'].replace('{modelo}', nombre)} for p in pendientes]
    return {'tipo': 'celular', 'familia': 'iphone', 'nombre': nombre, 'slug': slug, 'alias': alias,
            'pendientes': pendientes, 'datos': datos}

def esim_18(cifra):
    return [{'campo': 'bateria.capacidad_mah_solo_esim', 'tipo': 'falta',
             'detalle': 'Batería de las unidades solo eSIM (EE. UU. y Canadá). MacRumors (2026-09-10) dice que todavía no está confirmada; '
                        f'gsmarena.com y Wikipedia dan {cifra} mAh, de registros previos al lanzamiento.',
             'fuente': 'Desmontaje del {modelo} solo eSIM (ifixit.com) o macrumors.com'}]

PENDIENTES_DUO = [
    {'campo': 'rendimiento.ram_gb', 'tipo': 'falta',
     'detalle': 'RAM: Xcode 27 todavía no reconoce al Duo. MacRumors (2026-09-09) solo supone 12 GB porque tiene el mismo chip que el 18 Pro.',
     'fuente': 'macrumors.com (RAM según Xcode) o desmontaje en ifixit.com'},
    {'campo': 'bateria.capacidad_mah', 'tipo': 'falta',
     'detalle': 'Capacidad de la doble batería: Apple no la publica y las cifras que circulan no coinciden (entre 4.700 y 5.800 mAh).',
     'fuente': 'Etiqueta de energía del {modelo} en las páginas de Apple de la UE, macrumors.com o ifixit.com'},
]

SE_2 = ['iPhone SE 2', 'iPhone SE 2020', 'iPhone SE 2da generación', 'iPhone SE 2 gen', 'iPhone SE segunda generación', 'IP SE 2', 'IP SE 2020']
SE_3 = ['iPhone SE 3', 'iPhone SE 2022', 'iPhone SE 3ra generación', 'iPhone SE 3 gen', 'iPhone SE tercera generación', 'IP SE 3', 'IP SE 2022']

MODELOS = [
    modelo('iPhone X', 'iphone-x', ['iPhone 10', 'iPhone Ten', 'IP X'], X, []),
    modelo('iPhone XR', 'iphone-xr', ['IP XR', 'iPhone 10R'], XR, []),
    modelo('iPhone XS', 'iphone-xs', ['IP XS', 'iPhone 10S'], XS, []),
    modelo('iPhone XS Max', 'iphone-xs-max', ['IP XS Max', 'iPhone 10S Max'], XS_MAX, []),
    modelo('iPhone 11', 'iphone-11', ['IP 11'], ONCE, []),
    modelo('iPhone 11 Pro', 'iphone-11-pro', ['IP 11 Pro'], ONCE_PRO, []),
    modelo('iPhone 11 Pro Max', 'iphone-11-pro-max', ['IP 11 Pro Max', 'iPhone 11 ProMax'], ONCE_PRO_MAX, []),
    modelo('iPhone SE (2.ª generación)', 'iphone-se-2', SE_2, SE2, []),
    modelo('iPhone 12', 'iphone-12', ['IP 12'], DOCE, []),
    modelo('iPhone 12 mini', 'iphone-12-mini', ['IP 12 mini', 'iPhone 12mini'], DOCE_MINI, []),
    modelo('iPhone 12 Pro', 'iphone-12-pro', ['IP 12 Pro'], DOCE_PRO, []),
    modelo('iPhone 12 Pro Max', 'iphone-12-pro-max', ['IP 12 Pro Max', 'iPhone 12 ProMax'], DOCE_PRO_MAX, []),
    modelo('iPhone 13 mini', 'iphone-13-mini', ['IP 13 mini', 'iPhone 13mini'], TRECE_MINI, []),
    modelo('iPhone 13', 'iphone-13', ['IP 13'], TRECE, []),
    modelo('iPhone SE (3.ª generación)', 'iphone-se-3', SE_3, SE3, []),
    modelo('iPhone 13 Pro', 'iphone-13-pro', ['IP 13 Pro'], TRECE_PRO, []),
    modelo('iPhone 13 Pro Max', 'iphone-13-pro-max', ['IP 13 Pro Max', 'iPhone 13 ProMax'], TRECE_PRO_MAX,
           []),
    modelo('iPhone 14', 'iphone-14', ['IP 14'], CATORCE, []),
    modelo('iPhone 14 Plus', 'iphone-14-plus', ['IP 14 Plus', 'iPhone 14Plus'], CATORCE_PLUS, []),
    modelo('iPhone 14 Pro', 'iphone-14-pro', ['IP 14 Pro'], CATORCE_PRO, []),
    modelo('iPhone 14 Pro Max', 'iphone-14-pro-max', ['IP 14 Pro Max', 'iPhone 14 ProMax'], CATORCE_PRO_MAX,
           []),
    modelo('iPhone 15', 'iphone-15', ['IP 15'], QUINCE, []),
    modelo('iPhone 15 Plus', 'iphone-15-plus', ['IP 15 Plus', 'iPhone 15Plus'], QUINCE_PLUS, []),
    modelo('iPhone 15 Pro', 'iphone-15-pro', ['IP 15 Pro'], QUINCE_PRO, []),
    modelo('iPhone 15 Pro Max', 'iphone-15-pro-max', ['IP 15 Pro Max', 'iPhone 15 ProMax'], QUINCE_PRO_MAX, []),
    modelo('iPhone 16', 'iphone-16', ['IP 16'], DIECISEIS, []),
    modelo('iPhone 16 Plus', 'iphone-16-plus', ['IP 16 Plus', 'iPhone 16Plus'], DIECISEIS_PLUS, []),
    modelo('iPhone 16 Pro', 'iphone-16-pro', ['IP 16 Pro'], DIECISEIS_PRO, []),
    modelo('iPhone 16 Pro Max', 'iphone-16-pro-max', ['IP 16 Pro Max', 'iPhone 16 ProMax'], DIECISEIS_PRO_MAX,
           []),
    modelo('iPhone 16e', 'iphone-16e', ['IP 16e'], DIECISEIS_E, []),
    modelo('iPhone 17', 'iphone-17', ['IP 17'], DIECISIETE, []),
    modelo('iPhone Air', 'iphone-air', ['IP Air', 'iPhone 17 Air', 'IP 17 Air'], AIR, []),
    modelo('iPhone 17e', 'iphone-17e', ['IP 17e'], DIECISIETE_E, []),
    modelo('iPhone 17 Pro', 'iphone-17-pro', ['IP 17 Pro'], DIECISIETE_PRO, []),
    modelo('iPhone 17 Pro Max', 'iphone-17-pro-max', ['IP 17 Pro Max', 'iPhone 17 ProMax'], DIECISIETE_PRO_MAX,
           []),
    modelo('iPhone 18 Pro', 'iphone-18-pro', ['IP 18 Pro'], DIECIOCHO_PRO, esim_18('4.288')),
    modelo('iPhone 18 Pro Max', 'iphone-18-pro-max', ['IP 18 Pro Max', 'iPhone 18 ProMax'], DIECIOCHO_PRO_MAX,
           esim_18('5.567')),
    modelo('iPhone Duo', 'iphone-duo', ['IP Duo'], DUO, PENDIENTES_DUO),
]

cabecera = """<?php

/*
 * Fichas de iPhone para la tienda, la comparativa y el recomendador.
 *
 * - `datos` es la única fuente: números, sí/no y `false` cuando el modelo NO tiene algo
 *   (teleobjetivo, LiDAR…). `null` solo donde el fabricante no publica el dato (horas de streaming
 *   en modelos antiguos) o en los campos declarados en `pendientes` mientras llega la fuente.
 * - Los textos de la ficha se generan con App\\Support\\FichaTecnica\\TextosCelular.
 * - Esquema y validación: App\\Support\\FichaTecnica\\EsquemaCelular. Revisar con
 *     php artisan modelos:verificar
 *   y cargar con
 *     php artisan db:seed --class=ModelosReferenciaSeeder
 * - Fuentes: especificaciones y comparador oficiales de Apple, pegados por el equipo. `pendientes`
 *   documenta lo que falta y lo que está cargado sin salir de esas páginas (tipo `verificar`), con
 *   la fuente donde confirmarlo:
 *     php artisan modelos:pendientes
 * - La RAM y la capacidad de batería no las publica Apple: salen de fuentes externas que coinciden
 *   (docs/admin-ui/informes/ram-bateria-2026-09-15.md).
 * - Los precios NO van aquí: salen del inventario de la tienda.
 */

return """
salida = cabecera + '[\n' + ''.join('    ' + php(m, 1) + ',\n' for m in MODELOS) + '];\n'
(Path(__file__).resolve().parents[1] / 'iphone.php').write_text(salida)
print(len(MODELOS), 'modelos escritos')
