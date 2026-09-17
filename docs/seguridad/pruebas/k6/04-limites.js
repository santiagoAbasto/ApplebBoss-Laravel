// Límites de uso (throttle): un solo cliente supera el límite de cada ruta y debe recibir 429.
// El POST del newsletter lleva lleno el campo trampa «website»: el servidor responde sin guardar nada.
import http from 'k6/http';
import { check } from 'k6';
import { BASE } from './comun.js';
export const options = { vus: 1, iterations: 1, thresholds: { checks: ['rate==1'] } };
function rafaga(nombre, n, hacer, limite) {
  let primero429 = null;
  for (let i = 1; i <= n; i++) {
    const r = hacer();
    if (r.status === 429 && primero429 === null) primero429 = i;
  }
  console.log(`${nombre}: primer 429 en el pedido ${primero429} (límite ${limite}/min)`);
  check(primero429, { [`${nombre} limita (429 después de ${limite})`]: (v) => v !== null && v === limite + 1 });
}
export default function () {
  rafaga('api/buscar', 65, () => http.get(`${BASE}/api/buscar?q=ipad`, { headers: { Accept: 'application/json' } }), 60);
  rafaga('api/v1/products', 125, () => http.get(`${BASE}/api/v1/products`, { headers: { Accept: 'application/json' } }), 120);
  const home = http.get(`${BASE}/`);
  const xsrf = decodeURIComponent((home.cookies['XSRF-TOKEN'] || [{}])[0].value || '');
  rafaga('newsletter (trampa)', 7, () => http.post(`${BASE}/newsletter`, JSON.stringify({ email: 'k6-trampa@example.com', website: 'bot' }), {
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-XSRF-TOKEN': xsrf, 'X-Requested-With': 'XMLHttpRequest' },
  }), 5);
  rafaga('api/automation sin token', 32, () => http.get(`${BASE}/api/automation/top-products`, { headers: { Accept: 'application/json' } }), 30);
}
