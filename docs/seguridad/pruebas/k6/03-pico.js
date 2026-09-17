// Pico corto: 60 usuarios durante 30 s sobre inicio y catálogo, para ver degradación y recuperación.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { BASE } from './comun.js';
export const options = {
  scenarios: { pico: { executor: 'ramping-vus', stages: [{ duration: '10s', target: 60 }, { duration: '30s', target: 60 }, { duration: '10s', target: 0 }] } },
  thresholds: { http_req_failed: ['rate<0.02'], http_req_duration: ['p(95)<4000'] },
};
export default function () {
  const r = http.get(BASE + (Math.random() < 0.5 ? '/' : '/catalogo'));
  check(r, { '200': (x) => x.status === 200 });
  sleep(0.5 + Math.random());
}
