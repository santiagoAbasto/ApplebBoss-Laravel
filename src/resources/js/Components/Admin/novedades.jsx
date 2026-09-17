import { Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { CheckCircle2, CircleAlert, House, List, Newspaper } from 'lucide-react';
import { Badge, buttonCls } from '@/Components/Admin/ui';

// Piezas que comparten el listado y el editor de Tienda online → Novedades.

export const ESTADOS = {
  borrador:   { label: 'Borrador', tone: 'slate' },
  programada: { label: 'Programada', tone: 'lila' },
  publicada:  { label: 'Publicada', tone: 'emerald' },
};

export function EstadoNovedad({ estado }) {
  const e = ESTADOS[estado] ?? ESTADOS.borrador;
  return <Badge tone={e.tone}>{e.label}</Badge>;
}

const FALTANTES = { texto: 'Sin texto', resumen: 'Sin resumen', foto: 'Sin foto' };

/** Lo que le falta a una novedad para verse bien. Sin texto no se puede publicar. */
export function Faltantes({ lista = [] }) {
  if (lista.length === 0) return null;
  return (
    <p className="mt-1.5 flex flex-wrap gap-1.5">
      {lista.map((f) => <Badge key={f} tone={f === 'texto' ? 'rose' : 'amber'}>{FALTANTES[f] ?? f}</Badge>)}
    </p>
  );
}

/** «16/09/2026 a las 10:30», en hora de Bolivia. */
export function fechaHora(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const dia = d.toLocaleDateString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/La_Paz' });
  const hora = d.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/La_Paz' });
  return `${dia} a las ${hora}`;
}

/** Lo que dice la fila sobre la fecha. */
export function lineaFecha(n) {
  if (n.estado === 'programada') return `Se publica sola el ${fechaHora(n.fecha)}`;
  if (n.estado === 'publicada') return n.fecha ? `Publicada el ${fechaHora(n.fecha)}` : 'Publicada';
  return n.actualizada ? `Editada ${n.actualizada}` : 'Sin publicar';
}

const plural = (n, uno, varios) => (n === 1 ? uno : varios.replace('{n}', n));

/** Dónde se ven las novedades: su página, la sección del inicio y los menús. */
export function DondeSeVen({ donde = {} }) {
  const publicadas = donde.publicadas ?? 0;
  const hay = publicadas > 0;
  const inicio = donde.inicio;
  const menus = donde.menus ?? [];
  const nombresMenus = menus.map((m) => m.label).join(' · ');

  const filas = [
    {
      Icon: Newspaper,
      titulo: 'La página /novedades',
      ok: hay,
      texto: hay
        ? `Lista ${plural(publicadas, 'la única publicada', 'las {n} publicadas')}, de la más nueva a la más vieja.`
        : 'Por ahora muestra un aviso: todavía no hay ninguna publicada. Google no la indexa.',
      accion: hay ? <a href="/novedades" target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-9 px-3 text-xs')}>Ver</a> : null,
    },
    {
      Icon: House,
      titulo: 'El inicio',
      ok: Boolean(inicio?.en_vigor && hay),
      texto: !inicio
        ? 'La sección «Novedades» no está en Portada.'
        : !inicio.encendida
          ? 'La sección «Novedades» está apagada en Portada.'
          : !inicio.en_vigor
            ? 'La sección «Novedades» está fuera de sus fechas en Portada.'
            : hay
              ? `«${inicio.titulo}» muestra ${plural(inicio.cantidad, 'la más nueva', 'las {n} más nuevas')}.`
              : 'La sección está encendida, pero no se dibuja hasta que publiques la primera.',
      accion: <Link href={route('admin.home-builder.index')} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>Portada</Link>,
    },
    {
      Icon: List,
      titulo: 'Los menús',
      ok: menus.length > 0 && hay,
      texto: menus.length === 0
        ? 'Ningún menú lleva a /novedades. El enlace se agrega en «Menú».'
        : hay
          ? `Hay un enlace en: ${nombresMenus}.`
          : `El enlace de ${nombresMenus} se oculta solo hasta que publiques la primera.`,
      accion: <Link href={route('admin.menus.index')} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>Menú</Link>,
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
                ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-label="Se ve" />
                : <CircleAlert className="h-3.5 w-3.5 text-amber-600" aria-label="No se ve" />}
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
    titulo: 'Un título que diga la noticia',
    por: 'Es lo que se lee en el inicio, en Google y al compartirla por WhatsApp.',
    bien: 'Llegaron los iPhone 17 Pro de 256 GB',
    evitar: '¡¡Gran novedad en Apple Boss!!',
  },
  {
    titulo: 'Un resumen con el dato importante',
    por: 'Sale debajo del título en las tarjetas y, si no escribes una descripción para Google, también ahí.',
    bien: 'Tenemos unidades nuevas en tres colores. Consulta por WhatsApp cuál queda.',
    evitar: 'Entra y entérate de todo.',
  },
  {
    titulo: 'Una foto propia y horizontal',
    por: 'La tienda la muestra en 16:9: una foto vertical se recorta arriba y abajo.',
    bien: 'El equipo sobre el mostrador, con buena luz y de al menos 1200 px de ancho.',
    evitar: 'Una captura de pantalla o la foto de otra página.',
  },
  {
    titulo: 'Solo lo que se cumple',
    por: 'La novedad queda publicada: si algo cambia, edítala o pásala a borrador.',
    bien: 'Stock confirmado al 16 de septiembre.',
    evitar: 'El mejor precio de Bolivia.',
  },
];

export function ConsejosNovedad() {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-6">
      <h2 className="text-base font-bold text-slate-900">Cómo escribir una buena novedad</h2>
      <p className="mt-0.5 text-[13px] text-slate-500">Una novedad sirve para que el cliente vuelva: algo que llegó, una guía corta o un aviso de la tienda.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {CONSEJOS.map((c) => (
          <div key={c.titulo} className="rounded-xl border border-slate-100 p-4">
            <p className="text-sm font-bold text-slate-900">{c.titulo}</p>
            <p className="mt-0.5 text-xs leading-snug text-slate-500">{c.por}</p>
            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-900">
              <span className="font-bold">Así sí: </span>{c.bien}
            </p>
            <p className="mt-1.5 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-900">
              <span className="font-bold">Evita: </span>{c.evitar}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
