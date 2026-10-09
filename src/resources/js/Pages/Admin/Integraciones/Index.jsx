import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { route } from 'ziggy-js';
import { Check, Copy, KeyRound, Pencil, Plug, Plus, RotateCw, ShieldAlert, Trash2 } from 'lucide-react';
import {
  Badge, Card, EmptyState, Field, Input, Modal, PageHeader, Switch, Toast, buttonCls, fmtDate, useToast,
} from '@/Components/Admin/ui';

// Sistema → Integraciones API: los sistemas que pueden leer la API de integración (solo lectura) y con qué permisos.
// El token se ve una sola vez; en la base queda solo su hash (App\Http\Controllers\Admin\IntegracionController).

function Copiar({ texto }) {
  const [listo, setListo] = useState(false);
  return (
    <button type="button" className={buttonCls('primary', 'h-10 shrink-0 px-4 text-sm')}
      onClick={() => navigator.clipboard?.writeText(texto).then(() => { setListo(true); setTimeout(() => setListo(false), 2000); })}>
      {listo ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {listo ? 'Copiado' : 'Copiar'}
    </button>
  );
}

function TokenNuevo({ token }) {
  return (
    <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-5">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-amber-900">Token de «{token.integracion}»: cópialo ahora</p>
          <p className="mt-1 text-[13px] text-amber-900/80">
            No se vuelve a mostrar. Guárdalo en las variables de entorno del otro sistema, nunca en el código, en un chat ni en una captura.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input readOnly value={token.token} onFocus={(e) => e.target.select()}
              className="h-10 min-w-0 flex-1 rounded-xl border border-amber-300 bg-white px-3 font-mono text-[13px] text-slate-900" />
            <Copiar texto={token.token} />
          </div>
        </div>
      </div>
    </section>
  );
}

function FormularioIntegracion({ integracion, scopes, onCerrar }) {
  const editando = Boolean(integracion);
  const { data, setData, post, patch, processing, errors } = useForm({
    nombre: integracion?.nombre ?? 'APPLE BOSS AI',
    scopes: integracion?.scopes ?? scopes.map((s) => s.clave),
    activa: integracion?.activa ?? true,
  });
  const alternar = (clave) => setData('scopes', data.scopes.includes(clave) ? data.scopes.filter((s) => s !== clave) : [...data.scopes, clave]);
  const guardar = () => {
    const opciones = { preserveScroll: true, onSuccess: onCerrar };
    if (editando) patch(route('admin.integraciones.update', integracion.id), opciones);
    else post(route('admin.integraciones.store'), opciones);
  };

  return (
    <Modal title={editando ? `Editar «${integracion.nombre}»` : 'Nueva integración'} onClose={onCerrar}
      footer={<>
        <button type="button" className={buttonCls('secondary', 'h-10 px-4 text-sm')} onClick={onCerrar}>Cancelar</button>
        <button type="button" disabled={processing} className={buttonCls('primary', 'h-10 px-4 text-sm')} onClick={guardar}>
          {editando ? 'Guardar' : 'Crear y generar token'}
        </button>
      </>}>
      <div className="space-y-5">
        <Field label="Nombre" hint="El sistema que va a leer la API. Lo ves en el registro de solicitudes." value={data.nombre} max={80} error={errors.nombre}>
          <Input value={data.nombre} onChange={(e) => setData('nombre', e.target.value)} maxLength={80} />
        </Field>
        <Field label="Permisos" hint="Todo es de solo lectura: ningún permiso deja cambiar stock, precios ni productos." error={errors.scopes}>
          <div className="space-y-2">
            {scopes.map((s) => (
              <label key={s.clave} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
                <input type="checkbox" className="mt-0.5 rounded border-slate-300" checked={data.scopes.includes(s.clave)} onChange={() => alternar(s.clave)} />
                <span className="min-w-0">
                  <span className="block font-mono text-[12px] font-bold text-slate-900">{s.clave}</span>
                  <span className="block text-[12px] text-slate-500">{s.texto}</span>
                </span>
              </label>
            ))}
          </div>
        </Field>
        {editando && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
            <span>
              <span className="block text-sm font-bold text-slate-900">Activa</span>
              <span className="block text-[12px] text-slate-500">Desactivada, ninguno de sus tokens entra.</span>
            </span>
            <Switch checked={data.activa} onChange={(v) => setData('activa', v)} label="Integración activa" />
          </div>
        )}
      </div>
    </Modal>
  );
}

