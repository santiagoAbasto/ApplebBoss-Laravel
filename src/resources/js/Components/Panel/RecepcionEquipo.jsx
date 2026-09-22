import { useState } from 'react';
import { Check, KeyRound, Minus, Plus, Trash2, X } from 'lucide-react';
import { Input, Segmented, inputCls } from '@/Components/Admin/ui';

// Sí / No / No probado. Ningún punto viene marcado: una nota que dice «todo funcionaba» sin que nadie lo probó
// no defiende a nadie, ni al cliente ni a la tienda.
export const ESTADOS = [
  { value: 'si', label: 'Sí', icon: Check, activo: 'border-emerald-600 bg-emerald-600 text-white' },
  { value: 'no', label: 'No', icon: X, activo: 'border-rose-600 bg-rose-600 text-white' },
  { value: 'nc', label: 'No probado', icon: Minus, activo: 'border-slate-500 bg-slate-500 text-white' },
];

const MODOS_DESBLOQUEO = [
  { value: 'deja', label: 'Lo deja' },
  { value: 'no_deja', label: 'No lo deja' },
  { value: 'sin_bloqueo', label: 'Sin bloqueo' },
];

const TIPOS_DESBLOQUEO = [
  { value: 'pin', label: 'PIN' },
  { value: 'patron', label: 'Patrón' },
  { value: 'contrasena', label: 'Contraseña' },
];

let ultimoId = 0;
export const puntoNuevo = (etiqueta, propio = false) => ({ id: ++ultimoId, etiqueta, estado: null, propio });

export const recepcionInicial = (puntos = []) => ({
  revision: puntos.map((p) => puntoNuevo(p)),
  desbloqueo: { modo: '', tipo: 'pin', valor: '' },
});

/** Lo que viaja al servidor: solo los puntos que alguien marcó. */
export const payloadRecepcion = (recepcion) => ({
  revision: recepcion.revision
    .filter((p) => p.estado && p.etiqueta.trim())
    .map((p) => ({ etiqueta: p.etiqueta.trim(), estado: p.estado })),
  desbloqueo: recepcion.desbloqueo.modo === 'deja'
    ? { modo: 'deja', tipo: recepcion.desbloqueo.tipo, valor: recepcion.desbloqueo.valor.trim() }
    : { modo: recepcion.desbloqueo.modo },
});

/** Cómo se lee el desbloqueo en el resumen lateral. */
export function textoDesbloqueo(desbloqueo) {
  if (desbloqueo.modo === 'deja') {
    const tipo = TIPOS_DESBLOQUEO.find((t) => t.value === desbloqueo.tipo)?.label ?? 'PIN';
    return desbloqueo.valor.trim() ? `${tipo} ${desbloqueo.valor.trim()}` : `${tipo} sin anotar`;
  }
  if (desbloqueo.modo === 'no_deja') return 'No lo deja';
  if (desbloqueo.modo === 'sin_bloqueo') return 'Sin bloqueo';
  return '';
}

export function validarRecepcion(recepcion) {
  const e = {};
  if (!recepcion.desbloqueo.modo) e.desbloqueo = 'Indica si el cliente deja el código de desbloqueo.';
  else if (recepcion.desbloqueo.modo === 'deja' && !recepcion.desbloqueo.valor.trim())
    e.desbloqueo = 'Escribe el código que dejó el cliente.';
  return e;
}

