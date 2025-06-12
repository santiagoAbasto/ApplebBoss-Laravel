import { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ToastContainer, { showSuccess, showError } from '@/Components/ToastNotification';
import { route } from 'ziggy-js';

export default function ProductosAppleIndex({ productos }) {
  const [busqueda, setBusqueda] = useState('');
  const flash = usePage().props.flash || {};

  const eliminar = (id) => {
    if (confirm('¿Deseas eliminar este producto Apple?')) {
      router.delete(route('admin.productos-apple.destroy', id), {
        onSuccess: () => showSuccess('Producto eliminado correctamente'),
        onError: () => showError('Error al eliminar el producto'),
      });
    }
  };

  const getBadgeColor = (estado) => {
    switch (estado) {
      case 'disponible': return 'bg-green-200 text-green-700';
      case 'vendido': return 'bg-red-200 text-red-700';
      case 'permuta': return 'bg-blue-200 text-blue-700';
      default: return 'bg-gray-200 text-gray-700';
    }
  };

  const productosFiltrados = productos.filter((p) =>
    p.modelo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.imei_1?.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.numero_serie?.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <AdminLayout>
      <Head title="Productos Apple" />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#003366]">🍏 Productos Apple</h1>
        <Link
          href={route('admin.productos-apple.create')}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          + Registrar Producto
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por modelo, IMEI o serie"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-green-100 text-gray-900 uppercase">
            <tr>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">Capacidad</th>
              <th className="px-4 py-3">Color</th>
              <th className="px-4 py-3">IMEI 1</th>
              <th className="px-4 py-3">IMEI 2</th>
              <th className="px-4 py-3">Serie</th>
              <th className="px-4 py-3">Estado IMEI</th>
              <th className="px-4 py-3">Precio Venta (Bs)</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productosFiltrados.length > 0 ? (
              productosFiltrados.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{p.modelo}</td>
                  <td className="px-4 py-3">{p.capacidad}</td>
                  <td className="px-4 py-3">{p.color}</td>
                  <td className="px-4 py-3">{p.imei_1 || '—'}</td>
                  <td className="px-4 py-3">{p.imei_2 || '—'}</td>
                  <td className="px-4 py-3">{p.numero_serie || '—'}</td>
                  <td className="px-4 py-3 capitalize">{p.estado_imei || '—'}</td>
                  <td className="px-4 py-3">Bs {parseFloat(p.precio_venta).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getBadgeColor(p.estado)}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2 justify-center">
                    <Link
                      href={route('admin.productos-apple.edit', p.id)}
                      className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Editar
                    </Link>
                    <button
                      onClick={() => eliminar(p.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="text-center text-gray-500 py-6">
                  No se encontraron productos Apple con ese dato.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ToastContainer />
    </AdminLayout>
  );
}
