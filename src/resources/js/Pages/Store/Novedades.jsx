import { Link } from '@inertiajs/react';
import { motion } from 'framer-motion';
import StoreLayout, { StoreContainer } from '@/Layouts/StoreLayout';
import Reveal from '@/Components/Store/Reveal';
import TarjetaNovedad from '@/Components/Store/TarjetaNovedad';
import { ArrowRight } from '@/Components/Store/Icons';
import { useNombreTienda } from '@/Components/Store/tienda';

// /novedades: las novedades publicadas, de la más nueva a la más vieja (Tienda online → Novedades). La más nueva va
// grande arriba. Sin novedades muestra un aviso; el enlace del pie y el sitemap se ocultan solos hasta la primera.

export default function Novedades({ novedades = [] }) {
  const nombre = useNombreTienda();
  const [primera, ...resto] = novedades;

  return (
    <StoreLayout>
      <section className="relative overflow-hidden" style={{ background: 'var(--ab-navy)' }}>
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full"
          style={{ background: 'rgba(88,94,159,0.35)' }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
        <span aria-hidden="true" className="pointer-events-none absolute -bottom-10 left-[42%] h-28 w-28 rounded-full" style={{ background: 'rgba(198,203,54,0.16)' }} />
        <StoreContainer className="relative py-10 md:py-14">
          <nav aria-label="Ruta" className="mb-3 text-xs font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
            <Link href="/" className="hover:text-white">Inicio</Link>
            <span className="mx-1.5">/</span>
            <span className="text-white">Novedades</span>
          </nav>
          <h1 className="text-3xl font-black leading-tight tracking-tight text-white md:text-[44px]">Novedades</h1>
          <p className="mt-2 max-w-xl text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Lo último que publicamos en {nombre}.
          </p>
        </StoreContainer>
      </section>

      <StoreContainer className="py-10 md:py-14">
        {!primera ? (
          <div className="mx-auto max-w-md py-12 text-center">
            <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Todavía no hay novedades publicadas.</p>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>Mientras tanto, mira lo que tenemos a la venta.</p>
            <Link
              href="/catalogo"
              className="mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--ab-navy)' }}
            >
              Ver el catálogo <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-8 md:space-y-10">
            <Reveal>
              <TarjetaNovedad novedad={primera} grande />
            </Reveal>
            {resto.length > 0 && (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {resto.map((n, i) => (
                  <Reveal key={n.id} delay={Math.min(i, 5) * 0.05} className="h-full">
                    <TarjetaNovedad novedad={n} />
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        )}
      </StoreContainer>
    </StoreLayout>
  );
}
