import { ExternalLink, Eye, Monitor, PanelBottom, Smartphone } from 'lucide-react';
import { Badge } from '@/Components/Admin/ui';
import { nombreDestino, usePaginasDestino } from '@/Components/Admin/LinkPicker';

// Piezas que comparten el listado y el editor de Tienda online → Menú.

/** Los tres menús de la tienda. No se ven en el mismo lugar, por eso cada uno admite cosas distintas. */
export const MENUS = [
  {
    key: 'header',
    nombre: 'Arriba, en la computadora',
    corto: 'Arriba',
    Icon: Monitor,
    donde: 'La barra de arriba de la tienda, cuando se entra desde una computadora.',
    submenus: true,
    columnas: false,
    verde: true,
    ayuda: 'Es el único menú que admite opciones adentro: al pasar el mouse por un enlace se abre una lista con las suyas.',
  },
  {
    key: 'mobile',
    nombre: 'En el celular',
    corto: 'Celular',
    Icon: Smartphone,
    donde: 'La lista que se abre al tocar el botón del menú en el celular.',
    submenus: false,
    columnas: false,
    verde: true,
    ayuda: 'Es una lista simple, una debajo de otra. Acá no hay opciones adentro: si pones muchas, el cliente tiene que bajar mucho.',
  },
  {
    key: 'footer',
    nombre: 'Abajo, en el pie de página',
    corto: 'Pie',
    Icon: PanelBottom,
    donde: 'Los enlaces del final de la página, en todas las pantallas.',
    submenus: false,
    columnas: true,
    verde: false,
    ayuda: 'Los enlaces se agrupan en columnas. Los que compartan el nombre de columna salen juntos.',
  },
];

export const menuDe = (key) => MENUS.find((m) => m.key === key) ?? MENUS[0];

/** Lo que pasa con un enlace, en palabras. */
export function BadgesEnlace({ item, menu }) {
  return (
    <>
      {!item.active && <Badge tone="slate">Oculto</Badge>}
      {item.myskin && menu.verde && <Badge tone="emerald">Verde MYSKIN</Badge>}
      {item.open_in_new_tab && <Badge tone="lila">Se abre aparte</Badge>}
      {item.externo && <Badge tone="amber">Fuera de la tienda</Badge>}
    </>
  );
}

/** A dónde lleva, en palabras y no en dirección web. */
export function Destino({ item, colecciones = [] }) {
  const paginas = usePaginasDestino();

  if (!item.url) {
    return <span className="text-slate-400">Sin enlace: solo abre sus opciones</span>;
  }

  const extras = [...colecciones.map((c) => [c.url, c.nombre]), ...paginas];
  const nombre = nombreDestino(item.url, extras);

  return (
    <span className="inline-flex items-center gap-1">
      {item.externo && <ExternalLink className="h-3 w-3 text-slate-400" aria-hidden="true" />}
      {nombre === item.url ? item.url : <>{nombre} <span className="text-slate-400">· {item.url}</span></>}
    </span>
  );
}

// ─── Vistas previas: cómo se ve cada menú en la tienda ───────────────────────

