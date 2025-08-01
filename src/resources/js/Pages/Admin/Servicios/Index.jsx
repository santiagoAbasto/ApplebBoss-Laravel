import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import dayjs from 'dayjs';
import { route } from 'ziggy-js';
import axios from 'axios';

export default function ServiciosIndex({ servicios = [], filtros = {}, vendedores = [] }) {
  const [fechaInicio, setFechaInicio] = useState(filtros.fecha_inicio || '');
  const [fechaFin, setFechaFin] = useState(filtros.fecha_fin || '');
  const [vendedorId, setVendedorId] = useState(filtros.vendedor_id || '');
  const [buscar, setBuscar] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState(null);
  

  const handleFiltrar = (e) => {
    e.preventDefault();
    router.get(route('admin.servicios.index'), {
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      vendedor_id: vendedorId,
    });
  };

  const handleExportarFiltrado = () => {
    const queryParams = new URLSearchParams({
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      vendedor_id: vendedorId,
    }).toString();
    window.open(route('admin.servicios.exportarFiltrado') + '?' + queryParams, '_blank');
  };

  const buscarServicio = async (e) => {
    e.preventDefault();
    if (!buscar.trim()) return;

    try {
      const response = await axios.get(route('admin.servicios.index'), {
        params: { buscar: buscar.trim() },
      });
      setResultadosBusqueda(response.data.servicios || []);
    } catch (error) {
      console.error('Error al buscar servicio técnico:', error);
      setResultadosBusqueda([]);
    }
  };

  

  const listaFinal = resultadosBusqueda !== null ? resultadosBusqueda : servicios;

  return (
    <AdminLayout>
      <Head title="Servicios Técnicos" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">🧰 Servicios Técnicos</h1>
        <div className="flex gap-3 mt-4 md:mt-0">
          <Link
            href={route('admin.servicios.create')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow transition"
          >
            ➕ Registrar Servicio
          </Link>
          <button
            onClick={handleExportarFiltrado}
            className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow transition"
          >
            🧾 Exportar PDF Filtrado
          </button>
        </div>
      </div>

      <form onSubmit={buscarServicio} className="flex items-center gap-2 mb-6">
        <input
          type="text"
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
          placeholder="Buscar por código o nombre del cliente"
          className="border px-3 py-2 rounded w-80"
        />
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Buscar
        </button>
      </form>

      <form
        onSubmit={handleFiltrar}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-md mb-6"
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Inicio</label>
          <input
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Fin</label>
          <input
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vendedor</label>
          <select
            value={vendedorId}
            onChange={(e) => setVendedorId(e.target.value)}
            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm"
          >
            <option value="">— Todos —</option>
            {vendedores.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2 px-4 rounded-lg shadow transition"
          >
            🔎 Filtrar
          </button>
        </div>
      </form>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-x-auto">
        <table className="w-full table-auto text-sm text-left text-gray-800 dark:text-gray-100">
          <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs uppercase">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Código Nota</th>
              <th className="px-4 py-3">Equipo</th>
              <th className="px-4 py-3">Técnico</th>
              <th className="px-4 py-3 text-right">Costo</th>
              <th className="px-4 py-3 text-right">Venta</th>
              <th className="px-4 py-3 text-right">Ganancia</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Registrado por</th>
              <th className="px-4 py-3 text-center">Nota</th>
            </tr>
          </thead>
          <tbody>
            {listaFinal.length > 0 ? (
              listaFinal.map((s) => {
                const costo = parseFloat(s.precio_costo || 0);
                const venta = parseFloat(s.precio_venta || 0);
                const ganancia = venta - costo;

                return (
                  <tr
                    key={s.id}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <td className="px-4 py-3">{s.cliente}</td>
                    <td className="px-4 py-3 text-blue-700 font-mono">{s.codigo_nota || '—'}</td>
                    <td className="px-4 py-3">{s.equipo}</td>
                    <td className="px-4 py-3">{s.tecnico}</td>
                    <td className="px-4 py-3 text-right">{costo.toFixed(2)} Bs</td>
                    <td className="px-4 py-3 text-right">{venta.toFixed(2)} Bs</td>
                    <td className="px-4 py-3 text-right text-green-600 font-semibold">{ganancia.toFixed(2)} Bs</td>
                    <td className="px-4 py-3">{dayjs(s.fecha).format('DD/MM/YYYY')}</td>
                    <td className="px-4 py-3">{s.vendedor?.name || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <a
                        href={route('admin.servicios.boleta', { servicio: s.id })}
                        target="_blank"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Ver Nota de Servicio
                      </a>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="10" className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  No hay servicios registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
