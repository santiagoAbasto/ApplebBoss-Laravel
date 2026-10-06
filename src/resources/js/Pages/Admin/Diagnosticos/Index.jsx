import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { route } from 'ziggy-js';
import { FileText, PencilLine, Plus, Stethoscope, Trash2 } from 'lucide-react';
import AdminGuide from '@/Components/Admin/AdminGuide';
import {
  Badge, EmptyState, Field, Input, Modal, PageHeader, Select, Textarea, Toast, buttonCls, useToast,
} from '@/Components/Admin/ui';

// Ventas y operación → Diagnósticos: el informe técnico de un equipo, con el membrete, la firma y el sello de la
// tienda. La firma certifica lo que vio el técnico: el PDF sale firmado recién con pruebas, conclusión y técnico.

const vacio = (hoy) => ({
  fecha: hoy, cliente_nombre: '', cliente_telefono: '', cliente_correo: '', equipo: '', identificador: '',
  falla_reportada: '', pruebas: [], conclusion: '', recomendacion: '', tecnico: '',
});

// Las pruebas guardadas primero; después las sugeridas que falten, sin resultado
const conSugeridas = (pruebas, sugeridas) => {
  const tiene = new Set(pruebas.map((p) => p.prueba.toLowerCase()));
  return [
    ...pruebas.map((p) => ({ ...p, detalle: p.detalle ?? '' })),
    ...sugeridas.filter((s) => !tiene.has(s.toLowerCase())).map((s) => ({ prueba: s, resultado: '', detalle: '' })),
  ];
};

