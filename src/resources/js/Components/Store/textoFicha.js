// Cómo se leen los textos de la ficha técnica («A · B» es una lista; «…; aviso» lleva una nota). Lo usan la ficha
// del producto (fichaTecnica.jsx) y la comparativa (comparativa.jsx).

/** Parte un texto por el separador, pero no dentro de paréntesis: «1.000 nits (1.600 en HDR · 3.000 en exteriores)» es una sola parte. */
export function partir(texto, separador) {
  const partes = [];
  let actual = '';
  let nivel = 0;
  for (let i = 0; i < texto.length; i += 1) {
    if (nivel === 0 && texto.startsWith(separador, i)) {
      partes.push(actual);
      actual = '';
      i += separador.length - 1;
      continue;
    }
    if (texto[i] === '(') nivel += 1;
    if (texto[i] === ')') nivel = Math.max(0, nivel - 1);
    actual += texto[i];
  }
  partes.push(actual);
  return partes.map((p) => p.trim()).filter(Boolean);
}

/** Valor para mostrar: listas como lista, textos largos partidos por « · ». */
export function partesDe(valor) {
  if (valor === null || valor === undefined || valor === '') return [];
  if (Array.isArray(valor)) return valor.map(String);
  return partir(String(valor), ' · ');
}

/** «cámara lenta a 240 fps» → «Cámara lenta a 240 fps»; respeta marcas que empiezan en minúscula (iOS, eSIM, mmWave). */
export const conMayuscula = (texto) => (/^[a-z]+[A-Z]/.test(texto) ? texto : texto.charAt(0).toUpperCase() + texto.slice(1));

/**
 * Cómo se lee un valor. Por omisión, un texto con « · » es una lista con viñetas. «principal»: la primera parte es el
 * dato y el resto, su detalle («IP68» y debajo «hasta 6 m durante 30 min»).
 */
const FORMATO = {
  resistencia: 'principal',
};

export const formatoDe = (key) => FORMATO[key] ?? 'lista';
