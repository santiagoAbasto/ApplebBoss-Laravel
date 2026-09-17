// Muestras de color de la comparativa. Apple no publica códigos de color: estos tonos son aproximados y solo
// acompañan al nombre oficial (que es el dato). La página lo aclara en la nota al pie.

/** Tono de cada nombre de color. */
const TONOS = {
  'Negro': '#2E2F31',
  'Blanco': '#F5F4F0',
  'Plata': '#E4E4E2',
  'Oro': '#F3E2C7',
  'Gris espacial': '#4A4A4D',
  'Grafito': '#54524F',
  'Medianoche': '#232A31',
  'Blanco estrella': '#F7F3EC',
  '(PRODUCT)RED': '#C8102E',
  'Azul': '#5C7FA8',
  'Verde': '#A9C5B0',
  'Rosa': '#F0C6D0',
  'Púrpura': '#C9B8DD',
  'Amarillo': '#F4DE7A',
  'Coral': '#EE7762',
  'Malva': '#D1CDDA',
  'Verde noche': '#4E5851',
  'Azul pacífico': '#2E4958',
  'Azul alpino': '#A7C1D9',
  'Verde alpino': '#576856',
  'Morado oscuro': '#594F63',
  'Negro espacial': '#3B3A39',
  'Titanio natural': '#BAB4A9',
  'Titanio azul': '#3E4A57',
  'Titanio blanco': '#F2F1ED',
  'Titanio negro': '#3C3C3D',
  'Titanio color desierto': '#BFA48F',
  'Azul ultramar': '#8FA3EE',
  'Verde azulado': '#A8D0CC',
  'Lavanda': '#D9CCE6',
  'Verde salvia': '#BACBAE',
  'Azul neblina': '#A9BCD4',
  'Azul cielo': '#CFE0EE',
  'Blanco nube': '#F4F3EF',
  'Dorado claro': '#EADBC0',
  'Azul oscuro': '#2F3B52',
  'Naranja cósmico': '#E0773A',
  'Rosa palo': '#EFD3D2',
  'Burdeos': '#6B2737',
  'Azul glacial': '#C8DAE8',
  'Blanco estelar': '#F3F1EC',
  'Cielo nocturno': '#2B3350',
  // Mac
  'Oro rosa': '#E8C4B8',
  'Rosa rubor': '#ECC6C0',
  'Amarillo cítrico': '#E8DA78',
  'Índigo': '#454C7E',
  'Morado': '#B9ABD6',
  'Naranja': '#EBA57F',
};

/** Nombres que se repiten entre generaciones con tonos distintos (el azul del 12 es oscuro; el del 15, casi pastel). */
const POR_GENERACION = {
  XR: { 'Azul': '#4E8CC6', 'Amarillo': '#F3D060', '(PRODUCT)RED': '#B0102A' },
  11: { 'Verde': '#AEE1CD', 'Amarillo': '#FFE681' },
  12: { 'Azul': '#1F4A72', 'Verde': '#D8EFD5', 'Púrpura': '#B7AFE6' },
  13: { 'Azul': '#447792', 'Verde': '#394C38', 'Rosa': '#FAE0D8' },
  14: { 'Azul': '#A0B4C7', 'Púrpura': '#E6DDEB', 'Amarillo': '#F9E479' },
  15: { 'Azul': '#D4E1EA', 'Verde': '#CAD4C5', 'Amarillo': '#EDE6C8', 'Rosa': '#E9CFD3' },
  16: { 'Rosa': '#F2ADDA' },
  // iMac de 24 pulgadas: tonos pastel, más claros que los mismos nombres en iPhone
  iMac: { 'Azul': '#A3BCD8', 'Verde': '#AACBB3', 'Rosa': '#EBBCC7', 'Amarillo': '#F2D98C', 'Plata': '#E3E4E6' },
};

const generacionDe = (modelo) => modelo?.match(/^iPhone (XR|\d+)/)?.[1] ?? (modelo?.startsWith('iMac') ? 'iMac' : null);

/** Tono aproximado de un color de un modelo, o null si no hay (se muestra solo el nombre). */
export function tonoDe(color, modelo = null) {
  return POR_GENERACION[generacionDe(modelo)]?.[color] ?? TONOS[color] ?? null;
}

/** Los tonos claros llevan un borde para que la muestra no se pierda sobre el fondo. */
export function esClaro(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.8;
}