function Formulario({ diagnostico, hoy, sugeridas, resultados, tecnicos, onClose }) {
  const base = vacio(hoy);
  const inicial = diagnostico
    ? Object.fromEntries(Object.keys(base).map((k) => [k, diagnostico[k] ?? base[k]]))
    : base;
  const { data, setData, post, put, processing, errors } = useForm({ ...inicial, pruebas: conSugeridas(inicial.pruebas || [], sugeridas) });

  const cambiarPrueba = (n, campo, valor) => setData((d) => ({
    ...d, pruebas: d.pruebas.map((p, i) => (i === n ? { ...p, [campo]: valor } : p)),
  }));
  const agregarPrueba = () => setData((d) => ({ ...d, pruebas: [...d.pruebas, { prueba: '', resultado: '', detalle: '' }] }));

  const guardar = (e) => {
    e.preventDefault();
    const opciones = { preserveScroll: true, onSuccess: onClose };
    if (diagnostico) put(route('admin.diagnosticos.update', diagnostico.id), opciones);
    else post(route('admin.diagnosticos.store'), opciones);
  };
  const campo = (nombre) => ({ value: data[nombre], onChange: (e) => setData(nombre, e.target.value) });
  const hechas = data.pruebas.filter((p) => p.prueba.trim() && p.resultado).length;

  return (
    <Modal wide title={diagnostico ? `Diagnóstico ${diagnostico.codigo}` : 'Nuevo diagnóstico'} onClose={onClose}
      footer={<>
        <button type="button" onClick={onClose} className={buttonCls('secondary')}>Cancelar</button>
        <button type="submit" form="form-diagnostico" disabled={processing} className={buttonCls('primary')}>Guardar</button>
      </>}>
      <form id="form-diagnostico" onSubmit={guardar} className="space-y-6">
        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="Cliente" error={errors.cliente_nombre}><Input {...campo('cliente_nombre')} maxLength={255} /></Field>
          <Field label="Fecha de la revisión" error={errors.fecha}><Input type="date" {...campo('fecha')} /></Field>
          <Field label="WhatsApp (opcional)" error={errors.cliente_telefono}><Input {...campo('cliente_telefono')} maxLength={20} placeholder="+591 70000000" /></Field>
          <Field label="Correo (opcional)" error={errors.cliente_correo}><Input type="email" {...campo('cliente_correo')} maxLength={255} /></Field>
          <Field label="Equipo" error={errors.equipo}><Input {...campo('equipo')} maxLength={255} placeholder="iPhone 15" /></Field>
          <Field label="IMEI o número de serie (opcional)" error={errors.identificador}><Input {...campo('identificador')} maxLength={60} /></Field>
        </section>

        <Field label="Falla que reporta el cliente" error={errors.falla_reportada} hint="Con sus palabras. En el informe sale como lo que declaró el cliente, no como resultado de la revisión.">
          <Textarea {...campo('falla_reportada')} rows={4} maxLength={5000} />
        </Field>

        <section>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Pruebas del técnico <span className="font-normal normal-case text-slate-400">· {hechas} con resultado</span></p>
          <p className="mt-1 text-[11px] text-slate-500">Solo salen en el informe las que tienen resultado. Ninguna viene marcada: se marca lo que se probó.</p>
          <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {data.pruebas.map((p, n) => (
              <li key={n} className="grid gap-2 px-3 py-2.5 sm:grid-cols-[minmax(0,1.1fr)_170px_minmax(0,1.4fr)]">
                <Input value={p.prueba} onChange={(e) => cambiarPrueba(n, 'prueba', e.target.value)} maxLength={80} placeholder="Otra prueba" aria-label="Prueba" />
                <Select value={p.resultado} onChange={(e) => cambiarPrueba(n, 'resultado', e.target.value)} aria-label={`Resultado de ${p.prueba || 'la prueba'}`}>
                  <option value="">Sin probar</option>
                  {Object.entries(resultados).map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
                </Select>
                <Input value={p.detalle} onChange={(e) => cambiarPrueba(n, 'detalle', e.target.value)} maxLength={500} placeholder="Observación (opcional)" aria-label={`Observación de ${p.prueba || 'la prueba'}`} />
              </li>
            ))}
          </ul>
          <button type="button" onClick={agregarPrueba} className={buttonCls('secondary', 'mt-2 h-9 px-3 text-xs')}><Plus className="h-3.5 w-3.5" /> Agregar prueba</button>
        </section>

        <Field label="Conclusión del técnico" error={errors.conclusion} hint="Qué tiene el equipo según lo que se probó. Sin conclusión el informe sale como borrador.">
          <Textarea {...campo('conclusion')} rows={4} maxLength={5000} />
        </Field>
        <Field label="Recomendación (opcional)" error={errors.recomendacion}>
          <Textarea {...campo('recomendacion')} rows={3} maxLength={5000} />
        </Field>
        <Field label="Técnico responsable" error={errors.tecnico}>
          <Input {...campo('tecnico')} maxLength={255} list="tecnicos-diagnostico" />
          <datalist id="tecnicos-diagnostico">{tecnicos.map((t) => <option key={t} value={t} />)}</datalist>
        </Field>
      </form>
    </Modal>
  );
}

export default function Index({ diagnosticos = [], pruebasSugeridas = [], resultados = {}, tecnicos = [], hoy = '' }) {
  const [toast] = useToast();
  const [abierto, setAbierto] = useState(null); // null cerrado · 'nuevo' · un diagnóstico

  const borrar = (d) => {
    if (window.confirm(`¿Borrar el diagnóstico ${d.codigo} de ${d.cliente_nombre}? No se puede deshacer.`)) {
      router.delete(route('admin.diagnosticos.destroy', d.id), { preserveScroll: true });
    }
  };
  const nuevo = (
    <button type="button" onClick={() => setAbierto('nuevo')} className={buttonCls('primary', 'h-11 px-4')}>
      <Plus className="h-4 w-4" /> Nuevo diagnóstico
    </button>
  );

  return (
    <AdminLayout>
      <Head title="Diagnósticos" />
      <Toast toast={toast} />

      <div className="ab-reset mx-auto max-w-[1200px] space-y-5">
        <PageHeader title="Diagnósticos" subtitle="El informe técnico de un equipo, con el membrete, la firma y el sello de la tienda." actions={nuevo} />

        <AdminGuide id="diagnosticos" title="¿Cómo se hace un informe?" steps={[
          'Al recibir el equipo, anota el cliente, el equipo y la falla que reporta con sus palabras.',
          'Cuando el técnico lo revisa, marca el resultado de cada prueba que hizo y escribe la conclusión.',
          'Con pruebas, conclusión y técnico, el PDF sale firmado y sellado. Antes sale como borrador sin firma.',
        ]} tip="La firma de la tienda respalda lo que probó el técnico, por eso no sale en un informe sin revisión." />

        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <h2 className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 text-base font-bold text-slate-900">
            <Stethoscope className="h-[18px] w-[18px] text-[#585E9F]" /> Informes
            <span className="text-sm font-semibold text-slate-400">{diagnosticos.length}</span>
          </h2>

          {diagnosticos.length === 0 ? (
            <EmptyState icon={Stethoscope} title="Todavía no hay diagnósticos" text="Crea el primero cuando recibas un equipo para revisar." action={nuevo} />
          ) : (
            <ol className="divide-y divide-slate-100">
              {diagnosticos.map((d) => (
                <li key={d.id} className="flex flex-wrap items-start justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2">
                      <span className="break-words text-[15px] font-bold text-slate-900">{d.equipo}</span>
                      {d.listo ? <Badge tone="emerald">Listo para entregar</Badge> : <Badge tone="amber">Borrador</Badge>}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      <span className="font-mono text-slate-600">{d.codigo}</span> · {d.cliente_nombre} · {d.fecha?.split('-').reverse().join('/')}
                      {d.tecnico ? ` · técnico ${d.tecnico}` : ''}
                    </p>
                    {!d.listo && <p className="mt-1 text-xs font-semibold text-amber-700">{d.falta} para firmarlo.</p>}
                    <p className="mt-2 line-clamp-2 whitespace-pre-line text-sm text-slate-700">{d.falla_reportada}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setAbierto(d)} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>
                      <PencilLine className="h-3.5 w-3.5" /> {d.listo ? 'Editar' : 'Completar'}
                    </button>
                    <a href={route('admin.diagnosticos.pdf', d.id)} target="_blank" rel="noopener noreferrer" className={buttonCls(d.listo ? 'primary' : 'secondary', 'h-9 px-3 text-xs')}>
                      <FileText className="h-3.5 w-3.5" /> {d.listo ? 'Informe PDF' : 'Ver borrador'}
                    </a>
                    <button type="button" onClick={() => borrar(d)} className={buttonCls('danger', 'h-9 px-3 text-xs')}>
                      <Trash2 className="h-3.5 w-3.5" /> Borrar
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {abierto && (
        <Formulario key={abierto === 'nuevo' ? 'nuevo' : abierto.id} diagnostico={abierto === 'nuevo' ? null : abierto} hoy={hoy}
          sugeridas={pruebasSugeridas} resultados={resultados} tecnicos={tecnicos} onClose={() => setAbierto(null)} />
      )}
    </AdminLayout>
  );
}
