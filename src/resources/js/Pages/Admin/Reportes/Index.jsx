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

  const itemsDesglosados = ventas.map((item) => {
    const precio_venta = parseFloat(item.precio_venta || 0);
    const descuento = parseFloat(item.descuento || 0);
    const permuta = parseFloat(item.permuta || 0);
    const capital = parseFloat(item.capital || 0);
    const subtotal = parseFloat(item.subtotal || 0);
    const ganancia = subtotal - descuento - permuta - capital;

    let nombreProducto = '—';
    if (item.celular) nombreProducto = `📱 ${item.celular.marca} ${item.celular.modelo}`;
    else if (item.computadora) nombreProducto = `💻 ${item.computadora.marca} ${item.computadora.nombre}`;
    else if (item.producto_general) nombreProducto = `📦 ${item.producto_general.nombre}`;
    else if (item.tipo === 'servicio_tecnico') nombreProducto = '🛠️ Servicio Técnico';

    const entregado =
      item.entregado_celular?.modelo ||
      item.entregado_computadora?.nombre ||
      item.entregado_producto_general?.nombre ||
      '—';

    return {
      ...item,
      producto: nombreProducto,
      entregado,
      precio_venta,
      descuento,
      permuta,
      capital,
      subtotal,
      ganancia,
    };
  });

  const chartData = {
    series: [
      resumen.total_ventas || 0,
      resumen.ganancia_liquida || 0,
      resumen.ganancia_servicio || 0,
      resumen.total_descuento || 0,
    ],
    options: {
      chart: { type: 'donut' },
      labels: ['Ventas Totales', 'Ganancia Productos', 'Ganancia Servicios', 'Descuentos'],
      colors: ['#10b981', '#3b82f6', '#06b6d4', '#f43f5e'],
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

      {/* Gráfico */}
      <div className="bg-white p-6 rounded-xl shadow mb-8">
        <h2 className="text-xl font-bold text-gray-700 mb-4">📊 Visualización General</h2>
        <Chart options={chartData.options} series={chartData.series} type="donut" height={350} />
      </div>

      {/* Detalle */}
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
              {itemsDesglosados.length > 0 ? itemsDesglosados.map((i, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{dayjs(i.fecha).format('DD/MM/YYYY')}</td>
                  <td className="px-3 py-2">{i.producto}</td>
                  <td className="px-3 py-2 capitalize">{i.tipo?.replace('_', ' ')}</td>
                  <td className="px-3 py-2 text-center">{i.cantidad}</td>
                  <td className="px-3 py-2 text-blue-700 font-semibold">{i.precio_venta.toFixed(2)} Bs</td>
                  <td className="px-3 py-2 text-red-600">- {i.descuento.toFixed(2)} Bs</td>
                  <td className="px-3 py-2 text-yellow-600">- {i.permuta.toFixed(2)} Bs</td>
                  <td className="px-3 py-2 text-orange-600">{i.capital.toFixed(2)} Bs</td>
                  <td className="px-3 py-2 font-medium">{i.subtotal.toFixed(2)} Bs</td>
                  <td className={`px-3 py-2 font-bold ${i.ganancia < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {i.ganancia < 0
                      ? `Se invirtió ${Math.abs(i.ganancia).toFixed(2)} Bs`
                      : `${i.ganancia.toFixed(2)} Bs`}
                  </td>
                  <td className="px-3 py-2">{i.vendedor}</td>
                  <td className="px-3 py-2">{i.entregado}</td>
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
