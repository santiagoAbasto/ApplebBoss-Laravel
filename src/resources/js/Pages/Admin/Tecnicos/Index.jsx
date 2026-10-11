import { Head, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';
import { Pencil, Plus, Wrench } from 'lucide-react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Badge, Button, EmptyState, Field, Input, Modal, PageHeader, Segmented, Switch, Toast, useToast } from '@/Components/Admin/ui';

// Sistema → Técnicos registrados: los nombres que se eligen al recibir un equipo y al firmar un diagnóstico.
// Corregir un nombre lo corrige también en los servicios y diagnósticos ya registrados (TecnicoController).

const veces = (n, una, varias) => `${n.toLocaleString('es-BO')} ${n === 1 ? una : varias}`;

function Editor({ tecnico, especialidades, onCerrar }) {
  const nuevo = !tecnico;
  const form = useForm({
    nombre: tecnico?.nombre ?? '',
    especialidad: tecnico?.especialidad ?? 'ambas',
    activo: tecnico?.activo ?? true,
  });
  const registros = (tecnico?.servicios ?? 0) + (tecnico?.diagnosticos ?? 0);
  const renombra = !nuevo && form.data.nombre.trim() !== tecnico.nombre;

  const guardar = (e) => {
    e.preventDefault();
    const opciones = { preserveScroll: true, onSuccess: onCerrar };
    nuevo ? form.post(route('admin.tecnicos.store'), opciones) : form.patch(route('admin.tecnicos.update', tecnico.id), opciones);
  };

  return (
    <Modal title={nuevo ? 'Nuevo técnico' : 'Editar técnico'} onClose={onCerrar}
      footer={<>
        <Button onClick={onCerrar}>Cancelar</Button>
        <Button variant="primary" type="submit" form="form-tecnico" disabled={form.processing}>
          {form.processing ? 'Guardando…' : 'Guardar'}
        </Button>
      </>}>
      <form id="form-tecnico" onSubmit={guardar} className="space-y-5">
        <Field label="Nombre" value={form.data.nombre} max={120} error={form.errors.nombre}
          hint={renombra && registros > 0
            ? `También se corrige en ${veces(tecnico.servicios, 'servicio', 'servicios')} y ${veces(tecnico.diagnosticos, 'diagnóstico', 'diagnósticos')} ya registrados.`
            : 'Tal como quieres que aparezca al recibir un equipo.'}>
          <Input value={form.data.nombre} onChange={(e) => form.setData('nombre', e.target.value)} maxLength={120} autoFocus placeholder="Ej.: MIGUEL CHAVEZ" />
        </Field>

        <Field label="Qué equipos recibe" error={form.errors.especialidad}>
          <Segmented ariaLabel="Qué equipos recibe" value={form.data.especialidad} onChange={(v) => form.setData('especialidad', v)} options={especialidades} cols="grid-cols-1 sm:grid-cols-3" />
        </Field>

        {!nuevo && (
          <div className="flex items-start justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Activo</p>
              <p className="mt-0.5 text-[12px] text-slate-500">Si lo desactivas deja de aparecer al recibir equipos. Sus servicios no se tocan.</p>
            </div>
            <Switch checked={form.data.activo} onChange={(v) => form.setData('activo', v)} label="Activo" />
          </div>
        )}
      </form>
    </Modal>
  );
}

export default function Index({ tecnicos = [], especialidades = [] }) {
  const [toast] = useToast();
  const [editando, setEditando] = useState(null); // null: cerrado · 'nuevo' · el técnico
  const etiqueta = Object.fromEntries(especialidades.map((e) => [e.value, e.label]));

  return (
    <AdminLayout title="Técnicos registrados">
      <Head title="Técnicos registrados" />
      <PageHeader
        title="Técnicos registrados"
        subtitle="Los nombres que se eligen al recibir un equipo en Servicio técnico y al firmar un diagnóstico. Si corriges un nombre, también se corrige en lo ya registrado."
        actions={<Button variant="primary" onClick={() => setEditando('nuevo')}><Plus className="h-4 w-4" /> Nuevo técnico</Button>}
      />

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200/80 bg-white">
        {tecnicos.length === 0 ? (
          <EmptyState icon={Wrench} title="Todavía no hay técnicos" text="Registra a quien repara para poder elegirlo al recibir un equipo." />
        ) : (
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-slate-50 text-left text-[12px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Nombre</th>
                <th className="px-5 py-3 font-semibold">Recibe</th>
                <th className="px-5 py-3 font-semibold">Servicios</th>
                <th className="px-5 py-3 font-semibold">Diagnósticos</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tecnicos.map((t) => (
                <tr key={t.id} className={t.activo ? '' : 'text-slate-400'}>
                  <td className="px-5 py-3.5 font-semibold text-slate-900">{t.nombre}</td>
                  <td className="px-5 py-3.5">{etiqueta[t.especialidad] ?? t.especialidad}</td>
                  <td className="px-5 py-3.5 tabular-nums">{t.servicios.toLocaleString('es-BO')}</td>
                  <td className="px-5 py-3.5 tabular-nums">{t.diagnosticos.toLocaleString('es-BO')}</td>
                  <td className="px-5 py-3.5">{t.activo ? <Badge tone="emerald">Activo</Badge> : <Badge>Inactivo</Badge>}</td>
                  <td className="px-5 py-3.5 text-right">
                    <Button variant="ghost" onClick={() => setEditando(t)} aria-label={`Editar a ${t.nombre}`}><Pencil className="h-4 w-4" /> Editar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editando && (
        <Editor key={editando === 'nuevo' ? 'nuevo' : editando.id} tecnico={editando === 'nuevo' ? null : editando}
          especialidades={especialidades} onCerrar={() => setEditando(null)} />
      )}
      <Toast toast={toast} />
    </AdminLayout>
  );
}