function Punto({ punto, onEstado, onQuitar }) {
  return (
    <li className={`flex items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
      punto.estado ? 'border-slate-200 bg-white' : 'border-dashed border-slate-300 bg-slate-50/60'}`}>
      <span className={`min-w-0 flex-1 truncate text-[13px] ${punto.estado ? 'font-semibold text-slate-900' : 'text-slate-600'}`}
        title={punto.etiqueta}>{punto.etiqueta}</span>
      <div className="flex shrink-0 items-center gap-1" role="group" aria-label={`Estado de ${punto.etiqueta}`}>
        {ESTADOS.map((e) => {
          const activo = punto.estado === e.value;
          const Icono = e.icon;
          return (
            <button key={e.value} type="button" aria-pressed={activo} title={e.label}
              aria-label={`${punto.etiqueta}: ${e.label}`}
              onClick={() => onEstado(activo ? null : e.value)}
              className={`grid h-7 w-7 place-items-center rounded-lg border text-[11px] font-bold transition-colors ${
                activo ? e.activo : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300 hover:text-slate-700'}`}>
              <Icono className="h-3.5 w-3.5" />
            </button>
          );
        })}
      </div>
      {/* Papelera y no una ✕: al lado del «No» del estado, dos equis seguidas se confunden */}
      <button type="button" onClick={onQuitar} title="Quitar este punto" aria-label={`Quitar ${punto.etiqueta}`}
        className="ml-1 grid h-7 w-7 shrink-0 place-items-center rounded-lg border-l border-slate-100 pl-2 text-slate-300 transition-colors hover:text-rose-600">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}

export default function RecepcionEquipo({ recepcion, onCambiar, error }) {
  const [nuevo, setNuevo] = useState('');
  const { revision, desbloqueo } = recepcion;
  const marcados = revision.filter((p) => p.estado).length;

  const cambiarRevision = (lista) => onCambiar({ ...recepcion, revision: lista });
  const cambiarDesbloqueo = (cambios) => onCambiar({ ...recepcion, desbloqueo: { ...desbloqueo, ...cambios } });

  const agregar = () => {
    const etiqueta = nuevo.trim();
    if (!etiqueta) return;
    // Lo que se agrega en el mostrador entra ya marcado: se escribe porque se acaba de comprobar
    cambiarRevision([...revision, { ...puntoNuevo(etiqueta, true), estado: 'si' }]);
    setNuevo('');
  };

  return (
    <div className="space-y-5">
      {/* Desbloqueo */}
      <div className={`rounded-xl border p-4 ${error ? 'border-rose-300 bg-rose-50/40' : 'border-slate-200 bg-slate-50/60'}`}>
        <p className="flex items-center gap-2 text-[13px] font-bold text-slate-900">
          <KeyRound className="h-4 w-4 text-[color:var(--ab-acento)]" /> Código de desbloqueo
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Sin el código no se puede probar el equipo. Marca siempre una opción: que el cliente no lo haya dejado
          también queda impreso en la nota.
        </p>
        <div className="mt-3 space-y-3">
          <Segmented options={MODOS_DESBLOQUEO} value={desbloqueo.modo} cols="grid-cols-3"
            ariaLabel="Código de desbloqueo" onChange={(v) => cambiarDesbloqueo({ modo: v })} />
          {desbloqueo.modo === 'deja' && (
            <div className="flex gap-2">
              <select value={desbloqueo.tipo} onChange={(e) => cambiarDesbloqueo({ tipo: e.target.value })}
                aria-label="Tipo de bloqueo" className={`${inputCls} h-11 w-36 pr-8`}>
                {TIPOS_DESBLOQUEO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <Input value={desbloqueo.valor} maxLength={60} autoComplete="off" className="font-semibold"
                placeholder={desbloqueo.tipo === 'patron' ? 'Ej.: L invertida, 1-4-7-8-9' : 'Ej.: 1234'}
                aria-label="Código de desbloqueo"
                onChange={(e) => cambiarDesbloqueo({ valor: e.target.value })} />
            </div>
          )}
        </div>
        {error && <p className="mt-2 text-xs font-semibold text-rose-600">{error}</p>}
      </div>

      {/* Revisión */}
      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-[13px] font-bold text-slate-900">
            Revisión del equipo
            <span className="ml-2 font-semibold text-slate-400">{marcados} de {revision.length} marcados</span>
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => cambiarRevision(revision.map((p) => ({ ...p, estado: 'si' })))}
              className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-200">
              Marcar todo «Sí»
            </button>
            {marcados > 0 && (
              <button type="button" onClick={() => cambiarRevision(revision.map((p) => ({ ...p, estado: null })))}
                className="rounded-lg px-2.5 py-1 text-xs font-bold text-slate-500 transition-colors hover:bg-slate-100">
                Limpiar
              </button>
            )}
          </div>
        </div>

        <ul className="grid gap-2 md:grid-cols-2">
          {revision.map((p) => (
            <Punto key={p.id} punto={p}
              onEstado={(estado) => cambiarRevision(revision.map((x) => (x.id === p.id ? { ...x, estado } : x)))}
              onQuitar={() => cambiarRevision(revision.filter((x) => x.id !== p.id))} />
          ))}
        </ul>

        <div className="mt-3 flex gap-2">
          <input value={nuevo} onChange={(e) => setNuevo(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregar(); } }}
            maxLength={80} aria-label="Agregar un punto a la revisión"
            placeholder="Agregar otro punto. Ej.: bandeja del chip trabada"
            className={`${inputCls} h-11 flex-1`} />
          <button type="button" onClick={agregar} disabled={!nuevo.trim()}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-[#011446] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#02205f] disabled:cursor-not-allowed disabled:opacity-40">
            <Plus className="h-4 w-4" /> Agregar
          </button>
        </div>
        <p className="mt-1.5 text-[11.5px] leading-snug text-slate-500">
          Solo se imprime lo que marques. Lo que no aplique a este equipo, quítalo con la papelera.
        </p>
      </div>
    </div>
  );
}
