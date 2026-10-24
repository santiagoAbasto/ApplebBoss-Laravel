import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { FileUp, FileSpreadsheet, FileText, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { PageHeader, Card, Field, Button, Badge, Toast, useToast, bsFmt, EmptyState } from '@/Components/Admin/ui';

const usd = (n) => `$${Number(n || 0).toLocaleString('es-BO')}`;

const SIM = { fisico: 'Chip físico', esim: 'eSIM' };

export default function Proveedores({ proveedores = [], vista = null }) {
  const toast = useToast();
  const form = useForm({ proveedor: vista?.proveedor ?? (proveedores[0]?.nombre ?? ''), archivo: null });

  const subir = (e) => {
    e.preventDefault();
    form.post(route('admin.proveedores.previsualizar'), { forceFormData: true, preserveScroll: true });
  };

  const publicar = () => {
    router.post(route('admin.proveedores.aplicar'), { proveedor: vista.proveedor, token: vista.token }, { preserveScroll: true });
  };

  return (
    <AdminLayout>
      <Head title="Listas de proveedor" />
      <Toast toast={toast} />

      <PageHeader
        title="Listas de proveedor"
        subtitle="Sube el Excel o el PDF de tu proveedor. El sistema le suma tu ganancia y el precio en Bs se calcula solo, al dólar paralelo en vivo."
      />

      {/* Proveedores con lista vigente */}
      <Card title="Proveedores" subtitle="Lo que hoy alimenta el catálogo" className="mb-6">
        {proveedores.length === 0 ? (
          <p className="text-sm text-slate-500">Todavía no hay listas cargadas.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {proveedores.map((p) => (
              <div key={p.archivo} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#011446] text-white">
                  <FileUp className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">{p.nombre}</p>
                  <p className="text-xs text-slate-500">{p.items} productos · {p.subida ? 'subida por ti' : 'de base'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Subir una lista */}
      <Card title="Subir o actualizar una lista" subtitle="Excel (.xlsx) de Apple Land o PDF de Planet. Mañana cambian los precios: subís el archivo nuevo y listo." className="mb-6">
        <form onSubmit={subir} className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Proveedor" error={form.errors.proveedor} hint="Elige uno o escribe el nombre de uno nuevo.">
              <input list="proveedores-lista" value={form.data.proveedor} maxLength={60} placeholder="Ej.: Apple Land"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-[color:var(--ab-acento)] focus:outline-none focus:ring-4 focus:ring-[rgb(var(--ab-acento-rgb)_/_0.15)]"
                onChange={(e) => form.setData('proveedor', e.target.value)} />
              <datalist id="proveedores-lista">
                {proveedores.map((p) => <option key={p.archivo} value={p.nombre} />)}
              </datalist>
            </Field>
            <Field label="Archivo de la lista" error={form.errors.archivo} hint="Excel o PDF, hasta 10 MB.">
              <input type="file" accept=".xlsx,.xls,.pdf" required
                className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#011446] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#011446]/90"
                onChange={(e) => form.setData('archivo', e.target.files?.[0] ?? null)} />
            </Field>
          </div>
          <Button type="submit" variant="primary" disabled={form.processing || !form.data.archivo || !form.data.proveedor}>
            {form.processing ? 'Leyendo…' : 'Ver vista previa'}
          </Button>
        </form>
      </Card>

      {/* Vista previa */}
      {vista && (
        <Card
          title={`Vista previa · ${vista.proveedor}`}
          subtitle={`${vista.archivo} — revisá antes de publicar. Nada entra a la tienda hasta que confirmes.`}
          actions={
            <Button variant="primary" onClick={publicar}>
              <CheckCircle2 className="mr-1.5 h-4 w-4" /> Publicar al catálogo
            </Button>
          }
        >
          <div className="mb-4 flex flex-wrap gap-2 text-sm">
            <Badge tone="emerald">{vista.resumen.total} productos</Badge>
            <Badge tone="navy">{vista.resumen.actualizados} ya existían</Badge>
            {vista.resumen.nuevos > 0 && <Badge tone="amber">{vista.resumen.nuevos} nuevos</Badge>}
            <Badge tone="slate">Paralelo {vista.resumen.tasa} Bs/USDT</Badge>
          </div>

          {vista.errores.length > 0 && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-sm font-bold text-amber-800">
                <AlertTriangle className="h-4 w-4" /> No se entendieron {vista.errores.length} líneas (no se publican):
              </p>
              <p className="mt-1 text-[13px] text-amber-700">{vista.errores.join(' · ')}</p>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Producto</th>
                  <th className="px-3 py-2.5">Colores</th>
                  <th className="px-3 py-2.5 text-right">Costo</th>
                  <th className="px-3 py-2.5 text-right">+ Ganancia</th>
                  <th className="px-3 py-2.5 text-right">Precio Bs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vista.filas.map((f, i) => (
                  <tr key={i} className={f.nuevo ? 'bg-amber-50/40' : ''}>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2 font-semibold text-slate-900">
                        {f.modelo} {f.capacidad && <span className="text-slate-500">{f.capacidad}</span>}
                        {f.sim && <Badge tone={f.sim === 'esim' ? 'navy' : 'slate'}>{SIM[f.sim] ?? f.sim}</Badge>}
                        {f.nuevo && <Badge tone="amber">nuevo</Badge>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-500">{f.colores?.join(', ') || '—'}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-500">{usd(f.costo_usd)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-emerald-700">+{usd(f.margen_usd)}</td>
                    <td className="px-3 py-2.5 text-right font-bold tabular-nums text-slate-900">{bsFmt(f.precio_bs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 flex items-center gap-2 text-[13px] text-slate-500">
            <Sparkles className="h-4 w-4 text-[var(--ab-periwinkle,#585E9F)]" />
            El precio en Bs se recalcula solo cuando cambia el dólar paralelo. Tus fotos no se pierden al publicar.
          </p>
        </Card>
      )}
    </AdminLayout>
  );
}
