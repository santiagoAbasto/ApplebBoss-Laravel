import { Link } from '@inertiajs/react';
import { ArrowRight, Clock } from '@/Components/Store/Icons';
import { useNombreTienda } from '@/Components/Store/tienda';

// La tarjeta de una novedad (Tienda online → Novedades). La comparten el inicio, /novedades, «Otras novedades» y la
// vista previa del panel: el mismo título, foto, fecha y resumen que ve el cliente.

/** «16 de septiembre de 2026», en hora de Bolivia (una novedad de las 23:00 no cambia de día). */
export function fechaLarga(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('es-BO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/La_Paz' });
}

/** Columnas según cuántas hay, para que en la computadora no quede una tarjeta suelta en la última fila. */
export function columnasNovedades(cantidad) {
  if (cantidad <= 1) return 'max-w-xl';
  if (cantidad === 2) return 'sm:grid-cols-2 lg:max-w-4xl';
  if (cantidad === 4) return 'sm:grid-cols-2 lg:grid-cols-4';
  return 'sm:grid-cols-2 lg:grid-cols-3';
}

/** Sin foto: el fondo de la marca, con los círculos del encabezado de las páginas. */
function SinFoto() {
  const nombre = useNombreTienda();

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: 'var(--ab-navy)' }} aria-hidden="true">
      <span className="absolute -right-10 -top-12 h-44 w-44 rounded-full" style={{ background: 'rgba(88,94,159,0.35)' }} />
      <span className="absolute -bottom-6 left-[30%] h-20 w-20 rounded-full" style={{ background: 'rgba(198,203,54,0.16)' }} />
      <span className="absolute bottom-4 left-5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">{nombre}</span>
    </div>
  );
}

/**
 * `grande`: la más nueva de /novedades, con la foto al costado en la computadora.
 * `vistaPrevia`: la dibuja igual, pero sin enlace (para el panel).
 */
export default function TarjetaNovedad({ novedad, grande = false, vistaPrevia = false }) {
  const fecha = fechaLarga(novedad.fecha);
  const Envoltura = vistaPrevia ? 'div' : Link;
  const enlace = vistaPrevia ? {} : { href: novedad.url };
  const Titulo = grande ? 'h2' : 'h3';

  return (
    <article className="group h-full min-w-0">
      <Envoltura
        {...enlace}
        className={`flex h-full overflow-hidden rounded-3xl border bg-white transition-shadow duration-300 ${grande ? 'flex-col lg:flex-row' : 'flex-col'} ${vistaPrevia ? '' : 'hover:shadow-[0_22px_44px_-28px_rgba(1,20,70,0.5)]'}`}
        style={{ borderColor: 'var(--border-light)' }}
      >
        <div
          className={`relative shrink-0 overflow-hidden ${grande ? 'aspect-[16/9] lg:aspect-auto lg:min-h-[360px] lg:w-[58%]' : 'aspect-[16/9]'}`}
          style={{ background: 'var(--surface-muted)' }}
        >
          {novedad.imagen ? (
            <img
              src={novedad.imagen}
              alt=""
              loading={grande ? 'eager' : 'lazy'}
              className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 ${vistaPrevia ? '' : 'group-hover:scale-[1.03]'}`}
            />
          ) : <SinFoto />}
        </div>

        <div className={`flex min-w-0 flex-1 flex-col ${grande ? 'p-6 sm:p-8 lg:justify-center lg:p-10' : 'p-5'}`}>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            {fecha && <time dateTime={novedad.fecha}>{fecha}</time>}
            {novedad.minutos > 0 && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {novedad.minutos} min de lectura
              </span>
            )}
          </p>
          <Titulo
            className={`mt-2 break-words font-black leading-snug tracking-tight ${grande ? 'text-2xl sm:text-[32px] sm:leading-tight' : 'line-clamp-3 text-lg'}`}
            style={{ color: 'var(--text-primary)' }}
          >
            {novedad.titulo || 'Sin título'}
          </Titulo>
          {novedad.resumen && (
            <p className={`mt-2 text-sm leading-relaxed ${grande ? 'sm:text-[15px]' : 'line-clamp-3'}`} style={{ color: 'var(--text-secondary)' }}>
              {novedad.resumen}
            </p>
          )}
          <span className={`inline-flex items-center gap-1.5 text-sm font-bold ${grande ? 'pt-6' : 'mt-auto pt-5'}`} style={{ color: 'var(--ab-navy)' }}>
            Leer la novedad <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Envoltura>
    </article>
  );
}