function Integracion({ integracion, horasDeGracia, onEditar }) {
  const nuevoToken = (vencer) => router.post(route('admin.integraciones.token', integracion.id), { vencer_anteriores: vencer }, { preserveScroll: true });
  const revocar = (token) => {
    if (window.confirm(`¿Revocar «${token.nombre}»? El sistema que lo use deja de entrar ya.`)) {
      router.delete(route('admin.integraciones.revocar', [integracion.id, token.id]), { preserveScroll: true });
    }
  };
  const vigentes = integracion.tokens.filter((t) => !t.vencido);

  return (
    <Card
      title={<span className="flex flex-wrap items-center gap-2">{integracion.nombre}
        {integracion.activa ? <Badge tone="emerald">Activa</Badge> : <Badge tone="rose">Desactivada</Badge>}</span>}
      subtitle={`Último uso: ${fmtDate(integracion.ultimo_uso)} · ${integracion.pedidos_24h} pedidos en 24 h, ${integracion.rechazos_24h} con error`}
      actions={<div className="flex flex-wrap gap-2">
        <button type="button" className={buttonCls('secondary', 'h-9 px-3 text-xs')} onClick={onEditar}><Pencil className="h-3.5 w-3.5" /> Editar</button>
        <button type="button" className={buttonCls('secondary', 'h-9 px-3 text-xs')} onClick={() => nuevoToken(false)}><Plus className="h-3.5 w-3.5" /> Otro token</button>
        {vigentes.length > 0 && (
          <button type="button" className={buttonCls('primary', 'h-9 px-3 text-xs')} title={`Los tokens actuales siguen ${horasDeGracia} h, para cambiarlo sin cortar el servicio`}
            onClick={() => nuevoToken(true)}><RotateCw className="h-3.5 w-3.5" /> Rotar token</button>
        )}
      </div>}>
      <div className="flex flex-wrap gap-1.5">
        {integracion.scopes.map((s) => <Badge key={s} tone="navy" className="font-mono">{s}</Badge>)}
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead className="text-[11px] uppercase tracking-wide text-slate-500">
            <tr><th className="py-2 pr-3">Token</th><th className="py-2 pr-3">Creado</th><th className="py-2 pr-3">Último uso</th><th className="py-2 pr-3">Vence</th><th /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {integracion.tokens.length === 0 && <tr><td colSpan={5} className="py-3 text-slate-500">Sin tokens: genera uno para conectar el sistema.</td></tr>}
            {integracion.tokens.map((t) => (
              <tr key={t.id} className={t.vencido ? 'text-slate-400' : ''}>
                <td className="py-2 pr-3 font-semibold"><KeyRound className="mr-1 inline h-3.5 w-3.5" />{t.nombre}</td>
                <td className="py-2 pr-3">{fmtDate(t.creado)}</td>
                <td className="py-2 pr-3">{fmtDate(t.ultimo_uso)}</td>
                <td className="py-2 pr-3">{t.vence ? (t.vencido ? 'Vencido' : fmtDate(t.vence)) : 'No vence'}</td>
                <td className="py-2 text-right">
                  <button type="button" className={buttonCls('danger', 'h-8 px-2.5 text-xs')} onClick={() => revocar(t)}><Trash2 className="h-3.5 w-3.5" /> Revocar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

const tonoEstado = (e) => (e < 300 ? 'emerald' : e === 429 ? 'amber' : e < 500 ? 'rose' : 'violet');

export default function Index({ integraciones, solicitudes, scopes, base, limite, horasDeGracia, tokenNuevo }) {
  const [toast] = useToast();
  const [editando, setEditando] = useState(null);

  return (
    <AdminLayout title="Integraciones API">
      <Head title="Integraciones API" />
      <div className="space-y-6">
        <PageHeader title="Integraciones API"
          subtitle="Sistemas autorizados a leer el inventario, los precios y las fotos de Apple Boss por la API de integración. Es de solo lectura."
          actions={<button type="button" className={buttonCls('primary', 'h-10 px-4 text-sm')} onClick={() => setEditando('nueva')}><Plus className="h-4 w-4" /> Nueva integración</button>} />

        {tokenNuevo && <TokenNuevo token={tokenNuevo} />}

        <Card title="Cómo se conecta" subtitle="Lo que necesita el otro sistema. La guía completa está en el repositorio: docs/integrations/APPLE_BOSS_AI_HANDOFF.md">
          <dl className="grid gap-3 text-[13px] sm:grid-cols-3">
            <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Dirección</dt><dd className="mt-1 break-all font-mono text-slate-900">{base}</dd></div>
            <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Cabecera</dt><dd className="mt-1 font-mono text-slate-900">Authorization: Bearer &lt;token&gt;</dd></div>
            <div><dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Límite</dt><dd className="mt-1 text-slate-900">{limite} pedidos por minuto por integración</dd></div>
          </dl>
          <p className="mt-3 text-[12px] text-slate-500">
            Prueba de conexión: <span className="font-mono text-slate-700">GET {base}/health</span>. La API muestra lo registrado en este sistema;
            que un producto no aparezca no quiere decir que la tienda no lo venda.
          </p>
        </Card>

        {integraciones.length === 0
          ? <Card><EmptyState icon={Plug} title="Todavía no hay integraciones" text="Crea «APPLE BOSS AI» cuando el otro sistema esté listo para conectarse. El token se muestra una sola vez."
              action={<button type="button" className={buttonCls('primary', 'h-10 px-4 text-sm')} onClick={() => setEditando('nueva')}><Plus className="h-4 w-4" /> Nueva integración</button>} /></Card>
          : integraciones.map((i) => <Integracion key={i.id} integracion={i} horasDeGracia={horasDeGracia} onEditar={() => setEditando(i)} />)}

        <Card title="Últimas solicitudes" subtitle="Las 60 más recientes, también las rechazadas. Se guardan 90 días. Nunca se guarda el token.">
          {solicitudes.length === 0
            ? <p className="text-[13px] text-slate-500">Todavía nadie llamó a la API.</p>
            : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-[13px]">
                  <thead className="text-[11px] uppercase tracking-wide text-slate-500">
                    <tr><th className="py-2 pr-3">Fecha</th><th className="py-2 pr-3">Integración</th><th className="py-2 pr-3">Ruta</th><th className="py-2 pr-3">Estado</th><th className="py-2 text-right">Tiempo</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {solicitudes.map((s) => (
                      <tr key={s.id}>
                        <td className="whitespace-nowrap py-2 pr-3">{fmtDate(s.fecha)}</td>
                        <td className="py-2 pr-3">{s.integracion ?? <span className="text-slate-400">Sin token válido</span>}</td>
                        <td className="py-2 pr-3 font-mono text-[12px]">{s.metodo} {s.ruta}</td>
                        <td className="py-2 pr-3"><Badge tone={tonoEstado(s.estado)}>{s.estado}</Badge></td>
                        <td className="py-2 text-right tabular-nums">{s.duracion_ms} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
        </Card>
      </div>

      {editando && (
        <FormularioIntegracion integracion={editando === 'nueva' ? null : editando} scopes={scopes} onCerrar={() => setEditando(null)} />
      )}
      <Toast toast={toast} />
    </AdminLayout>
  );
}
