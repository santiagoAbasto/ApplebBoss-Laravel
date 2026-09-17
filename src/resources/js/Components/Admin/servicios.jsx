import { ArrowUpRight, Check, Info, MessageCircle, X } from 'lucide-react';
import { SERVICE_ICONS, ServiceIcon, resolveServiceIcon } from '@/Components/Store/Icons';
import TarjetaServicio from '@/Components/Store/TarjetaServicio';

// Piezas de Tienda online → Servicios: el selector de ícono, qué hace cada tarjeta, la vista previa y la guía para
// escribirlas.

/** Qué pasa cuando el cliente toca la tarjeta. */
export const ACCIONES = {
  ninguna: { label: 'Solo informa', Icon: Info, tono: 'slate' },
  whatsapp: { label: 'Abre WhatsApp', Icon: MessageCircle, tono: 'emerald' },
  enlace: { label: 'Lleva a una página', Icon: ArrowUpRight, tono: 'lila' },
};

export const accionDe = (clave) => ACCIONES[clave] ?? ACCIONES.ninguna;

const EXPLICACION_ACCION = {
  ninguna: 'La tarjeta cuenta lo que ofreces y no lleva a ningún lado.',
  whatsapp: 'Abre un chat con un mensaje que nombra este servicio.',
  enlace: 'Por ejemplo, a Trade-In, a una colección o a Garantía.',
};

