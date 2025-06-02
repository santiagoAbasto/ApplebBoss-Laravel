import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';
import dayjs from 'dayjs';
import Chart from 'react-apexcharts';
import { route } from 'ziggy-js';

export default function ReporteIndex({ ventas = [], resumen, resumen_grafico, filtros, vendedores }) {
  const [fechaInicio, setFechaInicio] = useState(filtros.fecha_inicio || '');
  const [fechaFin, setFechaFin] = useState(filtros.fecha_fin || '');
  const [vendedorId, setVendedorId] = useState(filtros.vendedor_id || '');

  const handleFiltrar = (e) => {
    e.preventDefault();
    router.get(route('admin.reportes.index'), {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      vendedor_id: vendedorId,
    });
  };

  const handleExportarPDF = () => {
    const queryParams = new URLSearchParams({
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      vendedor_id: vendedorId,
    }).toString();
    window.open(route('admin.reportes.exportar') + '?' + queryParams, '_blank');
  };

  const chartData = {
    series: [
      resumen.ganancias_por_tipo?.celulares || 0,
      resumen.ganancias_por_tipo?.computadoras || 0,
      resumen.ganancias_por_tipo?.generales || 0,
      resumen.ganancias_por_tipo?.servicio_tecnico || 0,
      resumen.total_inversion || 0,
    ],
    options: {
      chart: { type: 'donut' },
      labels: [
        'Ganancia Celulares',
        'Ganancia Computadoras',
        'Ganancia Productos Generales',
        'Ganancia Servicio Técnico',
        'Inversión Total',
      ],
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#06b6d4', '#ef4444'],
      dataLabels: { style: { fontSize: '14px' } },
      legend: { position: 'bottom' },
    },
  };

  return (
    <AdminLayout>
      <Head title="Reportes de Ventas" />
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-sky-800 mb-4">📈 Reportes de Ventas</h1>
        <form onSubmit={handleFiltrar} className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-xl shadow">
          <div>
            <label className="text-sm font-medium text-gray-700">📅 Fecha Inicio</label>
            <input type="date" className="w-full mt-1 px-3 py-2 border rounded-lg" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">📅 Fecha Fin</label>
            <input type="date" className="w-full mt-1 px-3 py-2 border rounded-lg" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">👤 Vendedor</label>
            <select className="w-full mt-1 px-3 py-2 border rounded-lg" value={vendedorId} onChange={(e) => setVendedorId(e.target.value)}>
              <option value="">— Todos —</option>
              {vendedores.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 items-end">
            <button type="submit" className="w-full bg-sky-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-sky-700">🔍 Filtrar</button>
            <button type="button" onClick={handleExportarPDF} className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-xl hover:bg-green-700">🧾 Exportar PDF</button>
          </div>
        </form>
      </div>

      {/* Gráfico de torta */}
      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="text-xl font-bold text-gray-700 mb-4">📊 Ganancias por Categoría e Inversión</h2>
        <Chart options={chartData.options} series={chartData.series} type="donut" height={350} />
      </div>

      {/* Tabla Detalle */}
      <div className="bg-white p-6 rounded-xl shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">📄 Detalle de Ventas</h3>
        <div className="overflow-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
              <tr>
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Producto</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Cant.</th>
                <th className="px-3 py-2">Precio Venta</th>
                <th className="px-3 py-2">Descuento</th>
                <th className="px-3 py-2">Permuta</th>
                <th className="px-3 py-2">Capital</th>
                <th className="px-3 py-2">Subtotal</th>
                <th className="px-3 py-2">Ganancia</th>
                <th className="px-3 py-2">Vendedor</th>
                <th className="px-3 py-2">Entregado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ventas.length > 0 ? ventas.map((i, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{dayjs(i.fecha).format('DD/MM/YYYY')}</td>
                  <td className="px-3 py-2">{i.producto}</td>
                  <td className="px-3 py-2 capitalize">{i.tipo?.replace('_', ' ')}</td>
                  <td className="px-3 py-2 text-center">{i.cantidad}</td>
                  <td className="px-3 py-2 text-blue-700 font-semibold">{Number(i.precio_venta || 0).toFixed(2)} Bs</td>
                  <td className="px-3 py-2 text-red-600">- {Number(i.descuento || 0).toFixed(2)} Bs</td>
                  <td className="px-3 py-2 text-yellow-600">- {Number(i.permuta || 0).toFixed(2)} Bs</td>
                  <td className="px-3 py-2 text-orange-600">{Number(i.capital || 0).toFixed(2)} Bs</td>
                  <td className="px-3 py-2 font-medium">{Number(i.subtotal || 0).toFixed(2)} Bs</td>
                  <td className={`px-3 py-2 font-bold ${i.ganancia < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {i.ganancia < 0
                      ? `Se invirtió ${Math.abs(Number(i.ganancia || 0)).toFixed(2)} Bs`
                      : `${Number(i.ganancia || 0).toFixed(2)} Bs`}
                  </td>
                  <td className="px-3 py-2">{i.vendedor}</td>
                  <td className="px-3 py-2">{i.entregado ?? '—'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="12" className="text-center text-gray-500 py-4">No hay resultados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
