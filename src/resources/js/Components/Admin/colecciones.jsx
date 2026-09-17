import { Link } from '@inertiajs/react';
import { House, List, Link2 } from 'lucide-react';
import { Badge } from '@/Components/Admin/ui';

// Piezas que comparten el listado y el editor de Tienda online → Colecciones.

export const CAT_LABELS = {
  celulares: 'iPhone',
  computadoras: 'Mac',
  'productos-apple': 'Apple',
  fundas: 'Fundas',
  accesorios: 'Accesorios',
};

/** ¿Esta colección se ve hoy en la tienda? */
export const seVe = (c) => Boolean(c.active && c.en_venta > 0);

/** Por qué una colección no se está viendo, en una línea. */
export function motivoOculta(c) {
  if (!c.active) return 'Está oculta: su página no abre y no sale en la portada.';
  if (c.total === 0) return 'Todavía no tiene productos elegidos.';
  if (c.en_venta === 0) return 'Todo lo que tiene ya se vendió: no muestra nada.';
  return null;
}

/** El estado de un producto dentro de la colección. */
export function EstadoProducto({ estado }) {
  const tono = estado === 'A la venta' ? 'emerald' : estado === 'Vendido o reservado' ? 'amber' : 'slate';
  return <Badge tone={tono}>{estado}</Badge>;
}

/** Dónde figura la colección: su página, la portada y los menús. */
export function DondeSeVe({ donde = {}, url }) {
  const inicio = donde.inicio ?? [];
  const menus = donde.menus ?? [];

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
      <span className="inline-flex items-center gap-1">
        <Link2 className="h-3.5 w-3.5 text-slate-400" aria-hidden="true" /> {url}
      </span>
      {inicio.map((s) => (
        <span key={s.id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
          <House className="h-3 w-3" aria-hidden="true" />
          {s.activa ? 'En el inicio' : 'En el inicio (apagada)'}
        </span>
      ))}
      {menus.map((m) => (
        <span key={m.slot} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
          <List className="h-3 w-3" aria-hidden="true" />
          {m.label}
        </span>
      ))}
    </div>
  );
}

/** Las secciones «Colección de productos» de la portada y qué vitrina muestra cada una. */
export function VistaPortada({ colecciones = [], rutaPortada }) {
  const usadas = colecciones.flatMap((c) => (c.donde?.inicio ?? []).map((s) => ({ ...s, coleccion: c })));

  if (usadas.length === 0) {
    return (
      <div className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
        <p className="text-[13px] text-slate-500">Ninguna colección se muestra en el inicio todavía.</p>
        <Link href={rutaPortada} className="mt-2 inline-block text-[13px] font-bold text-[#585E9F] hover:underline">
          Elegir una en Portada
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-4 space-y-2">
      {usadas.map((s) => (
        <li key={s.id} className={`rounded-xl border px-4 py-3 ${s.activa ? 'border-slate-200' : 'border-dashed border-slate-200 bg-slate-50/60'}`}>
          <p className="flex items-center justify-between gap-2 text-sm font-bold text-slate-900">
            <span className="truncate">{s.titulo || s.coleccion.name}</span>
            {s.activa ? <Badge tone="emerald">Encendida</Badge> : <Badge tone="slate">Apagada</Badge>}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            Muestra «{s.coleccion.name}» · {s.coleccion.en_venta} a la venta
          </p>
        </li>
      ))}
    </ul>
  );
}

/** Vista previa del encabezado de la página de la colección. */
export function VistaPagina({ nombre, descripcion, cantidad }) {
  return (
    <div className="mt-4 rounded-2xl bg-[#F5F6FA] p-4">
      <p className="text-[11px] font-semibold text-slate-400">Inicio / Catálogo</p>
      <p className="mt-1 text-2xl font-black leading-tight tracking-tight text-[#0D0D1A]">{nombre || 'Sin nombre'}</p>
      {descripcion && <p className="mt-1.5 text-[13px] text-slate-600">{descripcion}</p>}
      <p className="mt-3 text-xs font-semibold text-slate-500">
        {cantidad} {cantidad === 1 ? 'producto disponible' : 'productos disponibles'}
      </p>
    </div>
  );
}
