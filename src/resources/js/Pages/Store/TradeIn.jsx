import { useForm } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import StoreLayout, { StoreContainer } from '@/Layouts/StoreLayout';
import FloatingDevices, { EquipoEnRevision } from '@/Components/Store/FloatingDevices';
import { useNombreTienda } from '@/Components/Store/tienda';
import {
    ArrowLeft, ArrowRight, Camera, Check, Display, Gamepad, Headphones, Info, Laptop, Package, PcTower, Plus, ShieldCheck, Smartphone, Tablet, Watch, X,
} from '@/Components/Store/Icons';

// /trade-in: el cliente cuenta cómo está su equipo (Apple o de otra marca) para recibir una cotización estimada. Las preguntas, sus opciones y
// sus ayudas llegan del servidor (App\Support\TradeIn\Cuestionario), que valida con el mismo cuestionario y arma el
// resumen del panel. Mientras más completo, más cerca queda la cotización del valor que se confirma en la tienda.

const BORRADOR = 'ab-trade-in-borrador';
const ICONOS = {
    iPhone: Smartphone, iPad: Tablet, MacBook: Laptop, Mac: Display, 'Apple Watch': Watch, AirPods: Headphones,
    'Celular Android': Smartphone, Laptop, 'PC de escritorio': PcTower, Consola: Gamepad, Otro: Package,
};
const EJEMPLOS = {
    iPhone: 'Ej.: iPhone 14 Pro',
    iPad: 'Ej.: iPad Air (5.ª generación)',
    MacBook: 'Ej.: MacBook Air (13 pulgadas, M2)',
    Mac: 'Ej.: iMac (24 pulgadas, 2021)',
    'Apple Watch': 'Ej.: Apple Watch Series 9 de 45 mm',
    AirPods: 'Ej.: AirPods Pro (2.ª generación)',
    'Celular Android': 'Ej.: Galaxy S23 Ultra o Redmi Note 13 Pro',
    Laptop: 'Ej.: ROG Strix G15 o IdeaPad 5',
    'PC de escritorio': 'Ej.: PC gamer armada',
    Consola: 'Ej.: PlayStation 5 Slim Digital',
    Otro: 'Ej.: Galaxy Tab S9, GoPro HERO12 o Apple TV 4K',
};
const NO_SE = 'No sé';
const TELEFONO = /^\+?[\d\s\-().]{7,30}$/;

const VACIO = {
    tipo_dispositivo: '', marca: '', modelo: '', capacidad: '', memoria: '', color: '', respuestas: {}, observaciones_cliente: '',
    nombre_contacto: '', telefono_contacto: '', email_contacto: '', ciudad: '', interes: '', declaracion: false, fotos: [], sitio_web: '',
};

function leerBorrador() {
    try {
        const b = JSON.parse(localStorage.getItem(BORRADOR) ?? 'null');
        return b && typeof b === 'object' && b.datos ? b : null;
    } catch {
        return null;
    }
}

/** Achica las fotos grandes antes de subirlas (lado mayor de 1600 px). Las que el navegador no puede leer, como HEIC, van tal cual. */
async function prepararFoto(archivo) {
    if (!/^image\/(jpeg|png|webp)$/.test(archivo.type) || typeof createImageBitmap !== 'function') return archivo;
    try {
        const imagen = await createImageBitmap(archivo);
        const escala = Math.min(1, 1600 / Math.max(imagen.width, imagen.height));
        if (escala === 1 && archivo.size < 1500000) return archivo;
        const lienzo = document.createElement('canvas');
        lienzo.width = Math.round(imagen.width * escala);
        lienzo.height = Math.round(imagen.height * escala);
        lienzo.getContext('2d').drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
        const blob = await new Promise((listo) => lienzo.toBlob(listo, 'image/jpeg', 0.85));
        return blob ? new File([blob], `${archivo.name.replace(/\.[^.]+$/, '')}.jpg`, { type: 'image/jpeg' }) : archivo;
    } catch {
        return archivo;
    }
}

const respondida = (p, valor) => {
    if (!p.requerida) return true;
    if (p.tipo === 'multiple') return Array.isArray(valor) && valor.length > 0;
    if (p.tipo === 'componentes') return p.componentes.every((c) => valor?.[c.id]);
    if (p.tipo === 'texto') return typeof valor === 'string' && valor.trim().length > 0;
    return valor !== undefined && valor !== null && valor !== '';
};

const tarjeta = (elegida) => `rounded-2xl border transition-colors ${elegida
    ? 'border-[color:var(--ab-navy)] bg-[#011446]/[0.04] ring-1 ring-[color:var(--ab-navy)]'
    : 'border-[color:var(--border-light)] bg-white hover:border-[color:var(--border-medium)]'}`;

const CAMPO = 'h-12 w-full rounded-xl border bg-white px-4 text-[15px] focus:outline-none focus:ring-2 focus:ring-[color:var(--ab-periwinkle)]';

// ─── Piezas ──────────────────────────────────────────────────────────────────

