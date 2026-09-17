// Configuración común: solo el Docker local del dueño. Nunca apuntar a un dominio público ni al túnel.
export const BASE = __ENV.BASE || 'http://127.0.0.1:8010';
if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(BASE)) {
  throw new Error('BASE debe ser el entorno local (127.0.0.1 o localhost)');
}
export const PAGINAS = [
  '/', '/catalogo', '/iphone', '/mac', '/myskin', '/seminuevos', '/comparar', '/comparar/iphone', '/comparar/mac',
  '/comparar/apple', '/novedades', '/paginas/nosotros', '/productos/iphone-14-plus-128gb-celeste',
  '/productos/alexa-echo-dot-max', '/trade-in', '/login',
];
export const API = ['/api/v1/products', '/api/v1/filters', '/api/v1/products/iphone-14-plus-128gb-celeste', '/api/buscar?q=iphone'];
