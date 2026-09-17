import { route } from 'ziggy-js';
import { AlertCircle, BadgeCheck, CalendarClock, CheckCircle2, EyeOff, FileClock, Image as ImageIcon, PackageOpen, Sparkles, Wrench } from 'lucide-react';
import { Badge, bsFmt } from '@/Components/Admin/ui';

// Piezas compartidas de las pantallas de «Productos en la tienda» (listado, agregar y editor).

export const CATEGORIAS = [
  { value: 'celulares', label: 'Celulares' },
  { value: 'computadoras', label: 'Computadoras' },
  { value: 'productos-apple', label: 'Productos Apple' },
  { value: 'fundas', label: 'Fundas' },
  { value: 'accesorios', label: 'Accesorios' },
];

export const categoriaTexto = (v) => CATEGORIAS.find((c) => c.value === v)?.label ?? v ?? '—';

// Condiciones que acepta la tienda (el inventario solo guarda Nuevo o Seminuevo)
export const CONDICIONES_TIENDA = [
  { value: 'Nuevo', label: 'Nuevo', icon: Sparkles, ayuda: 'Sin uso, en su caja.' },
  { value: 'Seminuevo', label: 'Seminuevo', icon: BadgeCheck, ayuda: 'Usado, revisado y funcionando bien.' },
  { value: 'Open Box', label: 'Open Box', icon: PackageOpen, ayuda: 'Caja abierta, con uso mínimo o sin uso.' },
  { value: 'Reacondicionado', label: 'Reacondicionado', icon: Wrench, ayuda: 'Reparado o restaurado para la venta.' },
];

export const MARCAS = [
  { value: 'APPLE_BOSS', label: 'Apple Boss' },
  { value: 'MYSKIN', label: 'MYSKIN' },
];

// Estado que calcula el servidor (CatalogoPublicacion::estadoPublicacion)
const ESTADOS = {
  Publicado: { label: 'En la tienda', tone: 'emerald', icon: CheckCircle2 },
  Borrador: { label: 'Borrador', tone: 'slate', icon: FileClock },
  Incompleto: { label: 'Falta completar', tone: 'amber', icon: AlertCircle },
  Programado: { label: 'Programado', tone: 'blue', icon: CalendarClock },
  Oculto: { label: 'Oculto', tone: 'slate', icon: EyeOff },
};

export function EstadoPublicacionBadge({ estado }) {
  const e = ESTADOS[estado] ?? { label: estado, tone: 'slate', icon: FileClock };
  const Icon = e.icon;
  return <Badge tone={e.tone}><Icon className="h-3 w-3" /> {e.label}</Badge>;
}

export const MyskinBadge = () => (
  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wide" style={{ background: '#A3BD31', color: '#0C1B47' }}>MYSKIN</span>
);

/** Pantalla de inventario de cada tipo, para editar precio o estado. */
export const inventarioUrl = (tipo, id) => {
  const rutas = {
    celular: 'admin.celulares.edit',
    computadora: 'admin.computadoras.edit',
    producto_apple: 'admin.productos-apple.edit',
    producto_general: 'admin.productos-generales.edit',
  };
  return rutas[tipo] ? route(rutas[tipo], id) : null;
};

export const tiendaUrl = (slug) => (slug ? route('store.product', slug) : null);

/** Lo mismo que CatalogoPublicacion::camposFaltantes(), calculado mientras se edita. */
export function faltantesDe(d, precioInventario) {
  const f = [];
  if (!d.titulo?.trim()) f.push('Nombre del producto');
  if (!d.slug?.trim()) f.push('Dirección web');
  if (!d.resumen?.trim()) f.push('Descripción corta');
  if (!d.categoria) f.push('Categoría');
  if (!d.condicion) f.push('Condición (Nuevo, Seminuevo…)');
  if (!precioInventario) f.push('Precio de venta en el inventario');
  return f;
}

export const slugDe = (texto) => String(texto ?? '')
  .toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9\s-]/g, '')
  .trim().replace(/\s+/g, '-').replace(/-+/g, '-');

/** Fecha del servidor (ISO) al formato del campo datetime-local, en la hora local. */
export function fechaParaCampo(valor) {
  if (!valor) return '';
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor)) return valor;
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Tarjeta como se ve en el catálogo público. */
export function TarjetaTienda({ titulo, resumen, imagen, precio, promo, badge, condicion }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="relative aspect-square bg-slate-50">
        {imagen
          ? <img src={imagen} alt="" className="h-full w-full object-contain p-3" />
          : <div className="grid h-full w-full place-items-center text-slate-300"><ImageIcon className="h-10 w-10" /></div>}
        {badge && (
          <span className="absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-[10px] font-extrabold" style={{ background: '#C6CB36', color: '#0D0D1A' }}>{badge}</span>
        )}
        {condicion && <span className="absolute right-3 top-3"><Badge tone={condicion === 'Nuevo' ? 'navy' : 'lila'}>{condicion}</Badge></span>}
      </div>
      <div className="p-4">
        <p className="line-clamp-2 text-sm font-bold text-[#011446]">{titulo || 'Sin nombre'}</p>
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{resumen || 'Sin descripción corta'}</p>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-extrabold tabular-nums text-[#011446]">{bsFmt(promo || precio)}</span>
          {promo > 0 && precio > 0 && <span className="text-xs tabular-nums text-slate-400 line-through">{bsFmt(precio)}</span>}
        </div>
      </div>
    </div>
  );
}
