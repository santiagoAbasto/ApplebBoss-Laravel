import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { CheckCircle2, CircleAlert, Gamepad2, Headphones, House, Laptop, List, Monitor, Package, PanelTop, PcCase, Smartphone, Tablet, Watch, Wrench } from 'lucide-react';
import { Badge, buttonCls } from '@/Components/Admin/ui';

// Piezas que comparten el listado y el detalle de Tienda online → Trade-In.

/** Qué significa cada etapa, para elegirla bien. Las etiquetas vienen del servidor (TradeInSolicitud::ETIQUETAS). */
export const ETAPAS = {
  nuevo:      { tono: 'amber', ayuda: 'Llegó desde la tienda y nadie le respondió.' },
  pendiente:  { tono: 'lila', ayuda: 'Le escribiste y falta que el cliente responda.' },
  contactado: { tono: 'blue', ayuda: 'Ya hablaron: están coordinando la revisión.' },
  evaluacion: { tono: 'violet', ayuda: 'El equipo está en la tienda para revisarlo.' },
  cotizado:   { tono: 'navy', ayuda: 'Le diste un valor estimado.' },
  aceptado:   { tono: 'emerald', ayuda: 'Aceptó el valor: falta recibir el equipo.' },
  completado: { tono: 'emerald', ayuda: 'Se recibió el equipo como parte de pago.' },
  rechazado:  { tono: 'slate', ayuda: 'No aceptó, no respondió o el equipo no califica.' },
};

export function EtapaBadge({ estado, etapas = [] }) {
  const label = etapas.find((e) => e.valor === estado)?.label ?? estado;
  return <Badge tone={ETAPAS[estado]?.tono ?? 'slate'}>{label}</Badge>;
}

const TONO_GRADO = { como_nuevo: 'emerald', muy_bueno: 'emerald', bueno: 'lila', detalles: 'amber', revisar: 'rose' };

export function GradoBadge({ grado, grados = {} }) {
  if (!grado) return null;
  return <Badge tone={TONO_GRADO[grado] ?? 'slate'}>{grados[grado] ?? grado}</Badge>;
}

export const ICONOS_TIPO = {
  iPhone: Smartphone, iPad: Tablet, MacBook: Laptop, Mac: Monitor, 'Apple Watch': Watch, AirPods: Headphones,
  'Celular Android': Smartphone, Laptop: Laptop, 'PC de escritorio': PcCase, Consola: Gamepad2, Otro: Package,
};

export const enlaceWhatsapp = (numero, mensaje) => `https://wa.me/${numero}?text=${encodeURIComponent(mensaje ?? '')}`;

export const bs = (n) => `Bs ${Number(n).toLocaleString('es-BO', { maximumFractionDigits: 2 })}`;

/** «16/09/2026 a las 10:30», en hora de Bolivia. */
export function fechaHora(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const dia = d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/La_Paz' });
  const hora = d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/La_Paz' });
  return `${dia} a las ${hora}`;
}

/** Por dónde llega el cliente a /trade-in. */
export function DondeSeLlega({ donde = {} }) {
  const inicio = donde.inicio;
  const menus = donde.menus ?? [];
  const servicios = donde.servicios ?? [];

  const filas = [
    {
      Icon: PanelTop, titulo: 'Barra de arriba', ok: true,
      texto: 'Siempre: el acceso «Trade-In» está junto a «Comparar», y en los accesos rápidos del celular.',
    },
    {
      Icon: House, titulo: 'El inicio', ok: Boolean(inicio?.en_vigor),
      texto: !inicio
        ? 'La sección «Trade-In» no está en Portada.'
        : !inicio.encendida
          ? 'La sección «Trade-In» está apagada en Portada.'
          : inicio.en_vigor ? `Sección «${inicio.titulo}».` : 'La sección «Trade-In» está fuera de sus fechas en Portada.',
      accion: <Link href={route('admin.home-builder.index')} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>Portada</Link>,
    },
    {
      Icon: List, titulo: 'Los menús', ok: menus.length > 0,
      texto: menus.length ? `Hay un enlace en: ${menus.join(' · ')}.` : 'Ningún menú lleva a /trade-in. El enlace se agrega en «Menú».',
      accion: <Link href={route('admin.menus.index')} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>Menú</Link>,
    },
    {
      Icon: Wrench, titulo: 'Servicios', ok: servicios.length > 0,
      texto: servicios.length ? `Llevan a Trade-In: ${servicios.join(' · ')}.` : 'Ninguna tarjeta de «Nuestros servicios» lleva a Trade-In.',
      accion: <Link href={route('admin.services.index')} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>Servicios</Link>,
    },
  ];

  return (
    <ul className="mt-3 space-y-2">
      {filas.map(({ Icon, titulo, texto, ok, accion }) => (
        <li key={titulo} className="flex items-start gap-3 rounded-xl bg-slate-50 px-3.5 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#585E9F]"><Icon className="h-[18px] w-[18px]" /></span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[13px] font-bold text-slate-900">
              {ok
                ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-label="Lleva a Trade-In" />
                : <CircleAlert className="h-3.5 w-3.5 text-amber-600" aria-label="No lleva a Trade-In" />}
              {titulo}
            </p>
            <p className="mt-0.5 text-xs leading-snug text-slate-500">{texto}</p>
          </div>
          {accion && <div className="shrink-0">{accion}</div>}
        </li>
      ))}
    </ul>
  );
}

