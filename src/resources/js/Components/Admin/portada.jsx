import { Link } from '@inertiajs/react';
import {
  ArrowLeftRight, BadgeCheck, Clock, Layers, MapPin, MessageCircle, Package, ScanLine,
  Newspaper, ShieldCheck, Smartphone, Star, Store, Tag, Wrench,
} from 'lucide-react';
import { Badge } from '@/Components/Admin/ui';

// Piezas que comparten el listado y el modal de Tienda online → Portada.

/**
 * Las piezas que sabe dibujar la tienda. No se crean ni se borran: acá solo se encienden, se ordenan y se editan.
 * `fuente` dice de qué módulo sale su contenido.
 */
export const TIPOS = {
  hero: {
    Icon: Store, nombre: 'Portada grande',
    ayuda: 'La parte de arriba, con los equipos que van pasando.',
  },
  trust: {
    Icon: ShieldCheck, nombre: 'Franja de confianza',
    ayuda: 'Los mensajes cortos que pasan debajo de la portada.',
  },
  featured: {
    Icon: Star, nombre: 'Productos destacados',
    ayuda: 'Las publicaciones marcadas como «Destacado».',
    fuente: { label: 'Productos en la tienda', ruta: 'admin.catalogo.index' },
  },
  category_rail: {
    Icon: Package, nombre: 'Accesos a las categorías',
    ayuda: 'El bloque «¿Qué estás buscando?».',
    fuente: { label: 'Categorías', ruta: 'admin.categories.index' },
  },
  category_products: {
    Icon: Smartphone, nombre: 'Productos de una categoría',
    ayuda: 'Un carrusel con lo que hay en una categoría.',
    fuente: { label: 'Categorías', ruta: 'admin.categories.index' },
  },
  myskin: {
    Icon: BadgeCheck, nombre: 'Fundas MYSKIN',
    ayuda: 'Las fundas marcadas como MYSKIN al publicarlas.',
    fuente: { label: 'Productos en la tienda', ruta: 'admin.catalogo.index' },
  },
  semiused: {
    Icon: ScanLine, nombre: 'Seminuevos',
    ayuda: 'Equipos con condición Seminuevo u Open Box.',
    fuente: { label: 'Productos en la tienda', ruta: 'admin.catalogo.index' },
  },
  trade_in: {
    Icon: ArrowLeftRight, nombre: 'Trade-In',
    ayuda: 'La invitación a entregar un equipo como parte de pago.',
  },
  product_collection: {
    Icon: Layers, nombre: 'Colección de productos',
    ayuda: 'Una vitrina armada a mano.',
    fuente: { label: 'Colecciones', ruta: 'admin.collections.index' },
  },
  new_arrivals: {
    Icon: Clock, nombre: 'Nuevos ingresos',
    ayuda: 'Las últimas publicaciones que subiste.',
    fuente: { label: 'Productos en la tienda', ruta: 'admin.catalogo.index' },
  },
  offers: {
    Icon: Tag, nombre: 'Ofertas',
    ayuda: 'Publicaciones con precio promocional vigente.',
    fuente: { label: 'Productos en la tienda', ruta: 'admin.catalogo.index' },
  },
  services: {
    Icon: Wrench, nombre: 'Servicios',
    ayuda: 'Las tarjetas con lo que ofreces además de vender equipos.',
    fuente: { label: 'Servicios', ruta: 'admin.services.index' },
  },
  location: {
    Icon: MapPin, nombre: 'Dónde estamos',
    ayuda: 'Tus locales, con la dirección, el horario y el mapa.',
    fuente: { label: 'Ubicaciones', ruta: 'admin.locations.index' },
  },
  news: {
    Icon: Newspaper, nombre: 'Novedades',
    ayuda: 'Las novedades publicadas más nuevas, con su foto y su resumen.',
    fuente: { label: 'Novedades', ruta: 'admin.novedades.index' },
  },
  faq: {
    Icon: MessageCircle, nombre: 'Preguntas frecuentes',
    ayuda: 'Las preguntas que más te hacen.',
    fuente: { label: 'Preguntas frecuentes', ruta: 'admin.faqs.index' },
  },
  reviews: {
    Icon: Star, nombre: 'Reseñas',
    ayuda: 'Las opiniones de tus clientes que aprobaste, pasando una por una.',
    fuente: { label: 'Reseñas', ruta: 'admin.resenas.index' },
  },
};

