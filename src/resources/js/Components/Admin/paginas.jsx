import { List, PanelBottom } from 'lucide-react';
import { Badge } from '@/Components/Admin/ui';

// Piezas que comparten el listado y el editor de Tienda online → Páginas.

/** Dónde figura una página: siempre en el pie, y en los menús donde le hayan puesto un enlace. */
export function DondeSeVe({ donde = {}, url }) {
  const menus = donde.menus ?? [];

  return (
    <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
      <span>{url}</span>
      {donde.en_informacion && (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
          <PanelBottom className="h-3 w-3" aria-hidden="true" /> En el pie, en «Información»
        </span>
      )}
      {menus.map((m) => (
        <span key={m.slot} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
          <List className="h-3 w-3" aria-hidden="true" /> {m.label}
        </span>
      ))}
    </p>
  );
}

/** Lo que pasa con una página, en una etiqueta. */
export function EstadoPagina({ pagina }) {
  if (!pagina.active) return <Badge tone="slate">Oculta</Badge>;
  if (pagina.vacia) return <Badge tone="amber">Sin texto</Badge>;
  return <Badge tone="emerald">Se ve</Badge>;
}

/** La columna «Información» del pie de página, tal como queda en la tienda. */
export function VistaPie({ paginas = [] }) {
  const visibles = paginas.filter((p) => p.active && p.donde?.en_informacion);

  return (
    <div className="mt-4 rounded-xl p-4" style={{ background: 'var(--ab-navy, #011446)' }}>
      <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-white">Información</p>
      {visibles.length === 0 ? (
        <p className="text-[11px] text-white/60">Ninguna página sale sola en el pie.</p>
      ) : (
        visibles.map((p) => (
          <p key={p.id} className="text-[11px] leading-relaxed text-white/85">{p.title}</p>
        ))
      )}
    </div>
  );
}

/** El encabezado de la página, tal como lo ve el cliente. */
export function VistaPagina({ titulo, texto }) {
  return (
    <div className="mt-4 overflow-hidden rounded-2xl">
      <div className="px-4 py-5" style={{ background: 'var(--ab-navy, #011446)' }}>
        <p className="text-[10px] text-white/60">Inicio / {titulo || 'Sin título'}</p>
        <p className="mt-1 text-xl font-black leading-tight text-white">{titulo || 'Sin título'}</p>
      </div>
      <div className="bg-[#F5F6FA] px-4 py-4">
        {texto
          ? <p className="line-clamp-4 text-[12px] leading-relaxed text-slate-600">{texto}</p>
          : <p className="text-[12px] text-amber-700">Sin texto: quien entre verá la página vacía.</p>}
      </div>
    </div>
  );
}