/** Qué pasa cuando el cliente toca la tarjeta, explicado en cada opción. */
export function SelectorAccion({ valor, onChange }) {
  return (
    <div role="radiogroup" aria-label="Qué pasa cuando el cliente toca la tarjeta" className="grid gap-2">
      {Object.entries(ACCIONES).map(([clave, { label, Icon }]) => {
        const elegida = valor === clave;
        return (
          <button
            key={clave}
            type="button"
            role="radio"
            aria-checked={elegida}
            onClick={() => onChange(clave)}
            className={`flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-all ${
              elegida
                ? 'border-[#011446] bg-[#011446]/[0.04] ring-1 ring-[#011446]'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${elegida ? 'bg-[#011446] text-white' : 'bg-slate-100 text-slate-500'}`}>
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-bold text-slate-900">{label}</span>
              <span className="block text-xs text-slate-500">{EXPLICACION_ACCION[clave]}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

// El nombre corto que entra debajo de cada ícono; el completo sale al pasar el mouse
const NOMBRE_CORTO = {
  scan: 'Diagnóstico', wrench: 'Reparación', package: 'Paquete', truck: 'Envío', badge: 'Revisado', shield: 'Garantía',
  battery: 'Batería', exchange: 'Trade-In', chat: 'Atención', store: 'Tienda', phone: 'iPhone', laptop: 'Mac',
};

/** Los íconos que sabe dibujar la tienda, para elegir tocando en vez de leer una lista. */
export function SelectorIcono({ valor, onChange }) {
  const actual = resolveServiceIcon(valor);

  return (
    <div role="radiogroup" aria-label="Ícono de la tarjeta" className="grid grid-cols-4 gap-2 sm:grid-cols-6">
      {Object.entries(SERVICE_ICONS).map(([clave, { label }]) => {
        const elegido = actual === clave;
        return (
          <button
            key={clave}
            type="button"
            role="radio"
            aria-checked={elegido}
            title={label}
            aria-label={label}
            onClick={() => onChange(clave)}
            className={`flex flex-col items-center gap-1.5 rounded-xl border px-1 py-2.5 text-center transition-all ${
              elegido
                ? 'border-[#011446] bg-[#011446] text-white shadow-[0_8px_18px_-10px_rgba(1,20,70,0.6)]'
                : 'border-slate-200 bg-white text-[#011446] hover:border-slate-300 hover:bg-slate-50'
            }`}
          >
            <ServiceIcon name={clave} className="h-5 w-5" />
            <span className={`line-clamp-1 w-full text-[10px] font-semibold ${elegido ? 'text-white/85' : 'text-slate-500'}`}>
              {NOMBRE_CORTO[clave] ?? label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** La sección como sale en el inicio: título, bajada y las tarjetas encendidas, cada una con su botón. */
export function VistaServicios({ servicios = [], titulo, subtitulo, whatsapp = true }) {
  const visibles = servicios.filter((s) => s.active);

  if (visibles.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-[13px] text-slate-500">
        Sin servicios encendidos, la tienda no dibuja esta sección.
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-xl bg-[#F5F5F7] p-4">
      <p className="text-lg font-black leading-tight tracking-tight text-[#0D0D1A]">{titulo}</p>
      {subtitulo && <p className="mt-1 text-xs leading-relaxed text-slate-500">{subtitulo}</p>}
      <div className={`mt-3 grid gap-2.5 ${visibles.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {visibles.map((s) => (
          <TarjetaServicio key={s.id} compacta vistaPrevia servicio={paraVista(s, whatsapp)} />
        ))}
      </div>
    </div>
  );
}

/** Lo que dibuja la tienda con esta fila: sin WhatsApp o sin dirección, la tarjeta queda sin botón. */
export function paraVista(servicio, whatsapp = true) {
  const accion = servicio.accion === 'whatsapp' && !whatsapp ? 'ninguna'
    : servicio.accion === 'enlace' && !servicio.enlace ? 'ninguna'
      : servicio.accion;
  const porDefecto = { whatsapp: 'Consultar por WhatsApp', enlace: 'Ver más' }[accion];

  return {
    ...servicio,
    accion,
    boton: porDefecto ? ((servicio.boton ?? '').trim() || porDefecto) : null,
  };
}

const CONSEJOS = [
  {
    titulo: 'Un título que se entienda solo',
    texto: 'Dos a cuatro palabras con lo que haces.',
    bien: 'Diagnóstico sin costo',
    mal: 'Servicio de excelencia',
  },
  {
    titulo: 'Una frase con lo que gana el cliente',
    texto: 'Qué hacen por él, no lo buenos que son.',
    bien: 'Te decimos qué tiene tu equipo antes de cobrarte.',
    mal: 'Contamos con amplia experiencia en el rubro.',
  },
  {
    titulo: 'Solo lo que cumples siempre',
    texto: 'La tarjeta es una promesa: si no la cumples todos los días, no la pongas.',
    bien: 'Envíos a coordinar por WhatsApp',
    mal: 'Envío gratis a todo el país',
  },
];

/** La guía para escribir tarjetas que se lean de un vistazo y no prometan de más. */
export function GuiaEscritura() {
  return (
    <>
      <ol className="mt-4 grid gap-3 md:grid-cols-3">
        {CONSEJOS.map((c, i) => (
          <li key={c.titulo} className="rounded-xl border border-slate-100 px-3.5 py-3">
            <p className="flex items-start gap-2 text-[13px] font-bold leading-snug text-slate-800">
              <span className="mt-px grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#011446] text-[11px] font-bold text-white">{i + 1}</span>
              {c.titulo}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{c.texto}</p>
            <div className="mt-2.5 space-y-1 border-t border-slate-100 pt-2.5 text-xs">
              <p className="flex items-start gap-1.5 text-emerald-700">
                <Check className="mt-px h-3.5 w-3.5 shrink-0" aria-label="Bien" /> <span>«{c.bien}»</span>
              </p>
              <p className="flex items-start gap-1.5 text-slate-400">
                <X className="mt-px h-3.5 w-3.5 shrink-0" aria-label="Evita" /> <span className="line-through decoration-slate-300">«{c.mal}»</span>
              </p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-3 rounded-xl bg-slate-50 px-3.5 py-3 text-xs leading-relaxed text-slate-600">
        <span className="font-bold text-slate-800">¿Cuántas?</span> Tres, cuatro o seis: así las filas quedan completas
        en la computadora. Más de seis ya no se leen de un vistazo.
      </p>
    </>
  );
}
