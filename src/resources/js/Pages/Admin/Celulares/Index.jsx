import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ToastContainer, { showSuccess, showError } from '@/Components/ToastNotification';
import { route } from 'ziggy-js'; // ✅ CORRECTO



export default function CelularesIndex({ celulares }) {
  const [busqueda, setBusqueda] = useState('');

  const eliminar = (id) => {
    if (confirm('¿Deseas eliminar este celular?')) {
      router.delete(route('admin.celulares.destroy', id), {
        onSuccess: () => showSuccess('Celular eliminado exitosamente'),
        onError: () => showError('Hubo un error al eliminar el celular'),
      });
    }
  };

  const habilitar = (id) => {
    if (confirm('¿Deseas habilitar este celular para la venta?')) {
      router.patch(route('admin.celulares.habilitar', id), {
        onSuccess: () => showSuccess('Celular habilitado correctamente'),
        onError: () => showError('Error al habilitar el celular'),
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

  const celularesFiltrados = celulares.filter((c) =>
    c.imei_1.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <AdminLayout>
      <Head title="Celulares" />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📱 Celulares</h1>
        <Link
          href={route('admin.celulares.create')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          + Registrar Celular
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por IMEI"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-blue-100 text-gray-900 uppercase">
            <tr>
              <th className="px-4 py-3">Modelo</th>
              <th className="px-4 py-3">IMEI 1</th>
              <th className="px-4 py-3">Batería</th>
              <th className="px-4 py-3">Estado IMEI</th>
              <th className="px-4 py-3">Precio Venta (Bs)</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {celularesFiltrados.length > 0 ? (
              celularesFiltrados.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{c.modelo}</td>
                  <td className="px-4 py-3">{c.imei_1}</td>
                  <td className="px-4 py-3">{c.bateria || 'N/A'}</td>
                  <td className="px-4 py-3 capitalize">{c.estado_imei.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">Bs {parseFloat(c.precio_venta).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getBadgeColor(c.estado)}`}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2 justify-center">
                    {c.estado === 'permuta' ? (
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        onClick={() => habilitar(c.id)}
                      >
                        Habilitar
                      </button>
                    ) : (
                      <Link
                        href={route('admin.celulares.edit', c.id)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Editar
                      </Link>
                    )}
                    <button
                      onClick={() => eliminar(c.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center text-gray-500 py-6">
                  No se encontraron celulares con ese IMEI.
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
