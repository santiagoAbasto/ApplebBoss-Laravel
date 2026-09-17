"""
Genera ../accesorios.php: fichas de accesorios (tipo «producto_general») para la tienda: cargadores, vidrios,
protectores, fundas, cables y accesorios de marca. Esquema: App\\Support\\FichaTecnica\\EsquemaAccesorio; textos de
la ficha: TextosAccesorio; descripción de la publicación: ContenidoAccesorio.

Cada ficha es un TIPO de accesorio, no una unidad: todos los «CUBO 20 W ORIGINAL» del inventario usan la del
adaptador de 20 W de Apple, y las fundas de silicona de cualquier iPhone, la de la funda de silicona (el iPhone sale
del nombre del inventario y reemplaza {modelo} en los textos). Solo lo que hay en el inventario; si se vende, la
ficha queda.

Reglas:
- Originales de marca: los datos de su página oficial y, lo que no publica, de otras fuentes (FUENTES). Lo que sale
  de una fuente que no es la marca queda «verificar» en `pendientes`.
- Genéricos (fundas, vidrios, cubos certificados, cables y accesorios sin marca): descripción genérica, solo lo que
  el producto es por definición o lo que dice su nombre. Nada de normas, durezas ni garantías que no se comprueben.
- `detectar`: expresiones regulares sobre el nombre del inventario en minúsculas, sin tildes y con las unidades
  pegadas («CUBO 20 W ORIGINAL» → «cubo 20w original»). Van de lo más específico a lo más general: gana la primera
  ficha que coincide y no cae en `excluir`.
- Los precios NO van aquí: salen del inventario.

    python3 generar_accesorios.py
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


def sistema(categoria, forma, detectar, excluir=(), anio=None, marca=None, modelo=None, grupo=None, para='tu iPhone'):
    return {
        'anio': anio, 'marca': marca, 'modelo': modelo, 'categoria': categoria, 'forma': forma,
        'grupo': grupo or categoria, 'para': para, 'detectar': list(detectar), 'excluir': list(excluir) or False,
    }


def contenido(resumen, parrafos, puntos, incluye):
    return {'resumen': resumen, 'parrafos': list(parrafos), 'puntos': list(puntos), 'incluye': list(incluye)}


def modelo(nombre, slug, familia, alias, sis, ficha, cont, visual=False, pendientes=()):
    return {'tipo': 'producto_general', 'familia': familia, 'nombre': nombre, 'slug': slug, 'alias': list(alias),
            'pendientes': list(pendientes), 'datos': {'sistema': sis, 'ficha': ficha, 'contenido': cont, 'visual': visual}}


def verificar(campo, detalle, fuente):
    return {'campo': campo, 'tipo': 'verificar', 'detalle': detalle, 'fuente': fuente}


def falta(campo, detalle, fuente):
    return {'campo': campo, 'tipo': 'falta', 'detalle': detalle, 'fuente': fuente}


PARED_USB_C = 'Cargador de pared USB‑C'
OTRA_MARCA = 'Otra marca (no es de Apple)'
BOLIVIA = '100 a 240 V ~ 50/60 Hz: sirve con los 220 V de Bolivia'
DIA_A_DIA = 'Protege la pantalla de rayones y golpes del día a día'
BORDES = 'Cubre la parte trasera y los bordes'

# ─── Cargadores de pared (comparativa /comparar/cargadores) ─────────────────────────────────────────────────────

CARGADORES = [
    # apple.com (EE. UU.), 40W Dynamic Power Adapter with 60W Max (MGKN4AM/A), y su nota al pie: modelo A3351.
    modelo('Adaptador de corriente dinámico de 40 W de Apple', 'apple-adaptador-dinamico-40w', 'cargador',
           ['CUBO 40 W ORIGINAL', 'CUBO DE 40W'],
           sistema('Cargador', 'cargador', [r'\b(cubo|cargador|adaptador)\b.*\b40w\b'], [r'\bcalidad\b', r'\bcertificad'],
                   anio=2025, marca='Apple', modelo='A3351', grupo='Originales de Apple', para='tu iPhone'),
           {
               'tipo': PARED_USB_C,
               'fabricante': 'Apple (original) · modelo A3351',
               'potencia': '40 W',
               'potencia_maxima': 'Hasta 60 W por momentos · Un sensor de temperatura baja la potencia para que no se caliente',
               'carga_rapida': 'Hasta 50 % en unos 15 minutos (iPhone 18 Pro y 18 Pro Max) · Hasta 50 % en 20 minutos '
                               '(iPhone 17, 17 Pro y 17 Pro Max) · Hasta 50 % en unos 20 minutos (iPhone Duo) · '
                               'Hasta 50 % en 30 minutos (iPhone Air) · Hasta 50 % en 35 minutos (iPad Pro de 13 pulgadas)',
               'puerto': 'Un puerto USB‑C',
               'salidas': '5 V ⎓ 3 A · 9 V ⎓ 3 A · 9 a 15 V ⎓ 2,67 A (AVS) · 15 a 20 V ⎓ 2 A (AVS)',
               'protocolos': 'USB Power Delivery con AVS: ajusta el voltaje en pasos finos para cargar con más eficiencia',
               'entrada': BOLIVIA,
               'cable': 'Se vende por separado · Para la carga más rápida, un cable USB‑C de 60 W o más',
               'compatibilidad': 'iPhone 8 o posterior, iPad, MacBook Air, Apple Watch, AirPods y equipos con USB‑C',
               'normas': 'Certificado para las normas de seguridad de los países donde Apple lo vende',
               'pruebas': 'Cargó una MacBook Air a casi 56 W y un iPhone 16 Pro Max a unos 27 W (ChargerLAB)',
           },
           contenido(
               'El cargador de Apple de 40 W que llega hasta 60 W: la carga más rápida para el iPhone 17 y el iPhone 18 Pro, '
               'en el tamaño del de 20 W.',
               ['El adaptador dinámico de 40 W de Apple entrega hasta 60 W por momentos, según el equipo y la temperatura. '
                'Con un iPhone 17, 17 Pro o 17 Pro Max llega al 50 % de batería en 20 minutos, y con un iPhone 18 Pro o '
                '18 Pro Max, en unos 15 minutos.',
                'Tiene AVS, que ajusta el voltaje en pasos finos para cargar con más eficiencia, y sirve para cualquier equipo '
                'con USB‑C, incluida la MacBook Air. Funciona con los 220 V de Bolivia. El cable se vende por separado: para '
                'la carga más rápida conviene uno USB‑C de 60 W o más.'],
               ['Original de Apple', '40 W, con picos de hasta 60 W', 'Hasta 50 % en 20 minutos en un iPhone 17',
                'USB Power Delivery con AVS', 'Un puerto USB‑C', 'Sirve para MacBook Air, iPad y AirPods'],
               ['Adaptador de corriente dinámico de 40 W de Apple']),
           visual={'etiqueta': '40W'},
           pendientes=[verificar('ficha.salidas', 'Apple no publica las salidas en su página: salen de la etiqueta de la '
                                 'versión A3365 que midió ChargerLAB. Confirmar con la etiqueta de las unidades (A3351).',
                                 'chargerlab.com: teardown del A3365')]),

    # apple.com (EE. UU.), 20W USB-C Power Adapter (MWVV3AM/A).
    modelo('Adaptador de corriente USB‑C de 20 W de Apple', 'apple-adaptador-usb-c-20w', 'cargador',
           ['CUBO 20 W ORIGINAL'],
           sistema('Cargador', 'cargador',
                   [r'\b(cubo|cargador|adaptador)\b.*\b20w\b.*\boriginal\b', r'\boriginal\b.*\b20w\b'],
                   [r'\bcalidad\b', r'\bcertificad', r'\borigen\b'],
                   anio=2020, marca='Apple', grupo='Originales de Apple'),
           {
               'tipo': PARED_USB_C,
               'fabricante': 'Apple (original)',
               'potencia': '20 W',
               'carga_rapida': 'Hasta 50 % en unos 35 minutos (iPhone 8 o posterior) · Carga óptima para iPad Pro y iPad Air',
               'puerto': 'Un puerto USB‑C',
               'salidas': '5 V ⎓ 3 A · 9 V ⎓ 2,22 A',
               'protocolos': 'USB Power Delivery',
               'entrada': BOLIVIA,
               'cable': 'Se vende por separado',
               'compatibilidad': 'iPhone 8 o posterior, iPad, Apple Watch, AirPods, HomePod mini y equipos con USB‑C',
               'normas': 'Certificado para las normas de seguridad de los países donde Apple lo vende',
               'pruebas': 'Eficiencia de 85,5 % a 89,7 % y hasta 49,5 °C a plena carga con 220 V (ChargerLAB)',
           },
           contenido(
               'El cargador original de Apple de 20 W: carga rápida para tu iPhone, hasta 50 % en unos 35 minutos, y carga '
               'óptima para el iPad.',
               ['El adaptador de corriente USB‑C de 20 W de Apple carga de forma rápida y eficiente en casa, en la oficina o '
                'de viaje. Con un iPhone 8 o posterior llega al 50 % de batería en unos 35 minutos.',
                'Sirve para cualquier equipo con USB‑C, y Apple lo recomienda para cargar el iPad Pro y el iPad Air. Funciona '
                'con los 220 V de Bolivia. El cable se vende por separado.'],
               ['Original de Apple', '20 W con USB Power Delivery', 'Carga rápida desde el iPhone 8',
                'Un puerto USB‑C', 'Sirve para iPad, Apple Watch y AirPods'],
               ['Adaptador de corriente USB‑C de 20 W de Apple']),
           visual={'etiqueta': '20W'},
           pendientes=[verificar('ficha.salidas', 'Apple no publica las salidas en su página: salen de la etiqueta que midió '
                                 'ChargerLAB (versión A2940). Confirmar con la etiqueta de las unidades.',
                                 'chargerlab.com: review del A2940')]),

    modelo('Cargador USB‑C de 20 W certificado', 'cargador-usb-c-20w-certificado', 'cargador',
           ['CUBO CERTIFICADO APPLE 20 W POWER ADAPTER', 'CUBO 20W Calidad Origen'],
           sistema('Cargador', 'cargador',
                   [r'\bcertificad\w*\b.*\b20w\b', r'\b20w\b.*\bcertificad', r'\b20w\b.*\bcalidad (de )?origen\b'],
                   grupo='Certificados'),
           {
               'tipo': PARED_USB_C,
               'fabricante': OTRA_MARCA,
               'potencia': '20 W',
               'carga_rapida': 'Carga rápida por USB‑C para iPhone 8 o posterior',
               'puerto': 'Un puerto USB‑C',
               'compatibilidad': 'iPhone, iPad, AirPods y otros equipos con USB‑C',
               'normas': 'Apple pide que los cargadores de otras marcas cumplan normas de seguridad como IEC 62368‑1',
           },
           contenido(
               'Cargador USB‑C de 20 W para la carga rápida de tu iPhone, una alternativa al original de Apple.',
               ['Un cargador de pared de 20 W con conector USB‑C para cargar rápido el iPhone 8 o posterior. También sirve '
                'para el iPad, los AirPods y otros equipos con USB‑C.',
                'Es de otra marca, no de Apple. Si dudas entre este y el original, compáralos lado a lado en la tienda.'],
               ['20 W con conector USB‑C', 'Carga rápida para iPhone 8 o posterior', 'Sirve para iPad y AirPods',
                'Alternativa al cargador de Apple'],
               ['Cargador de pared USB‑C de 20 W']),
           visual={'etiqueta': '20W'}),

    modelo('Cargador USB‑C de 25 W certificado', 'cargador-usb-c-25w-certificado', 'cargador',
           ['CUBO CERTIFICADO APPLE 25 W POWER ADAPTER'],
           sistema('Cargador', 'cargador', [r'\bcertificad\w*\b.*\b25w\b', r'\b25w\b.*\bcertificad'], grupo='Certificados'),
           {
               'tipo': PARED_USB_C,
               'fabricante': OTRA_MARCA,
               'potencia': '25 W',
               'carga_rapida': 'Carga rápida por USB‑C para iPhone 8 o posterior',
               'puerto': 'Un puerto USB‑C',
               'compatibilidad': 'iPhone, iPad, AirPods y otros equipos con USB‑C',
               'normas': 'Apple pide que los cargadores de otras marcas cumplan normas de seguridad como IEC 62368‑1',
           },
           contenido(
               'Cargador USB‑C de 25 W para cargar rápido tu iPhone y tu iPad.',
               ['Un cargador de pared de 25 W con conector USB‑C para la carga rápida del iPhone 8 o posterior, y también del '
                'iPad y los AirPods.',
                'Es de otra marca, no de Apple.'],
               ['25 W con conector USB‑C', 'Carga rápida para iPhone 8 o posterior', 'Sirve para iPad y AirPods'],
               ['Cargador de pared USB‑C de 25 W']),
           visual={'etiqueta': '25W'}),

    modelo('Cargador de pared de 35 W', 'cargador-pared-35w', 'cargador',
           ['CUBO 35 W CALIDAD ORIGINAL'],
           sistema('Cargador', 'cargador', [r'\b(cubo|cargador)\b.*\b35w\b'], grupo='Otras marcas'),
           {
               'tipo': 'Cargador de pared',
               'fabricante': OTRA_MARCA,
               'potencia': '35 W',
           },
           contenido(
               'Cargador de pared de 35 W para cargar tu iPhone, tu iPad y otros equipos.',
               ['Un cargador de pared de 35 W. Con el cable adecuado carga el iPhone, el iPad y otros equipos.',
                'Es de otra marca, no de Apple.'],
               ['35 W de potencia', 'Para iPhone, iPad y otros equipos'],
               ['Cargador de pared de 35 W']),
           visual={'etiqueta': '35W'},
           pendientes=[falta('ficha.puerto', 'El nombre del inventario no dice qué conectores tiene (USB‑C, USB‑A o dos).',
                             'Revisar la unidad')]),

    modelo('Cargador Gerlax de 45 W', 'gerlax-cargador-45w', 'cargador',
           ['Gerlax 45 W Cubo'],
           sistema('Cargador', 'cargador', [r'\bgerlax\b.*\b45w\b', r'\b45w\b.*\bgerlax\b'], marca='Gerlax', grupo='Otras marcas'),
           {
               'tipo': 'Cargador de pared',
               'fabricante': 'Gerlax',
               'potencia': '45 W',
           },
           contenido(
               'Cargador de pared Gerlax de 45 W para cargar tu celular y otros equipos.',
               ['Un cargador de pared de la marca Gerlax con 45 W de potencia.'],
               ['45 W de potencia', 'Marca Gerlax'],
               ['Cargador de pared Gerlax de 45 W']),
           visual={'etiqueta': '45W'},
           pendientes=[falta('ficha.puerto', 'El nombre del inventario no dice qué conectores tiene.', 'Revisar la unidad')]),

    modelo('Cargador USB de 5 W', 'cargador-usb-5w', 'cargador',
           ['CUBO 5W USB POWE ADAPTER'],
           sistema('Cargador', 'cargador', [r'\b(cubo|cargador|adaptador)\b.*\b5w\b'], grupo='Otras marcas'),
           {
               'tipo': 'Cargador de pared USB‑A',
               'fabricante': OTRA_MARCA,
               'potencia': '5 W',
               'carga_rapida': 'Carga normal: para la carga rápida hace falta un cargador USB‑C de 20 W o más',
               'puerto': 'Un puerto USB‑A',
               'compatibilidad': 'iPhone con cable Lightning a USB, AirPods y accesorios que cargan por USB‑A',
           },
           contenido(
               'Cargador de pared USB de 5 W para la carga normal de tu iPhone con un cable Lightning a USB.',
               ['Un cargador compacto con un puerto USB‑A, como el que traían los iPhone. Carga el iPhone con un cable '
                'Lightning a USB, además de AirPods y otros accesorios que cargan por USB‑A.',
                'Es carga normal: para la carga rápida hace falta un cargador USB‑C de 20 W o más.'],
               ['5 W con puerto USB‑A', 'Para iPhone con cable Lightning a USB', 'Sirve para AirPods y accesorios'],
               ['Cargador de pared USB de 5 W']),
           visual={'etiqueta': '5W'}),

    modelo('Cargador de pared con pantalla LED', 'cargador-pared-pantalla-led', 'cargador',
           ['CABEZAL FAST CHARGER LED DIGITAL'],
           sistema('Cargador', 'cargador', [r'\bcabezal\b', r'\bcharger\b.*\bled\b'], grupo='Otras marcas'),
           {
               'tipo': 'Cargador de pared con pantalla digital',
               'fabricante': OTRA_MARCA,
           },
           contenido(
               'Cargador de pared de carga rápida con pantalla LED digital.',
               ['Un cargador de pared de carga rápida con una pantalla LED digital.'],
               ['Carga rápida', 'Pantalla LED digital'],
               ['Cargador de pared']),
           visual={'etiqueta': 'LED'},
           pendientes=[falta('ficha.potencia', 'El nombre del inventario no dice la potencia ni los conectores.', 'Revisar la unidad')]),
]

# ─── Vidrios templados para iPhone (comparativa /comparar/vidrios) ─────────────────────────────────────────────

VIDRIOS = [
    # Corning: Gorilla Glass es vidrio de aluminosilicato reforzado por intercambio iónico (Wikipedia, Corning y
    # OtterBox). En el inventario todavía no hay ninguno con «Gorilla» en el nombre: se vincula solo cuando lo tenga.
    modelo('Vidrio templado Gorilla Glass', 'vidrio-templado-gorilla-glass', 'vidrio',
           ['VIDRIO TEMPLADO GORILLA GLASS IP 16 PRO MAX'],
           sistema('Vidrio templado', 'vidrio', [r'\bgorill?a\b'], grupo='Gorilla Glass'),
           {
               'tipo': 'Protector de pantalla de vidrio',
               'material': 'Vidrio de aluminosilicato Corning Gorilla Glass',
               'endurecido': 'Por intercambio iónico: un baño de sales de potasio caliente deja la superficie en compresión',
               'proteccion': 'Diseñado por Corning para resistir mejor los rayones y los golpes que el vidrio común',
           },
           contenido(
               'Protector de pantalla Gorilla Glass para {modelo}: el vidrio reforzado de Corning, hecho para resistir mejor '
               'rayones y golpes.',
               ['Está hecho con Gorilla Glass, el vidrio de aluminosilicato de Corning. Se refuerza con un baño de sales de '
                'potasio caliente que deja la superficie en compresión, y por eso resiste mejor los rayones y los golpes que '
                'el vidrio común.',
                'Protege la pantalla de {modelo} y deja ver la imagen como siempre.'],
               ['Vidrio Gorilla Glass de Corning', 'Reforzado por intercambio iónico', 'Protege de rayones y golpes',
                'Transparente'],
               ['Protector de pantalla Gorilla Glass'])),

    # Spigen: página oficial del GLAS.tR EZ Fit (dureza 9H, recubrimiento oleofóbico y bandeja de instalación).
    modelo('Spigen Glas.tR EZ Fit', 'spigen-glastr-ez-fit', 'vidrio',
           ['GLASS TR EZ FIT'],
           sistema('Vidrio templado', 'vidrio', [r'\bglas{1,2} ?tr\b', r'\bez ?fit\b'], marca='Spigen', grupo='De marca'),
           {
               'tipo': 'Protector de pantalla de vidrio templado',
               'fabricante': 'Spigen',
               'material': 'Vidrio templado',
               'proteccion': DIA_A_DIA,
               'dureza': '9H',
               'recubrimiento': 'Oleofóbico: repele las huellas del uso diario',
               'instalacion': 'Con la bandeja EZ Fit, que lo alinea solo sobre la pantalla',
               'compatibilidad': 'Compatible con las fundas Spigen',
           },
           contenido(
               'Vidrio templado Spigen Glas.tR EZ Fit: dureza 9H y una bandeja que lo alinea solo al colocarlo.',
               ['El Glas.tR EZ Fit de Spigen es vidrio templado de dureza 9H con recubrimiento oleofóbico, que repele las '
                'huellas del uso diario.',
                'Se coloca con la bandeja EZ Fit: la apoyas sobre el iPhone y el vidrio queda alineado solo. Es compatible '
                'con las fundas Spigen.'],
               ['Vidrio templado de dureza 9H', 'Recubrimiento oleofóbico', 'Bandeja de instalación EZ Fit',
                'Compatible con las fundas Spigen'],
               ['Protector de pantalla Spigen Glas.tR EZ Fit']),
           pendientes=[falta('sistema.modelo', 'El nombre del inventario no dice para qué iPhone es.', 'Revisar la caja')]),

    modelo('Vidrio templado antiespía', 'vidrio-templado-antiespia', 'vidrio',
           ['VIDRIO TEMPLADO ANTIESPIA'],
           sistema('Vidrio templado', 'vidrio', [r'\banti ?esp', r'\bprivacidad\b', r'\bprivacy\b'], grupo='Con filtro'),
           {
               'tipo': 'Protector de pantalla de vidrio templado',
               'material': 'Vidrio templado con filtro de privacidad',
               'proteccion': DIA_A_DIA,
               'filtro': 'Privacidad: de frente se ve normal y de costado la pantalla se oscurece',
           },
           contenido(
               'Vidrio templado antiespía para {modelo}: protege la pantalla y evita que la lean de costado.',
               ['Un vidrio templado con filtro de privacidad: de frente ves la pantalla normal y, de costado, se oscurece. '
                'Así nadie lee tus mensajes en el micro o en la fila.',
                'Protege la pantalla de {modelo} de rayones y golpes. Con el filtro, la pantalla se ve un poco más oscura '
                'también de frente.'],
               ['Filtro de privacidad', 'Protege de rayones y golpes', 'De frente se ve normal'],
               ['Protector de pantalla de vidrio templado antiespía'])),

    modelo('Vidrio templado mate antirreflejo', 'vidrio-templado-mate-antirreflejo', 'vidrio',
           ['Vidrio Templado Anti-Glare IP 13 PRO'],
           sistema('Vidrio templado', 'vidrio', [r'\banti ?glare\b', r'\bantirreflej', r'\bmate\b'], grupo='Con filtro'),
           {
               'tipo': 'Protector de pantalla de vidrio templado',
               'material': 'Vidrio templado con acabado mate',
               'proteccion': DIA_A_DIA,
               'filtro': 'Antirreflejo: el acabado mate reduce los reflejos de la luz',
           },
           contenido(
               'Vidrio templado mate para {modelo}: protege la pantalla y reduce los reflejos de la luz.',
               ['Un vidrio templado con acabado mate que reduce los reflejos del sol y de las luces, para ver mejor la '
                'pantalla de {modelo} al aire libre.',
                'Protege de rayones y golpes. Con el acabado mate la imagen se ve un poco menos brillante que con un vidrio '
                'transparente.'],
               ['Acabado mate antirreflejo', 'Protege de rayones y golpes', 'Mejor lectura al sol'],
               ['Protector de pantalla de vidrio templado mate'])),

    modelo('Vidrio templado con filtro de luz azul', 'vidrio-templado-luz-azul', 'vidrio',
           ['Vidrio Templado AntiBlue light IP 13 PRO'],
           sistema('Vidrio templado', 'vidrio', [r'\banti ?blue\b', r'\bluz azul\b', r'\bblue light\b'], grupo='Con filtro'),
           {
               'tipo': 'Protector de pantalla de vidrio templado',
               'material': 'Vidrio templado con filtro de luz azul',
               'proteccion': DIA_A_DIA,
               'filtro': 'Luz azul: reduce parte de la luz azul de la pantalla',
           },
           contenido(
               'Vidrio templado con filtro de luz azul para {modelo}: protege la pantalla y reduce parte de la luz azul.',
               ['Un vidrio templado con un filtro que reduce parte de la luz azul que emite la pantalla de {modelo}.',
                'Protege de rayones y golpes. El filtro puede darle un tono levemente cálido a la imagen.'],
               ['Filtro de luz azul', 'Protege de rayones y golpes', 'Transparente'],
               ['Protector de pantalla de vidrio templado con filtro de luz azul'])),

    modelo('Vidrio templado tradicional', 'vidrio-templado-tradicional', 'vidrio',
           ['VIDRIO TEMPLADO', 'Vidrio Templado IP 12/12PRO', 'Vidrio Templado IP XR / 11'],
           sistema('Vidrio templado', 'vidrio',
                   [r'\bvidrio\b.*\btemplado\b', r'\bvidrio (templado )?(iphone|ip)\b', r'\btempered glass\b'],
                   [r'\bcamara\b', r'\bipad\b', r'\bmacbook\b', r'\b(iwach|iwatch|watch)\b'], grupo='Tradicionales'),
           {
               'tipo': 'Protector de pantalla de vidrio templado',
               'material': 'Vidrio templado común',
               'endurecido': 'Templado: calor y enfriado rápido, o un tratamiento químico, que dejan la superficie en compresión',
               'proteccion': DIA_A_DIA,
           },
           contenido(
               'Vidrio templado para {modelo}: protege la pantalla de rayones y golpes del día a día.',
               ['Un protector de vidrio templado que cubre la pantalla de {modelo} y la cuida de rayones y golpes del uso '
                'diario. Es transparente: la imagen se ve como siempre.',
                'Si se raya o se rompe, cambias el vidrio y no la pantalla.'],
               ['Vidrio templado', 'Protege de rayones y golpes', 'Transparente',
                'Si se daña, cambias el vidrio y no la pantalla'],
               ['Protector de pantalla de vidrio templado'])),
]

# ─── Otros protectores (cámara, Apple Watch, iPad y MacBook) ───────────────────────────────────────────────────

PROTECTORES = [
    modelo('Protector de cámara', 'protector-camara', 'protector',
           ['VIDRIO CAMARA 14 PRO MAX', 'Vidrio de Camara IP 13', 'VIDRIO TEMPLADO CAMARA IP 11 PRO'],
           sistema('Protector de cámara', 'protector_camara',
                   [r'\b(vidrio|protector|lamina)\b.*\bcamara\b', r'\bcamara\b.*\bvidrio\b', r'\blentes?\b.*\bprotector\b']),
           {
               'tipo': 'Protector de vidrio para la cámara trasera',
               'proteccion': 'Cuida los lentes de la cámara de rayones y golpes',
           },
           contenido(
               'Protector de cámara para {modelo}: cuida los lentes traseros de rayones y golpes.',
               ['Un protector de vidrio que cubre los lentes de la cámara trasera de {modelo} y los cuida de rayones y golpes, '
                'que es donde más se marca el iPhone al apoyarlo.'],
               ['Cuida los lentes de la cámara', 'Protege de rayones y golpes', 'Hecho a la medida de cada modelo'],
               ['Protector de cámara'])),

    modelo('Protector de pantalla para Apple Watch', 'protector-pantalla-apple-watch', 'protector',
           ['Vidrio Protecto IWach for 41 mm'],
           sistema('Protector de pantalla', 'vidrio', [r'\bvidrio\b.*\b(iwach|iwatch|watch)\b'], para='tu Apple Watch'),
           {
               'tipo': 'Protector de vidrio para la pantalla del reloj',
               'proteccion': 'Cuida la pantalla del reloj de rayones y golpes',
           },
           contenido(
               'Protector de vidrio para {modelo}: cuida la pantalla del reloj de rayones y golpes.',
               ['Un protector de vidrio para la pantalla de {modelo}, que es la que más se expone a golpes contra marcos, '
                'mesas y paredes.'],
               ['Protege la pantalla del reloj', 'Para cada tamaño de caja'],
               ['Protector de pantalla para Apple Watch'])),

    modelo('Protector de pantalla para iPad', 'protector-pantalla-ipad', 'protector',
           ['VIDRIO IPAD'],
           sistema('Protector de pantalla', 'vidrio', [r'\bvidrio\b.*\bipad\b'], para='tu iPad'),
           {
               'tipo': 'Protector de pantalla de vidrio para iPad',
               'proteccion': DIA_A_DIA,
           },
           contenido(
               'Protector de pantalla de vidrio para {modelo}: cuida la pantalla de rayones y golpes.',
               ['Un protector de vidrio que cubre la pantalla de {modelo} y la cuida de rayones y golpes del uso diario.'],
               ['Protege la pantalla del iPad', 'Transparente'],
               ['Protector de pantalla para iPad']),
           pendientes=[falta('sistema.modelo', 'El nombre del inventario no dice para qué iPad es.', 'Revisar la caja')]),

    modelo('Protector de pantalla para MacBook', 'protector-pantalla-macbook', 'protector',
           ['VIDRIO MACBOOK'],
           sistema('Protector de pantalla', 'vidrio', [r'\bvidrio\b.*\bmacbook\b'], para='tu MacBook'),
           {
               'tipo': 'Protector de pantalla para MacBook',
               'proteccion': 'Cuida la pantalla de rayones y marcas',
           },
           contenido(
               'Protector de pantalla para {modelo}: cuida la pantalla de rayones y marcas.',
               ['Un protector para la pantalla de {modelo}, que la cuida de rayones y de las marcas del teclado al cerrarla.'],
               ['Protege la pantalla de la MacBook'],
               ['Protector de pantalla para MacBook']),
           pendientes=[falta('sistema.modelo', 'El nombre del inventario no dice para qué MacBook es.', 'Revisar la caja')]),
]

# ─── Fundas ──────────────────────────────────────────────────────────────────────────────────────────────────

FUNDAS = [
    modelo('Funda con teclado para iPad Pro', 'funda-teclado-ipad-pro', 'funda',
           ['FUNDA IPAD PRO + TECLADO'],
           sistema('Funda', 'funda', [r'\bfundas?\b.*\bipad\b.*\bteclado\b'], para='tu iPad Pro'),
           {'tipo': 'Funda con teclado para iPad Pro', 'proteccion': 'Protege el iPad de rayones y golpes'},
           contenido(
               'Funda con teclado para iPad Pro: protege tu iPad y te deja escribir cómodo.',
               ['Una funda que protege el iPad Pro y suma un teclado para escribir como en una computadora.'],
               ['Funda y teclado en uno', 'Protege el iPad'],
               ['Funda con teclado para iPad Pro']),
           pendientes=[falta('sistema.modelo', 'El nombre del inventario no dice para qué iPad Pro es ni cómo se conecta el teclado.',
                             'Revisar la caja')]),

    modelo('Funda para iPad', 'funda-ipad', 'funda',
           ['FUNDA DE IPAD', 'FUNDA IPAD'],
           sistema('Funda', 'funda', [r'\bfundas?\b.*\bipad\b'], para='tu iPad'),
           {'tipo': 'Funda para iPad', 'proteccion': 'Protege el iPad de rayones y golpes'},
           contenido(
               'Funda para {modelo}: protege el iPad de rayones y golpes al llevarlo.',
               ['Una funda para cuidar {modelo} de rayones y golpes en la mochila o en la casa.'],
               ['Protege el iPad', 'Para llevarlo a todos lados'],
               ['Funda para iPad']),
           pendientes=[falta('sistema.modelo', 'El nombre del inventario no dice para qué iPad es.', 'Revisar la caja')]),

    modelo('Funda para MacBook', 'funda-macbook', 'funda',
           ['FUNDA MACBOOK', 'FUNDA PARA MACBOOK PRO 16 PULGADAS'],
           sistema('Funda', 'funda', [r'\bfundas?\b.*\bmacbook\b'], para='tu MacBook'),
           {'tipo': 'Funda para MacBook', 'proteccion': 'Protege la MacBook de rayones y golpes'},
           contenido(
               'Funda para {modelo}: protege tu MacBook de rayones y golpes.',
               ['Una funda para llevar {modelo} protegida de rayones y golpes.'],
               ['Protege la MacBook', 'Para llevarla a todos lados'],
               ['Funda para MacBook'])),

    modelo('Funda para AirPods', 'funda-airpods', 'funda',
           ['FUNDA PARA AIRPODS PRO 2DA GEN', 'Fundas Airpods', 'Funda Airpods 1era Gen'],
           sistema('Funda', 'funda', [r'\bfundas?\b.*\bairpods\b'], para='tus AirPods'),
           {'tipo': 'Funda para el estuche de los AirPods', 'proteccion': 'Protege el estuche de rayones y golpes'},
           contenido(
               'Funda para el estuche de {modelo}: lo protege de rayones y golpes.',
               ['Una funda que envuelve el estuche de carga de {modelo} y lo cuida de rayones y golpes en el bolsillo o la '
                'mochila.'],
               ['Protege el estuche de carga', 'Fácil de poner y sacar'],
               ['Funda para AirPods'])),

    modelo('Funda MagSafe para iPhone', 'funda-magsafe', 'funda',
           ['FUNDA MAGSAFE IP 15 PRO MAX'],
           sistema('Funda', 'funda', [r'\bfundas?\b.*\bmags?a?fe\b']),
           {
               'tipo': 'Funda compatible con MagSafe',
               'magsafe': 'Sí: sus imanes se acoplan a cargadores y accesorios MagSafe',
               'proteccion': BORDES,
           },
           contenido(
               'Funda MagSafe para {modelo}: se acopla con imanes a cargadores, billeteras y soportes MagSafe.',
               ['Una funda con imanes para usar cargadores, billeteras y soportes MagSafe sin sacarla.',
                'Cubre la parte trasera y los bordes de {modelo} y lo cuida de rayones y golpes del día a día.'],
               ['Imanes compatibles con MagSafe', 'Cubre la parte trasera y los bordes', 'Hecha a la medida de cada modelo'],
               ['Funda MagSafe']),
           visual={'etiqueta': 'MagSafe'}),

    modelo('Funda de silicona para iPhone', 'funda-silicona', 'funda',
           ['FUNDA SILICONA IP 15 PRO', 'FUNDA DE SILICONA IP 12/12 PRO'],
           sistema('Funda', 'funda', [r'\bfundas?\b.*\bsilic']),
           {
               'tipo': 'Funda de silicona',
               'material': 'Silicona',
               'proteccion': BORDES,
           },
           contenido(
               'Funda de silicona para {modelo}: suave al tacto, firme en la mano y con protección para el uso diario.',
               ['La silicona es suave al tacto y firme en la mano. La funda cubre la parte trasera y los bordes de {modelo} y '
                'lo cuida de rayones y golpes del día a día.'],
               ['Silicona suave al tacto', 'Cubre la parte trasera y los bordes', 'Hecha a la medida de cada modelo'],
               ['Funda de silicona'])),

    modelo('Funda con diseño para iPhone', 'funda-diseno', 'funda',
           ['Funda de Diseño IP 14 PRO MAX', 'FUNDA DE DISEÑO'],
           sistema('Funda', 'funda', [r'\bfundas?\b.*\bdiseno\b']),
           {'tipo': 'Funda con diseño', 'proteccion': BORDES},
           contenido(
               'Funda con diseño para {modelo}: dale estilo a tu iPhone y cuídalo de rayones y golpes.',
               ['Una funda con diseño para darle personalidad a {modelo}. Cubre la parte trasera y los bordes y lo cuida de '
                'rayones y golpes del día a día.'],
               ['Con diseño', 'Cubre la parte trasera y los bordes', 'Hecha a la medida de cada modelo'],
               ['Funda con diseño'])),
]

# ─── Cables y adaptadores ───────────────────────────────────────────────────────────────────────────────────

LIGHTNING = 'iPhone con conector Lightning (del iPhone 5 al iPhone 14), AirPods y accesorios con Lightning'

CABLES = [
    modelo('Cable USB‑C a Lightning (1 m)', 'cable-usb-c-lightning-1m', 'cable',
           ['Cable USB C - to Lightning 1m', 'CABLE C A LIGHTNING 1 M'],
           sistema('Cable', 'cable', [r'\bcable\b.*\bc\b.*\blig\w*ning\b.*\b1m\b']),
           {
               'tipo': 'Cable USB‑C a Lightning',
               'puerto': 'USB‑C en un extremo y Lightning en el otro',
               'largo_cable': '1 m',
               'carga_rapida': 'Con un cargador USB‑C de 20 W o más, carga rápido el iPhone con Lightning (iPhone 8 a iPhone 14)',
               'compatibilidad': LIGHTNING,
           },
           contenido(
               'Cable USB‑C a Lightning de 1 m: con un cargador USB‑C de 20 W, carga rápido tu iPhone con Lightning.',
               ['Conecta un iPhone con Lightning a un cargador o a una computadora con USB‑C. Con un cargador USB‑C de 20 W o '
                'más, permite la carga rápida del iPhone 8 al iPhone 14.'],
               ['USB‑C a Lightning', '1 m de largo', 'Carga rápida con un cargador de 20 W', 'También pasa datos'],
               ['Cable USB‑C a Lightning de 1 m'])),

    modelo('Cable Lightning a USB', 'cable-lightning-usb', 'cable',
           ['Cable Lightning to USB'],
           sistema('Cable', 'cable', [r'\bcable\b.*\blig\w*ning\b.*\busb\b']),
           {
               'tipo': 'Cable Lightning a USB‑A',
               'puerto': 'Lightning en un extremo y USB‑A en el otro',
               'carga_rapida': 'Carga normal: para la carga rápida hace falta un cable USB‑C a Lightning',
               'compatibilidad': LIGHTNING,
           },
           contenido(
               'Cable Lightning a USB para cargar y sincronizar tu iPhone con Lightning.',
               ['Conecta un iPhone, unos AirPods o un accesorio con Lightning a un cargador o a una computadora con USB‑A.',
                'Es carga normal: para la carga rápida hace falta un cable USB‑C a Lightning.'],
               ['Lightning a USB‑A', 'Carga y pasa datos'],
               ['Cable Lightning a USB'])),

    modelo('Cable USB‑C a USB‑C (1 m)', 'cable-usb-c-usb-c-1m', 'cable',
           ['CABLE C A C 1 METRO'],
           sistema('Cable', 'cable', [r'\bcable\b.*\bc a c\b', r'\bcable\b.*\busb ?c\b.*\busb ?c\b']),
           {
               'tipo': 'Cable USB‑C a USB‑C',
               'puerto': 'USB‑C en los dos extremos',
               'largo_cable': '1 m',
               'carga_rapida': 'Con un cargador USB‑C de 20 W o más, carga rápido el iPhone 15 o posterior',
               'compatibilidad': 'iPhone 15 o posterior, iPad, Mac, AirPods y equipos con USB‑C',
           },
           contenido(
               'Cable USB‑C a USB‑C de 1 m para cargar tu iPhone 15 o posterior, el iPad, la Mac y más.',
               ['Conecta equipos con USB‑C a un cargador o entre sí. Con un cargador USB‑C de 20 W o más, permite la carga '
                'rápida del iPhone 15 o posterior.'],
               ['USB‑C en los dos extremos', '1 m de largo', 'Para iPhone 15 o posterior, iPad y Mac'],
               ['Cable USB‑C a USB‑C de 1 m'])),

    modelo('Adaptador de Lightning a 3,5 mm', 'adaptador-lightning-3-5mm', 'cable',
           ['Lighning to Headphone Jack'],
           sistema('Adaptador', 'cable', [r'\blig\w*ning\b.*\b(headphone|jack|3 5)\b']),
           {
               'tipo': 'Adaptador de Lightning a entrada de audífonos de 3,5 mm',
               'puerto': 'Lightning en un extremo y entrada de 3,5 mm en el otro',
               'compatibilidad': 'iPhone con conector Lightning',
           },
           contenido(
               'Adaptador para usar tus audífonos de cable de 3,5 mm en un iPhone con Lightning.',
               ['Los iPhone con Lightning no tienen entrada de audífonos: este adaptador te deja usar audífonos, parlantes o '
                'cables de audio con conector de 3,5 mm.'],
               ['Lightning a 3,5 mm', 'Para audífonos y parlantes con cable'],
               ['Adaptador de Lightning a 3,5 mm'])),

    modelo('Cable de carga rápida', 'cable-carga-rapida', 'cable',
           ['FAST CHARGIN DATA CABLE', 'FAST CHARGIN DATA CABLE CON PANTALLA'],
           sistema('Cable', 'cable', [r'\bdata cable\b', r'\bcable de datos\b']),
           {'tipo': 'Cable de carga y datos'},
           contenido(
               'Cable de carga rápida y datos.',
               ['Un cable para cargar rápido y pasar datos entre tus equipos.'],
               ['Carga rápida', 'Pasa datos'],
               ['Cable de carga rápida']),
           pendientes=[falta('ficha.puerto', 'El nombre del inventario no dice qué conectores tiene.', 'Revisar la unidad')]),
]

# ─── Accesorios de marca y genéricos ────────────────────────────────────────────────────────────────────────

ACCESORIOS = [
    # Amazon: aboutamazon.com (anuncio y nota de prensa de la India). Wi‑Fi, Bluetooth, medidas y peso: reseñas.
    modelo('Amazon Echo Dot Max', 'amazon-echo-dot-max', 'accesorio',
           ['ALEXA ECHO DOT MAX'],
           sistema('Parlante inteligente', 'parlante', [r'\becho dot max\b'], anio=2025, marca='Amazon', para='tu casa'),
           {
               'tipo': 'Parlante inteligente con Alexa',
               'fabricante': 'Amazon',
               'audio': 'Dos parlantes: un woofer de 2,5" para los graves y un tweeter de 0,8" para los agudos · '
                        'Casi 3 veces más graves que el Echo Dot (5.ª gen.)',
               'asistente': 'Alexa',
               'casa_inteligente': 'Hub integrado con Zigbee, Thread y Matter para controlar luces, enchufes y más',
               'procesador': 'Chip AZ3 de Amazon',
               'sensores': 'Omnisense: sonido, ultrasonido, radar Wi‑Fi y acelerómetro',
               'microfonos': 'Con botón para apagarlos',
               'wifi': 'Wi‑Fi 6E',
               'bluetooth': '5.3',
               'dimensiones': '10,8 × 10,8 × 9,9 cm',
               'peso': '505 g',
           },
           contenido(
               'El Echo Dot más potente: dos parlantes con casi tres veces más graves que el Echo Dot (5.ª gen.) y un hub de '
               'casa inteligente integrado.',
               ['El Echo Dot Max suma un woofer y un tweeter para un sonido más lleno, con casi tres veces más graves que el '
                'Echo Dot de 5.ª generación. Con Alexa manejas la música, las alarmas, los recordatorios y la casa '
                'inteligente con la voz.',
                'Trae un hub de casa inteligente con Zigbee, Thread y Matter: controla luces, enchufes y otros equipos '
                'compatibles sin un hub aparte. Necesita Wi‑Fi y la app Alexa.'],
               ['Woofer de 2,5" y tweeter de 0,8"', 'Hub de casa inteligente con Zigbee, Thread y Matter', 'Chip AZ3',
                'Wi‑Fi 6E y Bluetooth 5.3', 'Botón para apagar los micrófonos'],
               ['Echo Dot Max']),
           pendientes=[verificar('ficha.wifi', 'Amazon no lo detalla en sus anuncios: sale de reseñas.', 'soundguys.com y tomsguide.com'),
                       verificar('ficha.bluetooth', 'Amazon no lo detalla en sus anuncios: sale de reseñas.', 'soundguys.com y tomsguide.com'),
                       verificar('ficha.dimensiones', 'Sale de reseñas y fichas de terceros.', 'matteralpha.com y soundguys.com'),
                       verificar('ficha.peso', 'Sale de reseñas y fichas de terceros.', 'matteralpha.com y soundguys.com')]),

    modelo('Amazon Echo Dot', 'amazon-echo-dot', 'accesorio',
           ['Alexa Echo Dot'],
           sistema('Parlante inteligente', 'parlante', [r'\becho dot\b'], marca='Amazon', para='tu casa'),
           {
               'tipo': 'Parlante inteligente con Alexa',
               'fabricante': 'Amazon',
               'asistente': 'Alexa',
               'funciones': 'Música, alarmas, recordatorios, preguntas y control de la casa inteligente con la voz',
               'conectividad': 'Wi‑Fi y Bluetooth',
               'microfonos': 'Con botón para apagarlos',
           },
           contenido(
               'Parlante inteligente con Alexa: pide música, pon alarmas y maneja tu casa inteligente con la voz.',
               ['El Echo Dot es el parlante inteligente compacto de Amazon. Con Alexa pides música, pones alarmas y '
                'recordatorios, haces preguntas y controlas luces y enchufes compatibles con la voz.',
                'Se conecta por Wi‑Fi y también sirve como parlante Bluetooth. Necesita la app Alexa.'],
               ['Alexa con la voz', 'Wi‑Fi y Bluetooth', 'Botón para apagar los micrófonos'],
               ['Echo Dot']),
           pendientes=[falta('sistema.anio', 'El inventario no dice la generación del Echo Dot: con ella se suma lo propio de '
                             'cada una (sonido, sensores).', 'Etiqueta de la unidad o amazon.com')]),

    modelo('Amazon Echo Auto', 'amazon-echo-auto', 'accesorio',
           ['Alexa Echo Auto', 'ECHO AUTO'],
           sistema('Alexa para el auto', 'otro', [r'\becho auto\b'], marca='Amazon', para='tu auto'),
           {
               'tipo': 'Alexa para el auto',
               'fabricante': 'Amazon',
               'asistente': 'Alexa',
               'funciones': 'Música, llamadas, navegación y recordatorios con la voz, a través de la app Alexa del celular',
               'conectividad': 'Al celular por Bluetooth · Al estéreo del auto por Bluetooth o cable auxiliar de 3,5 mm',
           },
           contenido(
               'Lleva Alexa a tu auto: música, llamadas y navegación con la voz, sin soltar el volante.',
               ['El Echo Auto se conecta al celular por Bluetooth y usa la app Alexa para que pidas música, hagas llamadas, '
                'uses la navegación y recuerdes pendientes con la voz mientras manejas.',
                'Suena por el estéreo del auto, por Bluetooth o con un cable auxiliar de 3,5 mm.'],
               ['Alexa en el auto', 'Por Bluetooth o cable auxiliar', 'Funciona con la app Alexa del celular'],
               ['Echo Auto']),
           pendientes=[falta('sistema.anio', 'El inventario no dice la generación (la 2.ª es de 2022): con ella se suman los '
                             'micrófonos y lo que trae la caja.', 'Etiqueta de la unidad o amazon.com')]),

    # Amazon: developer.amazon.com, tabla de especificaciones de los Fire TV (modelo AFTCA002).
    modelo('Amazon Fire TV Stick 4K Select', 'amazon-fire-tv-stick-4k-select', 'accesorio',
           ['FIRE TV STICK 4K SELECT'],
           sistema('Streaming', 'streaming', [r'\bfire ?tv\b.*\b4k select\b'], anio=2025, marca='Amazon', modelo='AFTCA002',
                   para='tu TV'),
           {
               'tipo': 'Reproductor de streaming 4K para la TV',
               'fabricante': 'Amazon',
               'resolucion': '4K Ultra HD hasta 60 fps · HDR10, HDR10+ y HLG',
               'audio': 'Dolby Atmos por HDMI, si tu TV o barra de sonido lo acepta',
               'control': 'Control remoto por voz con Alexa',
               'procesador': 'MediaTek MT8698 de 4 núcleos, hasta 1,7 GHz',
               'memoria': '1 GB de RAM · 8 GB de almacenamiento',
               'wifi': 'Wi‑Fi 5 de doble banda (2,4 y 5 GHz)',
               'bluetooth': '5.0',
               'puerto': 'HDMI 2.1',
               'funciones': 'Vega OS, el sistema de Amazon para la TV',
           },
           contenido(
               'Streaming en 4K Ultra HD con HDR10+ en tu TV, con control remoto por voz con Alexa.',
               ['El Fire TV Stick 4K Select se conecta al puerto HDMI de la TV y lleva el streaming en 4K Ultra HD con HDR10, '
                'HDR10+ y HLG, y sonido Dolby Atmos si tu TV o barra de sonido lo acepta.',
                'Con el control remoto por voz buscas y manejas todo con Alexa. Funciona con Wi‑Fi de doble banda y usa Vega '
                'OS, el nuevo sistema de Amazon.'],
               ['4K Ultra HD hasta 60 fps', 'HDR10, HDR10+ y HLG', 'Dolby Atmos por HDMI', 'Control remoto por voz con Alexa',
                'Wi‑Fi 5 de doble banda'],
               ['Fire TV Stick 4K Select', 'Control remoto por voz con Alexa']),
           pendientes=[verificar('ficha.control', 'La tabla de Amazon para desarrolladores no nombra el control: sale de '
                                 'reseñas que coinciden.', 'tomsguide.com y cnx-software.com')]),

    # Sony: playstation.com (páginas del DualSense en EE. UU. y Japón).
    modelo('Control inalámbrico DualSense para PS5', 'sony-dualsense', 'accesorio',
           ['PLAYSTATION PS5 BLACK CONTROLLER', 'PLAYSTATION PS5 WHITE CHROME CONTROLLER'],
           sistema('Control', 'control', [r'\bdualsense\b', r'\bps5\b.*\bcontroller\b', r'\bplaystation 5\b.*\b(control|mando)\b'],
                   anio=2020, marca='Sony', para='tu PS5'),
           {
               'tipo': 'Control inalámbrico para PS5',
               'fabricante': 'Sony',
               'haptica': 'Dos actuadores en lugar de los motores de vibración de siempre',
               'gatillos': 'Cambian su resistencia según lo que pasa en el juego',
               'microfonos': 'Micrófono integrado con botón para silenciarlo',
               'audio': 'Parlante integrado y entrada de 3,5 mm para audífonos',
               'sensores': 'Acelerómetro y giroscopio para controles por movimiento',
               'funciones': 'Botón Crear para capturar y transmitir tus partidas',
               'conectividad': 'Bluetooth o cable USB‑C',
               'bateria': 'Recargable, integrada',
               'puerto': 'USB‑C',
               'compatibilidad': 'PS5, PC y Mac, y celulares y tablets Android y iOS',
           },
           contenido(
               'El control de la PS5, con respuesta háptica y gatillos adaptativos que te hacen sentir el juego.',
               ['El DualSense cambia la vibración de siempre por respuesta háptica con dos actuadores, y sus gatillos '
                'adaptativos cambian de resistencia según la acción. Tiene micrófono, parlante, sensores de movimiento y el '
                'botón Crear para capturar y transmitir tus partidas.',
                'Se carga por USB‑C y también funciona en PC, Mac, celulares y tablets por Bluetooth o cable. La respuesta '
                'háptica y los gatillos adaptativos dependen de cada juego y, fuera de la PS5, pueden necesitar cable.'],
               ['Respuesta háptica', 'Gatillos adaptativos', 'Micrófono y parlante integrados', 'Batería recargable por USB‑C',
                'También para PC, Mac y celulares'],
               ['Control inalámbrico DualSense'])),

    modelo('Control inalámbrico para PS4', 'control-inalambrico-ps4', 'accesorio',
           ['Mando Dualshock 4 FIFA', 'Mando Dualshock 4 Naranja'],
           sistema('Control', 'control', [r'\bdualshock\b', r'\b(mando|control)\b.*\bps4\b'], para='tu PS4'),
           {'tipo': 'Control inalámbrico para PS4'},
           contenido(
               'Control inalámbrico para jugar en tu PS4.',
               ['Un control inalámbrico para jugar en la PlayStation 4, con diseño a elección.'],
               ['Inalámbrico', 'Para PS4'],
               ['Control inalámbrico para PS4']),
           pendientes=[falta('ficha.fabricante', 'El nombre dice «Dualshock 4», pero no si son originales de Sony: si lo son, '
                             'se carga la ficha oficial.', 'Revisar la caja y el número de modelo (CUH‑ZCT2)')]),

    # PlayStation: playstation.com (página del juego). Premio: Wikipedia (The Game Awards 2024).
    modelo('Astro Bot (PS5)', 'astro-bot-ps5', 'accesorio',
           ['ASTRO BOT'],
           sistema('Videojuego', 'juego', [r'\bastro ?bot\b'], anio=2024, marca='Sony Interactive Entertainment', para='tu PS5'),
           {
               'tipo': 'Videojuego para PS5',
               'fabricante': 'Team ASOBI · PlayStation Studios',
               'juego': 'Plataformas en 3D · 1 jugador',
               'funciones': 'Más de 50 planetas y 300 bots para rescatar · Aprovecha la respuesta háptica y los gatillos '
                            'adaptativos del DualSense · Juego del año en The Game Awards 2024',
           },
           contenido(
               'La aventura de plataformas de ASTRO en PS5, elegida juego del año en The Game Awards 2024.',
               ['La nave de la PS5 se estrelló y la tripulación de bots quedó repartida por las galaxias: recorre más de 50 '
                'planetas para rescatar a los 300 bots. Es un juego de plataformas en 3D para un jugador que aprovecha la '
                'respuesta háptica y los gatillos adaptativos del DualSense.'],
               ['Exclusivo de PS5', 'Más de 50 planetas', 'Juego del año en The Game Awards 2024'],
               ['Juego Astro Bot para PS5'])),

    modelo('Videojuego Gran Turismo', 'videojuego-gran-turismo', 'accesorio',
           ['GRAN TURISMO'],
           sistema('Videojuego', 'juego', [r'\bgran turismo\b'], marca='Sony Interactive Entertainment', para='tu consola'),
           {'tipo': 'Videojuego de carreras', 'juego': 'Carreras de autos'},
           contenido(
               'Videojuego de carreras de la saga Gran Turismo.',
               ['Un juego de la saga Gran Turismo, las carreras de autos de PlayStation.'],
               ['Carreras de autos', 'Saga Gran Turismo'],
               ['Juego Gran Turismo']),
           pendientes=[falta('sistema.modelo', 'El nombre del inventario no dice qué edición ni para qué consola es '
                             '(por ejemplo, Gran Turismo 7 para PS5).', 'Revisar la caja')]),

    modelo('Pack de accesorios Gamefitz 10 en 1', 'gamefitz-pack-10-en-1', 'accesorio',
           ['Gamefitz 10 IN 1 Accesories Pack'],
           sistema('Accesorios para videojuegos', 'juego', [r'\bgamefitz\b'], marca='Gamefitz', para='tu consola'),
           {'tipo': 'Kit de accesorios para videojuegos', 'fabricante': 'Gamefitz'},
           contenido(
               'Pack de 10 accesorios Gamefitz para gamers.',
               ['Un kit de 10 accesorios de la marca Gamefitz para tu consola.'],
               ['10 accesorios en un pack', 'Marca Gamefitz'],
               ['Pack de accesorios Gamefitz 10 en 1']),
           pendientes=[falta('sistema.modelo', 'El nombre del inventario no dice para qué consola es ni qué trae el pack.',
                             'Revisar la caja')]),

    # Rapoo: rapoo-eu.com (ficha oficial). La distribución QWERTZ y el color salen del nombre del inventario.
    modelo('Rapoo Ralemo Pre 5', 'rapoo-ralemo-pre-5', 'accesorio',
           ['Rapoo Ralemo Pre 5 Wireless Keyboard DE Layout QWERTZ'],
           sistema('Teclado', 'teclado', [r'\bralemo\b'], marca='Rapoo', para='tu computadora'),
           {
               'tipo': 'Teclado mecánico inalámbrico',
               'fabricante': 'Rapoo',
               'conectividad': 'Bluetooth (3.0, 4.0 y 5.0), receptor USB de 2,4 GHz o cable · Cambia entre varios equipos con '
                               'un toque',
               'teclado': 'Teclas mecánicas de hasta 50 millones de pulsaciones · Teclas multimedia · Sin teclado numérico · '
                          'Distribución alemana (QWERTZ)',
               'iluminacion': 'Retroiluminación LED ajustable',
               'bateria': 'Recargable de 4.000 mAh: hasta 13 días con una carga',
               'compatibilidad': 'Windows, macOS, iOS, Android y Chrome OS',
               'dimensiones': '31,2 × 14,1 × 4,3 cm',
               'peso': '754 g',
           },
           contenido(
               'Teclado mecánico inalámbrico con estilo retro: Bluetooth, receptor de 2,4 GHz o cable, y hasta 13 días por '
               'carga.',
               ['El Ralemo Pre 5 de Rapoo tiene teclas mecánicas de hasta 50 millones de pulsaciones, teclas multimedia y '
                'retroiluminación LED. Se conecta por Bluetooth, con su receptor USB de 2,4 GHz o por cable, y cambia entre '
                'varios equipos con un toque.',
                'Su batería de 4.000 mAh dura hasta 13 días con una carga. Esta unidad tiene distribución alemana (QWERTZ): '
                'algunas teclas cambian de lugar respecto al teclado en español.'],
               ['Teclas mecánicas', 'Bluetooth, 2,4 GHz o cable', 'Batería de hasta 13 días', 'Distribución alemana (QWERTZ)'],
               ['Teclado Rapoo Ralemo Pre 5'])),

    # Satechi: satechi.com (ficha oficial del OntheGo Bluetooth Mouse, ST-MOTGK y ST-MOTGW).
    modelo('Satechi OntheGo Bluetooth Mouse', 'satechi-onthego-mouse', 'accesorio',
           ['SATECHI ONTHEGO MOUSE'],
           sistema('Mouse', 'mouse', [r'\bsatechi\b.*\bmouse\b', r'\bonthego\b'], anio=2025, marca='Satechi',
                   para='tu computadora'),
           {
               'tipo': 'Mouse Bluetooth',
               'fabricante': 'Satechi',
               'conectividad': 'Bluetooth 5.1 · Hasta 3 equipos',
               'precision': 'DPI ajustable: 800, 1.200, 1.600 o 2.400',
               'bateria': 'Recargable de 300 mAh por USB‑C',
               'autonomia': 'Hasta 80 h de uso con una carga',
               'compatibilidad': 'macOS, iPadOS, iOS, Windows, Chrome OS, Linux y Android',
               'dimensiones': '10,9 × 6,1 × 3,1 cm',
               'peso': '81 g',
           },
           contenido(
               'Mouse Bluetooth compacto para llevar: se conecta a 3 equipos y dura hasta 80 horas por carga.',
               ['El OntheGo de Satechi es un mouse Bluetooth compacto y liviano, pensado para viajar. Se conecta a hasta 3 '
                'equipos y cambias entre ellos al instante; la precisión se ajusta de 800 a 2.400 DPI.',
                'Se carga por USB‑C y dura hasta 80 horas de uso. Funciona con Mac, iPad, iPhone, Windows, Chrome OS, Linux y '
                'Android.'],
               ['Bluetooth 5.1 para 3 equipos', 'DPI de 800 a 2.400', 'Hasta 80 h por carga', 'Carga por USB‑C'],
               ['Mouse Satechi OntheGo', 'Cable de carga USB‑C'])),

    modelo('Teclado Bluetooth', 'teclado-bluetooth', 'accesorio',
           ['Bluetooth Keyboard'],
           sistema('Teclado', 'teclado', [r'\bbluetooth keyboard\b', r'\bteclado\b.*\bbluetooth\b'], para='tu iPad o tu celular'),
           {'tipo': 'Teclado inalámbrico', 'conectividad': 'Bluetooth'},
           contenido(
               'Teclado inalámbrico Bluetooth para tu iPad, celular o computadora.',
               ['Un teclado inalámbrico que se conecta por Bluetooth para escribir más cómodo en el iPad, el celular o la '
                'computadora.'],
               ['Inalámbrico por Bluetooth', 'Para iPad, celular y computadora'],
               ['Teclado Bluetooth'])),

    modelo('Teclado plegable portátil', 'teclado-plegable', 'accesorio',
           ['Folding Keyboard Portable - Fashion'],
           sistema('Teclado', 'teclado', [r'\bfolding keyboard\b', r'\bteclado\b.*\bplegable\b'], para='tu celular o tu iPad'),
           {'tipo': 'Teclado plegable'},
           contenido(
               'Teclado portátil que se pliega para llevarlo en el bolsillo o la mochila.',
               ['Un teclado que se pliega para llevarlo a todos lados y escribir cómodo con el celular o el iPad.'],
               ['Se pliega', 'Portátil'],
               ['Teclado plegable'])),

    modelo('Teclado gamer', 'teclado-gamer', 'accesorio',
           ['Teclado Gamer'],
           sistema('Teclado', 'teclado', [r'\bteclado gamer\b', r'\bgaming keyboard\b'], para='tu computadora'),
           {'tipo': 'Teclado para juegos'},
           contenido(
               'Teclado gamer para jugar y escribir en tu computadora.',
               ['Un teclado pensado para jugar en la computadora.'],
               ['Para jugar', 'Para computadora'],
               ['Teclado gamer'])),

    modelo('Batería externa Gerlax de 20.000 mAh', 'gerlax-bateria-externa-20000', 'accesorio',
           ['Gerlax Power Bank 20000 mah'],
           sistema('Batería externa', 'bateria', [r'\bgerlax\b.*\bpower ?bank\b', r'\bpower ?bank\b.*\b20000'], marca='Gerlax',
                   para='tu celular'),
           {'tipo': 'Batería externa (power bank)', 'fabricante': 'Gerlax', 'bateria': '20.000 mAh'},
           contenido(
               'Batería externa Gerlax de 20.000 mAh para cargar tu celular fuera de casa.',
               ['Una batería externa de 20.000 mAh de la marca Gerlax para cargar el celular y otros equipos donde estés.'],
               ['20.000 mAh', 'Para cargar fuera de casa'],
               ['Batería externa Gerlax de 20.000 mAh'])),

    modelo('Batería externa', 'bateria-externa', 'accesorio',
           ['POWER BANK'],
           sistema('Batería externa', 'bateria', [r'\bpower ?bank\b'], para='tu celular'),
           {'tipo': 'Batería externa (power bank)'},
           contenido(
               'Batería externa para cargar tu celular donde estés.',
               ['Una batería externa para cargar el celular y otros equipos fuera de casa.'],
               ['Carga fuera de casa'],
               ['Batería externa']),
           pendientes=[falta('ficha.bateria', 'El nombre del inventario no dice la capacidad.', 'Revisar la unidad')]),

    # Apple: carga inalámbrica (support.apple.com/108377): los Qi comunes llegan a 7,5 W; MagSafe y Qi2, a más.
    modelo('Cargador inalámbrico magnético de 15 W', 'cargador-inalambrico-magnetico-15w', 'accesorio',
           ['15W Max Fast Charging Magnetic'],
           sistema('Cargador inalámbrico', 'cargador', [r'\bmagnetic\b.*\bcharg', r'\bcharg\w*\b.*\bmagnetic\b'], para='tu iPhone'),
           {
               'tipo': 'Cargador inalámbrico magnético',
               'potencia': 'Hasta 15 W, según el fabricante · Con iPhone depende del estándar: los cargadores Qi llegan a '
                           '7,5 W; los MagSafe y Qi2, a más',
               'magsafe': 'Imanes que lo alinean con el iPhone 12 o posterior',
           },
           contenido(
               'Cargador inalámbrico magnético: se pega a tu iPhone y lo carga sin cable.',
               ['Un cargador inalámbrico con imanes que se acopla a la parte trasera del iPhone 12 o posterior y lo carga sin '
                'enchufar el cable al teléfono.',
                'El fabricante indica hasta 15 W. Con un iPhone, la velocidad depende del estándar del cargador: según Apple, '
                'los cargadores Qi llegan hasta 7,5 W y los MagSafe y Qi2 cargan más rápido.'],
               ['Carga inalámbrica', 'Imanes para iPhone 12 o posterior', 'Hasta 15 W según el fabricante'],
               ['Cargador inalámbrico magnético'])),

    modelo('Cargador para auto', 'cargador-auto', 'accesorio',
           ['CARGADOR AUTO', 'ACEFAST FAST IN CAR CHARGER'],
           sistema('Accesorio para auto', 'auto', [r'\bcargador\b.*\bauto\b', r'\bcar charger\b'], para='tu celular'),
           {'tipo': 'Cargador para el encendedor del auto'},
           contenido(
               'Carga tu celular en el auto desde el encendedor.',
               ['Un cargador que se conecta al encendedor del auto para cargar el celular mientras viajas.'],
               ['Para el encendedor del auto', 'Carga mientras viajas'],
               ['Cargador para auto'])),

    modelo('Soporte de celular para auto', 'soporte-celular-auto', 'accesorio',
           ['IN CAR PHONE SUPPORT'],
           sistema('Accesorio para auto', 'auto', [r'\bcar phone support\b', r'\bsoporte\b.*\b(auto|carro)\b'], para='tu celular'),
           {'tipo': 'Soporte de celular para el auto'},
           contenido(
               'Soporte para tener el celular a la vista en el auto y seguir el GPS sin tomarlo en la mano.',
               ['Un soporte que sostiene el celular a la vista mientras manejas, para seguir el GPS sin tenerlo en la mano.'],
               ['Celular a la vista', 'Para seguir el GPS'],
               ['Soporte de celular para auto'])),

    modelo('Protector para cubo de 20 W y cable', 'protector-cubo-cable', 'accesorio',
           ['PROTECTOR CUBO 20W + PROTECTOR CABLE'],
           sistema('Protector de cargador', 'cargador', [r'\bprotector cubo\b', r'\bprotector\b.*\bcable\b'], para='tu cargador'),
           {'tipo': 'Protector para cargador y cable'},
           contenido(
               'Protector para el cubo de 20 W y el cable: cuida el cargador y evita que el cable se doble junto al conector.',
               ['Un protector para el cubo de 20 W y otro para el cable, que evita que el cable se doble y se rompa junto al '
                'conector.'],
               ['Protege el cubo de 20 W', 'Cuida el cable junto al conector'],
               ['Protector para cubo de 20 W', 'Protector para cable'])),

    modelo('Correas de repuesto para Apple Watch', 'correas-apple-watch', 'accesorio',
           ['Set Manillas de Remplazo Iwatch for 44 MM'],
           sistema('Correa', 'reloj', [r'\bmanillas?\b', r'\bcorreas?\b'], para='tu Apple Watch'),
           {'tipo': 'Set de correas de repuesto'},
           contenido(
               'Set de correas de repuesto para {modelo}: cambia el estilo de tu reloj.',
               ['Un set de correas para cambiar el estilo de {modelo} según la ocasión.'],
               ['Set de correas', 'Para cambiar el estilo del reloj'],
               ['Set de correas de repuesto'])),

    modelo('Micrófono inalámbrico', 'microfono-inalambrico', 'accesorio',
           ['Microfono Wireless Microphone'],
           sistema('Micrófono', 'otro', [r'\bmicrofono\b', r'\bmicrophone\b'], para='tus videos'),
           {'tipo': 'Micrófono inalámbrico'},
           contenido(
               'Micrófono inalámbrico para grabar tu voz con más claridad en videos y transmisiones.',
               ['Un micrófono inalámbrico para que tu voz se escuche más clara en videos, clases y transmisiones.'],
               ['Inalámbrico', 'Para videos y transmisiones'],
               ['Micrófono inalámbrico'])),

    modelo('Parlante con luces RGB', 'parlante-rgb', 'accesorio',
           ['PARLANTE SQUISHY RGB'],
           sistema('Parlante', 'parlante', [r'\bparlante\b', r'\bspeaker\b'], para='tu música'),
           {'tipo': 'Parlante portátil', 'iluminacion': 'Luces RGB de colores'},
           contenido(
               'Parlante portátil con luces RGB de colores.',
               ['Un parlante portátil con luces RGB de colores para acompañar tu música.'],
               ['Luces RGB', 'Portátil'],
               ['Parlante con luces RGB']),
           pendientes=[falta('ficha.conectividad', 'El nombre del inventario no dice cómo se conecta (Bluetooth o cable).',
                             'Revisar la unidad')]),

    modelo('Llavero localizador ACEFAST', 'acefast-llavero-localizador', 'accesorio',
           ['ACEFAST LLAVERO INTELIGENTE'],
           sistema('Localizador', 'otro', [r'\bllavero\b', r'\btracker\b', r'\bsmart ?tag\b'], marca='ACEFAST', para='tus cosas'),
           {'tipo': 'Localizador para llaves y objetos', 'fabricante': 'ACEFAST'},
           contenido(
               'Llavero localizador ACEFAST para encontrar tus llaves, tu mochila o tu maleta desde el celular.',
               ['Un llavero inteligente de ACEFAST para ubicar tus llaves, tu mochila o tu maleta desde el celular.'],
               ['Localiza tus cosas desde el celular', 'Marca ACEFAST'],
               ['Llavero localizador ACEFAST']),
           pendientes=[falta('sistema.modelo', 'ACEFAST tiene varios modelos (S1 a S4) y con cada uno cambian la compatibilidad '
                             '(app Buscar de Apple) y la batería.', 'Revisar la caja')]),

    modelo('Audífonos con conector Lightning', 'audifonos-lightning', 'accesorio',
           ['AUDIFONO LIGHTNING'],
           sistema('Audífonos', 'audifonos', [r'\bau[df]ifono\w*\b.*\blig\w*ning\b'], para='tu iPhone'),
           {'tipo': 'Audífonos con cable Lightning', 'compatibilidad': 'iPhone con conector Lightning'},
           contenido(
               'Audífonos con cable y conector Lightning para escuchar música en tu iPhone.',
               ['Audífonos con cable que se conectan directo al puerto Lightning del iPhone, sin adaptador.'],
               ['Conector Lightning', 'Sin adaptador'],
               ['Audífonos con conector Lightning'])),

    modelo('Audífonos inalámbricos', 'audifonos-inalambricos', 'accesorio',
           ['Galaxy Buds2 Pro'],
           sistema('Audífonos', 'audifonos', [r'\bbuds\w*\b', r'\bearbuds\b', r'\binalambric\w*\b.*\bau[df]ifono'], para='tu celular'),
           {'tipo': 'Audífonos inalámbricos con estuche de carga', 'conectividad': 'Bluetooth'},
           contenido(
               'Audífonos inalámbricos Bluetooth con estuche de carga.',
               ['Audífonos inalámbricos que se conectan por Bluetooth al celular y se cargan en su estuche.'],
               ['Inalámbricos por Bluetooth', 'Estuche de carga'],
               ['Audífonos inalámbricos con estuche de carga'])),

    modelo('Audífonos', 'audifonos', 'accesorio',
           ['AUFIFONOS CORE HEADSET'],
           sistema('Audífonos', 'audifonos', [r'\bau[df]ifono', r'\bheadset\b'], para='tu música'),
           {'tipo': 'Audífonos'},
           contenido(
               'Audífonos para escuchar tu música.',
               ['Audífonos para escuchar música y contenido con buen sonido.'],
               ['Para tu música'],
               ['Audífonos']),
           pendientes=[falta('ficha.conectividad', 'El nombre del inventario no dice si son con cable o inalámbricos.',
                             'Revisar la unidad')]),

    modelo('Set de juguetes coleccionables Cars', 'juguetes-coleccionables-cars', 'accesorio',
           ['CARS SET DE JUGUETES COLECCIONABLES'],
           sistema('Juguetes', 'otro', [r'\bjuguetes?\b', r'\bcoleccionables?\b'], para='tu colección'),
           {'tipo': 'Juguetes coleccionables'},
           contenido(
               'Set de juguetes coleccionables de Cars.',
               ['Un set de juguetes coleccionables de Cars.'],
               ['Set coleccionable', 'Cars'],
               ['Set de juguetes coleccionables Cars']),
           pendientes=[falta('sistema.modelo', 'El nombre del inventario no dice qué trae el set.', 'Revisar la caja')]),
]

# Orden de detección: lo más específico primero (el protector del cubo antes que los cubos; la cámara antes que los
# vidrios; el teclado del iPad antes que la funda del iPad).
MODELOS = (
    [m for m in ACCESORIOS if m['slug'] == 'protector-cubo-cable']
    + CARGADORES + PROTECTORES + VIDRIOS + FUNDAS + CABLES
    + [m for m in ACCESORIOS if m['slug'] != 'protector-cubo-cable']
)

FUENTES = {
    'apple-adaptador-dinamico-40w': [
        'apple.com (EE. UU.): «40W Dynamic Power Adapter with 60W Max» (MGKN4AM/A): hasta 60 W, AVS, tiempos de carga, '
        'compatibilidad y nota al pie con el modelo A3351 y el cable de 60 W.',
        'chargerlab.com: teardown del A3365 (entrada, salidas, sensor de temperatura y pruebas con MacBook Air e iPhone).',
        'macrumors.com: USB Power Delivery 3.2 con SPR AVS y picos de 60 W por la temperatura.',
    ],
    'apple-adaptador-usb-c-20w': [
        'apple.com (EE. UU.): «20W USB-C Power Adapter» (MWVV3AM/A): 50 % en unos 35 minutos, iPad Pro y iPad Air, '
        'compatibilidad y cable por separado.',
        'chargerlab.com: review del A2940 (entrada, salidas, eficiencia y temperatura).',
        'support.apple.com/120548: los adaptadores de Apple están certificados para las normas de los países donde se venden.',
    ],
    'cargador-usb-c-20w-certificado': ['Genérico. support.apple.com/120548 (normas para cargadores de otras marcas) y '
                                       'support.apple.com/102574 (carga rápida con adaptadores USB‑PD de otras marcas).'],
    'cargador-usb-c-25w-certificado': ['Genérico. support.apple.com/120548 y support.apple.com/102574.'],
    'cargador-pared-35w': ['Genérico: solo la potencia del nombre del inventario.'],
    'gerlax-cargador-45w': ['Genérico: marca y potencia del nombre del inventario.'],
    'cargador-usb-5w': ['Genérico. support.apple.com/102574 (la carga rápida pide 20 W o más).'],
    'cargador-pared-pantalla-led': ['Genérico: lo que dice el nombre del inventario.'],
    'vidrio-templado-gorilla-glass': [
        'Wikipedia «Gorilla Glass»: vidrio de aluminosilicato de Corning reforzado con un baño de sales de potasio (intercambio iónico).',
        '9to5mac.com y digitaltrends.com (alianza Corning y OtterBox, 2019): vidrio de aluminosilicato con intercambio '
        'iónico formulado para protectores, con mejor resistencia a rayones.',
    ],
    'spigen-glastr-ez-fit': ['spigen.com: GLAS.tR EZ Fit (9H, oleofóbico, bandeja de alineación, compatible con fundas Spigen).'],
    'vidrio-templado-antiespia': ['Genérico: vidrio templado con filtro de privacidad, como dice su nombre.'],
    'vidrio-templado-mate-antirreflejo': ['Genérico: vidrio templado mate (Anti‑Glare), como dice su nombre.'],
    'vidrio-templado-luz-azul': ['Genérico: vidrio templado con filtro de luz azul (AntiBlue), como dice su nombre.'],
    'vidrio-templado-tradicional': ['Wikipedia «Tempered glass»: templado térmico o químico que deja la superficie en compresión.'],
    'protector-camara': ['Genérico.'],
    'protector-pantalla-apple-watch': ['Genérico: el tamaño sale del nombre del inventario.'],
    'protector-pantalla-ipad': ['Genérico.'],
    'protector-pantalla-macbook': ['Genérico.'],
    'funda-teclado-ipad-pro': ['Genérico.'],
    'funda-ipad': ['Genérico.'],
    'funda-macbook': ['Genérico: el modelo sale del nombre del inventario.'],
    'funda-airpods': ['Genérico: el modelo sale del nombre del inventario.'],
    'funda-magsafe': ['Genérico: funda con imanes compatible con MagSafe.'],
    'funda-silicona': ['Genérico.'],
    'funda-diseno': ['Genérico.'],
    'cable-usb-c-lightning-1m': ['support.apple.com/102574: la carga rápida del iPhone 8 al 14 pide cable USB‑C a Lightning y 18 W o más.'],
    'cable-lightning-usb': ['Genérico. support.apple.com/102574.'],
    'cable-usb-c-usb-c-1m': ['Genérico. support.apple.com/102574 (iPhone 15 o posterior con USB‑C).'],
    'adaptador-lightning-3-5mm': ['Genérico.'],
    'cable-carga-rapida': ['Genérico: lo que dice el nombre del inventario.'],
    'amazon-echo-dot-max': [
        'aboutamazon.com: «Echo Dot Max and Echo Studio, built for Alexa+» (woofer y tweeter, AZ3, casi 3 veces más graves).',
        'press.aboutamazon.com (India, junio de 2026): hub con Zigbee, Thread y Matter, Omnisense, botón de micrófonos y colores.',
        'soundguys.com y tomsguide.com: Wi‑Fi 6E y Bluetooth 5.3. matteralpha.com: medidas y peso.',
    ],
    'amazon-echo-dot': ['Genérico de la línea Echo Dot (Wi‑Fi, Bluetooth y botón de micrófonos), sin la generación.'],
    'amazon-echo-auto': ['Genérico de la línea Echo Auto; techcrunch.com (2.ª gen., 2022) para la conexión por Bluetooth o auxiliar.'],
    'amazon-fire-tv-stick-4k-select': [
        'developer.amazon.com: tabla de especificaciones de los Fire TV (AFTCA002: Vega OS, MT8698, 1 GB, 8 GB, Wi‑Fi 5, '
        'Bluetooth 5.0, HDMI 2.1, HDR10, HDR10+ y HLG, Dolby Atmos por HDMI).',
        'tomsguide.com y cnx-software.com: control remoto por voz con Alexa.',
    ],
    'sony-dualsense': ['playstation.com (EE. UU. y Japón): respuesta háptica, gatillos adaptativos, micrófono, parlante, '
                       'entrada de 3,5 mm, sensores de movimiento, botón Crear, USB‑C y compatibilidad con PC, Mac y celulares.'],
    'control-inalambrico-ps4': ['Genérico: lo que dice el nombre del inventario.'],
    'astro-bot-ps5': ['playstation.com: página del juego (más de 50 planetas, 300 bots, un jugador, exclusivo de PS5).',
                      'Wikipedia «Astro Bot»: juego del año en The Game Awards 2024.'],
    'videojuego-gran-turismo': ['Genérico: lo que dice el nombre del inventario.'],
    'gamefitz-pack-10-en-1': ['Genérico: lo que dice el nombre del inventario.'],
    'rapoo-ralemo-pre-5': ['rapoo-eu.com: ficha oficial (conexión, batería de 4.000 mAh y 13 días, teclas, medidas y peso). '
                           'La distribución QWERTZ sale del nombre del inventario.'],
    'satechi-onthego-mouse': ['satechi.com: ficha oficial del OntheGo Bluetooth Mouse (ST-MOTGK / ST-MOTGW).'],
    'teclado-bluetooth': ['Genérico.'],
    'teclado-plegable': ['Genérico.'],
    'teclado-gamer': ['Genérico.'],
    'gerlax-bateria-externa-20000': ['Genérico: marca y capacidad del nombre del inventario.'],
    'bateria-externa': ['Genérico.'],
    'cargador-inalambrico-magnetico-15w': ['support.apple.com/108377: muchos cargadores Qi cargan el iPhone hasta 7,5 W.',
                                           'support.apple.com/120619: para cargar más rápido sin cable, un cargador MagSafe o Qi2.'],
    'cargador-auto': ['Genérico.'],
    'soporte-celular-auto': ['Genérico.'],
    'protector-cubo-cable': ['Genérico.'],
    'correas-apple-watch': ['Genérico: el tamaño sale del nombre del inventario.'],
    'microfono-inalambrico': ['Genérico.'],
    'parlante-rgb': ['Genérico.'],
    'acefast-llavero-localizador': ['Genérico: marca del nombre del inventario.'],
    'audifonos-lightning': ['Genérico.'],
    'audifonos-inalambricos': ['Genérico: sin datos de marca (el inventario no dice si son originales).'],
    'audifonos': ['Genérico.'],
    'juguetes-coleccionables-cars': ['Genérico.'],
}

cabecera = """<?php

