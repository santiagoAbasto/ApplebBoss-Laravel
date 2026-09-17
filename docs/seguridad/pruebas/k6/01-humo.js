// Humo: 1 usuario recorre todas las páginas públicas y la API pública. Verifica estado, tiempo y encabezados.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE, PAGINAS, API } from './comun.js';
export const options = { vus: 1, iterations: 2, thresholds: { checks: ['rate>0.99'], http_req_failed: ['rate<0.01'] } };
export default function () {
  for (const p of PAGINAS) {
    const r = http.get(BASE + p, { tags: { tipo: 'pagina', ruta: p } });
    check(r, {
      'página 200': (x) => x.status === 200,
      'menos de 2 s': (x) => x.timings.duration < 2000,
      'X-Frame-Options o CSP frame-ancestors': (x) => !!x.headers['X-Frame-Options'] || /frame-ancestors/.test(x.headers['Content-Security-Policy'] || ''),
      'X-Content-Type-Options nosniff': (x) => (x.headers['X-Content-Type-Options'] || '').toLowerCase() === 'nosniff',
      'sin stack trace': (x) => !/(Stack trace|vendor\/laravel|Whoops)/.test(x.body || ''),
    });
    sleep(0.3);
  }
  for (const p of API) {
    const r = http.get(BASE + p, { headers: { Accept: 'application/json' }, tags: { tipo: 'api', ruta: p } });
    check(r, {
      'api 200': (x) => x.status === 200,
      'api JSON': (x) => (x.headers['Content-Type'] || '').includes('json'),
      'api sin costo ni IMEI': (x) => !/precio_costo|ganancia|"imei"|procedencia/i.test(x.body || ''),
    });
    sleep(0.3);
  }
}
