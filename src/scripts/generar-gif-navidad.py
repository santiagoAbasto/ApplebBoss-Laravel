#!/usr/bin/env python3
"""Genera public/images/correo/navidad-trineo.gif: el banner animado de los correos de Navidad.

Los clientes de correo no animan CSS (solo Apple Mail), así que el movimiento va en un GIF: el trineo con los renos
cruza un paisaje de pinos mientras parpadean las luces. Los dibujos son los mismos de la web
(resources/js/Components/Temporada/Personajes.jsx), escritos acá como SVG plano.

Uso:  python3 scripts/generar-gif-navidad.py      (necesita rsvg-convert e ImageMagick)
"""
import math, os, subprocess, tempfile

PINO, PINO_CLARO, BURDEOS, BURDEOS_OSC = '#143D2B', '#1F5A40', '#A42635', '#7E1B28'
ORO, ORO_CLARO, MARFIL, PIEL, TINTA = '#B88A44', '#E2BC72', '#FFF8EE', '#F2C9A5', '#2A1B14'
PELAJE, PELAJE_CLARO, PELAJE_OSC = '#9A6B45', '#C9A27A', '#6B4A2B'
ANCHO, ALTO, CUADROS = 560, 124, 40
DESTELLO = 'M12 0C13 7 17 11 24 12C17 13 13 17 12 24C11 17 7 13 0 12C7 11 11 7 12 0Z'


def pata(x1, y1, x2, y2, grados):
    return f'<path d="M{x1} {y1}L{x2} {y2}" transform="rotate({grados:.1f} {x1} {y1})"/>'


def reno(x, fase, guia=False):
    a = 18 * math.sin(fase)
    salto = -2.2 * abs(math.sin(fase))
    nariz = BURDEOS if guia else TINTA
    return f'''<g transform="translate({x} {salto:.1f})">
      <g fill="none" stroke="{PELAJE_OSC}" stroke-width="3.4" stroke-linecap="round">
        {pata(12, 60, 7, 78, a)}{pata(19, 61, 22, 78, -a)}{pata(40, 60, 36, 78, -a)}{pata(46, 59, 52, 77, a)}
        <path d="M58 26C57 18 53 14 48 11M56 19C53 19 50 17 47 18M61 25C63 18 67 14 72 12M63 19C66 18 69 16 72 17" stroke-width="2.6"/>
      </g>
      <ellipse cx="29" cy="52" rx="22" ry="11" fill="{PELAJE}"/><path d="M44 48L54 30L64 34L54 56Z" fill="{PELAJE}"/>
      <ellipse cx="62" cy="33" rx="10" ry="8" fill="{PELAJE}"/><ellipse cx="69" cy="36" rx="6" ry="5" fill="{PELAJE_CLARO}"/>
      <circle cx="74" cy="35" r="3.6" fill="{nariz}"/><circle cx="62" cy="30" r="1.8" fill="{TINTA}"/>
      <path d="M46 44Q51 50 57 46" stroke="{BURDEOS}" stroke-width="4" stroke-linecap="round" fill="none"/><circle cx="52" cy="50" r="2.4" fill="{ORO_CLARO}"/>
    </g>'''


def trineo(fase):
    sube = -1.5 * math.sin(fase / 2)
    return f'''<path d="M96 52Q140 58 176 46Q214 56 248 46" fill="none" stroke="{ORO}" stroke-width="1.6"/>
    <g transform="translate(0 {sube:.1f})">
      <path d="M6 78H86C97 78 102 71 102 62" fill="none" stroke="{ORO_CLARO}" stroke-width="4" stroke-linecap="round"/>
      <path d="M24 78V66M72 78V66" stroke="{ORO}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="26" cy="34" r="17" fill="{PINO_CLARO}"/>
      <rect x="14" y="18" width="13" height="12" rx="2" fill="#FFFFFF" transform="rotate(-14 20 24)"/><rect x="30" y="14" width="12" height="12" rx="2" fill="{ORO_CLARO}" transform="rotate(10 36 20)"/>
      <path d="M46 62C46 44 52 36 62 36C72 36 78 44 78 62Z" fill="{BURDEOS}"/><circle cx="63" cy="27" r="10" fill="{PIEL}"/>
      <path d="M54 27C53 38 58 43 64 43C70 43 74 38 73 28C70 32 60 32 54 27Z" fill="#FFFFFF"/>
      <path d="M53 21C54 12 62 8 70 11C75 13 78 18 79 24L72 22C68 18 60 19 53 21Z" fill="{BURDEOS}"/>
      <rect x="51" y="19" width="23" height="5" rx="2.5" fill="#FFFFFF"/><circle cx="80" cy="25" r="3.4" fill="#FFFFFF"/><circle cx="67" cy="26" r="1.5" fill="{TINTA}"/>
      <path d="M72 46L92 52" stroke="{BURDEOS}" stroke-width="8" stroke-linecap="round"/><circle cx="95" cy="52" r="5" fill="{PINO_CLARO}"/>
      <path d="M4 40C4 58 12 66 28 66H84C92 66 96 60 96 52V46H80V54H36C28 54 22 48 20 40Z" fill="{BURDEOS_OSC}"/>
      <path d="M8 44C10 56 16 62 28 62H84" fill="none" stroke="{ORO_CLARO}" stroke-width="2" stroke-linecap="round"/>
    </g>'''


