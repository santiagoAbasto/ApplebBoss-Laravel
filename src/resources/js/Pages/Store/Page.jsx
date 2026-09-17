import { Link, usePage } from '@inertiajs/react';
import { motion } from 'framer-motion';
import StoreLayout, { StoreContainer, useWhatsApp } from '@/Layouts/StoreLayout';
import { ArrowRight, MessageCircle } from '@/Components/Store/Icons';
import Reveal from '@/Components/Store/Reveal';

export default function StorePage({ page }) {
  const { paginas = [] } = usePage().props;
  const wa = useWhatsApp();
  const current = typeof window !== 'undefined' ? window.location.pathname : '';

  return (
    <StoreLayout>
      {/* Encabezado de la página */}
      <section className="relative overflow-hidden" style={{ background: 'var(--ab-navy)' }}>
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full"
          style={{ background: 'rgba(88,94,159,0.35)' }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[-40px] left-[42%] h-28 w-28 rounded-full"
          style={{ background: 'rgba(198,203,54,0.16)' }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <StoreContainer className="relative py-10 md:py-12">
          <nav aria-label="Ruta" className="mb-3 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
            <Link href="/" className="hover:text-white">Inicio</Link>
            <span className="mx-1.5">/</span>
            <span className="text-white">{page.title}</span>
          </nav>
          <motion.h1
            className="text-3xl font-black leading-tight tracking-tight text-white md:text-[40px]"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {page.title}
          </motion.h1>
        </StoreContainer>
      </section>

      <StoreContainer className="py-10 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <Reveal>
            <article className="rounded-3xl border bg-white p-6 md:p-10" style={{ borderColor: 'var(--border-light)' }}>
              {page.content ? (
                <div
                  className="prose prose-slate max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h2:mt-0 prose-a:text-[color:var(--ab-periwinkle)]"
                  dangerouslySetInnerHTML={{ __html: page.content }}
                />
              ) : (
                <p className="text-slate-400">Esta página no tiene contenido todavía.</p>
              )}
            </article>
          </Reveal>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
            {paginas.length > 1 && (
              <Reveal delay={0.08} className="rounded-3xl border border-slate-200 bg-white p-5">
                <p className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--ab-periwinkle)' }}>
                  Información
                </p>
                <ul>
                  {paginas.map((p) => {
                    const active = p.href === current;
                    return (
                      <li key={p.href}>
                        <Link
                          href={p.href}
                          className="group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-slate-50"
                          style={active ? { background: 'var(--surface-muted)', color: 'var(--ab-navy)' } : { color: 'var(--text-secondary)' }}
                          aria-current={active ? 'page' : undefined}
                        >
                          {p.title}
                          <ArrowRight className="h-3.5 w-3.5 opacity-40 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Reveal>
            )}

            <Reveal delay={0.16}>
              <div className="rounded-3xl p-6" style={{ background: 'var(--ab-navy)' }}>
                <p className="text-base font-black text-white">¿Tienes una consulta?</p>
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  Te atendemos personalmente en nuestra tienda.
                </p>
                {wa.enabled && wa.number ? (
                  <a
                    href={wa.url(`${wa.saludo} tengo una consulta sobre «${page.title}»`)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-opacity hover:opacity-90"
                    style={{ background: 'var(--ab-lime)', color: 'var(--text-on-lime)' }}
                  >
                    <MessageCircle className="h-4 w-4" /> Escríbenos
                  </a>
                ) : (
                  <Link
                    href="/#contacto"
                    className="mt-4 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold transition-opacity hover:opacity-90"
                    style={{ background: 'var(--ab-lime)', color: 'var(--text-on-lime)' }}
                  >
                    Cómo llegar <ArrowRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </Reveal>
          </aside>
        </div>
      </StoreContainer>
    </StoreLayout>
  );
}
