import { Check, Globe, X } from 'lucide-react';

// Piezas de Marketing y Google → «Google y redes sociales»: las vistas previas de cómo se ve un enlace en Google y
// al compartirlo, y la guía para escribir los textos.

/** El resultado tal como lo dibuja Google: dirección, título azul y la frase de abajo. */
export function VistaGoogle({ url, titulo, descripcion, oculta = false }) {
  if (oculta) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-[13px] text-slate-500">
        Esta página está oculta: Google no la muestra en los resultados y no entra en el sitemap.
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3.5">
      <div className="flex items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-100">
          <Globe className="h-3.5 w-3.5 text-slate-500" />
        </span>
        <span className="min-w-0 truncate text-xs text-slate-600">{url}</span>
      </div>
      <p className="mt-1.5 truncate text-[17px] leading-snug text-[#1a0dab]">{titulo || 'Sin título'}</p>
      <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-slate-600">
        {descripcion || <span className="text-slate-400">Sin descripción: Google arma la frase con un pedazo suelto de la página.</span>}
      </p>
    </div>
  );
}

/** La tarjeta que se ve al pegar el enlace en WhatsApp, Facebook o Instagram. */
export function VistaCompartir({ url, titulo, descripcion, imagen, sitio }) {
  const dominio = (() => {
    try { return new URL(url).host.replace(/^www\./, ''); } catch { return url; }
  })();

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex aspect-[1.91/1] items-center justify-center bg-slate-100">
        {imagen
          ? <img src={imagen} alt="" className="h-full w-full object-cover" />
          : <span className="px-4 text-center text-xs text-slate-400">Sin imagen: WhatsApp muestra solo el texto, en una tarjeta chica</span>}
      </div>
      <div className="px-3.5 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{dominio}</p>
        <p className="mt-0.5 line-clamp-2 text-[13px] font-bold leading-snug text-slate-900">{titulo || 'Sin título'}</p>
        {descripcion && <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-slate-500">{descripcion}</p>}
        {sitio && <p className="mt-1 text-[11px] text-slate-400">{sitio}</p>}
      </div>
    </div>
  );
}

/** Contador con el color del límite de Google (verde en su rango, ámbar fuera). */
export function Medida({ valor, min, max, etiqueta }) {
  const largo = (valor ?? '').length;
  const fuera = largo === 0 ? false : (max && largo > max) || (min && largo < min);

  return (
    <span className={`text-[11px] tabular-nums ${largo === 0 ? 'text-slate-400' : fuera ? 'font-bold text-amber-600' : 'text-emerald-600'}`}>
      {largo}/{max} {etiqueta}
    </span>
  );
}

export const CONSEJOS_SEO = [
  {
    titulo: 'El título dice qué es y dónde',
    texto: 'Google corta cerca de los 60 caracteres. Pon primero lo que vendes, después tu tienda y la ciudad: así te encuentra quien busca «iPhone en Cochabamba».',
    bien: 'iPhone nuevos y seminuevos — Apple Boss Cochabamba',
    mal: 'Inicio | Bienvenidos a nuestra tienda online oficial',
  },
  {
    titulo: 'La descripción es tu aviso',
    texto: 'No cambia tu posición, pero decide si te hacen clic. Entre 70 y 160 caracteres, con lo que te hace distinto y una razón para entrar.',
    bien: 'iPhone, Mac y accesorios revisados uno por uno, con la condición y la batería informadas. Entrega en Cochabamba.',
    mal: 'Somos la mejor tienda con los mejores precios y la mejor atención del mercado.',
  },
  {
    titulo: 'La imagen es lo que se ve en WhatsApp',
    texto: 'Cuando alguien pega tu enlace en un chat, se ve esa foto. Sin imagen, la tarjeta sale chica y pasa desapercibida. 1200 × 630 px, con el equipo bien grande.',
    bien: 'Una foto del equipo con el logo en una esquina',
    mal: 'Una captura de pantalla de la web, con texto chico',
  },
];
