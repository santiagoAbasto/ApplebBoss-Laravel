import { Check, X } from 'lucide-react';

// Piezas de Tienda online → Configuración: las vistas previas de lo que el cliente ve con estos datos (la barra de
// anuncio, el pie de página y el botón de WhatsApp) y la guía para escribirlos.

/** El número tal como lo arma wa.me: solo dígitos, con código de país. */
export const soloDigitos = (valor) => (valor ?? '').replace(/[^0-9]/g, '');

/** «59175904313» → «+591 75904313», para leerlo de un vistazo. */
export function numeroLegible(valor) {
  const n = soloDigitos(valor);
  if (n.length < 8) return n;
  if (n.startsWith('591')) return `+591 ${n.slice(3)}`;
  return `+${n}`;
}

/** Con qué arranca cada mensaje que la tienda le arma al cliente. La misma regla que usa la tienda. */
export const saludoDe = (nombre) => `Hola ${(nombre ?? '').trim() || 'Apple Boss'},`;

/** La barra de arriba de la tienda. Sin texto no se dibuja, y el panel lo dice. */
export function VistaAnuncio({ texto }) {
  const t = (texto ?? '').trim();

  if (!t) {
    return (
      <p className="mt-3 rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-[13px] text-slate-500">
        Sin texto, la barra no se dibuja: el encabezado empieza directo con el logo.
      </p>
    );
  }

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="truncate px-3 py-2 text-center text-[11px] font-semibold text-white" style={{ background: '#011446' }}>
        {t}
      </div>
      <div className="flex items-center gap-2 px-3 py-3">
        <img src="/images/logo-appleboss.png" alt="" className="h-7 w-7 object-contain" />
        <span className="h-2 w-20 rounded-full bg-slate-100" />
        <span className="ml-auto h-2 w-10 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

/** La columna de la marca del pie de página, con el nombre y la frase. */
export function VistaPie({ nombre, tagline, ciudad, pais, anio = new Date().getFullYear() }) {
  return (
    <div className="mt-3 overflow-hidden rounded-xl" style={{ background: '#011446' }}>
      <div className="px-4 py-4">
        <div className="flex items-center gap-2.5">
          <img src="/images/logo-appleboss.png" alt="" className="h-8 w-8 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
          <span className="text-lg font-black tracking-tight text-white">{nombre}</span>
        </div>
        {tagline
          ? <p className="mt-2.5 text-[12px] leading-5 text-white/80" style={{ maxWidth: '26ch' }}>{tagline}</p>
          : <p className="mt-2.5 text-[12px] leading-5 text-white/40">Sin frase, acá queda un hueco debajo del nombre.</p>}
        {ciudad && (
          <span className="mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold" style={{ background: '#C6CB36', color: '#0D0D1A' }}>
            {ciudad}{pais ? `, ${pais}` : ''}
          </span>
        )}
      </div>
      <div className="border-t px-4 py-2.5 text-[10px] font-medium text-white" style={{ borderColor: 'rgba(255,255,255,0.14)' }}>
        © {anio} {nombre}{pais ? ` · ${pais}` : ''}
      </div>
    </div>
  );
}

const IconoWhatsapp = ({ className = 'h-6 w-6' }) => (
  <svg viewBox="0 0 24 24" className={className} style={{ fill: '#fff' }} aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.955-1.418A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 01-4.073-1.114l-.292-.173-3.022.865.88-2.952-.19-.303A7.96 7.96 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z" />
  </svg>
);

/** El botón verde que flota en la tienda y el mensaje con el que se abre la conversación. */
export function VistaWhatsapp({ activo, numero, mensaje, nombre }) {
  if (!activo) {
    return (
      <p className="mt-3 rounded-xl border border-dashed border-slate-200 px-4 py-5 text-center text-[13px] text-slate-500">
        Apagado: la tienda no muestra el botón verde ni los botones de WhatsApp de los servicios y los locales.
      </p>
    );
  }

  const n = soloDigitos(numero);
  const texto = (mensaje ?? '').trim();

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-[#F5F5F7] p-4">
      <div className="flex items-end justify-end gap-3">
        <div className="min-w-0 flex-1 rounded-2xl bg-white px-3.5 py-2.5 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400">
            {n ? `wa.me/${n}` : 'Falta el número'}
          </p>
          <p className="mt-1 break-words text-[13px] leading-snug text-slate-800">
            {texto || <span className="text-slate-400">Sin mensaje: WhatsApp se abre con la conversación en blanco.</span>}
          </p>
        </div>
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full" style={{ background: '#25D366', boxShadow: '0 6px 20px rgba(37,211,102,0.45)' }}>
          <IconoWhatsapp className="h-7 w-7" />
        </span>
      </div>
      <p className="mt-3 border-t border-slate-200 pt-3 text-[12px] leading-relaxed text-slate-500">
        Desde la ficha de un producto y desde el carrito, el mensaje lo arma la tienda con el equipo y arranca con
        «<span className="font-semibold text-slate-700">{saludoDe(nombre)}</span>».
      </p>
    </div>
  );
}

const CONSEJOS = [
  {
    titulo: 'El nombre, tal como lo busca el cliente',
    texto: 'Es el que sale en el encabezado, en el pie, en cada mensaje de WhatsApp y en los datos que lee Google. Escríbelo como está en tu cartel y en tus redes, sin agregarle lo que vendes.',
    bien: 'Apple Boss',
    mal: 'Apple Boss — iPhone, Mac y accesorios en Cochabamba',
  },
  {
    titulo: 'La frase del pie dice por qué comprarte',
    texto: 'Una sola idea, en tus palabras y cumplible siempre. Va debajo del nombre, al final de todas las páginas.',
    bien: 'Equipos revisados uno por uno, con la condición escrita en cada publicación.',
    mal: 'Los mejores precios del país y garantía oficial en todo.',
  },
  {
    titulo: 'La barra de anuncio se lee de pasada',
    texto: 'Es la franja de arriba de todas las páginas y se corta en el celular: pocas palabras, separadas con «·». Si no tienes nada que avisar, déjala vacía y no se dibuja.',
    bien: 'Envíos a todo el país · Revisamos antes de entregar',
    mal: 'Bienvenido a nuestra tienda, esperamos que encuentres lo que buscas',
  },
];

export function GuiaConfiguracion() {
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
        <span className="font-bold text-slate-800">El número de WhatsApp</span> va con el código de país y solo con
        números, sin «+», espacios ni guiones: así lo necesita el enlace de wa.me. En Bolivia son 591 y los 8 dígitos
        de la línea. Para probarlo, abre <span className="font-semibold text-slate-700">wa.me/59175904313</span> en tu
        celular con ese número: si abre tu chat, está bien escrito.
      </p>
    </>
  );
}
