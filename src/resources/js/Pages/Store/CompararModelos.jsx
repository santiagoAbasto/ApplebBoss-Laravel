import { Link, router } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import StoreLayout, { StoreContainer, money, useWhatsApp } from '@/Layouts/StoreLayout';
import ModeloVisual from '@/Components/Store/ModeloVisual';
import {
  LIMITE_LISTA, clave, conMayuscula, esencialesDe, formatoDe, noTiene, partesDe, partir, seccionesComparativa,
} from '@/Components/Store/comparativa';
import { esClaro, tonoDe } from '@/Components/Store/tonosColor';
import { ArrowLeft, ArrowRight, Check, ChevronDown, Info, MessageCircle, Minus, Plus, X } from '@/Components/Store/Icons';
import { useNombreTienda } from '@/Components/Store/tienda';

// Comparativa pública de modelos (hasta 4). Los datos técnicos vienen de la base de modelos de referencia; el precio
// y el stock los calcula el servidor desde el inventario. Sirve para iPhone (/comparar/iphone) y Mac (/comparar/mac):
// las filas salen de la ficha técnica del tipo.

// Columnas: desde pantallas medianas siempre `maximo`, para que tengan el mismo ancho con uno o con cuatro modelos. En
// celulares, los elegidos y el espacio para agregar, a 40vw cada uno: se ven dos, asoma la siguiente y se desliza de
// costado. Las variables (--cols, --cols-md y --ancho-movil) las pone `varsGrid`.
const GRID = 'grid gap-x-4 sm:gap-x-6 grid-cols-[repeat(var(--cols),minmax(0,1fr))] md:grid-cols-[repeat(var(--cols-md),minmax(0,1fr))]';
const ANCHO = 'min-w-[var(--ancho-movil)] md:min-w-0';
// Lo que queda fijo a la izquierda cuando la tabla se desliza de costado (títulos de sección y de fila). En celulares
// no puede ser más ancho que la pantalla, o el texto quedaría fuera de la vista.
const FIJO = 'sticky left-4 sm:left-0';
const ANCHO_ROTULO = 'max-w-[calc(100vw-2rem)] sm:max-w-[calc(100vw-3.5rem)] md:max-w-none';
// Cada valor cuelga de una línea vertical: así se lee como la columna de su modelo.
const CELDA = 'min-w-0 border-l-2 pl-3 sm:pl-4';

const precioTexto = (oferta) => (oferta.unidades > 1 ? `Desde ${money(oferta.desde)}` : money(oferta.desde));

function varsGrid(columnas, maximo) {
  return { '--cols': columnas, '--cols-md': maximo, '--ancho-movil': `calc(${columnas} * 40vw + ${columnas - 1}rem)` };
}

/** Opciones del selector agrupadas: por año en iPhone y Mac; en los accesorios, por su grupo («Originales de Apple»). */
function agruparPorAnio(opciones) {
  const grupos = [];
  for (const o of opciones) {
    const nombre = o.grupo ?? String(o.anio);
    const ultimo = grupos[grupos.length - 1];
    if (ultimo && ultimo.anio === nombre) ultimo.lista.push(o);
    else grupos.push({ anio: nombre, lista: [o] });
  }
  return grupos;
}

/**
 * Línea de un modelo: en iPhone numerados, «iPhone 14 Plus» y «iPhone 16 Plus» son de la misma (los demás, Air, SE o X,
 * no tienen); en Mac, la familia («MacBook Air», «MacBook Pro», «iMac»).
 */
const lineaDe = (nombre) => {
  const iphone = nombre.match(/^iPhone (\d+)(e?)(?: (.+))?$/);
  if (iphone) return `${iphone[2]}|${iphone[3] ?? ''}`;
  return nombre.match(/^(MacBook(?: Air| Pro| Neo)?|iMac)\b/)?.[1] ?? null;
};

/** Para agregar rápido: primero lo que hay en tienda, después la misma línea del primer modelo y después lo más nuevo. */
function sugerencias(opciones, seleccion, cantidad = 4) {
  const elegidos = new Set(seleccion.map((m) => m.slug));
  const linea = seleccion[0] ? lineaDe(seleccion[0].nombre) : null;
  const vistos = new Set();
  return [
    ...opciones.filter((o) => o.en_tienda),
    ...(linea ? opciones.filter((o) => lineaDe(o.nombre) === linea) : []),
    ...opciones,
  ].filter((o) => !elegidos.has(o.slug) && !vistos.has(o.slug) && vistos.add(o.slug)).slice(0, cantidad);
}