export const metaDe = (tipo) => TIPOS[tipo] ?? { Icon: Package, nombre: tipo, ayuda: '' };

/** Orden sugerido: el mismo del menú de la tienda. */
export const ORDEN_MENU = [
  ['hero'], ['trust'], ['featured'], ['category_rail'],
  ['category_products', 'celulares'], ['category_products', 'computadoras'], ['category_products', 'productos-apple'],
  ['myskin'], ['category_products', 'accesorios'], ['semiused'], ['trade_in'],
  ['product_collection'], ['new_arrivals'], ['offers'], ['services'], ['location'], ['news'], ['faq'], ['reviews'],
];

export function rangoMenu(section) {
  const i = ORDEN_MENU.findIndex(([tipo, cat]) => tipo === section.type && (!cat || section.settings?.categoria === cat));
  return i === -1 ? ORDEN_MENU.length : i;
}

export function EstadoSeccion({ section }) {
  if (!section.active) return <Badge tone="slate">Apagada</Badge>;
  if (section.publicar_desde || section.publicar_hasta) {
    return section.se_ve ? <Badge tone="lila">Con fechas</Badge> : <Badge tone="amber">Fuera de fecha</Badge>;
  }
  if (!section.se_ve) return <Badge tone="amber">Sin contenido</Badge>;
  return <Badge tone="emerald">Se ve</Badge>;
}

/** El inicio como queda hoy: solo las secciones que de verdad se dibujan, en orden. */
export function VistaInicio({ sections = [] }) {
  const visibles = sections.filter((s) => s.se_ve);

  if (visibles.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-[13px] text-slate-500">
        Hoy el inicio no muestra ninguna sección.
      </p>
    );
  }

  return (
    <ol className="mt-4 space-y-1.5">
      {visibles.map((s, i) => {
        const meta = metaDe(s.type);
        return (
          <li key={s.id} className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2">
            <span className="w-4 shrink-0 text-center text-[11px] font-bold tabular-nums text-slate-400">{i + 1}</span>
            <meta.Icon className="h-4 w-4 shrink-0 text-[#585E9F]" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-slate-800">{s.titulo}</span>
            {s.cantidad !== null && s.cantidad !== undefined && (
              <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-400">{s.cantidad}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Los módulos que llenan la portada. */
export function FuentesDeContenido({ ruta }) {
  const modulos = [
    ['Productos en la tienda', 'admin.catalogo.index', 'Destacados, nuevos ingresos, ofertas, seminuevos y MYSKIN.'],
    ['Categorías', 'admin.categories.index', 'Los accesos del inicio y los carruseles por categoría.'],
    ['Colecciones', 'admin.collections.index', 'Las vitrinas armadas a mano.'],
    ['Servicios', 'admin.services.index', 'Las tarjetas de «Nuestros servicios» y su botón.'],
    ['Ubicaciones', 'admin.locations.index', 'Tus locales: dirección, horario, contacto y mapa.'],
    ['Novedades', 'admin.novedades.index', 'Las publicaciones con fecha: lo que llegó, guías y avisos.'],
    ['Preguntas frecuentes', 'admin.faqs.index', 'Las preguntas del final.'],
    ['Reseñas', 'admin.resenas.index', 'Las opiniones de tus clientes, después de las preguntas.'],
  ];

  return (
    <ul className="mt-3 space-y-2">
      {modulos.map(([label, nombre, ayuda]) => (
        <li key={nombre}>
          <Link href={ruta(nombre)} className="block rounded-xl px-3 py-2 transition-colors hover:bg-slate-50">
            <span className="text-[13px] font-bold text-slate-800">{label}</span>
            <span className="mt-0.5 block text-xs text-slate-500">{ayuda}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