def pino(x, y, s, claro, encendida):
    c = PINO_CLARO if claro else PINO
    luz = lambda on: 1 if on else 0.25
    return f'''<g transform="translate({x} {y}) scale({s})"><rect x="-3" y="34" width="6" height="8" fill="{PELAJE_OSC}"/>
      <path d="M0 0L16 22H-16Z" fill="{c}"/><path d="M0 12L20 38H-20Z" fill="{c}"/>
      <circle cx="-6" cy="28" r="2.4" fill="{ORO_CLARO}" opacity="{luz(encendida)}"/><circle cx="7" cy="18" r="2.4" fill="{BURDEOS}" opacity="{luz(not encendida)}"/>
      <path d="{DESTELLO}" fill="{ORO_CLARO}" transform="translate(-5 -11) scale(.42)" opacity="{luz(encendida)}"/></g>'''


def cuadro(f):
    t = f / CUADROS
    fase = 2 * math.pi * f / 5                      # galope: un ciclo cada 5 cuadros
    x = -150 + t * (ANCHO + 170)                    # el trineo entra por la izquierda y sale por la derecha
    turno = (f // 5) % 2 == 0                       # las luces alternan cada 5 cuadros
    colores = [ORO_CLARO, BURDEOS, '#FFFFFF', PINO_CLARO]
    focos = ''
    for i in range(10):
        fx = 28 + i * 56
        prendido = (i % 2 == 0) == turno
        color = colores[i % 4]
        focos += f'<rect x="{fx - 2.5}" y="9" width="5" height="4" rx="1" fill="{PINO}"/>'
        if prendido:
            focos += f'<circle cx="{fx}" cy="19" r="9" fill="{color}" opacity=".25"/>'
        focos += f'<ellipse cx="{fx}" cy="19" rx="4.6" ry="6.2" fill="{color}" opacity="{1 if prendido else 0.3}" stroke="{PINO}" stroke-width=".5"/>'
    estrellas = ''.join(
        f'<path d="{DESTELLO}" fill="{ORO_CLARO}" transform="translate({sx} {sy}) scale({ss})" opacity="{1 if ((i % 2 == 0) == turno) else 0.3}"/>'
        for i, (sx, sy, ss) in enumerate([(70, 34, .5), (210, 40, .36), (330, 30, .46), (470, 38, .4), (520, 52, .3)]))
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="{ANCHO}" height="{ALTO}" viewBox="0 0 {ANCHO} {ALTO}">
  <rect width="{ANCHO}" height="{ALTO}" fill="{MARFIL}"/>
  <path d="M0 6Q28 22 56 6T112 6T168 6T224 6T280 6T336 6T392 6T448 6T504 6T560 6" fill="none" stroke="{PINO}" stroke-width="1.6"/>
  {focos}{estrellas}
  <path d="M0 {ALTO}V92Q70 70 140 88T280 84T420 90T560 78V{ALTO}Z" fill="{PINO_CLARO}" opacity=".3"/>
  {pino(40, 62, .95, False, turno)}{pino(74, 72, .7, True, not turno)}{pino(250, 66, .8, True, turno)}
  {pino(404, 62, .9, False, not turno)}{pino(436, 74, .65, True, turno)}{pino(528, 58, 1.0, False, turno)}
  <g transform="translate({x:.1f} 30) scale(.5)">{trineo(fase)}{reno(118, fase + 1.6)}{reno(196, fase, True)}</g>
  <path d="M0 {ALTO}V106Q100 92 200 104T400 102T560 98V{ALTO}Z" fill="{PINO}"/>
  <g transform="translate(110 96)"><rect y="5" width="18" height="13" rx="2" fill="{BURDEOS}"/><rect x="-2" y="2" width="22" height="5" rx="2" fill="{BURDEOS_OSC}"/><rect x="7" y="2" width="4" height="16" fill="{ORO_CLARO}"/></g>
  <g transform="translate(476 94)"><rect y="5" width="18" height="13" rx="2" fill="#FFFFFF"/><rect x="-2" y="2" width="22" height="5" rx="2" fill="#EADFCB"/><rect x="7" y="2" width="4" height="16" fill="{BURDEOS}"/></g>
</svg>'''


def main():
    destino = os.path.join(os.path.dirname(__file__), '..', 'public', 'images', 'correo', 'navidad-trineo.gif')
    with tempfile.TemporaryDirectory() as tmp:
        pngs = []
        for f in range(CUADROS):
            svg, png = os.path.join(tmp, f'{f:03d}.svg'), os.path.join(tmp, f'{f:03d}.png')
            open(svg, 'w').write(cuadro(f))
            subprocess.run(['rsvg-convert', '-w', str(int(ANCHO * 1.5)), svg, '-o', png], check=True)   # a 1,5x: nítido en retina sin pesar de más
            pngs.append(png)
        subprocess.run(['magick', '-delay', '8', '-loop', '0', *pngs, '-colors', '40', '-layers', 'Optimize', destino], check=True)
    print(os.path.abspath(destino), os.path.getsize(destino) // 1024, 'KB')


if __name__ == '__main__':
    main()