/** Alto del header de la tienda (es sticky y cambia con el ancho de pantalla): la barra de modelos va justo debajo. */
function useAltoHeader() {
  const [alto, setAlto] = useState(0);
  useEffect(() => {
    const header = document.querySelector('[data-header-tienda]');
    if (!header) return undefined;
    const medir = () => setAlto(Math.round(header.getBoundingClientRect().height));
    medir();
    const observer = new ResizeObserver(medir);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);
  return alto;
}

/** Celdas vacías hasta completar la fila: la del espacio para agregar y, desde pantallas medianas, el resto hasta `maximo`. */
function Huecos({ usados, maximo, primero = null }) {
  if (usados >= maximo) return null;
  return (
    <>
      {primero ?? <div aria-hidden="true" />}
      {Array.from({ length: maximo - usados - 1 }, (_, i) => <div key={i} aria-hidden="true" className="hidden md:block" />)}
    </>
  );
}

/** Muestra de un color. Sin tono conocido no se dibuja nada (o, con `hueco`, un aro vacío para no descuadrar la lista). */
function Muestra({ color, modelo, className = 'h-3.5 w-3.5', hueco = false }) {
  const tono = tonoDe(color, modelo);
  if (!tono) {
    return hueco ? <span aria-hidden="true" className={`inline-block shrink-0 rounded-full border border-dashed ${className}`} style={{ borderColor: 'var(--border-medium)' }} /> : null;
  }
  return (
    <span aria-hidden="true" className={`inline-block shrink-0 rounded-full ${className}`}
      style={{ background: tono, boxShadow: `inset 0 0 0 1px ${esClaro(tono) ? 'rgba(1,20,70,0.22)' : 'rgba(0,0,0,0.10)'}` }} />
  );
}

function SelectorModelo({ grupos, enTienda, valor = null, ocupados, onChange, etiqueta }) {
  const ocupado = (slug) => slug !== valor && ocupados.includes(slug);
  return (
    <label className="relative block min-w-0">
      <span className="sr-only">{etiqueta}</span>
      <select
        value={valor ?? ''}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="w-full cursor-pointer appearance-none truncate rounded-full border bg-white py-2.5 pl-4 pr-9 text-sm font-bold focus:outline-none focus-visible:ring-2"
        style={{ borderColor: 'var(--border-medium)', color: 'var(--text-primary)', '--tw-ring-color': 'var(--ab-periwinkle)', backgroundImage: 'none' }}
      >
        {!valor && <option value="">Elegir modelo</option>}
        {enTienda.length > 0 && (
          <optgroup label="En tienda ahora">
            {enTienda.map((o) => (
              <option key={`tienda-${o.slug}`} value={o.slug} disabled={ocupado(o.slug)}>{o.nombre}</option>
            ))}
          </optgroup>
        )}
        {grupos.map(({ anio, lista }) => (
          <optgroup key={anio} label={String(anio)}>
            {lista.map((o) => (
              <option key={o.slug} value={o.slug} disabled={ocupado(o.slug)}>{o.nombre}</option>
            ))}
          </optgroup>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
    </label>
  );
}

function Interruptor({ activo, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={activo} onClick={() => onChange(!activo)}
      className="inline-flex items-center gap-2.5 self-start rounded-full border bg-white py-1.5 pl-1.5 pr-4 text-sm font-bold"
      style={{ borderColor: activo ? 'var(--ab-navy)' : 'var(--border-light)', color: 'var(--text-primary)' }}>
      <span className="relative inline-block h-6 w-10 rounded-full transition-colors duration-200"
        style={{ background: activo ? 'var(--ab-navy)' : 'var(--border-medium)' }}>
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200"
          style={{ transform: activo ? 'translateX(16px)' : 'translateX(0)' }} />
      </span>
      Solo diferencias
    </button>
  );
}

function CabeceraModelo({ modelo, tipo, altoMaximo, grupos, enTienda, ocupados, onCambiar, onQuitar }) {
  const wa = useWhatsApp();
  const { specs, oferta } = modelo;
  const accesorio = tipo === 'producto_general';   // se cuentan unidades, no equipos
  const colores = specs.colores_disponibles ?? [];
  const capacidades = specs.capacidades_disponibles ?? [];
  const waUrl = wa.enabled ? wa.url(`${wa.saludo} busco un ${modelo.nombre}. ¿Lo pueden conseguir?`) : null;

  return (
    <div className="flex min-w-0 snap-start flex-col">
      <SelectorModelo grupos={grupos} enTienda={enTienda} valor={modelo.slug} ocupados={ocupados} onChange={onCambiar}
        etiqueta={`Cambiar el ${modelo.nombre} por otro modelo`} />

      <div className="relative mt-4">
        <ModeloVisual modelo={modelo} tipo={tipo} altoMaximo={altoMaximo} className="aspect-[5/6] w-full rounded-3xl" />
        {onQuitar && (
          <button type="button" onClick={onQuitar} aria-label={`Quitar el ${modelo.nombre} de la comparación`} title="Quitar de la comparación"
            className="absolute right-2.5 top-2.5 grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-sm ring-1 ring-black/5 transition-colors hover:bg-white"
            style={{ color: 'var(--text-secondary)' }}>
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="mt-4 text-xs font-bold" style={{ color: 'var(--ab-periwinkle)' }}>{modelo.etiqueta ?? modelo.anio}</p>
      <h2 className="mt-0.5 text-lg font-black leading-tight tracking-tight sm:text-xl" style={{ color: 'var(--text-primary)' }}>
        {modelo.nombre}
      </h2>
      {colores.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
          <ul className="flex flex-wrap gap-1.5" aria-label={`Colores: ${colores.join(', ')}`}>
            {colores.map((c) => (
              <li key={c} title={c}><Muestra color={c} modelo={modelo.nombre} className="h-4 w-4" /></li>
            ))}
          </ul>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {colores.length} {colores.length === 1 ? 'color' : 'colores'}
          </span>
        </div>
      )}
      {capacidades.length > 0 && (
        <p className="mt-1.5 text-xs leading-snug" style={{ color: 'var(--text-secondary)' }}>{capacidades.join(' · ')}</p>
      )}

      <div className="mt-4 flex flex-1 flex-col rounded-2xl p-3.5"
        style={{ background: oferta ? 'rgba(198,203,54,0.16)' : 'var(--surface-muted)' }}>
        {oferta ? (
          <>
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#3A3F00' }}>En tienda</p>
            <p className="mt-0.5 text-lg font-black tabular-nums" style={{ color: 'var(--ab-navy)' }}>{precioTexto(oferta)}</p>
            <p className="mb-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
              {accesorio
                ? `${oferta.unidades.toLocaleString('es-BO')} en stock · ${oferta.condiciones.join(' y ')}`
                : `${oferta.unidades} ${oferta.unidades === 1 ? 'equipo' : 'equipos'} · ${oferta.condiciones.join(' y ')}`}
            </p>
            {/* El botón va al fondo de la caja: las cajas de una fila terminan a la misma altura, así los botones quedan en línea */}
            <Link href={oferta.url}
              className="mt-auto inline-flex items-center gap-1.5 self-start rounded-full border border-transparent px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--ab-navy)' }}>
              {accesorio ? 'Ver en la tienda' : oferta.unidades === 1 ? 'Ver equipo' : 'Ver equipos'} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </>
        ) : (
          <>
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Sin stock ahora</p>
            <p className="mb-3 mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>Pregúntanos si podemos conseguirlo.</p>
            {waUrl && (
              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                className="mt-auto inline-flex items-center gap-1.5 self-start rounded-full border bg-white px-4 py-2 text-xs font-bold transition-colors hover:bg-black/5"
                style={{ borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }}>
                <MessageCircle className="h-3.5 w-3.5" /> Consultar
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function EspacioLibre({ grupos, enTienda, ocupados, onAgregar, maximo, sugeridos }) {
  return (
    <div className="flex min-w-0 snap-start flex-col">
      <SelectorModelo grupos={grupos} enTienda={enTienda} ocupados={ocupados} onChange={onAgregar} etiqueta="Agregar un modelo a la comparación" />
      <div className="mt-4 grid aspect-[5/6] w-full place-items-center rounded-3xl border-2 border-dashed p-4 text-center"
        style={{ borderColor: 'var(--border-medium)' }}>
        <div>
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full" style={{ background: 'var(--surface-muted)', color: 'var(--ab-navy)' }}>
            <Plus className="h-6 w-6" />
          </span>
          <p className="mt-3 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Agrega un modelo</p>
          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Puedes comparar hasta {maximo}.</p>
        </div>
      </div>
      {sugeridos.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Sugeridos</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {sugeridos.map((o) => (
              <button key={o.slug} type="button" onClick={() => onAgregar(o.slug)}
                className="inline-flex items-center gap-1 rounded-full border bg-white px-3 py-1.5 text-left text-xs font-bold transition-colors hover:border-[color:var(--ab-navy)]"
                style={{ borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}>
                <Plus className="h-3 w-3 shrink-0" /> {o.nombre}
                {o.en_tienda && (
                  <span className="ml-0.5 rounded-full px-1.5 py-px text-[10px] font-bold" style={{ background: 'rgba(198,203,54,0.24)', color: '#3A3F00' }}>
                    en tienda
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Fila fija bajo el header con los modelos elegidos, para no perder de vista qué columna es cuál. */
function BarraModelos({ visible, top, seleccion, maximo, columnas, tipo, altoMaximo, filaRef }) {
  return (
    <div aria-hidden="true"
      className={`fixed inset-x-0 z-30 border-b bg-white shadow-[0_8px_24px_-18px_rgba(1,20,70,0.35)] transition-[opacity,transform] duration-200 ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'}`}
      style={{ top, borderColor: 'var(--border-light)' }}>
      <StoreContainer>
        <div className="-mx-4 overflow-hidden px-4 sm:mx-0 sm:px-0">
          <div ref={filaRef} className={`${GRID} ${ANCHO} py-2.5`} style={varsGrid(columnas, maximo)}>
            {seleccion.map((m) => (
              <div key={m.slug} className={`${CELDA} flex items-center gap-2.5`} style={{ borderColor: 'var(--ab-periwinkle)' }}>
                <ModeloVisual modelo={m} tipo={tipo} altoMaximo={altoMaximo} className="hidden aspect-[5/6] w-8 shrink-0 rounded-lg md:block" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black" style={{ color: 'var(--text-primary)' }}>{m.nombre}</p>
                  <p className="truncate text-xs font-semibold" style={{ color: m.oferta ? 'var(--ab-periwinkle)' : 'var(--text-muted)' }}>
                    {m.oferta ? `En tienda · ${precioTexto(m.oferta)}` : 'Sin stock ahora'}
                  </p>
                </div>
              </div>
            ))}
            <Huecos usados={seleccion.length} maximo={maximo} />
          </div>
        </div>
      </StoreContainer>
    </div>
  );
}

/**
 * Título de una fila, en una sola línea con su ícono. Qué significa el dato va al lado, en gris (pantallas grandes),
 * o detrás del botón «i» (celular y tablet): así el título y los valores quedan alineados y la fila se lee limpia.
 */
function RotuloFila({ icon: Icon, label, ayuda }) {
  const [abierta, setAbierta] = useState(false);
  return (
    <div className={`${FIJO} ${ANCHO_ROTULO}`}>
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg" style={{ background: 'rgba(88,94,159,0.10)', color: 'var(--ab-periwinkle)' }}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <h3 className="shrink-0 text-[15px] font-extrabold leading-tight sm:text-base" style={{ color: 'var(--text-primary)' }}>{label}</h3>
        {ayuda && (
          <>
            <p className="hidden min-w-0 truncate text-[13px] lg:block" style={{ color: 'var(--text-muted)' }} title={ayuda}>{ayuda}</p>
            <button type="button" onClick={() => setAbierta(!abierta)} aria-expanded={abierta} aria-label={`Qué significa «${label}»`}
              className="-ml-1 grid h-7 w-7 shrink-0 place-items-center rounded-full transition-colors lg:hidden"
              style={{ color: abierta ? 'var(--ab-periwinkle)' : 'var(--text-muted)' }}>
              <Info className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
      {ayuda && abierta && (
        <p className="mt-2.5 rounded-xl px-3 py-2 text-[13px] leading-snug lg:hidden" style={{ background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}>
          {ayuda}
        </p>
      )}
    </div>
  );
}

function FilaEsencial({ esencial, seleccion, maximo, tipo, contexto }) {
  return (
    <div className="border-t py-5 first:border-t-0" style={{ borderColor: 'var(--border-light)' }}>
      <RotuloFila icon={esencial.campo.icon} label={esencial.label} />
      <div className={`mt-3.5 ${GRID}`}>
        {seleccion.map((m) => {
          const valor = m.specs[esencial.key];
          const texto = valor ? (esencial.corto ? esencial.corto(valor, contexto) : valor) : (esencial.vacio ?? noTiene(tipo, esencial.key) ?? '—');
          const sub = esencial.sub && m.specs[esencial.sub]
            ? (esencial.subTexto ? esencial.subTexto(m.specs[esencial.sub]) : m.specs[esencial.sub])
            : null;
          return (
            <div key={m.slug} className={CELDA} style={{ borderColor: valor ? 'var(--ab-periwinkle)' : 'var(--border-medium)' }}>
              <p className="break-words text-[15px] font-bold leading-snug sm:text-base" style={{ color: valor ? 'var(--text-primary)' : 'var(--text-muted)' }}>{texto}</p>
              {sub && <p className="mt-0.5 break-words text-[13px] leading-snug" style={{ color: 'var(--text-secondary)' }}>{sub}</p>}
            </div>
          );
        })}
        <Huecos usados={seleccion.length} maximo={maximo} />
      </div>
    </div>
  );
}

/** Un valor de la tabla: texto, lista con viñetas, dato con detalle, colores o capacidades; los avisos («; …») van como nota. */
function Celda({ valor, vacio, campo, modelo, limite = null }) {
  const lista = Array.isArray(valor);
  const [principal, ...notas] = lista ? [valor] : partir(String(valor ?? ''), '; ');
  const partes = partesDe(principal).map(conMayuscula);

  if (!partes.length) {
    return vacio
      ? <p className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--text-muted)' }}><Minus className="h-4 w-4" /> {vacio}</p>
      : <p className="text-sm" style={{ color: 'var(--text-muted)' }}><span aria-hidden="true">—</span><span className="sr-only">Sin dato</span></p>;
  }

  // Colores: una lista con la muestra de cada uno, un color por línea (como las demás listas de la tabla)
  if (lista && campo === 'colores_disponibles') {
    return (
      <ul className="space-y-2.5">
        {partes.map((p) => (
          <li key={p} className="flex items-center gap-2.5 text-sm font-medium leading-tight" style={{ color: 'var(--text-primary)' }}>
            <Muestra color={p} modelo={modelo.nombre} className="h-[18px] w-[18px]" hueco />
            <span className="min-w-0 break-words">{p}</span>
          </li>
        ))}
      </ul>
    );
  }

  if (lista) {
    return (
      <ul className="flex flex-wrap content-start items-start gap-1.5">
        {partes.map((p) => (
          <li key={p} className="rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: 'var(--surface-muted)', color: 'var(--text-primary)' }}>
            {p}
          </li>
        ))}
      </ul>
    );
  }

  const visibles = limite && partes.length > limite + 1 ? partes.slice(0, limite) : partes;
  const ocultos = partes.length - visibles.length;
  let contenido;
  if (partes.length === 1) {
    contenido = partes[0] === 'Sí'
      ? <p className="inline-flex items-center gap-1.5 text-[15px] font-semibold"><Check className="h-4 w-4" style={{ color: '#1A7A1A' }} /> Sí</p>
      : <p className="break-words text-[15px] font-semibold leading-snug">{partes[0]}</p>;
  } else if (formatoDe(campo) === 'principal') {
    contenido = (
      <>
        <p className="break-words text-[15px] font-semibold leading-snug">{partes[0]}</p>
        {partes.slice(1).map((p) => <p key={p} className="mt-0.5 break-words text-[13px] leading-snug" style={{ color: 'var(--text-secondary)' }}>{p}</p>)}
      </>
    );
  } else {
    contenido = (
      <ul className="space-y-1.5">
        {visibles.map((p) => (
          <li key={p} className="flex gap-2 text-sm leading-snug">
            <span aria-hidden="true" className="mt-[7px] h-1 w-1 shrink-0 rounded-full" style={{ background: 'var(--ab-periwinkle)' }} />
            <span className="min-w-0 break-words">{p}</span>
          </li>
        ))}
        {ocultos > 0 && <li className="pl-3 text-[13px] font-semibold" style={{ color: 'var(--text-muted)' }}>y {ocultos} más</li>}
      </ul>
    );
  }

  return (
    <div className="min-w-0" style={{ color: 'var(--text-primary)' }}>
      {contenido}
      {notas.map((n) => (
        <p key={n} className="mt-2 text-xs leading-snug" style={{ color: 'var(--text-secondary)' }}>{conMayuscula(n)}</p>
      ))}
    </div>
  );
}

function FilaTabla({ campo, valores, seleccion, maximo, tipo }) {
  const [completa, setCompleta] = useState(false);
  const largo = Math.max(...valores.map((v) => (Array.isArray(v) ? 0 : partesDe(partir(String(v ?? ''), '; ')[0] ?? '').length)));
  const larga = formatoDe(campo.key) === 'lista' && largo > LIMITE_LISTA + 1;

  return (
    <div className="border-t py-6" style={{ borderColor: 'var(--border-light)' }}>
      <RotuloFila icon={campo.icon} label={campo.label} ayuda={campo.ayuda} />
      <div className={`mt-5 sm:mt-6 ${GRID}`}>
        {valores.map((v, i) => (
          <div key={seleccion[i].slug} className={CELDA} style={{ borderColor: 'rgba(88,94,159,0.22)' }}>
            <Celda valor={v} vacio={noTiene(tipo, campo.key)} campo={campo.key} modelo={seleccion[i]} limite={larga && !completa ? LIMITE_LISTA : null} />
          </div>
        ))}
        <Huecos usados={seleccion.length} maximo={maximo} />
      </div>
      {larga && (
        <button type="button" onClick={() => setCompleta(!completa)} aria-expanded={completa}
          className={`${FIJO} mt-4 inline-flex items-center gap-1.5 rounded-full border bg-white px-3.5 py-1.5 text-xs font-bold transition-colors hover:border-[color:var(--ab-navy)]`}
          style={{ borderColor: 'var(--border-light)', color: 'var(--ab-navy)' }}>
          {completa ? 'Ver menos' : 'Ver la lista completa'}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${completa ? 'rotate-180' : ''}`} />
        </button>
      )}
    </div>
  );
}

function Seccion({ grupo, seleccion, maximo, tipo, soloDiferencias, margenAncla }) {
  const conDatos = grupo.campos
    .map((campo) => ({ campo, valores: seleccion.map((m) => m.specs?.[campo.key] ?? null) }))
    .filter((f) => f.valores.some((v) => partesDe(v).length));
  if (!conDatos.length) return null;

  const filas = soloDiferencias && seleccion.length > 1
    ? conDatos.filter((f) => new Set(f.valores.map(clave)).size > 1)
    : conDatos;
  const Icon = grupo.icon;

  return (
    <section id={grupo.id} aria-labelledby={`titulo-${grupo.id}`} className="pt-16" style={{ scrollMarginTop: margenAncla }}>
      <h2 id={`titulo-${grupo.id}`} className={`${FIJO} inline-flex items-center gap-3 text-[22px] font-black tracking-tight sm:text-2xl`} style={{ color: 'var(--text-primary)' }}>
        <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: 'var(--ab-navy)' }}>
          <Icon className="h-5 w-5" />
        </span>
        {grupo.label}
      </h2>

      {filas.length === 0 ? (
        <p className={`${FIJO} mt-4 inline-block rounded-2xl px-4 py-3 text-sm`} style={{ background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}>
          Sin diferencias: {seleccion.length === 2 ? 'los dos modelos coinciden' : `los ${seleccion.length} modelos coinciden`} en {grupo.label.toLowerCase()}.
        </p>
      ) : (
        <div className="mt-4">
          {filas.map(({ campo, valores }) => (
            <FilaTabla key={campo.key} campo={campo} valores={valores} seleccion={seleccion} maximo={maximo} tipo={tipo} />
          ))}
        </div>
      )}
    </section>
  );
}

function Comparador({ familia, maximo, opciones, seleccion }) {
  const tipo = familia.tipo;
  const nombre = useNombreTienda();
  // La familia de la base («cargador») puede no ser la de la dirección («cargadores»); sin familia (productos Apple), todos los campos
  const base = familia.base === undefined ? familia.slug : familia.base;
  const todas = useMemo(() => seccionesComparativa(tipo, base), [tipo, base]);
  // Solo las secciones con algún dato en los modelos elegidos: un cargador no tiene «Protección y diseño»
  const secciones = todas.filter((g) => g.campos.some((c) => seleccion.some((m) => partesDe(m.specs?.[c.key]).length)));
  const esenciales = useMemo(() => esencialesDe(tipo, base), [tipo, base]);
  const grupos = useMemo(() => agruparPorAnio(opciones), [opciones]);
  const enTienda = useMemo(() => opciones.filter((o) => o.en_tienda), [opciones]);
  const [soloDiferencias, setSoloDiferencias] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [barra, setBarra] = useState(false);
  const altoHeader = useAltoHeader();
  const cabeceras = useRef(null);
  const tabla = useRef(null);
  const filaBarra = useRef(null);

  const slugs = seleccion.map((m) => m.slug);
  const columnas = Math.min(maximo, seleccion.length + 1);
  // Escala de las ilustraciones: los iPhone por su alto; las Mac por su ancho
  const altoMaximo = Math.max(0, ...seleccion.map((m) => (tipo === 'computadora' ? m.visual?.ancho_mm : m.visual?.alto_mm) ?? 0)) || null;
  const sugeridos = sugerencias(opciones, seleccion);
  const contexto = { versionActual: familia.version_actual };
  const margenAncla = altoHeader + 84; // el header y la barra de modelos
  const conMuestras = seleccion.some((m) => (m.specs.colores_disponibles ?? []).length);

  // La barra fija aparece cuando las cabeceras quedaron arriba y se va al terminar la tabla. Con el menú del celular
  // abierto el header pasa de ~110 px a más de 400: ahí la barra se oculta para no quedar colgada debajo del menú.
  useEffect(() => {
    const revisar = () => {
      const cab = cabeceras.current?.getBoundingClientRect();
      const fin = tabla.current?.getBoundingClientRect();
      setBarra(Boolean(cab && fin && altoHeader < 240 && cab.bottom < altoHeader && fin.bottom > altoHeader + 96));
    };
    revisar();
    window.addEventListener('scroll', revisar, { passive: true });
    window.addEventListener('resize', revisar);
    return () => {
      window.removeEventListener('scroll', revisar);
      window.removeEventListener('resize', revisar);
    };
  }, [altoHeader]);

  // En celulares la tabla se desliza de costado: la barra se mueve con ella
  useEffect(() => {
    const el = tabla.current;
    if (!el) return undefined;
    const mover = () => {
      if (filaBarra.current) filaBarra.current.style.transform = `translateX(${-el.scrollLeft}px)`;
    };
    mover();
    el.addEventListener('scroll', mover, { passive: true });
    return () => el.removeEventListener('scroll', mover);
  }, []);

  const ir = (nuevos) => router.get(`/comparar/${familia.slug}`, { modelos: nuevos.join(',') }, {
    preserveState: true,
    preserveScroll: true,
    replace: true,
    only: ['seleccion'],
    onStart: () => setCargando(true),
    onFinish: () => setCargando(false),
  });

  return (
    <>
      <BarraModelos visible={barra} top={altoHeader} seleccion={seleccion} maximo={maximo} columnas={columnas} tipo={tipo} altoMaximo={altoMaximo} filaRef={filaBarra} />

      <section className="border-b" style={{ borderColor: 'var(--border-light)', background: 'linear-gradient(180deg, #F1F2F8 0%, var(--surface-page) 100%)' }}>
        <StoreContainer className="pb-8 pt-8 sm:pb-10 sm:pt-12">
          <Link href={familia.volver?.url ?? `/${familia.slug}`} className="inline-flex items-center gap-1.5 text-sm font-bold transition-opacity hover:opacity-70" style={{ color: 'var(--text-muted)' }}>
            <ArrowLeft className="h-4 w-4" /> {familia.volver?.nombre ?? familia.nombre}
          </Link>
          <h1 className="mt-4 text-balance text-[clamp(2rem,5vw,3.5rem)] font-black leading-[1.02] tracking-[-0.04em]" style={{ color: 'var(--text-primary)' }}>
            {familia.titulo ?? `Compara modelos de ${familia.nombre}`}
          </h1>
          <p className="mt-3 max-w-2xl text-[0.9375rem] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {familia.bajada ?? `Elige hasta ${maximo} modelos y míralos lado a lado. Los datos técnicos son los de Apple; el precio y el stock, los de nuestra tienda.`}
          </p>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-6">
            {seleccion.length > 1 && <Interruptor activo={soloDiferencias} onChange={setSoloDiferencias} />}
            <nav aria-label="Ir a una sección" className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" style={{ scrollbarWidth: 'none' }}>
              {secciones.map((g) => (
                <a key={g.id} href={`#${g.id}`}
                  className="shrink-0 rounded-full border bg-white px-3.5 py-1.5 text-xs font-bold transition-colors hover:border-[color:var(--ab-navy)]"
                  style={{ borderColor: 'var(--border-light)', color: 'var(--text-secondary)' }}>
                  {g.label}
                </a>
              ))}
            </nav>
          </div>
        </StoreContainer>
      </section>

      <StoreContainer className="pb-24 pt-8">
        {columnas > 2 && (
          <p className="mb-4 inline-flex items-center gap-1.5 text-xs font-semibold md:hidden" style={{ color: 'var(--text-muted)' }}>
            Desliza de costado para ver todas las columnas <ArrowRight className="h-3.5 w-3.5" />
          </p>
        )}
        {/* Solo en celulares la tabla se desliza de costado; desde tablet las columnas entran y no hay barra de desplazamiento */}
        <div ref={tabla} className="-mx-4 snap-x snap-mandatory scroll-px-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:scroll-px-0 sm:px-0 md:snap-none md:overflow-visible md:pb-0">
          <div className={`${ANCHO} transition-opacity duration-200 ${cargando ? 'opacity-60' : ''}`} style={varsGrid(columnas, maximo)}>
            <div ref={cabeceras} className={GRID}>
              {seleccion.map((m, i) => (
                <CabeceraModelo key={m.slug} modelo={m} tipo={tipo} altoMaximo={altoMaximo} grupos={grupos} enTienda={enTienda} ocupados={slugs}
                  onCambiar={(slug) => ir(slugs.map((s, j) => (j === i ? slug : s)))}
                  onQuitar={seleccion.length > 1 ? () => ir(slugs.filter((_, j) => j !== i)) : null} />
              ))}
              <Huecos usados={seleccion.length} maximo={maximo} primero={(
                <EspacioLibre grupos={grupos} enTienda={enTienda} ocupados={slugs} maximo={maximo} sugeridos={sugeridos}
                  onAgregar={(slug) => ir([...slugs, slug])} />
              )} />
            </div>

            {seleccion.length > 0 && (
              <>
                <section aria-labelledby="titulo-esencial" className="pt-14">
                  <h2 id="titulo-esencial" className={`${FIJO} inline-block text-[22px] font-black tracking-tight sm:text-2xl`} style={{ color: 'var(--text-primary)' }}>
                    Lo esencial
                  </h2>
                  {/* El fondo sobresale a los costados para que las columnas queden alineadas con las de arriba */}
                  <div className="-mx-4 mt-4 border-y bg-white px-4 sm:-mx-6 sm:rounded-3xl sm:border sm:px-6" style={{ borderColor: 'var(--border-light)' }}>
                    {esenciales.map((e) => (
                      <FilaEsencial key={e.key} esencial={e} seleccion={seleccion} maximo={maximo} tipo={tipo} contexto={contexto} />
                    ))}
                  </div>
                </section>

                {secciones.map((g) => (
                  <Seccion key={g.id} grupo={g} seleccion={seleccion} maximo={maximo} tipo={tipo} soloDiferencias={soloDiferencias} margenAncla={margenAncla} />
                ))}
              </>
            )}
          </div>
        </div>

        <div className="mt-16 rounded-3xl p-5 text-xs leading-relaxed sm:p-6" style={{ background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}>
          <p>
            <strong style={{ color: 'var(--text-primary)' }}>De dónde salen los datos.</strong>{' '}
            {familia.fuentes ?? (
              <>
                Las características técnicas vienen de las fichas oficiales de Apple; cuando Apple publica datos distintos por país, usamos los de EE. UU.
                La autonomía es la de un equipo nuevo: en un seminuevo depende de la salud de su batería, que indicamos en cada publicación.
                El precio y el stock son los de {nombre} al momento de abrir esta página.
              </>
            )}
            {conMuestras && ' Las muestras de color son aproximadas; el nombre es el oficial.'}
            {seleccion.some((m) => !m.imagen) && ' Las ilustraciones son referenciales.'}
          </p>
        </div>
      </StoreContainer>
    </>
  );
}

export default function CompararModelos(props) {
  return (
    <StoreLayout>
      <Comparador {...props} />
    </StoreLayout>
  );
}