/*
 * Fichas de accesorios (tipo «producto_general») para la tienda: cargadores, vidrios, protectores, fundas, cables y
 * accesorios de marca.
 *
 * - Cada ficha es un TIPO de accesorio, no una unidad: la publicación la toma según el nombre del inventario
 *   (`sistema.detectar`) y reemplaza {modelo} en los textos con el equipo que dice ese nombre. Si se vende, la ficha queda.
 * - Originales de marca con los datos de su página oficial; genéricos con descripción genérica, sin datos que no se
 *   comprueben. Lo que sale de una fuente que no es la marca queda «verificar» en `pendientes`.
 * - Esquema: App\\Support\\FichaTecnica\\EsquemaAccesorio. Textos: TextosAccesorio y ContenidoAccesorio.
 *     php artisan modelos:verificar   ·   php artisan db:seed --class=ModelosReferenciaSeeder
 * - Detalle y fuentes: docs/admin-ui/informes/accesorios-2026-09-15.md.
 * - Los precios NO van aquí: salen del inventario de la tienda.
 * - Generado con herramientas/generar_accesorios.py: no se edita a mano.
 */

return """

if __name__ == '__main__':
    slugs = [m['slug'] for m in MODELOS]
    assert len(slugs) == len(set(slugs)), 'slugs repetidos'
    for m in MODELOS:
        assert m['slug'] in FUENTES, f"{m['slug']} sin fuente"
        assert m['datos']['ficha'], f"{m['slug']} sin ficha"
    salida = cabecera + '[\n' + ''.join('    ' + php(m, 1) + ',\n' for m in MODELOS) + '];\n'
    (Path(__file__).resolve().parents[1] / 'accesorios.php').write_text(salida)
    print(len(MODELOS), 'fichas de accesorios escritas')
