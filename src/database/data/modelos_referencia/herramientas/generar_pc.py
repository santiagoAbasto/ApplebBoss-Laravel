"""
Genera ../pc.php: fichas de laptops con Windows (familia «pc») para la tienda. Esquema:
App\\Support\\FichaTecnica\\EsquemaPc; textos: App\\Support\\FichaTecnica\\TextosPc.

Cada modelo es una configuración exacta del fabricante (Lenovo: el MTM de la etiqueta), no la familia completa: la
IdeaPad Gaming 3 15ARH7 se vendió con cuatro procesadores, cinco tarjetas gráficas, tres pantallas y dos baterías.
Solo las que hay o hubo en el inventario (si un equipo se vende, su ficha queda). Primero la ficha oficial de la
marca; lo que no publica, de otras fuentes que coincidan. Cada fuente queda en FUENTES y en
docs/admin-ui/informes/computadoras-2026-09-15.md. Los precios NO van aquí: salen del inventario.

    python3 generar_pc.py
"""
from pathlib import Path


def php(v, ind=0):
    """Mismo formato de salida que generar_computadoras.py."""
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


# Lenovo IdeaPad Gaming 3 15ARH7, MTM 82SB00K9US (la #10 del inventario; etiqueta: fabricada el 2023-02-21, 20 V ⎓ 8,5 A).
# Configuración: lenovo.com (EE. UU.), página del número de parte. Plataforma: PSREF de Lenovo (14 de diciembre de 2023).
IDEAPAD_GAMING_3_15ARH7_82SB00K9US = {
    'pantalla': {
        'pulgadas': 15.6, 'px_ancho': 1920, 'px_alto': 1080, 'resolucion_nombre': 'Full HD',
        'tecnologia': 'IPS', 'antirreflejo': True, 'tactil': False,
        'frecuencia_hz': 120, 'sincronizacion': 'AMD FreeSync', 'brillo_nits': 250,
        'gama': '45 % NTSC', 'contraste': '800:1', 'atenuacion_dc': True,
    },
    'rendimiento': {
        'arquitectura': 'x86', 'chip': 'AMD Ryzen 7 7735HS',
        'cpu_nucleos': 8, 'cpu_hilos': 16, 'cpu_ghz_base': 3.2, 'cpu_ghz_max': 4.75, 'cache_l3_mb': 16,
        # La versión para laptops (NVIDIA: «RTX 4050 Laptop GPU»)
        'gpu': 'NVIDIA GeForce RTX 4050', 'gpu_memoria': '6 GB GDDR6', 'gpu_tgp_w': 85,
        'gpu_dynamic_boost': 'Dynamic Boost 2.0', 'gpu_integrada': 'AMD Radeon 680M',
        'ram_gb': [16], 'ram_tipo': 'DDR5-4800', 'ram_modulos': '2 × 8 GB', 'ram_ranuras_libres': 0,
        'almacenamiento_gb': [512], 'ssd': 'SSD NVMe M.2 2242 PCIe 4.0, QLC', 'ranura_ssd_libre': 'M.2 2280 PCIe 4.0',
        'pantallas_externas': 'Hasta dos monitores externos: por HDMI hasta 4K a 60 Hz y por USB‑C hasta 5K a 60 Hz',
    },
    'bateria': {
        'wh': 60.0, 'celdas': 4, 'video_h': 13.1, 'video_prueba': 'video local en 1080p a 150 nits',
        'uso_h': 7.8, 'uso_prueba': 'MobileMark 2018',
        'adaptador_w': 170, 'conector_carga': 'slim tip',
        'carga_rapida': 'Rapid Charge Boost: 2 h de uso con 15 min de carga',
    },
    'conectividad': {
        'puertos': [
            'Dos USB‑A 3.2 Gen 1 (5 Gb/s), uno a cada lado',
            'USB‑C 3.2 Gen 2 (10 Gb/s) con DisplayPort 1.4 y Power Delivery 3.0',
            'HDMI 2.0',
            'Ethernet RJ‑45',
            'Entrada combinada de 3.5 mm para audífonos y micrófono',
            'Conector de carga',
        ],
        'wifi': 'Wi‑Fi 6 (802.11ax) 2×2', 'bluetooth': '5.1', 'ethernet': 'Gigabit Ethernet',
    },
    'multimedia': {
        'camara': 'HD de 720p con tapa de privacidad',
        'audio': 'Dos parlantes estéreo de 2 W con Nahimic Audio',
        'microfonos': 'Dos micrófonos',
    },
    'entrada': {
        'teclado': 'Retroiluminado en blanco, con teclado numérico',
        'idioma_teclado': 'inglés (EE. UU.)',
        'trackpad': 'ClickPad sin botones de 12 × 7,5 cm',
        'huella': False,
    },
    'diseno': {
        'formato': 'portatil', 'material': 'Plástico PC‑ABS (tapa y base)', 'colores': ['Gris ónix'],
        # Grosor: lenovo.com da 21,8 a 25,9 mm. Peso: «desde 2,40 kg» en lenovo.com (EE. UU.); PSREF da «desde 2,32 kg»
        # para la plataforma. Vale el de EE. UU., como con Apple.
        'ancho_mm': 359.6, 'profundidad_mm': 266.4, 'grosor_mm': 21.8, 'grosor_max_mm': 25.9,
        'peso_kg': 2.4, 'peso_desde': True,
    },
    'sistema': {
        # 2023: la RTX 4050 para laptops salió en febrero de 2023 y la unidad se fabricó el 2023-02-21.
        'anio': 2023, 'sistema_operativo': 'Windows 11 Home', 'plataforma': 'IdeaPad Gaming 3 15ARH7',
        'numero_parte': 'MTM 82SB00K9US',
        'seguridad': ['TPM 2.0 por firmware, integrado en el procesador', 'Tapa de privacidad en la cámara'],
    },
}

