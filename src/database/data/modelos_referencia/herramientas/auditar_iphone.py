"""
Audita las fichas contra una página de comparación de Apple pegada en un archivo de texto.
Muestra los campos cuyo valor NO aparece en la página: esos deben quedar en pendientes como verificar.
Ojo: la página trae 2 a 4 modelos juntos; un valor puede aparecer por otro modelo (revisar el contexto con grep).

Uso:  python3 auditar_iphone.py pagina.txt "iPhone 16" "iPhone 16 Pro"
"""
import re
import sys
from pathlib import Path
fuente = (Path(__file__).resolve().parent / 'generar_iphone.py').read_text().split('cabecera = ')[0]
ns = {}
exec(fuente, ns)
MODELOS = ns['MODELOS']
CONFIRMADO = ns['CONFIRMADO']   # confirmado fuera de la página (informe con URL oficial): no se marca

PALABRA = {2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco', 6: 'seis', 8: 'ocho', 16: 'dieciséis'}

def num(n):
    return ('%g' % n).replace('.', ',')
def miles(n):
    return f'{n:,}'.replace(',', '.')
def nucleos(n):
    return rf'({n}|{PALABRA.get(n, n)}) núcleos'
def cm(mm):
    return num(round(mm / 10, 3)) + ' cm'
def px(largo, corto):   # Apple escribe «2.868 por 1.320» o, en el plegable, «1.878 por 2.670»
    return rf'({miles(largo)} por {miles(corto)}|{miles(corto)} por {miles(largo)})'

def patrones(d):
    p, r, c, v, f, b, n, s, x, o = (d[k] for k in ['pantalla', 'rendimiento', 'camaras', 'video', 'frontal', 'bateria', 'conectividad', 'seguridad', 'diseno', 'sistema'])
    yield 'pantalla.pulgadas', rf'{num(p["pulgadas"])}(″| pulgadas)'
    yield 'pantalla.nombre', re.escape(p['nombre'])
    yield 'pantalla.px', px(p['px_largo'], p['px_corto'])
    yield 'pantalla.ppi', rf'{p["ppi"]} p/p'
    if p['plegable']: yield 'pantalla.plegable', 'plegable'
    if p['nanotexturizado']: yield 'pantalla.nanotexturizado', 'nanotexturizado'
    if p['exterior_pulgadas']:
        yield 'pantalla.exterior_pulgadas', rf'[Ee]xterior[^\n]{{0,40}}{num(p["exterior_pulgadas"])} pulgadas'
        yield 'pantalla.exterior_px', rf'[Ee]xterior: Resolución de ' + px(p['exterior_px_largo'], p['exterior_px_corto']) + rf' píxeles a {p["exterior_ppi"]} p/p'
    if p['apple_pencil']: yield 'pantalla.apple_pencil', re.escape(p['apple_pencil']).replace('USB\\-C', 'USB.C')
    yield 'pantalla.contraste', re.escape(p['contraste'])
    yield 'pantalla.respuesta_tactil', re.escape(p['respuesta_tactil'])
    yield 'pantalla.brillo_nits', rf'{miles(p["brillo_nits"])} (nits|cd)'
    if p['brillo_hdr_nits']: yield 'pantalla.brillo_hdr_nits', rf'{miles(p["brillo_hdr_nits"])} (nits|cd)'
    if p['brillo_exteriores_nits']: yield 'pantalla.brillo_exteriores_nits', rf'{miles(p["brillo_exteriores_nits"])} nits'
    if p['true_tone']: yield 'pantalla.true_tone', 'True Tone'
    if p['gama_p3']: yield 'pantalla.gama_p3', 'P3'
    if p['promotion']: yield 'pantalla.promotion', 'ProMotion'
    if p['siempre_activa']: yield 'pantalla.siempre_activa', 'siempre activa'
    if p['dynamic_island']: yield 'pantalla.dynamic_island', 'Dynamic Island'
    yield 'rendimiento.chip', re.escape(r['chip'])
    yield 'rendimiento.cpu_nucleos', 'CPU de ' + nucleos(r['cpu_nucleos'])
    yield 'rendimiento.cpu_rendimiento', rf'({r["cpu_rendimiento"]}|{PALABRA[r["cpu_rendimiento"]]}) ' + ('supernúcleos' if r['supernucleos'] else 'de rendimiento')
    if r['neural_engine_doble']: yield 'rendimiento.neural_engine_doble', 'Doble Neural Engine de ' + nucleos(r['neural_engine_nucleos'])
    yield 'rendimiento.gpu_nucleos', 'GPU de ' + nucleos(r['gpu_nucleos'])
    yield 'rendimiento.neural_engine_nucleos', 'Neural Engine de ' + nucleos(r['neural_engine_nucleos'])
    if r['gpu_neural_accelerators']: yield 'rendimiento.gpu_neural_accelerators', 'GPU de ' + nucleos(r['gpu_nucleos']) + ' con Neural Accelerators'
    yield 'camaras.principal_mp', rf'{c["principal_mp"]} (Mpx|MP)'
    if c['ultra_mp']: yield 'camaras.ultra_mp', rf'[Uu]ltra gran angular[^\n]{{0,20}}{c["ultra_mp"]} (Mpx|MP)'
    if c['ultra_fusion']: yield 'camaras.ultra_fusion', 'Ultra gran angular Fusion'
    if c['tele_mp']: yield 'camaras.tele_mp', rf'[Tt]eleobjetivo[^\n]{{0,20}}{c["tele_mp"]} (Mpx|MP)'
    if c['tele_fusion']: yield 'camaras.tele_fusion', 'Teleobjetivo Fusion'
    if c['apertura_variable']: yield 'camaras.apertura_variable', 'Apertura variable de ' + re.escape(c['apertura_variable'])
    if c['controles_pro']: yield 'camaras.controles_pro', 'Controles Pro para la apertura'
    if c['enfoque_inteligente']: yield 'camaras.enfoque_inteligente', 'Enfoque con seguimiento inteligente'
    for func in c['otras_funciones'] or []:
        yield 'camaras.otras_funciones:' + func, re.escape(func)
    yield 'camaras.retrato', re.escape(c['retrato'])
    est = c['estabilizacion']
    yield 'camaras.estabilizacion', ('desplazamiento del sensor' + (' de segunda generación' if 'segunda' in est else '')) if 'desplazamiento' in est else re.escape(est)
    yield 'camaras.flash', re.escape(c['flash'])
    yield 'camaras.hdr_fotos', re.escape(c['hdr_fotos'])
    yield 'camaras.iluminacion_retrato_efectos', rf'({c["iluminacion_retrato_efectos"]}|{PALABRA[c["iluminacion_retrato_efectos"]]}) efectos'
    for k, t in [('modo_noche', 'Modo Noche'), ('deep_fusion', 'Deep Fusion'), ('proraw', 'ProRAW'), ('lidar', 'LiDAR'),
                 ('estilos_fotograficos', 'Estilos Fotográficos'), ('macro', 'macro'), ('photonic_engine', 'Photonic Engine')]:
        if c[k]: yield 'camaras.' + k, t
    if c['superalta_resolucion_mp']: yield 'camaras.superalta_resolucion_mp', 'superalta resolución'
    if r['trazado_rayos']: yield 'rendimiento.trazado_rayos', 'Trazado de rayos'
    if c['fotos_espaciales']: yield 'camaras.fotos_espaciales', 'Fotos espaciales'
    if v['espacial']: yield 'video.espacial', 'vídeo espacial'
    if v['apple_log']: yield 'video.apple_log', re.escape(v['apple_log'])
    if v['aces']: yield 'video.aces', 'ACES'
    if v['prores_raw']: yield 'video.prores_raw', 'ProRes RAW'
    if v['genlock']: yield 'video.genlock', 'Genlock'
    if v['efectos_cine']: yield 'video.efectos_cine', 'Efectos del modo Cine'
    if v['poca_luz']: yield 'video.poca_luz', 'Mejores vídeos con poca luz'
    if v['time_lapse']: yield 'video.time_lapse', 'time.lapse con estabilización ' + re.escape(v['time_lapse'])
    if n['thread']: yield 'conectividad.thread', 'Thread'
    if x['boton_accion']: yield 'diseno.boton_accion', 'Botón Acción'
    if o['apple_intelligence']: yield 'sistema.apple_intelligence', 'Apple Intelligence'
    if c['tele_mp']: yield 'camaras.zoom_optico_max', 'x' + num(c['zoom_optico_max'])
    if p['brillo_minimo_nits']: yield 'pantalla.brillo_minimo_nits', rf'[Bb]rillo mínimo de {p["brillo_minimo_nits"]} nit'
    if c['fusion']: yield 'camaras.fusion', 'Fusion'
    if c['estilos_fotograficos']: yield 'camaras.estilos_fotograficos', re.escape(c['estilos_fotograficos'])
    if v['audio_espacial']: yield 'video.audio_espacial', 'Audio espacial'
    if v['reduccion_viento']: yield 'video.reduccion_viento', 'ruido del viento'
    if v['mezcla_audio']: yield 'video.mezcla_audio', 'Mezcla de Audio'
    if b['carga_rapida_magsafe_w']: yield 'bateria.carga_rapida_magsafe_w', rf'adaptador de {b["carga_rapida_magsafe_w"]} W(\]\([^)]*\))? ?o superior y un cargador MagSafe'
    if x['control_camara']: yield 'diseno.control_camara', 'Control de Cámara'
    if c['estabilizacion_tele']: yield 'camaras.estabilizacion_tele', 'sensor en 3D'
    if v['microfonos_estudio']: yield 'video.microfonos_estudio', 'Cuatro micrófonos'
    yield 'conectividad.conector', n['conector'].replace('-', '.')
    yield 'conectividad.usb', re.escape(n['usb'].split(' hasta')[0])
    yield 'video.camara_lenta', re.escape(v['camara_lenta'].replace('fps', 'f/s'))
    if v['quicktake']: yield 'video.quicktake', 'QuickTake'
    if v['audio_estereo']: yield 'video.audio_estereo', 'estéreo'
    if v['dolby_vision_fps']: yield 'video.dolby_vision_fps', rf'Dolby Vision.{{0,30}}{v["dolby_vision_fps"]} f/s|{v["dolby_vision_fps"]} f/s.{{0,30}}Dolby Vision'
    if v['modo_cine']: yield 'video.modo_cine', 'Modo Cine'
    if v['modo_accion']: yield 'video.modo_accion', 'Modo Acción'
    if v['captura_dual']: yield 'video.captura_dual', rf'Captura Dual \(hasta 4K[^)]{{0,30}}{re.search(r"(\d+) fps", v["captura_dual"]).group(1)} f/s\)'
    if v['prores']: yield 'video.prores', 'ProRes'
    yield 'frontal.mp', rf'{f["mp"]} (Mpx|MP)'
    yield 'frontal.nombre', re.escape(f['nombre'])
    yield 'frontal.retrato', re.escape(f['retrato'])
    if f['encuadre_centrado']: yield 'frontal.encuadre_centrado', 'Encuadre Centrado para fotos'
    if f['video_ultraestabilizado']: yield 'frontal.video_ultraestabilizado', '[Vv]ídeo ultraestabilizado'
    for func in f['otras_funciones'] or []:
        yield 'frontal.otras_funciones:' + func, re.escape(func)
    if f['bajo_pantalla']: yield 'frontal.bajo_pantalla', 'Cámara FaceTime bajo la pantalla'
    if f['modo_cine']: yield 'frontal.modo_cine', 'Modo Cine hasta 4K' if '4K' in f['modo_cine'] else 'Modo Cine'
    if f['prores']: yield 'frontal.prores', 'ProRes ' + re.escape(f['prores'].replace('fps', 'f/s')) if 'externa' in f['prores'] else 'ProRes'
    if f['enfoque_inteligente']: yield 'frontal.enfoque_inteligente', 'Enfoque con seguimiento inteligente'
    if f['efectos_cine']: yield 'frontal.efectos_cine', 'Efectos del modo Cine'
    if f['poca_luz']: yield 'frontal.poca_luz', 'Mejores vídeos con poca luz'
    if f['time_lapse']: yield 'frontal.time_lapse', 'time.lapse con estabilización ' + re.escape(f['time_lapse'])
    if f['camara_lenta']: yield 'frontal.camara_lenta', re.escape(f['camara_lenta'].replace('fps', 'f/s'))
    if f['estabilizacion_cine']: yield 'frontal.estabilizacion_cine', 'calidad de cine'
    yield 'bateria.video_h', rf'[Hh]asta {b["video_h"]} horas'
    if b['streaming_h']: yield 'bateria.streaming_h', rf'[Ss]treaming.{{0,40}}{b["streaming_h"]} horas'
    yield 'bateria.carga_rapida', rf'50 % (de carga )?en (unos )?{re.search(r"(\d+) min", b["carga_rapida"]).group(1)} minutos'
    yield 'bateria.carga_rapida_w', rf'adaptador (de )?{b["carga_rapida_w"]} W'
    if b['carga_rapida_voltaje_ajustable']: yield 'bateria.carga_rapida_voltaje_ajustable', 'fuente de voltaje ajustable'
    if b['doble']: yield 'bateria.doble', 'Doble batería'
    if b['video_exterior_h']: yield 'bateria.video_exterior_h', rf'{b["video_exterior_h"]} horas[^\n]{{0,60}}exterior'
    if b['streaming_exterior_h']: yield 'bateria.streaming_exterior_h', rf'{b["streaming_exterior_h"]} horas en la pantalla exterior'
    if b['carga_rapida_magsafe']:
        yield 'bateria.carga_rapida_magsafe', rf'50 % (de carga )?en (unos )?{re.search(r"(\d+) min", b["carga_rapida_magsafe"]).group(1)} minutos[^\n]{{0,450}}cargador MagSafe'
    if b['qi_w']: yield 'bateria.qi_w', num(b['qi_w']) + ' W'
    if b['magsafe_w']: yield 'bateria.magsafe_w', rf'{b["magsafe_w"]} W'
    if b['qi2']: yield 'bateria.qi2', 'Qi2'
    if n['cinco_g']: yield 'conectividad.cinco_g', re.escape(n['cinco_g']).replace('sub\\-6', 'sub.6')
    yield 'conectividad.lte', re.escape(n['lte'])
    yield 'conectividad.wifi', n['wifi'].replace('‑', '.')
    yield 'conectividad.bluetooth', 'Bluetooth ' + re.escape(n['bluetooth'])
    yield 'conectividad.nfc', 'NFC con modo (de )?lectura'
    if n['uwb']: yield 'conectividad.uwb', re.escape(n['uwb'])
    yield 'conectividad.gnss', re.escape(n['gnss'])
    yield 'conectividad.tarjetas_expres', 'reserva de batería' if 'reserva' in n['tarjetas_expres'] else '[Tt]arjetas exprés|Express'
    yield 'conectividad.sim', 'eSIM' if n['esim'] else 'Nano.SIM'
    yield 'seguridad.biometria', re.escape(s['biometria'].split(' (')[0])
    if s['emergencia_sos']: yield 'seguridad.emergencia_sos', 'Emergencia SOS'
    yield 'diseno.estructura', '(?i)' + re.escape(x['estructura'])
    yield 'diseno.frente', re.escape(x['frente']) if x['frente'].startswith('Ceramic Shield') else '(?i)vidrio'
    yield 'diseno.dorso', ('(?i)(parte trasera|parte posterior|trasera|posterior).{0,40}vidrio|vidrio.{0,40}(trasera|posterior)' if x['dorso'] == 'vidrio'
                           else '(?i)(parte trasera|parte posterior).{0,10}' + re.escape(x['dorso']))
    yield 'diseno.ip', rf'{x["ip"]}.{{0,80}}{x["ip_metros"]} metro'
    yield 'diseno.alto_mm', cm(x['alto_mm'])
    yield 'diseno.ancho_mm', cm(x['ancho_mm'])
    yield 'diseno.grosor_mm', cm(x['grosor_mm'])
    if x['abierto_ancho_mm']: yield 'diseno.abierto_ancho_mm', cm(x['abierto_ancho_mm']) + ' abierto'
    if x['abierto_grosor_mm']: yield 'diseno.abierto_grosor_mm', cm(x['abierto_grosor_mm']) + ' abierto'
    yield 'diseno.peso_g', rf'{x["peso_g"]} g'
    for col in x['colores']:
        yield 'diseno.colores:' + col, '(?i)' + re.escape(col).replace(r'\(PRODUCT\)RED', r'\(?PRODUCT\)? ?RED')
    for gb in x['capacidades_gb']:
        yield f'diseno.capacidades_gb:{gb}', f'{gb // 1024} TB' if gb >= 1024 else f'{gb} GB'
    yield 'sistema.anio', str(o['anio'])
    yield 'sistema.ios_lanzamiento', re.escape(o['ios_lanzamiento'])
    if o['ios_maximo']: yield 'sistema.ios_maximo', re.escape(o['ios_maximo'])
    for nm in o['numeros_modelo'] or []:
        yield 'sistema.numeros_modelo:' + nm, nm

if len(sys.argv) < 3:
    sys.exit('Uso: python3 auditar_iphone.py pagina.txt "iPhone 16" ["iPhone 16 Pro" ...]')

texto = Path(sys.argv[1]).read_text().replace('\xad', '')
por_nombre = {m['nombre']: m for m in MODELOS}
for nombre in sys.argv[2:]:
    if nombre not in por_nombre:
        sys.exit(f'No existe «{nombre}» en generar_iphone.py')
    faltan = [campo for campo, rx in patrones(por_nombre[nombre]['datos'])
              if (nombre, campo.split(':')[0]) not in CONFIRMADO and not re.search(rx, texto)]
    print(f'{nombre:28} {", ".join(faltan) or "—"}')
