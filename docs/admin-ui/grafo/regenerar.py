#!/usr/bin/env python3
"""Regenera el grafo de graphify (docs/admin-ui/grafo/graphify-out) sin gastar tokens.

Copia cada archivo de mapa-fuentes.json (ruta corta del grafo → ruta real en el repo) a grafo/fuente/, corre
`graphify update fuente` y deja el resultado en graphify-out/, sin la carpeta fuente/, el manifest ni la caché.
Si graphify falla, vuelve a dejar el grafo anterior. Para sumar un archivo al grafo, agregarlo al mapa con su ruta
corta (por ejemplo "Support/EsquemaComputadora.php"). No toca nada fuera de docs/admin-ui/grafo/.

Uso, desde la raíz del repo: python3 docs/admin-ui/grafo/regenerar.py
"""
import json
import shutil
import subprocess
import sys
from pathlib import Path

GRAFO = Path(__file__).resolve().parent
RAIZ = GRAFO.parents[2]
FUENTE = GRAFO / 'fuente'
SALIDA = GRAFO / 'graphify-out'


def main():
    mapa = json.loads((GRAFO / 'mapa-fuentes.json').read_text())
    faltan = [real for real in mapa.values() if not (RAIZ / real).is_file()]
    if faltan:
        sys.exit('No existen: ' + ', '.join(faltan))
    graphify = shutil.which('graphify') or str(Path.home() / '.local/bin/graphify')

    shutil.rmtree(FUENTE, ignore_errors=True)
    for corto, real in mapa.items():
        destino = FUENTE / corto
        destino.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(RAIZ / real, destino)
    if SALIDA.exists():
        shutil.move(str(SALIDA), str(FUENTE / 'graphify-out'))

    try:
        subprocess.run([graphify, 'update', 'fuente'], cwd=GRAFO, check=True)
    finally:
        # graphify deja un graphify-out con solo su caché: se borra antes de mover el resultado
        shutil.rmtree(SALIDA, ignore_errors=True)
        if (FUENTE / 'graphify-out').exists():
            shutil.move(str(FUENTE / 'graphify-out'), str(SALIDA))
        shutil.rmtree(FUENTE, ignore_errors=True)
        (SALIDA / 'manifest.json').unlink(missing_ok=True)
        for cache in [c for c in SALIDA.rglob('cache') if c.is_dir()]:
            shutil.rmtree(cache, ignore_errors=True)

    grafo = json.loads((SALIDA / 'graph.json').read_text())
    archivos = {n.get('source_file') for n in grafo['nodes'] if n.get('source_file')}
    aristas = grafo.get('links', grafo.get('edges', []))
    print(f"{len(grafo['nodes'])} nodos · {len(aristas)} aristas · {len(archivos)} archivos")


if __name__ == '__main__':
    main()