FUENTES = {
    'lenovo-ideapad-gaming-3-15arh7-82sb00k9us': [
        'Configuración del MTM (procesador, gráfica, memoria, disco, pantalla, batería, adaptador, teclado, color): '
        'lenovo.com (EE. UU.), página del número de parte 82SB00K9US.',
        'Plataforma 15ARH7 (núcleos, caché, TGP, monitores, ranuras, puertos, cámara, audio, autonomía, medidas, '
        'material, seguridad): PSREF de Lenovo, versión del 14 de diciembre de 2023.',
        'Confirman la configuración: laptoparena.net (teclado blanco, Wi‑Fi 6 2×2, Bluetooth 5.1, 45 % NTSC) y '
        'mundolaptops.com (4 celdas, teclado numérico retroiluminado, Windows 11 Home).',
    ],
}


def modelo(nombre, slug, alias, datos, pendientes=()):
    return {'tipo': 'computadora', 'familia': 'pc', 'nombre': nombre, 'slug': slug, 'alias': alias,
            'pendientes': list(pendientes), 'datos': datos}


MODELOS = [
    modelo('Lenovo IdeaPad Gaming 3 15ARH7 (Ryzen 7 7735HS, RTX 4050)', 'lenovo-ideapad-gaming-3-15arh7-82sb00k9us',
           ['IdeaPad Gaming 3 15ARH7', 'Lenovo 82SB00K9US'], IDEAPAD_GAMING_3_15ARH7_82SB00K9US),
]

cabecera = """<?php

/*
 * Fichas de laptops con Windows (familia «pc») para la tienda.
 *
 * - Cada ficha es una configuración exacta del fabricante (Lenovo: el MTM de la etiqueta), la de una unidad que hay o
 *   hubo en el inventario. Si un equipo se vende, su ficha queda.
 * - `datos` es la única fuente: números, sí/no y `false` cuando el modelo NO tiene algo.
 * - Textos de la ficha: App\\Support\\FichaTecnica\\TextosPc. Esquema: App\\Support\\FichaTecnica\\EsquemaPc.
 *     php artisan modelos:verificar   ·   php artisan db:seed --class=ModelosReferenciaSeeder
 * - Fuente: primero la ficha oficial de la marca (Lenovo: lenovo.com y PSREF); después, otras que coincidan.
 *   Detalle: docs/admin-ui/informes/computadoras-2026-09-15.md.
 * - Los precios NO van aquí: salen del inventario de la tienda.
 * - Generado con herramientas/generar_pc.py: no se edita a mano.
 */

return """

if __name__ == '__main__':
    for m in MODELOS:
        faltan = [s for s in m['datos'] if not m['datos'][s]]
        assert not faltan, f"{m['nombre']}: secciones vacías {faltan}"
        assert m['slug'] in FUENTES, f"{m['slug']} sin fuente"
    salida = cabecera + '[\n' + ''.join('    ' + php(m, 1) + ',\n' for m in MODELOS) + '];\n'
    (Path(__file__).resolve().parents[1] / 'pc.php').write_text(salida)
    print(len(MODELOS), 'modelos escritos')
