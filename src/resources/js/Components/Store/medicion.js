/*
 * Medición propia de la tienda (Tienda online → Tráfico): avisa una página vista o una acción a /api/eventos.
 * Sin cookies ni nada guardado en el navegador; nunca datos personales (EventoWebController los filtra igual).
 * Si el visitante aceptó Google Analytics, la acción también va a GA4.
 */

let referenteEnviado = false;

export function medir(nombre, etiqueta) {
  if (typeof window === 'undefined') return;
  // De dónde llegó la visita: solo en la primera página (al navegar dentro de la tienda, document.referrer no cambia)
  let ref;
  if (nombre === 'pagina' && !referenteEnviado) {
    referenteEnviado = true;
    ref = document.referrer ? document.referrer.slice(0, 300) : undefined;
  }
  const body = JSON.stringify({ nombre, ruta: window.location.pathname, etiqueta: etiqueta ? String(etiqueta).slice(0, 120) : undefined, ref });
  try {
    // sendBeacon sobrevive a la navegación (un clic que cambia de página)
    if (!navigator.sendBeacon?.('/api/eventos', body)) {
      fetch('/api/eventos', { method: 'POST', body, keepalive: true }).catch(() => {});
    }
  } catch {
    // La medición nunca rompe la tienda
  }
  if (nombre !== 'pagina') window.gtag?.('event', nombre, etiqueta ? { etiqueta: String(etiqueta).slice(0, 100) } : undefined);
}
