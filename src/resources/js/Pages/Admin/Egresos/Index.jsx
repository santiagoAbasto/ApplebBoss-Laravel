import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { FaFilter, FaFilePdf, FaPlus } from 'react-icons/fa';

export default function Index({ egresos, filtros }) {
  const { data, setData, get } = useForm({
    fecha_inicio: filtros?.fecha_inicio || '',
    fecha_fin: filtros?.fecha_fin || '',
  });

  const handleFiltrar = () => {
    get(route('admin.egresos.index'), {
      preserveScroll: true,
      preserveState: true,
    });
  };

  const handleExportarPDF = () => {
    const query = new URLSearchParams({
      fecha_inicio: data.fecha_inicio,
      fecha_fin: data.fecha_fin,
    }).toString();
    window.open(route('admin.egresos.exportar-pdf') + '?' + query, '_blank');
  };

  return (
    <AdminLayout>
      <Head title="Egresos" />

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Encabezado */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
            💸 Listado de Egresos
          </h1>
          <Link
            href={route('admin.egresos.create')}
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow-sm transition"
          >
            <FaPlus /> Nuevo Egreso
          </Link>
        </div>

        {/* Filtro */}
        <div className="bg-white p-4 rounded shadow flex flex-wrap gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 font-medium">Desde</label>
            <input
              type="date"
              value={data.fecha_inicio}
              onChange={e => setData('fecha_inicio', e.target.value)}
              className="input border-gray-300 rounded-md"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 font-medium">Hasta</label>
            <input
              type="date"
              value={data.fecha_fin}
              onChange={e => setData('fecha_fin', e.target.value)}
              className="input border-gray-300 rounded-md"
            />
          </div>
          <button
            onClick={handleFiltrar}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow-sm transition"
          >
            <FaFilter /> Filtrar
          </button>
          <button
            onClick={handleExportarPDF}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow-sm transition"
          >
            <FaFilePdf /> Exportar PDF
          </button>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto bg-white rounded shadow">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-blue-50 text-blue-900 font-semibold text-left">
              <tr>
                <th className="px-4 py-3 border">#</th>
                <th className="px-4 py-3 border">Concepto</th>
                <th className="px-4 py-3 border">Precio (Bs)</th>
                <th className="px-4 py-3 border">Tipo de Gasto</th>
                <th className="px-4 py-3 border">Frecuencia</th>
                <th className="px-4 py-3 border">Cuotas</th>
                <th className="px-4 py-3 border">Comentario</th>
                <th className="px-4 py-3 border">Registrado por</th>
                <th className="px-4 py-3 border">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {egresos.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-6 text-gray-500">
                    No hay egresos registrados.
                  </td>
                </tr>
              ) : (
                egresos.map((e, i) => (
                  <tr key={e.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-2 border text-center">{i + 1}</td>
                    <td className="px-4 py-2 border">{e.concepto}</td>
                    <td className="px-4 py-2 border">Bs {parseFloat(e.precio_invertido).toFixed(2)}</td>
                    <td className="px-4 py-2 border capitalize">{e.tipo_gasto.replace('_', ' ')}</td>
                    <td className="px-4 py-2 border">{e.frecuencia || '—'}</td>
                    <td className="px-4 py-2 border">
                      {e.tipo_gasto === 'cuota_bancaria'
                        ? `${e.cuotas_pendientes ?? 0} cuotas`
                        : 'No aplica'}
                    </td>
                    <td className="px-4 py-2 border">{e.comentario || '—'}</td>
                    <td className="px-4 py-2 border">{e.user?.name || '—'}</td>
                    <td className="px-4 py-2 border">{new Date(e.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
