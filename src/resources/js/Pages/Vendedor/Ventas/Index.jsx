import VendedorLayout from '@/Layouts/VendedorLayout';
import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import axios from 'axios';

export default function Index({ ventas }) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);

  const buscarNota = async () => {
    if (!query.trim()) return;

    try {
      const response = await axios.post(route('ventas.buscarNota'), {
        codigo_nota: query,
      });
      setResultados(response.data);
    } catch (error) {
      console.error('Error al buscar:', error);
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

  const exportarPDF = () => {
    window.open(route('vendedor.ventas.exportar'), '_blank');
  };

  return (
    <VendedorLayout>
      <Head title="Mis Ventas" />

      {/* Título + botones */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
          Mis Ventas
        </h1>
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
        <button
          onClick={buscarNota}
          className="btn btn-primary"
        >
          Buscar
        </button>
      </div>

      {/* Resultados */}
      {resultados.length > 0 && (
        <div className="bg-white rounded shadow p-4 mb-6">
          <h2 className="text-lg font-bold mb-2">Resultados de búsqueda</h2>
          <ul className="space-y-2">
            {resultados.map((venta) => (
              <li key={venta.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <strong>{venta.codigo_nota}</strong> — {venta.nombre_cliente}
                </div>
                <a
                  href={route('ventas.boleta', venta.id)}
                  target="_blank"
                  className="text-blue-500 underline"
                >
                  Ver Boleta
                </a>
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
                <th className="px-4 py-2 text-left">Producto(s)</th>
                <th className="px-4 py-2 text-left">Total Venta</th>
                <th className="px-4 py-2 text-left">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ventas.length > 0 ? (
                ventas.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-2">{v.nombre_cliente}</td>
                    <td className="px-4 py-2">
                      {v.items.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1">
                          {v.items.map((item, i) => (
                            <li key={i}>{obtenerNombreProducto(item)}</li>
                          ))}
                        </ul>
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-4 py-6 text-center text-gray-400 italic">
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
