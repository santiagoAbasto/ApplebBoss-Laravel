import { Link } from '@inertiajs/react';
import StoreLayout, { StoreContainer, money, useStoreCart, useWhatsApp } from '@/Layouts/StoreLayout';
import ModeloVisual from '@/Components/Store/ModeloVisual';
import ProductCard from '@/Components/Store/ProductCard';
import { FichaTecnica } from '@/Components/Store/fichaTecnica';
import { esClaro, tonoDe } from '@/Components/Store/tonosColor';
import { ArrowRight, ChevronDown, ChevronRight, GitCompare, MessageCircle } from '@/Components/Store/Icons';

// La página permanente de un modelo (/iphone/iphone-15-pro-max). La ficha técnica sale de la base de modelos de
// referencia; el precio y el stock, del inventario de hoy. Sin stock la página sigue en pie y ofrece consultar.

const ANCLA = { scrollMarginTop: 'calc(var(--alto-header, 0px) + 64px)' };

// El carrito vive dentro de StoreLayout: el contenido que usa useStoreCart va en un componente hijo.
export default function Modelo(props) {
  return (
    <StoreLayout>
      <ModeloContenido {...props} />
    </StoreLayout>
  );
}

function Disponibilidad({ modelo, comparar, accesorio }) {
  const wa = useWhatsApp();
  const { oferta } = modelo;
  const waUrl = wa.enabled ? wa.url(`${wa.saludo} busco un ${modelo.nombre}. ¿Lo pueden conseguir?`) : null;

  return (
    <div className="mt-6 rounded-2xl p-5" style={{ background: oferta ? 'rgba(198,203,54,0.16)' : 'var(--surface-muted)' }}>
      {oferta ? (
        <>
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#3A3F00' }}>En tienda hoy</p>
          <p className="mt-1 text-3xl font-black tabular-nums tracking-tight" style={{ color: 'var(--ab-navy)' }}>
            {oferta.unidades > 1 && <span className="mr-1.5 text-base font-bold">Desde</span>}{money(oferta.desde)}
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {accesorio
              ? `${oferta.unidades.toLocaleString('es-BO')} en stock`
              : `${oferta.unidades} ${oferta.unidades === 1 ? 'equipo disponible' : 'equipos disponibles'}`}
            {oferta.condiciones.length > 0 && ` · ${oferta.condiciones.join(' y ')}`}
          </p>
        </>
      ) : (
        <>
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Sin stock ahora</p>
          <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Hoy no tenemos este modelo en la tienda. Escríbenos y te decimos si lo podemos conseguir.
          </p>
        </>
      )}

      <div className="mt-4 flex flex-wrap gap-2.5">
        {oferta && (
          <a href="#disponibles" className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--ab-navy)' }}>
            {oferta.unidades === 1 ? 'Ver el disponible' : 'Ver los disponibles'} <ArrowRight className="h-4 w-4" />
          </a>
        )}
        {!oferta && waUrl && (
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--ab-navy)' }}>
            <MessageCircle className="h-4 w-4" /> Consultar por WhatsApp
          </a>
        )}
        <Link href={comparar} className="inline-flex items-center gap-2 rounded-full border bg-white px-5 py-2.5 text-sm font-bold transition-colors hover:bg-black/5"
          style={{ borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }}>
          <GitCompare className="h-4 w-4" /> Comparar
        </Link>
      </div>
    </div>
  );
}

