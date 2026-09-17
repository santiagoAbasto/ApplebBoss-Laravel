import { useState } from 'react';
import { usePage } from '@inertiajs/react';

// Destinos del sitio para elegir de una lista, sin escribir direcciones a mano.
export const DESTINOS = [
    ['/', 'Inicio'],
    ['/catalogo', 'Todo el catálogo'],
    ['/iphone', 'iPhone'],
    ['/mac', 'Mac'],
    ['/catalogo?categoria=productos-apple', 'Más Apple (iPad, Watch, AirPods)'],
    ['/myskin', 'Fundas MYSKIN'],
    ['/catalogo?categoria=accesorios', 'Accesorios'],
    ['/seminuevos', 'Seminuevos'],
    ['/trade-in', 'Trade-In (entregar tu equipo)'],
    ['/novedades', 'Novedades'],
];

const OTRA = '__otra__';

/** El nombre legible de un destino: las páginas fijas y las colecciones o páginas que se le pasen. */
export const nombreDestino = (url, extra = []) =>
    [...DESTINOS, ...extra].find(([v]) => v === url)?.[1] ?? url;

/** Las páginas informativas encendidas (Nosotros, Garantía…), que comparte el servidor con todas las pantallas. */
export const usePaginasDestino = () => (usePage().props.paginas ?? []).map((p) => [p.href, p.title]);

/**
 * "¿A dónde lleva?" — lista de páginas del sitio + opción para pegar otra dirección.
 * `extra` suma destinos propios del sitio (por ejemplo, las colecciones) en su propio grupo.
 */
export default function LinkPicker({
    value, onChange, className = '', allowEmpty = false, emptyLabel = 'Sin enlace',
    extra = null, extraLabel = 'Colecciones',
}) {
    // Sin `extra`, se usan las colecciones que comparta la pantalla (Menú, Portada, Categorías, Servicios)
    const { colecciones = [] } = usePage().props;
    const destinos = extra ?? colecciones.map((c) => [c.url, c.nombre]);
    const paginas = usePaginasDestino();
    const conocido = [...DESTINOS, ...destinos, ...paginas].some(([v]) => v === value);
    const [otra, setOtra] = useState(!!value && !conocido);

    const selectValue = otra ? OTRA : (value || '');

    return (
        <div className="space-y-2">
            <select
                className={className}
                value={selectValue}
                onChange={(e) => {
                    const v = e.target.value;
                    if (v === OTRA) { setOtra(true); return; }
                    setOtra(false);
                    onChange(v);
                }}
            >
                {allowEmpty && <option value="">{emptyLabel}</option>}
                {!allowEmpty && !value && !otra && <option value="" disabled>Elige una página…</option>}
                {DESTINOS.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                {destinos.length > 0 && (
                    <optgroup label={extraLabel}>
                        {destinos.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                    </optgroup>
                )}
                {paginas.length > 0 && (
                    <optgroup label="Páginas informativas">
                        {paginas.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                    </optgroup>
                )}
                <option value={OTRA}>Otra dirección (pegar enlace)…</option>
            </select>
            {otra && (
                <input
                    className={className}
                    value={value ?? ''}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder="Pega aquí el enlace, por ejemplo: https://wa.me/591…"
                    maxLength={500}
                />
            )}
        </div>
    );
}
