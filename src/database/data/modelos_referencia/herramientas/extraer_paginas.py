"""
Recupera las páginas de comparación de Apple que el usuario pegó en conversaciones de Claude Code y las guarda
como .txt (una por página, nombrada por los modelos que compara), para volver a auditarlas con auditar_iphone.py.

Uso:  python3 extraer_paginas.py carpeta_destino [transcripciones...]
      Sin transcripciones, lee todas las de ~/.claude/projects/*ApplebBoss-Laravel*/*.jsonl
"""
import json
import re
import sys
from pathlib import Path

if len(sys.argv) < 2:
    sys.exit('Uso: python3 extraer_paginas.py carpeta_destino [transcripciones...]')

destino = Path(sys.argv[1])
destino.mkdir(parents=True, exist_ok=True)
fuentes = [Path(p) for p in sys.argv[2:]] or sorted(Path.home().glob('.claude/projects/*ApplebBoss-Laravel*/*.jsonl'))

paginas = {}
for ruta in fuentes:
    for linea in ruta.open(encoding='utf-8'):
        try:
            evento = json.loads(linea)
        except ValueError:
            continue
        if evento.get('type') != 'user':
            continue
        contenido = evento.get('message', {}).get('content')
        textos = [contenido] if isinstance(contenido, str) else [
            parte.get('text', '') for parte in contenido or [] if isinstance(parte, dict) and parte.get('type') == 'text']
        # Un mensaje puede traer varias páginas seguidas: cada una empieza con el aviso de financiación.
        partes = [p for t in textos for p in re.split(r'(?=Paga tu nuevo iPhone a tu ritmo)', t)]
        for texto in partes:
            modelos = re.search(r'modelList=([a-z0-9,-]+)', texto)
            if 'iphone/compare' in texto and modelos:
                clave = modelos.group(1)
                if len(texto) > len(paginas.get(clave, '')):   # si se pegó dos veces, la más completa
                    paginas[clave] = texto

for clave, texto in sorted(paginas.items()):
    archivo = destino / f'pagina_{clave.replace(",", "_")}.txt'
    archivo.write_text(texto, encoding='utf-8')
    print(archivo)
print(len(paginas), 'páginas')
