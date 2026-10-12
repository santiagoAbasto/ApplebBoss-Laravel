import { usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';

/*
 * Aviso de cookies y carga de Google Analytics y Microsoft Clarity (Tienda online → Tráfico).
 *
 * Sin código cargado en el panel no aparece nada. Con código, ninguna de las dos herramientas carga hasta que el
 * visitante pulse «Aceptar»; «Rechazar» tiene el mismo peso. La elección queda en este navegador
 * (`appleboss:consentimiento`) y se cambia desde la política de cookies (BotonCambiarEleccion). La medición propia
 * no usa cookies y no depende de este aviso. Lo describe /paginas/cookies: si cambia algo acá, cambia allá.
 */

const CLAVE = 'appleboss:consentimiento';

const leer = () => { try { return localStorage.getItem(CLAVE); } catch { return null; } };
const guardar = (v) => { try { localStorage.setItem(CLAVE, v); } catch { /* sin almacenamiento: se vuelve a preguntar */ } };

function cargarScript(src, id) {
  if (document.getElementById(id)) return;
  const s = document.createElement('script');
  s.async = true;
  s.src = src;
  s.id = id;
  document.head.appendChild(s);
}

function cargarMedicion({ ga4, clarity }) {
  if (ga4 && !window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer.push(arguments); }; // eslint-disable-line prefer-rest-params
    window.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' });
    window.gtag('js', new Date());
    window.gtag('config', ga4, { allow_google_signals: false, allow_ad_personalization_signals: false });
    cargarScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga4)}`, 'ab-ga4');
  }
  if (clarity && !window.clarity) {
    window.clarity = function clarity() { (window.clarity.q = window.clarity.q || []).push(arguments); }; // eslint-disable-line prefer-rest-params
    window.clarity('consentv2', { ad_Storage: 'denied', analytics_Storage: 'granted' });
    // El id del <script> no puede ser «clarity»: choca con window.clarity
    cargarScript(`https://www.clarity.ms/tag/${encodeURIComponent(clarity)}`, 'ab-clarity-tag');
  }
}

export default function AvisoCookies() {
  const { tienda } = usePage().props;
  const medicion = tienda?.medicion ?? {};
  const hayTerceros = Boolean(medicion.ga4 || medicion.clarity);
  const [eleccion, setEleccion] = useState(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const e = leer();
    setEleccion(e);
    setListo(true);
    if (e === 'acepto' && hayTerceros) cargarMedicion(medicion);
  }, [hayTerceros, medicion.ga4, medicion.clarity]); // eslint-disable-line react-hooks/exhaustive-deps

  // El enlace de baja del newsletter lleva un código personal: ahí no se pregunta ni se carga nada
  const enBaja = typeof window !== 'undefined' && window.location.pathname.startsWith('/newsletter/baja');
  const visible = listo && hayTerceros && !eleccion && !enBaja;

  // Mientras el aviso está a la vista, el WhatsApp flotante se aparta (en el celular lo taparía)
  useEffect(() => {
    if (!visible) return undefined;
    document.body.dataset.avisoCookies = '';
    return () => { delete document.body.dataset.avisoCookies; };
  }, [visible]);

  const elegir = (v) => {
    guardar(v);
    setEleccion(v);
    if (v === 'acepto') cargarMedicion(medicion);
  };

  const nombres = [medicion.ga4 && 'Google Analytics', medicion.clarity && 'Microsoft Clarity'].filter(Boolean).join(' y ');

  return (
    <AnimatePresence>
      {visible && (
        <motion.div role="region" aria-label="Aviso de cookies"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-3 bottom-3 z-[1200] rounded-2xl border bg-white p-4 shadow-[0_20px_60px_-20px_rgba(1,20,70,0.45)] sm:inset-x-auto sm:left-5 sm:bottom-5 sm:max-w-[400px] sm:p-5"
          style={{ borderColor: 'var(--border-light)' }}>
          <p className="text-[14px] leading-relaxed text-slate-700">
            Usamos cookies de analítica ({nombres}) <strong>solo si aceptas</strong>. Nos ayudan a saber qué páginas sirven y cómo se usa la tienda.{' '}
            <a href="/paginas/cookies" className="font-semibold underline underline-offset-2" style={{ color: 'var(--ab-navy)' }}>Leer la política de cookies</a>
          </p>
          <div className="mt-3.5 grid grid-cols-2 gap-2">
            {[['rechazo', 'Rechazar'], ['acepto', 'Aceptar']].map(([valor, texto]) => (
              <button key={valor} type="button" onClick={() => elegir(valor)}
                className="h-11 rounded-full border text-[14px] font-bold transition-colors hover:bg-slate-50"
                style={{ borderColor: 'var(--ab-navy)', color: 'var(--ab-navy)' }}>
                {texto}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** «Cambiar mi elección» de la política de cookies: borra la decisión, las cookies propias de GA4 y Clarity y vuelve a preguntar. */
export function BotonCambiarEleccion() {
  const cambiar = () => {
    try { localStorage.removeItem(CLAVE); } catch { /* nada guardado */ }
    window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
    window.clarity?.('consent', false);
    const partes = window.location.hostname.split('.');
    const dominios = partes.map((_, i) => partes.slice(i).join('.')).filter((d) => d.includes('.'));
    document.cookie.split(';').map((c) => c.split('=')[0].trim())
      .filter((n) => n === '_ga' || n.startsWith('_ga_') || n === '_clck' || n === '_clsk')
      .forEach((n) => {
        document.cookie = `${n}=; Max-Age=0; path=/`;
        dominios.forEach((d) => { document.cookie = `${n}=; Max-Age=0; path=/; domain=.${d}`; });
      });
    window.location.reload();
  };

  return (
    <button type="button" onClick={cambiar}
      className="mt-6 inline-flex h-11 items-center rounded-full border px-6 text-[14px] font-bold transition-colors hover:bg-slate-50"
      style={{ borderColor: 'var(--ab-navy)', color: 'var(--ab-navy)' }}>
      Cambiar mi elección de cookies
    </button>
  );
}
