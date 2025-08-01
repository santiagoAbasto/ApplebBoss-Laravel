import VendedorLayout from '@/Layouts/VendedorLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';
import { route } from 'ziggy-js';

export default function Index({ ventas }) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);

  const buscarNota = async () => {
    if (!query.trim()) return;

    try {
      const response = await axios.post(route('vendedor.ventas.buscarNota'), {
        codigo_nota: query.trim(),
      });
      setResultados(response.data);
    } catch (error) {
      console.error('Error al buscar:', error);
      setResultados([]);
    }
  };

  const obtenerNombreProducto = (item) => {
    return (
      item.celular?.modelo ||
      item.computadora?.modelo ||
      item.producto_general?.nombre ||
      item.producto_apple?.modelo ||
      (item.tipo === 'servicio' ? 'Servicio Técnico' : 'Producto')
    );
  };
  const esServicioTecnico = (venta) =>
    venta.tipo === 'servicio_tecnico' ||
    venta.tipo_venta === 'servicio_tecnico' ||
    venta.tipo === 'servicio';

  const abrirBoleta = (registro) => {
    if (!registro || !registro.id_real || !registro.tipo_venta) return;

    const isServicio = registro.tipo_venta === 'servicio_tecnico';

    const url = isServicio
      ? route('vendedor.servicios.boleta', { servicio: registro.id_real })
      : route('vendedor.ventas.boleta', { venta: registro.id_real });

    window.open(url, '_blank');
  };

  const exportarPDF = () => {
    window.open(route('vendedor.ventas.exportar'), '_blank');
  };

  return (
    <VendedorLayout>
      <Head title="Mis Ventas" />

      {/* Título + botones */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2">Mis Ventas</h1>
        <div className="flex gap-2">
          <Link
            href={route('vendedor.ventas.create')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow transition"
          >
            + Nueva Venta
          </Link>
          <button
            onClick={exportarPDF}
            className="inline-flex items-center px-4 py-2 border border-red-500 text-red-500 text-sm font-semibold rounded-lg hover:bg-red-50 transition"
          >
            📄 Exportar PDF
          </button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          className="input w-full"
          placeholder="Buscar por código de nota o cliente"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && buscarNota()}
        />
        <button onClick={buscarNota} className="btn btn-primary">Buscar</button>
      </div>

      {/* Resultados de búsqueda */}
      {resultados.length > 0 && (
        <div className="bg-white border border-blue-100 rounded shadow p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-700 mb-2">Resultados de búsqueda</h2>
          <ul className="space-y-2 text-sm">
            {resultados.map((venta, index) => (
              <li key={`${venta.id}-${index}`} className="flex justify-between items-center border-b pb-2">
                <div>
                  <span className="font-bold text-blue-900">{venta.codigo_nota || '—'}</span> — {venta.nombre_cliente}
                  <div className="text-xs text-gray-500">
                    {esServicioTecnico(venta) ? 'Servicio Técnico' : 'Venta de producto'}
                  </div>
                </div>
                <button
                  onClick={() => {
                    abrirBoleta(venta);
                    setQuery('');
                    setResultados([]);
                  }}
                  className="btn btn-sm btn-outline-primary"
                >
                  Ver Boleta
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabla de ventas */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm text-gray-700">
            <thead className="bg-blue-50 text-blue-800 font-semibold text-xs uppercase">
              <tr>
                <th className="px-4 py-2 text-left">Cliente</th>
                <th className="px-4 py-2 text-left">Código Nota</th>
                <th className="px-4 py-2 text-left">Producto(s)</th>
                <th className="px-4 py-2 text-left">Total Venta</th>
                <th className="px-4 py-2 text-left">Fecha</th>
                <th className="px-4 py-2 text-left">Boleta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ventas.length > 0 ? (
                ventas.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-2">{v.nombre_cliente}</td>
                    <td className="px-4 py-2 text-blue-700 font-mono">{v.codigo_nota || '—'}</td>
                    <td className="px-4 py-2">
                      {v.items && v.items.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {v.items.map((item, i) => (
                            <li key={`${v.id}-${i}`}>{obtenerNombreProducto(item)}</li>
                          ))}
                        </ul>
                      ) : esServicioTecnico(v) ? (
                        <span className="text-indigo-600 font-semibold">Servicio Técnico</span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 font-semibold text-green-700">
                      {parseFloat(v.subtotal || 0).toLocaleString('es-BO', { minimumFractionDigits: 2 })} Bs
                    </td>
                    <td className="px-4 py-2 text-gray-500">
                      {new Date(v.created_at).toLocaleString('es-BO', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => {
                          console.log(v); // ✅ Asegura que tiene tipo: 'servicio_tecnico'
                          abrirBoleta(v);
                        }}
                        className="btn btn-xs btn-outline-primary"
                      >
                        Ver Boleta
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-4 py-6 text-center text-gray-400 italic">
                    No hay ventas registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </VendedorLayout>
  );
}
