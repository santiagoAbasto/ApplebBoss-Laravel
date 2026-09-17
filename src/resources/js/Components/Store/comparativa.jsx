import { camposDeFamilia, gruposFicha } from '@/Components/Store/fichaTecnica';
import { partesDe } from '@/Components/Store/textoFicha';

// Los helpers de texto viven en textoFicha.js (los comparte la ficha del producto); se reexportan por comodidad.
export { conMayuscula, formatoDe, partesDe, partir } from '@/Components/Store/textoFicha';

// Qué muestra la comparativa pública de modelos. Sale de la ficha técnica (mismos grupos, etiquetas, íconos y ayudas):
// se quita lo que depende de un equipo en particular y se suma lo que ofrece el modelo (memorias, almacenamientos y
// colores con que salió). Cada tipo define lo que puede no tener (NO_TIENE) y lo que va arriba (ESENCIAL).

/** Datos de la unidad a la venta, no del modelo. En un accesorio, «Compatible con» sale del nombre de cada artículo. */
const DEL_EQUIPO = ['salud_bateria', 'ciclos_bateria', 'sistema_operativo', 'modelo_compatible', 'color', 'coleccion'];

/** Datos de la unidad que, en la comparativa, pasan a ser lo que ofrece el modelo. */
const COLORES = { key: 'colores_disponibles', label: 'Colores', ayuda: 'Colores con los que salió a la venta.' };
const DEL_MODELO = {
  celular: {
    capacidad: { key: 'capacidades_disponibles', label: 'Capacidades', ayuda: 'Almacenamiento con el que salió a la venta.' },
    almacenamiento: { key: 'capacidades_disponibles', label: 'Capacidades', ayuda: 'Almacenamiento con el que salió a la venta.' },
    color: COLORES,
  },
  producto_apple: {
    color: COLORES,
  },
  computadora: {
    ram: { key: 'memorias_disponibles', label: 'Memoria RAM', ayuda: 'Memorias con las que salió a la venta.' },
    almacenamiento: { key: 'almacenamientos_disponibles', label: 'Almacenamiento', ayuda: 'Almacenamientos con los que salió a la venta.' },
    color: COLORES,
  },
};

/** Lo que un modelo puede no tener: la celda vacía lo dice. En el resto, un guion. */
const NO_TIENE = {
  celular: {
    camara_ultra: 'No tiene', teleobjetivo: 'No tiene', lidar: 'No tiene', banda_ultraancha: 'No tiene', thread: 'No tiene',
    boton_accion: 'No tiene', control_camara: 'No tiene', apple_intelligence: 'No compatible',
  },
  computadora: {
    tasa_refresco: 'Sin ProMotion', neural_engine: 'No tiene', ancho_banda: 'No lo publica', apple_intelligence: 'No compatible',
    autonomia: 'Sin batería (de escritorio)', bateria_wh: 'Sin batería', carga: 'Se conecta a la corriente', ethernet: 'No tiene',
    thread: 'No tiene', biometria: 'No tiene',
  },
  // Accesorios: lo que un original publica y un genérico no («No lo informa»), y lo que de verdad no tiene
  producto_general: {
    potencia_maxima: 'No tiene', salidas: 'No lo informa', protocolos: 'No lo informa', entrada: 'No lo informa',
    cable: 'No lo informa', normas: 'No lo informa', pruebas: 'Sin pruebas publicadas', filtro: 'Sin filtro',
    endurecido: 'No lo informa', dureza: 'No lo informa', recubrimiento: 'No lo informa', instalacion: 'A mano, sin guía',
    fabricante: 'No lo informa',
  },
};

/**
 * Lo esencial de cada modelo, arriba de la tabla. `corto(valor, contexto)` resume el valor; el contexto trae
 * `versionActual`, la versión de iOS más nueva de la base (la que reciben los modelos que todavía se actualizan).
 */