function Bloque({ titulo, ayuda, opcional = false, error, children }) {
    return (
        <fieldset className="min-w-0">
            <legend className="text-[15px] font-bold leading-snug" style={{ color: 'var(--text-primary)' }}>
                {titulo}
                {opcional && <span className="ml-2 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Opcional</span>}
            </legend>
            {ayuda && (
                <p className="mt-1.5 flex gap-2 text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    <Info className="mt-0.5 h-4 w-4 shrink-0" style={{ color: 'var(--ab-periwinkle)' }} />
                    <span>{ayuda}</span>
                </p>
            )}
            <div className="mt-3">{children}</div>
            {error && <p className="mt-2 text-xs font-semibold text-red-600">{error}</p>}
        </fieldset>
    );
}

function Marca({ elegida, cuadrada = false }) {
    return (
        <span aria-hidden="true" className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center border ${cuadrada ? 'rounded-md' : 'rounded-full'}`}
            style={elegida ? { background: 'var(--ab-navy)', borderColor: 'var(--ab-navy)', color: '#fff' } : { borderColor: 'var(--border-medium)' }}>
            {elegida && <Check className="h-3.5 w-3.5" strokeWidth={2.4} />}
        </span>
    );
}

function Opciones({ p, valor, onChange }) {
    return (
        <div role="radiogroup" aria-label={p.pregunta} className="grid gap-2 sm:grid-cols-2">
            {p.opciones.map((o) => {
                const elegida = valor === o.valor;
                return (
                    <button key={o.valor} type="button" role="radio" aria-checked={elegida} onClick={() => onChange(o.valor)}
                        className={`${tarjeta(elegida)} flex items-start gap-3 px-4 py-3 text-left`}>
                        <Marca elegida={elegida} />
                        <span className="min-w-0">
                            <span className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{o.texto}</span>
                            {o.detalle && <span className="mt-0.5 block text-xs" style={{ color: 'var(--text-muted)' }}>{o.detalle}</span>}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function Multiple({ p, valor, onChange }) {
    const elegidas = Array.isArray(valor) ? valor : [];
    const exclusivas = p.opciones.filter((o) => o.exclusiva).map((o) => o.valor);

    const alternar = (v) => {
        if (elegidas.includes(v)) return onChange(elegidas.filter((x) => x !== v));
        if (exclusivas.includes(v)) return onChange([v]);
        return onChange([...elegidas.filter((x) => !exclusivas.includes(x)), v]);
    };

    return (
        <div className="grid gap-2 sm:grid-cols-2">
            {p.opciones.map((o) => {
                const elegida = elegidas.includes(o.valor);
                return (
                    <button key={o.valor} type="button" role="checkbox" aria-checked={elegida} onClick={() => alternar(o.valor)}
                        className={`${tarjeta(elegida)} flex items-start gap-3 px-4 py-3 text-left`}>
                        <Marca elegida={elegida} cuadrada />
                        <span className="min-w-0">
                            <span className="block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{o.texto}</span>
                            {o.detalle && <span className="mt-0.5 block text-xs" style={{ color: 'var(--text-muted)' }}>{o.detalle}</span>}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function Numero({ p, valor, onChange }) {
    return (
        <div className="flex max-w-[240px] items-center overflow-hidden rounded-xl border bg-white focus-within:ring-2 focus-within:ring-[color:var(--ab-periwinkle)]"
            style={{ borderColor: 'var(--border-medium)' }}>
            <input type="number" inputMode="numeric" min={p.min} max={p.max} value={valor ?? ''} aria-label={p.pregunta}
                onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
                className="h-12 min-w-0 flex-1 border-0 bg-transparent px-4 text-[15px] focus:outline-none focus:ring-0" />
            <span className="px-4 text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>{p.sufijo}</span>
        </div>
    );
}

const TONO_ESTADO = {
    funciona: { background: '#ECFDF5', borderColor: '#10B981', color: '#047857' },
    falla: { background: '#FFF1F2', borderColor: '#F43F5E', color: '#BE123C' },
    no_probado: { background: '#F1F5F9', borderColor: '#94A3B8', color: '#334155' },
};

function Componentes({ p, valor, onChange, estados }) {
    const actual = valor ?? {};
    const faltan = p.componentes.filter((c) => !actual[c.id]).length;
    const completar = () => onChange(Object.fromEntries(p.componentes.map((c) => [c.id, actual[c.id] ?? 'funciona'])));

    return (
        <div>
            {faltan > 0 && (
                <button type="button" onClick={completar}
                    className="mb-3 inline-flex items-center gap-1.5 rounded-full border bg-white px-4 py-2 text-xs font-bold transition-colors hover:bg-black/[0.03]"
                    style={{ borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }}>
                    <Check className="h-3.5 w-3.5" /> Marcar {faltan === p.componentes.length ? 'todo' : 'lo que falta'} como «Funciona»
                </button>
            )}
            <ul className="divide-y rounded-2xl border" style={{ borderColor: 'var(--border-light)' }}>
                {p.componentes.map((c) => (
                    <li key={c.id} className="flex flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: 'var(--border-light)' }}>
                        <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{c.texto}</span>
                        <div role="radiogroup" aria-label={c.texto} className="grid grid-cols-3 gap-1.5 sm:w-[310px] sm:shrink-0">
                            {Object.entries(estados).map(([v, texto]) => {
                                const elegida = actual[c.id] === v;
                                return (
                                    <button key={v} type="button" role="radio" aria-checked={elegida}
                                        onClick={() => onChange({ ...actual, [c.id]: v })}
                                        className="h-9 rounded-lg border px-1 text-xs font-bold transition-colors"
                                        style={elegida ? TONO_ESTADO[v] : { borderColor: 'var(--border-light)', color: 'var(--text-secondary)', background: '#fff' }}>
                                        {texto}
                                    </button>
                                );
                            })}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function Chips({ opciones, valor, onChange, etiqueta }) {
    return (
        <div role="radiogroup" aria-label={etiqueta} className="flex flex-wrap gap-2">
            {opciones.map((o) => {
                const elegida = valor === o;
                return (
                    <button key={o} type="button" role="radio" aria-checked={elegida} onClick={() => onChange(elegida ? '' : o)}
                        className="h-10 rounded-full border px-4 text-sm font-semibold transition-colors"
                        style={elegida
                            ? { background: 'var(--ab-navy)', borderColor: 'var(--ab-navy)', color: '#fff' }
                            : { background: '#fff', borderColor: 'var(--border-light)', color: 'var(--text-primary)' }}>
                        {o}
                    </button>
                );
            })}
        </div>
    );
}

function Campo({ label, opcional = false, error, ayuda, ...props }) {
    return (
        <label className="block min-w-0">
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {label}
                {opcional && <span className="ml-2 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Opcional</span>}
            </span>
            <input {...props} className={`${CAMPO} mt-1.5`} style={{ borderColor: error ? '#EF4444' : 'var(--border-medium)', color: 'var(--text-primary)' }} />
            {ayuda && !error && <span className="mt-1 block text-xs" style={{ color: 'var(--text-muted)' }}>{ayuda}</span>}
            {error && <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span>}
        </label>
    );
}

function Texto({ p, valor, onChange, error }) {
    return (
        <input value={valor ?? ''} maxLength={p.max} placeholder={p.placeholder} aria-label={p.pregunta} autoComplete="off"
            onChange={(e) => onChange(e.target.value)}
            className={`${CAMPO} max-w-lg`} style={{ borderColor: error ? '#EF4444' : 'var(--border-medium)', color: 'var(--text-primary)' }} />
    );
}

function Pregunta({ p, valor, onChange, estados, errores }) {
    return (
        <Bloque titulo={p.pregunta} ayuda={p.ayuda} opcional={!p.requerida} error={errores[0]}>
            {p.tipo === 'texto' && <Texto p={p} valor={valor} onChange={onChange} error={errores[0]} />}
            {p.tipo === 'opcion' && <Opciones p={p} valor={valor} onChange={onChange} />}
            {p.tipo === 'multiple' && <Multiple p={p} valor={valor} onChange={onChange} />}
            {p.tipo === 'numero' && <Numero p={p} valor={valor} onChange={onChange} />}
            {p.tipo === 'componentes' && <Componentes p={p} valor={valor} onChange={onChange} estados={estados} />}
        </Bloque>
    );
}

// ─── Pasos especiales ────────────────────────────────────────────────────────

function PasoEquipo({ cuestionario, data, setData, errors, modelos, ficha, capacidades, memorias, colores, elegirTipo, preguntas, responder, erroresDe }) {
    const tipo = data.tipo_dispositivo;
    const marcas = cuestionario.marcas[tipo];
    const grupos = cuestionario.tipos.reduce((g, t) => ({ ...g, [t.grupo]: [...(g[t.grupo] ?? []), t] }), {});

    return (
        <div className="space-y-8">
            <Bloque titulo="¿Qué equipo quieres entregar?" error={errors.tipo_dispositivo}
                ayuda="Recibimos equipos Apple y también de otras marcas.">
                <div className="space-y-5">
                    {Object.entries(grupos).map(([grupo, tipos]) => (
                        <div key={grupo}>
                            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>{grupo}</p>
                            <div role="radiogroup" aria-label={`Tipo de equipo: ${grupo}`} className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-4">
                                {tipos.map(({ valor, detalle }) => {
                                    const Icono = ICONOS[valor] ?? Package;
                                    const elegida = tipo === valor;
                                    return (
                                        <button key={valor} type="button" role="radio" aria-checked={elegida} onClick={() => elegirTipo(valor)}
                                            className={`${tarjeta(elegida)} flex flex-col items-start gap-2 p-4 text-left`}>
                                            <Icono className="h-6 w-6" style={{ color: elegida ? 'var(--ab-navy)' : 'var(--ab-periwinkle)' }} />
                                            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{valor}</span>
                                            <span className="text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>{detalle}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </Bloque>

            {tipo && (
                <>
                    {marcas && (
                        <Bloque titulo="Marca" error={errors.marca}>
                            <input list={marcas.length ? 'marcas-trade-in' : undefined} value={data.marca} autoComplete="off"
                                onChange={(e) => setData('marca', e.target.value)} placeholder={marcas.length ? `Ej.: ${marcas[0]}` : 'Ej.: Samsung, Garmin, Canon'}
                                aria-label="Marca" className={`${CAMPO} max-w-sm`}
                                style={{ borderColor: errors.marca ? '#EF4444' : 'var(--border-medium)', color: 'var(--text-primary)' }} />
                            {marcas.length > 0 && (
                                <datalist id="marcas-trade-in">
                                    {marcas.map((m) => <option key={m} value={m} />)}
                                </datalist>
                            )}
                        </Bloque>
                    )}

                    <Bloque titulo={tipo === 'Otro' ? '¿Qué equipo es?' : 'Modelo'} error={errors.modelo}
                        ayuda={['iPhone', 'iPad'].includes(tipo) ? '¿No sabes cuál es? En tu equipo: Configuración > General > Información.' : null}>
                        <input list={modelos[tipo]?.length ? 'modelos-trade-in' : undefined} value={data.modelo} autoComplete="off"
                            onChange={(e) => setData('modelo', e.target.value)} placeholder={EJEMPLOS[tipo]} aria-label="Modelo"
                            className={CAMPO} style={{ borderColor: errors.modelo ? '#EF4444' : 'var(--border-medium)', color: 'var(--text-primary)' }} />
                        {modelos[tipo]?.length > 0 && (
                            <datalist id="modelos-trade-in">
                                {modelos[tipo].map((m) => <option key={m.nombre} value={m.nombre} />)}
                            </datalist>
                        )}
                        {ficha && (
                            <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                                <Check className="h-3.5 w-3.5" /> Lo tenemos en nuestra base: te mostramos sus capacidades y colores.
                            </p>
                        )}
                    </Bloque>

                    {cuestionario.capacidades[tipo] && (
                        <Bloque titulo="Almacenamiento" error={errors.capacidad}>
                            <Chips etiqueta="Almacenamiento" opciones={capacidades} valor={data.capacidad} onChange={(v) => setData('capacidad', v)} />
                        </Bloque>
                    )}

                    {cuestionario.memorias[tipo] && (
                        <Bloque titulo="Memoria (RAM)" error={errors.memoria}>
                            <Chips etiqueta="Memoria" opciones={memorias} valor={data.memoria} onChange={(v) => setData('memoria', v)} />
                        </Bloque>
                    )}

                    {/* Lo propio del tipo: por ejemplo, el procesador y la tarjeta gráfica de una computadora */}
                    {preguntas.filter((p) => p.paso === 'equipo').map((p) => (
                        <Pregunta key={p.id} p={p} valor={data.respuestas?.[p.id]} onChange={(v) => responder(p.id, v)} errores={erroresDe(p.id)} />
                    ))}

                    <Bloque titulo="Color" opcional error={errors.color}>
                        {colores.length > 0 ? (
                            <Chips etiqueta="Color" opciones={colores} valor={data.color} onChange={(v) => setData('color', v)} />
                        ) : (
                            <input value={data.color} onChange={(e) => setData('color', e.target.value)} placeholder={cuestionario.marcas[tipo] ? 'Ej.: Negro' : 'Ej.: Negro espacial'} aria-label="Color"
                                className={`${CAMPO} max-w-sm`} style={{ borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }} />
                        )}
                    </Bloque>
                </>
            )}
        </div>
    );
}

function PasoContacto({ data, setData, errors, previas, agregarFotos, quitarFoto, maxFotos, preparando }) {
    const selector = useRef(null);
    const errorFotos = errors.fotos ?? Object.entries(errors).find(([k]) => k.startsWith('fotos.'))?.[1];
    const sugerencia = {
        iPhone: 'la pantalla encendida, la parte de atrás, los bordes y una captura de Condición de la batería',
        Laptop: 'la pantalla encendida, el teclado, la tapa y una captura de Configuración > Sistema > Acerca de',
        'PC de escritorio': 'el gabinete por fuera y por dentro, y una captura de Configuración > Sistema > Acerca de',
        Consola: 'la consola por delante y por detrás, los controles y la pantalla de inicio encendida',
    }[data.tipo_dispositivo] ?? 'la pantalla encendida, la parte de atrás y los bordes';

    return (
        <div className="space-y-8">
            <Bloque titulo="Fotos del equipo" opcional error={errorFotos}
                ayuda={`Hasta ${maxFotos}, con buena luz. Sugerimos: ${sugerencia}.`}>
                <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 lg:grid-cols-6">
                    {previas.map((f, i) => (
                        <div key={`${f.nombre}-${i}`} className="relative aspect-square overflow-hidden rounded-xl border" style={{ borderColor: 'var(--border-light)', background: 'var(--surface-muted)' }}>
                            {f.url ? (
                                <img src={f.url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                            ) : (
                                <span className="grid h-full w-full place-items-center p-2 text-center text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                                    <span><Camera className="mx-auto mb-1 h-5 w-5" />{f.nombre}</span>
                                </span>
                            )}
                            <button type="button" onClick={() => quitarFoto(i)} aria-label={`Quitar la foto ${i + 1}`}
                                className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                    {previas.length < maxFotos && (
                        <button type="button" onClick={() => selector.current?.click()} disabled={preparando}
                            className="grid aspect-square place-items-center rounded-xl border-2 border-dashed text-center transition-colors hover:bg-black/[0.02] disabled:opacity-50"
                            style={{ borderColor: 'var(--border-medium)', color: 'var(--text-secondary)' }}>
                            <span><Plus className="mx-auto h-6 w-6" /><span className="mt-1 block text-xs font-bold">{preparando ? 'Preparando…' : 'Agregar'}</span></span>
                        </button>
                    )}
                </div>
                <input ref={selector} type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => { agregarFotos(e.target.files); e.target.value = ''; }} />
            </Bloque>

            <div className="grid gap-4 sm:grid-cols-2">
                <Campo label="Nombre" value={data.nombre_contacto} error={errors.nombre_contacto} autoComplete="name"
                    onChange={(e) => setData('nombre_contacto', e.target.value)} />
                <Campo label="WhatsApp o teléfono" type="tel" value={data.telefono_contacto} error={errors.telefono_contacto} autoComplete="tel"
                    placeholder="Ej.: 70012345" ayuda="Te escribimos a este número." onChange={(e) => setData('telefono_contacto', e.target.value)} />
                <Campo label="Correo" opcional type="email" value={data.email_contacto} error={errors.email_contacto} autoComplete="email"
                    onChange={(e) => setData('email_contacto', e.target.value)} />
                <Campo label="Ciudad" opcional value={data.ciudad} error={errors.ciudad} placeholder="Ej.: Cochabamba"
                    onChange={(e) => setData('ciudad', e.target.value)} />
            </div>

            <Campo label="¿Qué equipo te gustaría llevar?" opcional value={data.interes} error={errors.interes}
                placeholder="Ej.: iPhone 16 Pro de 256 GB" ayuda="Así te mostramos opciones con el valor de tu equipo."
                onChange={(e) => setData('interes', e.target.value)} />

            <div>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4" style={{ borderColor: errors.declaracion ? '#EF4444' : 'var(--border-light)' }}>
                    <input type="checkbox" checked={data.declaracion} onChange={(e) => setData('declaracion', e.target.checked)}
                        className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-[#011446] focus:ring-[#585E9F]" />
                    <span className="text-sm leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                        Declaro que el equipo es mío y que lo que respondí es verdad. Sé que la cotización es estimada y que el valor se confirma al revisar el equipo en la tienda.
                    </span>
                </label>
                {errors.declaracion && <p className="mt-2 text-xs font-semibold text-red-600">{errors.declaracion}</p>}
            </div>

            {/* Un robot llena este campo; una persona no lo ve */}
            <div aria-hidden="true" className="absolute -left-[9999px] top-0 h-px w-px overflow-hidden">
                <label>
                    Sitio web
                    <input tabIndex={-1} autoComplete="off" value={data.sitio_web} onChange={(e) => setData('sitio_web', e.target.value)} />
                </label>
            </div>
        </div>
    );
}

function Lateral({ data, pasos, paso, alcanzable, completo, onIr }) {
    const Icono = ICONOS[data.tipo_dispositivo] ?? Package;
    const detalle = [data.capacidad, data.memoria && data.memoria !== NO_SE ? `${data.memoria} de memoria` : null, data.color]
        .filter((v) => v && v !== NO_SE).join(' · ');
    const marca = data.marca?.trim();
    // Igual que en el panel: «Microsoft Xbox» con «Xbox Series X» no repite la marca
    const yaLaNombra = marca?.toLowerCase().split(/\s+/).some((p) => p.length >= 3 && data.modelo.toLowerCase().includes(p));
    const nombre = marca && !yaLaNombra ? `${marca} ${data.modelo}` : data.modelo;

    return (
        <aside className="space-y-4 lg:sticky lg:top-48">
            <div className="rounded-3xl border bg-white p-5" style={{ borderColor: 'var(--border-light)' }}>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--ab-periwinkle)' }}>Tu equipo</p>
                <div className="mt-3 flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" style={{ background: 'var(--surface-muted)', color: 'var(--ab-navy)' }}>
                        <Icono className="h-6 w-6" />
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{(data.modelo && nombre) || data.tipo_dispositivo || 'Todavía sin elegir'}</p>
                        {detalle && <p className="truncate text-xs" style={{ color: 'var(--text-secondary)' }}>{detalle}</p>}
                    </div>
                </div>
            </div>

            <nav aria-label="Pasos" className="hidden rounded-3xl border bg-white p-3 lg:block" style={{ borderColor: 'var(--border-light)' }}>
                <ol className="space-y-1">
                    {pasos.map((p, i) => {
                        const hecho = completo(p.id) && i !== paso;
                        return (
                            <li key={p.id}>
                                <button type="button" onClick={() => onIr(i)} disabled={!alcanzable(i)} aria-current={i === paso ? 'step' : undefined}
                                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition-colors enabled:hover:bg-black/[0.03] disabled:opacity-40"
                                    style={i === paso ? { background: 'var(--surface-muted)', color: 'var(--ab-navy)' } : { color: 'var(--text-secondary)' }}>
                                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                                        style={hecho ? { background: 'var(--ab-lime)', color: 'var(--text-on-lime)' } : i === paso ? { background: 'var(--ab-navy)', color: '#fff' } : { background: 'var(--surface-muted)' }}>
                                        {hecho ? <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> : i + 1}
                                    </span>
                                    {p.titulo}
                                </button>
                            </li>
                        );
                    })}
                </ol>
            </nav>

            <div className="rounded-3xl border bg-white p-5" style={{ borderColor: 'var(--border-light)' }}>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Cómo sigue</p>
                <ol className="mt-3 space-y-2.5 text-[13px] leading-snug" style={{ color: 'var(--text-secondary)' }}>
                    {['Revisamos tus respuestas y tus fotos.', 'Te escribimos por WhatsApp con un valor estimado.', 'Si te conviene, traes el equipo y confirmamos el valor al revisarlo.'].map((t, i) => (
                        <li key={t} className="flex gap-2.5">
                            <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-[11px] font-bold" style={{ background: 'var(--surface-muted)', color: 'var(--ab-navy)' }}>{i + 1}</span>
                            {t}
                        </li>
                    ))}
                </ol>
                <p className="mt-4 flex gap-2 border-t pt-4 text-xs leading-relaxed" style={{ borderColor: 'var(--border-light)', color: 'var(--text-muted)' }}>
                    <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: 'var(--ab-periwinkle)' }} />
                    Usamos tus datos solo para responderte sobre esta cotización.
                </p>
            </div>
        </aside>
    );
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default function TradeIn({ cuestionario, modelos = {}, maxFotos = 6 }) {
    const nombre = useNombreTienda();
    const borrador = useMemo(() => leerBorrador(), []);
    const pasos = cuestionario.pasos;
    const { data, setData, post, processing, errors, hasErrors } = useForm({ ...VACIO, ...(borrador?.datos ?? {}), fotos: [], declaracion: false, sitio_web: '' });
    const [paso, setPaso] = useState(() => Math.min(Math.max(0, borrador?.paso ?? 0), pasos.length - 1));
    const [retomado, setRetomado] = useState(Boolean(borrador?.datos?.tipo_dispositivo));
    const [previas, setPrevias] = useState([]);
    const [preparando, setPreparando] = useState(false);
    const arriba = useRef(null);

    const tipo = data.tipo_dispositivo;
    const preguntas = cuestionario.preguntas[tipo] ?? [];
    const actual = pasos[paso];

    // Lo respondido queda guardado en este navegador (sin fotos ni declaración) por si se cierra la página
    useEffect(() => {
        const t = setTimeout(() => {
            try {
                const { fotos, declaracion, sitio_web, ...datos } = data;
                localStorage.setItem(BORRADOR, JSON.stringify({ datos, paso }));
            } catch { /* sin almacenamiento */ }
        }, 400);
        return () => clearTimeout(t);
    }, [data, paso]);

    useEffect(() => () => previas.forEach((f) => f.url && URL.revokeObjectURL(f.url)), []); // eslint-disable-line react-hooks/exhaustive-deps

    const ficha = (modelos[tipo] ?? []).find((m) => m.nombre.toLowerCase() === data.modelo.trim().toLowerCase());
    const capacidades = [...(ficha?.capacidades ?? cuestionario.capacidades[tipo] ?? []), NO_SE];
    const memorias = [...(ficha?.memorias ?? cuestionario.memorias[tipo] ?? []), NO_SE];
    const colores = ficha?.colores ?? [];

    const completo = (id) => {
        if (id === 'equipo') {
            return Boolean(tipo) && data.modelo.trim().length >= 2
                && (!cuestionario.marcas[tipo] || data.marca.trim().length >= 2)
                && (!cuestionario.capacidades[tipo] || Boolean(data.capacidad))
                && (!cuestionario.memorias[tipo] || Boolean(data.memoria))
                && preguntas.filter((p) => p.paso === 'equipo').every((p) => respondida(p, data.respuestas?.[p.id]));
        }
        if (id === 'contacto') {
            return data.nombre_contacto.trim().length >= 2 && TELEFONO.test(data.telefono_contacto.trim()) && data.declaracion;
        }
        // Sin tipo de equipo no hay preguntas: el paso no cuenta como hecho
        return Boolean(tipo) && preguntas.filter((p) => p.paso === id).every((p) => respondida(p, data.respuestas?.[p.id]));
    };
    const alcanzable = (i) => pasos.slice(0, i).every((p) => completo(p.id));
    const faltantes = actual.id === 'equipo' || actual.id === 'contacto'
        ? 0
        : preguntas.filter((p) => p.paso === actual.id && !respondida(p, data.respuestas?.[p.id]))
            // En la lista de piezas cuenta cada pieza sin responder
            .reduce((total, p) => total + (p.tipo === 'componentes' ? p.componentes.filter((c) => !data.respuestas?.[p.id]?.[c.id]).length : 1), 0);

    const ir = (i) => {
        setPaso(i);
        const caja = arriba.current;
        if (caja && caja.getBoundingClientRect().top < 0) caja.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const elegirTipo = (t) => setData((d) => ({
        ...d, tipo_dispositivo: t, capacidad: '', memoria: '', color: '', marca: d.tipo_dispositivo === t ? d.marca : '',
        respuestas: d.tipo_dispositivo === t ? d.respuestas : {},
    }));
    const responder = (id, valor) => setData((d) => ({ ...d, respuestas: { ...d.respuestas, [id]: valor } }));

    const agregarFotos = async (lista) => {
        const archivos = Array.from(lista ?? []).slice(0, Math.max(0, maxFotos - data.fotos.length));
        if (!archivos.length) return;
        setPreparando(true);
        const listos = await Promise.all(archivos.map(prepararFoto));
        setPreparando(false);
        setData((d) => ({ ...d, fotos: [...d.fotos, ...listos].slice(0, maxFotos) }));
        setPrevias((p) => [...p, ...listos.map((f) => ({
            url: /^image\/(jpeg|png|webp|gif)$/.test(f.type) ? URL.createObjectURL(f) : null,
            nombre: f.name,
        }))].slice(0, maxFotos));
    };

    const quitarFoto = (i) => {
        if (previas[i]?.url) URL.revokeObjectURL(previas[i].url);
        setPrevias((p) => p.filter((_, j) => j !== i));
        setData((d) => ({ ...d, fotos: d.fotos.filter((_, j) => j !== i) }));
    };

    const empezarDeNuevo = () => {
        try { localStorage.removeItem(BORRADOR); } catch { /* sin almacenamiento */ }
        setData({ ...VACIO });
        setPrevias([]);
        setRetomado(false);
        ir(0);
    };

    const pasoDeError = (clave) => {
        if (/^(tipo_dispositivo|marca|modelo|capacidad|memoria|color)$/.test(clave)) return 'equipo';
        const id = clave.match(/^respuestas\.([^.]+)/)?.[1];
        if (id) return preguntas.find((p) => p.id === id)?.paso ?? 'equipo';
        if (clave === 'observaciones_cliente') return 'historia';
        return 'contacto';
    };

    const enviar = () => {
        if (processing) return;
        post(route('trade-in.store'), {
            forceFormData: true,
            // Con errores se queda en su lugar; al enviarse, la confirmación abre arriba
            preserveScroll: 'errors',
            onError: (errores) => {
                const destino = pasos.findIndex((p) => p.id === pasoDeError(Object.keys(errores)[0] ?? ''));
                if (destino >= 0) ir(destino);
            },
        });
    };

    const erroresDe = (id) => Object.entries(errors).filter(([k]) => k === `respuestas.${id}` || k.startsWith(`respuestas.${id}.`)).map(([, v]) => v);
    const ultimo = paso === pasos.length - 1;

    return (
        <StoreLayout>
            <section className="relative overflow-hidden" style={{ background: 'var(--ab-navy)' }}>
                <FloatingDevices />
                <StoreContainer className="relative z-10 py-14 md:py-20">
                    <div className="grid items-center gap-10 xl:grid-cols-[minmax(0,620px)_minmax(0,1fr)]">
                        <div className="max-w-2xl">
                            <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--ab-lime)' }}>Trade-In {nombre}</span>
                            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white md:text-[44px]">Cotiza tu equipo</h1>
                            <p className="mt-3 text-[15px] leading-relaxed text-white/75">
                                Recibimos iPhone, Mac y todo Apple, y también celulares Android, laptops, PC gamer, consolas y más. Cuéntanos cómo está, pieza por pieza: mientras más precisas sean tus respuestas, más cerca va a estar la cotización del valor que confirmamos al revisar el equipo en la tienda.
                            </p>
                            <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-white/85">
                                {['Sin costo', 'Sin compromiso', 'Te respondemos por WhatsApp'].map((t) => (
                                    <li key={t} className="flex items-center gap-1.5"><Check className="h-4 w-4" style={{ color: 'var(--ab-lime)' }} strokeWidth={2.4} />{t}</li>
                                ))}
                            </ul>

                            {/* En celular y tablet la revisión también se ve: la misma animación, acercada al equipo,
                                y lo que revisamos escrito debajo para que se lea nítido en pantalla angosta. */}
                            <div className="mt-7 xl:hidden">
                                <div aria-hidden="true" className="relative h-[190px] sm:h-[240px]">
                                    <EquipoEnRevision compacta />
                                </div>
                                <ul className="mt-2 flex flex-wrap justify-center gap-2">
                                    {['Pantalla', 'Batería', 'Cuentas y bloqueos', 'Piezas'].map((t) => (
                                        <li
                                            key={t}
                                            className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[12px] font-semibold text-white/85"
                                        >
                                            {t}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        {/* El espacio de la derecha: un equipo en revisión (solo decorativo) */}
                        <div aria-hidden="true" className="relative hidden self-stretch xl:block">
                            <EquipoEnRevision />
                        </div>
                    </div>
                </StoreContainer>
            </section>

            <section className="py-8 md:py-12" style={{ background: 'var(--surface-page)' }}>
                <StoreContainer>
                    <div ref={arriba} className="grid scroll-mt-32 items-start gap-6 lg:scroll-mt-48 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
                        <div className="relative min-w-0 rounded-3xl border bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-8" style={{ borderColor: 'var(--border-light)' }}>
                            {retomado && (
                                <p className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-2xl px-4 py-3 text-sm" style={{ background: 'var(--surface-muted)', color: 'var(--text-secondary)' }}>
                                    Retomamos lo que habías respondido en este navegador.
                                    <button type="button" onClick={empezarDeNuevo} className="font-bold underline" style={{ color: 'var(--ab-navy)' }}>Empezar de nuevo</button>
                                </p>
                            )}

                            <div className="flex gap-1.5" aria-hidden="true">
                                {pasos.map((p, i) => (
                                    <span key={p.id} className="h-1.5 flex-1 rounded-full transition-colors"
                                        style={{ background: i <= paso ? 'var(--ab-navy)' : 'var(--surface-muted)' }} />
                                ))}
                            </div>
                            <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--ab-periwinkle)' }}>
                                Paso {paso + 1} de {pasos.length}
                            </p>
                            <h2 className="mt-1 text-2xl font-black tracking-tight" style={{ color: 'var(--text-primary)' }}>{actual.titulo}</h2>
                            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>{actual.bajada}</p>

                            {hasErrors && (
                                <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                                    Revisa lo marcado en rojo antes de enviar.
                                </p>
                            )}

                            <AnimatePresence mode="wait">
                                <motion.div key={actual.id} className="mt-7 space-y-8"
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                                    {actual.id === 'equipo' && (
                                        <PasoEquipo cuestionario={cuestionario} data={data} setData={setData} errors={errors} modelos={modelos} ficha={ficha}
                                            capacidades={capacidades} memorias={memorias} colores={colores} elegirTipo={elegirTipo}
                                            preguntas={preguntas} responder={responder} erroresDe={erroresDe} />
                                    )}

                                    {actual.id !== 'equipo' && actual.id !== 'contacto' && preguntas.filter((p) => p.paso === actual.id).map((p) => (
                                        <Pregunta key={p.id} p={p} valor={data.respuestas?.[p.id]} onChange={(v) => responder(p.id, v)}
                                            estados={cuestionario.estados} errores={erroresDe(p.id)} />
                                    ))}

                                    {actual.id === 'historia' && (
                                        <Bloque titulo="¿Algo más que debamos saber?" opcional error={errors.observaciones_cliente}
                                            ayuda="Un detalle que no preguntamos: por ejemplo, si siempre usó funda y vidrio templado.">
                                            <textarea value={data.observaciones_cliente} maxLength={1000} rows={3} aria-label="Algo más que debamos saber"
                                                onChange={(e) => setData('observaciones_cliente', e.target.value)}
                                                className="w-full rounded-xl border bg-white px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-[color:var(--ab-periwinkle)]"
                                                style={{ borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }} />
                                        </Bloque>
                                    )}

                                    {actual.id === 'contacto' && (
                                        <PasoContacto data={data} setData={setData} errors={errors} previas={previas} agregarFotos={agregarFotos}
                                            quitarFoto={quitarFoto} maxFotos={maxFotos} preparando={preparando} />
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t pt-6" style={{ borderColor: 'var(--border-light)' }}>
                                {paso > 0 ? (
                                    <button type="button" onClick={() => ir(paso - 1)}
                                        className="inline-flex h-12 items-center gap-2 rounded-full border px-5 text-sm font-bold transition-colors hover:bg-black/[0.03]"
                                        style={{ borderColor: 'var(--border-medium)', color: 'var(--text-primary)' }}>
                                        <ArrowLeft className="h-4 w-4" /> Anterior
                                    </button>
                                ) : <span />}

                                <div className="flex flex-wrap items-center justify-end gap-3">
                                    {!completo(actual.id) && (
                                        <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                                            {faltantes > 0
                                                ? `Te falta${faltantes === 1 ? '' : 'n'} ${faltantes} respuesta${faltantes === 1 ? '' : 's'}.`
                                                : actual.id === 'contacto' ? 'Completa tu nombre, tu número y la declaración.' : 'Completa los datos del equipo.'}
                                        </span>
                                    )}
                                    {ultimo ? (
                                        <button type="button" onClick={enviar} disabled={processing || preparando || !completo(actual.id)}
                                            className="inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-bold transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                                            style={{ background: 'var(--ab-lime)', color: 'var(--text-on-lime)' }}>
                                            {processing ? 'Enviando…' : 'Enviar solicitud'} <ArrowRight className="h-4 w-4" />
                                        </button>
                                    ) : (
                                        <button type="button" onClick={() => ir(paso + 1)} disabled={!completo(actual.id)}
                                            className="inline-flex h-12 items-center gap-2 rounded-full px-7 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                                            style={{ background: 'var(--ab-navy)' }}>
                                            Siguiente <ArrowRight className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <Lateral data={data} pasos={pasos} paso={paso} alcanzable={alcanzable} completo={completo} onIr={ir} />
                    </div>
                </StoreContainer>
            </section>
        </StoreLayout>
    );
}
