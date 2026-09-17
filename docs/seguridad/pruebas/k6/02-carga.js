// Carga moderada: sube a 25 usuarios en 1 min, se mantiene 2 min y baja. Mezcla de páginas públicas y API.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE, PAGINAS, API } from './comun.js';
export const options = {
  scenarios: { carga: { executor: 'ramping-vus', stages: [{ duration: '1m', target: 25 }, { duration: '2m', target: 25 }, { duration: '30s', target: 0 }] } },
  thresholds: {
    'http_req_duration{tipo:pagina}': ['p(95)<2500'],
    'http_req_failed{tipo:pagina}': ['rate<0.01'],
    'checks{tipo:api}': ['rate>0.95'],
  },
};
export default function () {
  const p = PAGINAS[Math.floor(Math.random() * PAGINAS.length)];
  const r = http.get(BASE + p, { tags: { tipo: 'pagina' } });
  check(r, { 'página 200': (x) => x.status === 200 }, { tipo: 'pagina' });
  if (Math.random() < 0.3) {
    const a = API[Math.floor(Math.random() * API.length)];
    const ra = http.get(BASE + a, { headers: { Accept: 'application/json' }, tags: { tipo: 'api' } });
    check(ra, { 'api 200 o 429 (límite)': (x) => x.status === 200 || x.status === 429 }, { tipo: 'api' });
  }
  sleep(1 + Math.random() * 2);
}
