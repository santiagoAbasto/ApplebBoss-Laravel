import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { route } from 'ziggy-js';
import { ExternalLink, Hammer, MessageCircle, Trash2, Wrench } from 'lucide-react';
import AdminGuide from '@/Components/Admin/AdminGuide';
import { Badge, EmptyState, PageHeader, Select, Textarea, Toast, buttonCls, useToast } from '@/Components/Admin/ui';
import { enlaceWhatsapp } from '@/Components/Admin/tradein';

// Tienda online → Solicitudes de servicio: lo que llega desde /servicio-tecnico. Acá se le escribe al cliente por
// WhatsApp y se sigue hasta que el equipo llega; ahí se registra en Servicio técnico, con su recepción.

const TONOS = { nuevo: 'amber', contactado: 'navy', recibido: 'emerald', cerrado: 'slate' };

function Fila({ s, estados }) {
  const [estado, setEstado] = useState(s.estado);
  const [notas, setNotas] = useState(s.notas ?? '');
  const cambio = estado !== s.estado || notas !== (s.notas ?? '');
  const ruta = route('admin.solicitudes-servicio.update', s.id);
  const opciones = { preserveScroll: true };

  const guardar = () => router.patch(ruta, { estado, notas_internas: notas }, opciones);
  // Abrir WhatsApp con una solicitud nueva la pasa a «En conversación»
  const escribir = () => { if (s.estado === 'nuevo') { setEstado('contactado'); router.patch(ruta, { estado: 'contactado' }, opciones); } };
  const borrar = () => {
    if (window.confirm(`¿Borrar la solicitud ${s.codigo} con los datos de ${s.cliente}? No se puede deshacer.`)) {
      router.delete(route('admin.solicitudes-servicio.destroy', s.id), opciones);
    }
  };

  return (
    <li className={`grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)] ${s.estado === 'cerrado' ? 'bg-slate-50/60' : ''}`}>
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-2">
          <span className="break-words text-[15px] font-bold text-slate-900">{s.equipo}</span>
          <Badge tone={TONOS[s.estado]}>{estados[s.estado]}</Badge>
        </p>
        <p className="mt-0.5 text-xs text-slate-500">
          <span className="font-mono text-slate-600">{s.codigo}</span> · {s.tipo} · {s.cliente} · {s.telefono} · llegó {s.creada_hace}
          {s.atendida_por ? ` · atiende ${s.atendida_por}` : ''}
        </p>
        <p className="mt-2 flex flex-wrap gap-1.5">
          {s.problemas.map((p) => <Badge key={p} tone="rose">{p}</Badge>)}
        </p>
        {s.descripcion && <p className="mt-2 whitespace-pre-line text-sm text-slate-700">{s.descripcion}</p>}

        <div className="mt-3 flex flex-wrap gap-2">
          {s.whatsapp && (
            <a href={enlaceWhatsapp(s.whatsapp, s.mensaje)} target="_blank" rel="noopener noreferrer" onClick={escribir}
              className={buttonCls('success', 'h-9 px-3 text-xs')}>
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          )}
          <Link href={route('admin.servicios.create')} className={buttonCls('secondary', 'h-9 px-3 text-xs')}>
            <Hammer className="h-3.5 w-3.5" /> Registrar la recepción
          </Link>
          <button type="button" onClick={borrar} className={buttonCls('danger', 'h-9 px-3 text-xs')}>
            <Trash2 className="h-3.5 w-3.5" /> Borrar
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <Select value={estado} onChange={(e) => setEstado(e.target.value)} aria-label={`Estado de ${s.codigo}`}>
          {Object.entries(estados).map(([valor, label]) => <option key={valor} value={valor}>{label}</option>)}
        </Select>
        <Textarea value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={2000} rows={2}
          placeholder="Notas internas (no las ve el cliente)" aria-label={`Notas internas de ${s.codigo}`} />
        {cambio && <button type="button" onClick={guardar} className={buttonCls('primary', 'h-9 w-full text-xs')}>Guardar</button>}
      </div>
    </li>
  );
}

export default function Index({ solicitudes = [], estados = {} }) {
  const [toast] = useToast();
  const nuevas = solicitudes.filter((s) => s.estado === 'nuevo').length;
  const verPagina = (
    <a href="/servicio-tecnico" target="_blank" rel="noopener noreferrer" className={buttonCls('secondary', 'h-11 px-4')}>
      <ExternalLink className="h-4 w-4" /> Ver la página
    </a>
  );

  return (
    <AdminLayout>
      <Head title="Solicitudes de servicio" />
      <Toast toast={toast} />

      <div className="ab-reset mx-auto max-w-[1200px] space-y-5">
        <PageHeader
          title="Solicitudes de servicio"
          subtitle="Los pedidos de revisión que llegan desde la página de servicio técnico de la tienda, con el equipo, lo que le pasa y cómo ubicar al cliente."
          actions={verPagina}
        />

        <AdminGuide id="solicitudes-servicio" title="¿Cómo se atiende una solicitud?" steps={[
          'El cliente llena el formulario de /servicio-tecnico. Te avisamos en el Resumen y con un número junto a «Solicitudes de servicio» en el menú.',
          'Escríbele con «WhatsApp»: el mensaje ya lleva su código y la solicitud pasa a «En conversación».',
          'Cuando traiga el equipo, regístralo con «Registrar la recepción» (Servicio técnico) y deja la solicitud en «Equipo recibido».',
        ]} tip="Las notas internas nunca se muestran en la tienda." />

        <section className="rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          <h2 className="flex items-center gap-2 border-b border-slate-100 px-5 py-4 text-base font-bold text-slate-900">
            <Wrench className="h-[18px] w-[18px] text-[#585E9F]" /> Solicitudes
            <span className="text-sm font-semibold text-slate-400">{solicitudes.length}</span>
            {nuevas > 0 && <Badge tone="amber">{nuevas} sin responder</Badge>}
          </h2>

          {solicitudes.length === 0 ? (
            <EmptyState icon={Wrench} title="Todavía no llegó ninguna solicitud"
              text="Cuando un cliente pida la revisión de su equipo en /servicio-tecnico, aparece acá y te avisamos en el Resumen." action={verPagina} />
          ) : (
            <ol className="divide-y divide-slate-100">
              {solicitudes.map((s) => <Fila key={`${s.id}-${s.estado}-${s.notas ?? ''}`} s={s} estados={estados} />)}
            </ol>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