function ModeloContenido({ modelo, familia, products = [], comparar, otros = [], faqs = [] }) {
  const { add } = useStoreCart();
  const colores = modelo.specs.colores_disponibles ?? [];
  const capacidades = modelo.specs.capacidades_disponibles ?? [];
  const accesorio = familia.tipo === 'producto_general';

  return (
    <StoreContainer>
      <nav aria-label="Ruta" className="flex min-w-0 items-center gap-1.5 py-5 text-[13px] font-semibold" style={{ color: 'var(--text-muted)' }}>
        <Link href="/" className="hover:underline">Inicio</Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <Link href={familia.volver.url} className="hover:underline">{familia.volver.nombre}</Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{modelo.nombre}</span>
      </nav>

      <section className="grid items-center gap-8 pb-12 md:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] md:gap-12">
        {/* En celulares va primero el título con el precio y después la imagen */}
        <ModeloVisual modelo={modelo} tipo={familia.tipo} className="order-2 mx-auto aspect-[5/6] w-full max-w-[280px] rounded-3xl md:order-1 md:max-w-[420px]" />

        <div className="order-1 min-w-0 md:order-2">
          <p className="text-xs font-bold" style={{ color: 'var(--ab-periwinkle)' }}>{modelo.etiqueta ?? modelo.anio}</p>
          <h1 className="mt-1 text-3xl font-black leading-tight tracking-tight sm:text-4xl" style={{ color: 'var(--text-primary)' }}>
            {modelo.titulo}
          </h1>

          {colores.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1">
              <ul className="flex flex-wrap gap-1.5" aria-label={`Colores: ${colores.join(', ')}`}>
                {colores.map((c) => {
                  const tono = tonoDe(c, modelo.nombre);
                  return tono && (
                    <li key={c} title={c} className="h-5 w-5 rounded-full"
                      style={{ background: tono, boxShadow: `inset 0 0 0 1px ${esClaro(tono) ? 'rgba(1,20,70,0.22)' : 'rgba(0,0,0,0.10)'}` }} />
                  );
                })}
              </ul>
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{colores.join(' · ')}</span>
            </div>
          )}
          {capacidades.length > 0 && (
            <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{capacidades.join(' · ')}</p>
          )}

          <Disponibilidad modelo={modelo} comparar={comparar} accesorio={accesorio} />
        </div>
      </section>

      {products.length > 0 && (
        <section id="disponibles" className="border-t py-12" style={{ borderColor: 'var(--border-light)', ...ANCLA }}>
          <h2 className="mb-6 text-xl font-black" style={{ color: 'var(--text-primary)' }}>{modelo.nombre} disponibles hoy</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => <ProductCard key={p.key} product={p} onAdd={add} />)}
          </div>
        </section>
      )}

      <section id="ficha" className="border-t py-12" style={{ borderColor: 'var(--border-light)', ...ANCLA }}>
        <h2 className="mb-6 text-xl font-black" style={{ color: 'var(--text-primary)' }}>Ficha técnica del {modelo.nombre}</h2>
        <FichaTecnica tipo={familia.tipo} atributos={modelo.specs} />

        <Link href={comparar}
          className="group mt-10 flex flex-col items-start justify-between gap-4 rounded-3xl p-5 transition-colors sm:flex-row sm:items-center sm:p-6"
          style={{ background: 'var(--surface-muted)' }}>
          <span>
            <span className="block text-base font-extrabold" style={{ color: 'var(--text-primary)' }}>¿Dudas entre modelos?</span>
            <span className="mt-0.5 block text-sm" style={{ color: 'var(--text-secondary)' }}>
              Compara el {modelo.nombre} con otros, lado a lado, con el precio de los que tenemos en tienda.
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition-opacity group-hover:opacity-90"
            style={{ background: 'var(--ab-navy)' }}>
            <GitCompare className="h-4 w-4" /> Comparar {familia.nombre}
          </span>
        </Link>
      </section>

      {otros.length > 0 && (
        <section className="border-t py-12" style={{ borderColor: 'var(--border-light)' }}>
          <h2 className="mb-5 text-xl font-black" style={{ color: 'var(--text-primary)' }}>Otros modelos</h2>
          <ul className="flex flex-wrap gap-2.5">
            {otros.map((o) => (
              <li key={o.url}>
                <Link href={o.url} className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-semibold transition-colors hover:bg-black/5"
                  style={{ borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }}>
                  {o.en_tienda && <span className="h-2 w-2 rounded-full" style={{ background: 'var(--ab-lime)' }} title="Disponible en la tienda" />}
                  {o.nombre}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Preguntas: se cargan en el panel; sin preguntas, la sección no se dibuja */}
      {faqs.length > 0 && (
        <section className="border-t py-12" style={{ borderColor: 'var(--border-light)' }}>
          <h2 className="mb-4 text-xl font-black" style={{ color: 'var(--text-primary)' }}>Preguntas frecuentes</h2>
          {faqs.map(({ id, question, answer }) => (
            <details key={id} className="group border-b py-4" style={{ borderColor: 'var(--border-light)' }}>
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {question}
                <ChevronDown className="ml-4 h-4 w-4 shrink-0 transition-transform group-open:rotate-180" style={{ color: 'var(--text-muted)' }} />
              </summary>
              <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>{answer}</p>
            </details>
          ))}
        </section>
      )}
    </StoreContainer>
  );
}
