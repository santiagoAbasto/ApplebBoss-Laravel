"""
Genera public/sbadmin/css/sb-admin-2.compat.min.css a partir de sb-admin-2.min.css.

SB Admin (Bootstrap 4) trae utilidades con los MISMOS nombres que Tailwind pero otros valores y con
!important (p-5 = 3rem, mb-4 = 1.5rem, shadow, border, rounded, text-xs, text-gray-*…). Como se carga
después de Tailwind, pisa el diseño de todas las pantallas nuevas del panel.

Esta copia quita solo esas utilidades repetidas; las clases propias de Bootstrap (card, btn, form-control,
row/col, d-flex, justify-content-*, font-weight-*, text-primary…) se mantienen.

Uso:  python3 scripts/sbadmin-compat.py
"""
import re
from pathlib import Path

SRC = Path('public/sbadmin/css/sb-admin-2.min.css')
OUT = Path('public/sbadmin/css/sb-admin-2.compat.min.css')

CHOCAN = re.compile(r'^\.(?:'
    r'[mp][trblxy]?-(?:0|1|2|3|4|5|auto)'                 # espaciado
    r'|shadow(?:-sm|-lg|-none)?'                          # sombras
    r'|border(?:-0)?'                                     # borde base
    r'|rounded(?:-sm|-lg)?'                               # radios
    r'|text-(?:xs|sm|lg|xl|left|right|center|white|nowrap)'
    r'|text-gray-\d{3}|bg-gray-\d{3}|bg-white|bg-transparent'
    r'|visible|invisible|overflow-(?:auto|hidden)|float-(?:left|right|none)'
    r'|flex-(?:wrap|nowrap|row|row-reverse|wrap-reverse)'
    r'|align-(?:baseline|top|middle|bottom|text-top|text-bottom)|[wh]-auto'
    r')$')


def filtrar(css: str) -> tuple[str, int]:
    out, i, quitadas = [], 0, 0
    while i < len(css):
        j = css.find('{', i)
        if j == -1:
            out.append(css[i:]); break
        selector = css[i:j].strip()
        # Buscar la llave que cierra este bloque (puede haber anidados en @media)
        depth, k = 1, j + 1
        while depth and k < len(css):
            depth += {'{': 1, '}': -1}.get(css[k], 0)
            k += 1
        cuerpo = css[j + 1:k - 1]

        if selector.startswith(('@media', '@supports')):
            interno, q = filtrar(cuerpo)
            quitadas += q
            if interno.strip():
                out.append(f'{selector}{{{interno}}}')
        elif selector.startswith('@'):
            out.append(f'{selector}{{{cuerpo}}}')
        else:
            partes = [s for s in selector.split(',')]
            quedan = [s for s in partes if not CHOCAN.match(s.strip())]
            quitadas += len(partes) - len(quedan)
            if quedan:
                out.append(f"{','.join(quedan)}{{{cuerpo}}}")
        i = k
    return ''.join(out), quitadas


css = SRC.read_text(encoding='utf-8')
limpio, quitadas = filtrar(css)
OUT.write_text('/* Generado por scripts/sbadmin-compat.py: SB Admin sin las utilidades que chocan con Tailwind. No editar a mano. */\n' + limpio, encoding='utf-8')
print(f'{quitadas} selectores quitados · {len(css)//1024} KB → {len(limpio)//1024} KB')
