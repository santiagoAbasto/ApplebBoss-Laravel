import { Link } from '@inertiajs/react';
import StoreLayout, { StoreContainer } from '@/Layouts/StoreLayout';
import TarjetaNovedad, { columnasNovedades, fechaLarga } from '@/Components/Store/TarjetaNovedad';
import { ArrowLeft, Clock, MessageCircle } from '@/Components/Store/Icons';

// Una novedad (Tienda online → Novedades): título, resumen, fecha y tiempo de lectura; la foto, el texto y otras
// novedades. Los datos para Google (BlogPosting) los arma el servidor.

const PROSA = 'prose prose-slate max-w-none sm:prose-lg prose-headings:font-black prose-headings:tracking-tight prose-a:text-[color:var(--ab-periwinkle)] prose-li:marker:text-[color:var(--ab-periwinkle)]';

function Bloque({ bloque }) {
  switch (bloque.type) {
    case 'text':
      return <div className={PROSA} dangerouslySetInnerHTML={{ __html: bloque.content ?? '' }} />;
    case 'heading':
      return <h2 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>{bloque.content}</h2>;
    case 'quote':
      return (
        <blockquote className="border-l-4 pl-5" style={{ borderColor: 'var(--ab-lime)' }}>
          <p className="text-lg italic leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{bloque.content}</p>
          {bloque.author && <footer className="mt-2 text-sm" style={{ color: 'var(--text-muted)' }}>— {bloque.author}</footer>}
        </blockquote>
      );
    case 'image':
      return (
        <figure>
          <img src={bloque.url} alt={bloque.caption ?? ''} loading="lazy" className="w-full rounded-2xl" />
          {bloque.caption && <figcaption className="mt-2 text-center text-xs" style={{ color: 'var(--text-muted)' }}>{bloque.caption}</figcaption>}
        </figure>
      );
    default:
      return null;
  }
}

/** JSON para una etiqueta <script>: sin «<» literal, así ningún texto puede cerrar la etiqueta. */
const jsonSeguro = (datos) => JSON.stringify(datos).replace(/</g, '\\u003c');

export default function Novedad({ novedad, datosGoogle = {}, relacionadas = [] }) {
  const fecha = fechaLarga(novedad.fecha);
  const direccion = typeof window !== 'undefined' ? window.location.href : '';
  const compartir = `https://wa.me/?text=${encodeURIComponent(`${novedad.titulo} ${direccion}`.trim())}`;
  const conFoto = Boolean(novedad.imagen_grande);

  return (
    <StoreLayout>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonSeguro(datosGoogle) }} />

      <section className="relative overflow-hidden" style={{ background: 'var(--ab-navy)' }}>
        <span aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full" style={{ background: 'rgba(88,94,159,0.35)' }} />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-10 left-[12%] h-28 w-28 rounded-full" style={{ background: 'rgba(198,203,54,0.16)' }} />
        <StoreContainer className={`relative pt-10 md:pt-14 ${conFoto ? 'pb-28 md:pb-40' : 'pb-10 md:pb-14'}`}>
          <div className="mx-auto max-w-3xl">
            <nav aria-label="Ruta" className="mb-4 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
              <Link href="/" className="hover:text-white">Inicio</Link>
              <span className="mx-1.5">/</span>
              <Link href="/novedades" className="hover:text-white">Novedades</Link>
            </nav>
            <h1 className="text-balance break-words text-3xl font-black leading-[1.08] tracking-tight text-white md:text-[46px]">
              {novedad.titulo}
            </h1>
            {novedad.resumen && (
              <p className="mt-4 text-[17px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>{novedad.resumen}</p>
            )}
            <p className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
              {fecha && <time dateTime={novedad.fecha}>{fecha}</time>}
              {novedad.autor && <span>Por {novedad.autor}</span>}
              <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" /> {novedad.minutos} min de lectura</span>
            </p>
          </div>
        </StoreContainer>
      </section>

      <StoreContainer className="pb-16 md:pb-20">
        <div className="mx-auto max-w-4xl">
          {conFoto && (
            // relative z-10: el encabezado es `relative` y, sin esto, se dibuja encima de la foto que sube sobre él
            <div className="relative z-10 -mt-20 overflow-hidden rounded-3xl shadow-[0_30px_60px_-30px_rgba(1,20,70,0.55)] md:-mt-32" style={{ background: 'var(--surface-muted)' }}>
              <img src={novedad.imagen_grande} alt={novedad.titulo} className="aspect-[16/9] w-full object-cover" />
            </div>
          )}

          <article className="mx-auto mt-10 max-w-3xl space-y-6 md:mt-12">
            {(novedad.bloques ?? []).map((bloque, i) => <Bloque key={i} bloque={bloque} />)}
          </article>

          <div className="mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-between gap-3 border-t pt-6" style={{ borderColor: 'var(--border-light)' }}>
            <Link href="/novedades" className="inline-flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-70" style={{ color: 'var(--ab-navy)' }}>
              <ArrowLeft className="h-4 w-4" /> Todas las novedades
            </Link>
            <a
              href={compartir}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-bold transition-colors hover:bg-black/[0.03]"
              style={{ borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }}
            >
              <MessageCircle className="h-4 w-4" /> Compartir por WhatsApp
            </a>
          </div>
        </div>
      </StoreContainer>

      {relacionadas.length > 0 && (
        <section className="py-12 md:py-14" style={{ background: 'var(--surface-muted)' }}>
          <StoreContainer>
            <h2 className="mb-6 text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>Otras novedades</h2>
            <div className={`grid gap-5 ${columnasNovedades(relacionadas.length)}`}>
              {relacionadas.map((n) => <TarjetaNovedad key={n.id} novedad={n} />)}
            </div>
          </StoreContainer>
        </section>
      )}
    </StoreLayout>
  );
}
