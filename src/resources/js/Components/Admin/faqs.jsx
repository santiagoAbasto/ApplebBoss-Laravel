import { ChevronDown, House, Package, ScanLine, Smartphone } from 'lucide-react';

// Piezas que comparten el listado y el editor de Tienda online → Preguntas frecuentes.

/** El ícono de cada lugar donde puede salir una pregunta. */
export const ICONOS = {
  general: House,
  producto: Package,
  iphone: Smartphone,
  seminuevos: ScanLine,
};

export const iconoDe = (clave) => ICONOS[clave] ?? House;

/** Así se ve el bloque de preguntas en la tienda: la primera abierta y las demás cerradas. */
export function VistaPreguntas({ preguntas = [] }) {
  const visibles = preguntas.filter((p) => p.active);

  if (visibles.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-[13px] text-slate-500">
        Sin preguntas encendidas, la tienda no dibuja esta sección.
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-slate-200 px-4">
      <p className="border-b border-slate-100 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
        Preguntas frecuentes
      </p>
      {visibles.slice(0, 6).map((p, i) => (
        <div key={p.id} className="border-b border-slate-100 py-3 last:border-b-0">
          <p className="flex items-start justify-between gap-3 text-[13px] font-semibold text-slate-800">
            {p.question}
            <ChevronDown className={`mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 ${i === 0 ? 'rotate-180' : ''}`} aria-hidden="true" />
          </p>
          {i === 0 && <p className="mt-2 text-xs leading-relaxed text-slate-500">{p.answer}</p>}
        </div>
      ))}
      {visibles.length > 6 && (
        <p className="py-3 text-xs text-slate-400">y {visibles.length - 6} más…</p>
      )}
    </div>
  );
}