function Chip({ children, verde, apagado }) {
  return (
    <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-bold ${apagado ? 'opacity-40' : ''}`}
      style={verde ? { color: '#A3BD31' } : undefined}>
      {children}
    </span>
  );
}

function VistaHeader({ items }) {
  const visibles = items.filter((i) => i.active);
  const conHijos = visibles.find((i) => i.children?.some((c) => c.active));

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
      <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        <span className="h-2 w-2 rounded-full bg-slate-300" />
        <span className="h-2 w-2 rounded-full bg-slate-300" />
      </div>
      <div className="bg-white px-3 py-2.5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <span className="text-[11px] font-black text-[#011446]">APPLE BOSS</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-1 gap-y-1 pt-2">
          {visibles.length === 0
            ? <span className="text-[11px] text-slate-400">Sin enlaces: la tienda muestra el menú de fábrica.</span>
            : visibles.map((i) => <Chip key={i.id} verde={i.myskin}>{i.label}</Chip>)}
        </div>
        {conHijos && (
          <div className="mt-1.5 w-max rounded-lg border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
            {conHijos.children.filter((c) => c.active).map((c) => (
              <p key={c.id} className="px-1 py-0.5 text-[10px] text-slate-600">{c.label}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VistaMobile({ items }) {
  const visibles = items.filter((i) => i.active);

  return (
    <div className="mt-4 flex justify-center">
      <div className="w-[164px] overflow-hidden rounded-[1.4rem] border-[3px] border-slate-200 bg-white">
        <div className="flex items-center justify-between border-b border-slate-100 px-2.5 py-2">
          <span className="text-[9px] font-black text-[#011446]">APPLE BOSS</span>
          <span className="flex flex-col gap-[2px]">
            <span className="block h-[1.5px] w-3 bg-slate-400" />
            <span className="block h-[1.5px] w-3 bg-slate-400" />
          </span>
        </div>
        <div className="px-2.5 py-1.5">
          {visibles.length === 0
            ? <p className="py-3 text-center text-[10px] text-slate-400">Sin enlaces: sale el menú de fábrica.</p>
            : visibles.slice(0, 9).map((i) => (
              <p key={i.id} className="border-b border-slate-100 py-1.5 text-[10px] font-semibold last:border-b-0"
                style={i.myskin ? { color: '#A3BD31' } : { color: '#334155' }}>
                {i.label}
              </p>
            ))}
          {visibles.length > 9 && <p className="py-1.5 text-[10px] text-slate-400">y {visibles.length - 9} más…</p>}
        </div>
      </div>
    </div>
  );
}

function VistaFooter({ items }) {
  const visibles = items.filter((i) => i.active);
  const columnas = [];
  visibles.forEach((i) => {
    const nombre = i.group || 'Otros';
    const col = columnas.find((c) => c.nombre === nombre) ?? (columnas.push({ nombre, links: [] }), columnas[columnas.length - 1]);
    col.links.push(i);
  });

  return (
    <div className="mt-4 rounded-xl p-3" style={{ background: 'var(--ab-navy, #011446)' }}>
      {columnas.length === 0 ? (
        <p className="py-3 text-center text-[10px] text-white/60">Sin enlaces: la tienda muestra el pie de fábrica.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {columnas.slice(0, 3).map((c) => (
            <div key={c.nombre}>
              <p className="mb-1 text-[9px] font-bold uppercase tracking-wider text-white">{c.nombre}</p>
              {c.links.slice(0, 5).map((l) => (
                <p key={l.id} className="text-[10px] leading-relaxed text-white/80">{l.label}</p>
              ))}
              {c.links.length > 5 && <p className="text-[10px] text-white/50">y {c.links.length - 5} más…</p>}
            </div>
          ))}
        </div>
      )}
      {columnas.length > 3 && <p className="mt-2 text-[10px] text-white/50">Hay {columnas.length} columnas: en la tienda se ven todas.</p>}
    </div>
  );
}

export function VistaMenu({ slot, items = [] }) {
  if (slot === 'mobile') return <VistaMobile items={items} />;
  if (slot === 'footer') return <VistaFooter items={items} />;
  return <VistaHeader items={items} />;
}

/** Lo que la tienda muestra siempre, sin pasar por este módulo. */
export function SiempreVisible({ slot }) {
  const fijos = {
    header: ['Comparar iPhone', 'Comparar Mac', 'Comparar cargadores', 'Comparar vidrios'],
    mobile: ['Comparar iPhone', 'Comparar Mac', 'Comparar cargadores', 'Comparar vidrios'],
    footer: ['Las páginas informativas (Nosotros, Garantía…)', 'El WhatsApp y la dirección de la tienda'],
  }[slot] ?? [];

  if (fijos.length === 0) return null;

  return (
    <ul className="mt-3 space-y-1.5">
      {fijos.map((f) => (
        <li key={f} className="flex items-start gap-2 text-[13px] text-slate-600">
          <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden="true" />
          {f}
        </li>
      ))}
    </ul>
  );
}