const ESENCIAL = {
  celular: [
    { key: 'tamano_pantalla', label: 'Pantalla', sub: 'tasa_refresco' },
    { key: 'chip', label: 'Chip' },
    { key: 'sistema_camaras', label: 'Cámaras', sub: 'zoom_optico', subTexto: (v) => `Zoom óptico: ${v}` },
    { key: 'autonomia', label: 'Batería', corto: (v) => {
      const horas = v.match(/hasta (\d+(?:,\d+)?) h de reproducción de video/i)?.[1];
      return horas ? `Hasta ${horas} h de video` : v;
    } },
    { key: 'biometria', label: 'Desbloqueo' },
    { key: 'ultimo_ios', label: 'Actualizaciones', corto: (v, { versionActual } = {}) => (
      v === versionActual ? `Recibe ${v}, la versión actual` : `Se quedó en ${v}`
    ) },
    { key: 'apple_intelligence', label: 'Apple Intelligence', corto: () => 'Compatible', vacio: 'No compatible' },
  ],
  computadora: [
    { key: 'tamano_pantalla', label: 'Pantalla', sub: 'pantalla' },
    // En las Intel el chip ya dice la CPU; en las de Apple, debajo van sus núcleos
    { key: 'chip', label: 'Chip', sub: 'cpu_cores', subTexto: (v) => (/intel/i.test(v) ? null : `CPU de ${partesDe(v).join(' o ')}`) },
    { key: 'memorias_disponibles', label: 'Memoria RAM', corto: (v) => enumerar([].concat(v)) },
    { key: 'autonomia', label: 'Batería', vacio: 'Sin batería (de escritorio)', corto: (v) => {
      const horas = v.match(/hasta (\d+(?:,\d+)?) h de reproducción de video/i)?.[1];
      return horas ? `Hasta ${horas} h de video` : v;
    } },
    { key: 'peso', label: 'Peso' },
    { key: 'ultimo_so', label: 'Actualizaciones', corto: (v, { versionActual } = {}) => (
      v === versionActual ? `Recibe ${v}, la versión actual` : `Se quedó en ${v}`
    ) },
    { key: 'apple_intelligence', label: 'Apple Intelligence', corto: () => 'Compatible', vacio: 'No compatible' },
  ],
  // Productos Apple (iPad, Apple Watch, AirPods…): lo que sirve para cualquiera de sus tipos; lo que un tipo no tiene, «—»
  producto_apple: [
    { key: 'chip', label: 'Chip', corto: (v) => partesDe(v)[0] },
    { key: 'autonomia', label: 'Batería', corto: (v) => partesDe(v)[0] },
    { key: 'carga', label: 'Carga', corto: (v) => partesDe(v)[0] },
    { key: 'peso', label: 'Peso', corto: (v) => partesDe(v)[0] },
    { key: 'generacion', label: 'Año' },
  ],
  // Laptops con Windows (familia «pc»): lo que más se mira en una gamer. Sin nada de Apple.
  pc: [
    { key: 'tamano_pantalla', label: 'Pantalla', sub: 'tasa_refresco' },
    { key: 'chip', label: 'Procesador', sub: 'cpu_cores', subTexto: (v) => partesDe(v)[0] },
    { key: 'gpu', label: 'Tarjeta gráfica' },
    { key: 'memorias_disponibles', label: 'Memoria RAM', corto: (v) => enumerar([].concat(v)) },
    { key: 'autonomia', label: 'Batería' },
    { key: 'peso', label: 'Peso' },
  ],
  // Cargadores: lo primero que se pregunta al elegir entre el original y el certificado
  cargador: [
    { key: 'fabricante', label: 'Fabricante', vacio: 'No lo informa' },
    { key: 'potencia', label: 'Potencia', sub: 'potencia_maxima', subTexto: (v) => partesDe(v)[0] },
    { key: 'carga_rapida', label: 'Carga rápida', corto: (v) => partesDe(v)[0] },
    { key: 'puerto', label: 'Conector' },
  ],
  // Vidrios templados: de qué están hechos y cuánto protegen
  vidrio: [
    { key: 'material', label: 'Material' },
    { key: 'proteccion', label: 'Protección' },
    { key: 'filtro', label: 'Filtro', vacio: 'Sin filtro' },
  ],
};

/** ['16 GB', '24 GB', '32 GB'] → «16 GB, 24 GB o 32 GB» */
const enumerar = (l) => (l.length > 1 ? `${l.slice(0, -1).join(', ')} o ${l[l.length - 1]}` : (l[0] ?? ''));

/** Una lista más larga que esto se muestra resumida, con «Ver la lista completa». */
export const LIMITE_LISTA = 6;

/** Grupos y filas de la comparativa. Con familia («mac», «pc», «cargador»…), solo sus campos: la Mac no lleva «Tarjeta gráfica». */
export function seccionesComparativa(tipo, familia = null) {
  const vistos = new Set();
  return gruposFicha(tipo)
    .map((g) => ({
      ...g,
      campos: camposDeFamilia(g, familia)
        .filter((c) => !DEL_EQUIPO.includes(c.key))
        .map((c) => (DEL_MODELO[tipo]?.[c.key] ? { ...c, ...DEL_MODELO[tipo][c.key] } : c))
        .filter((c) => !vistos.has(c.key) && vistos.add(c.key)),
    }))
    .filter((g) => g.campos.length);
}

export const noTiene = (tipo, key) => NO_TIENE[tipo]?.[key] ?? null;

/** Lo esencial de la familia si tiene el suyo (PC, cargadores, vidrios); si no, el de su tipo. */
export function esencialesDe(tipo, familia = null) {
  const campos = seccionesComparativa(tipo, familia).flatMap((g) => g.campos);
  return (ESENCIAL[familia] ?? ESENCIAL[tipo] ?? [])
    .map((e) => ({ ...e, campo: campos.find((c) => c.key === e.key) }))
    .filter((e) => e.campo);
}

/** Para «Solo diferencias»: dos valores iguales comparan igual aunque uno sea lista y otro texto. */
export const clave = (valor) => partesDe(valor).join('|').toLowerCase();