const CONSEJOS = [
  {
    titulo: 'Responde el mismo día',
    por: 'La solicitud llega con el equipo, lo que falla y el WhatsApp del cliente: con eso ya puedes escribirle.',
    bien: 'Escribirle con «WhatsApp» apenas llega la solicitud.',
    evitar: 'Dejarla en «Nueva» hasta el día siguiente.',
  },
  {
    titulo: 'Un valor claro y condicionado',
    por: 'Lo que declaró el cliente no reemplaza la revisión: el valor final se confirma con el equipo en la mano.',
    bien: 'Por tu iPhone 13 de 128 GB el valor estimado es de Bs 2.800, sujeto a la revisión en la tienda.',
    evitar: 'Te pagamos 2800 seguro.',
  },
  {
    titulo: 'Pide lo que falta antes de cotizar',
    por: 'Si no puso la batería o hay algo «sin probar», pídeselo: la cotización se acerca más al valor final.',
    bien: '¿Nos mandas una captura de Configuración > Batería > Condición de la batería?',
    evitar: 'Mándame info del equipo.',
  },
  {
    titulo: 'Cierra siempre la solicitud',
    por: 'Así el listado muestra solo lo que está en curso.',
    bien: '«Completada» al recibir el equipo; «Cerrada sin acuerdo» con una nota interna si no siguió.',
    evitar: 'Dejarla en «Esperando respuesta» para siempre.',
  },
];

export function ConsejosTradeIn() {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
      <h2 className="text-base font-bold text-slate-900">Cómo responder una solicitud</h2>
      <p className="mt-0.5 text-[13px] text-slate-500">El cliente está comparando opciones: una respuesta clara y a tiempo hace la diferencia.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {CONSEJOS.map((c) => (
          <div key={c.titulo} className="rounded-xl border border-slate-100 p-4">
            <p className="text-sm font-bold text-slate-900">{c.titulo}</p>
            <p className="mt-0.5 text-xs leading-snug text-slate-500">{c.por}</p>
            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900"><span className="font-bold">Así sí: </span>{c.bien}</p>
            <p className="mt-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-900"><span className="font-bold">Evita: </span>{c.evitar}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/** La revisión al recibir el equipo, con los caminos de la ayuda de Apple para Latinoamérica. */
export function AntesDeRecibir() {
  const pasos = [
    ['Confirma el modelo', 'Configuración > General > Información, «Número de modelo».'],
    ['Revisa la batería', 'Configuración > Batería > Condición de la batería, «Capacidad máxima». En Apple Watch: Configuración > Batería > Condición.'],
    ['Revisa las piezas', 'Configuración > General > Información, «Historial de piezas y servicios» (solo aparece si tuvo una reparación): «Original», «Desconocida», «Sin verificar» o «Usada».'],
    ['Que cierre sesión', 'Configuración > [su nombre] > Cerrar sesión. Si no puede (no recuerda la contraseña o la cuenta es de otra persona), no lo recibas.'],
    ['Que lo borre', 'Configuración > General > Transferir o restablecer el iPhone > Borrar contenido y configuración.'],
  ];

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <h2 className="text-base font-bold text-slate-900">Al recibir un iPhone o iPad</h2>
      <p className="mt-0.5 text-[13px] text-slate-500">Revísalo con el cliente presente, en este orden.</p>
      <ol className="mt-3 space-y-2.5">
        {pasos.map(([titulo, texto], i) => (
          <li key={titulo} className="flex gap-3">
            <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#011446] text-[11px] font-bold text-white">{i + 1}</span>
            <p className="text-[13px] leading-snug text-slate-600"><span className="font-bold text-slate-900">{titulo}: </span>{texto}</p>
          </li>
        ))}
      </ol>
      <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-snug text-slate-500">
        En una Mac portátil, los ciclos de la batería: con la tecla Opción presionada, menú Apple &gt; Información del Sistema &gt; Alimentación.
        Caminos de la ayuda de Apple para Latinoamérica.
      </p>
    </section>
  );
}
