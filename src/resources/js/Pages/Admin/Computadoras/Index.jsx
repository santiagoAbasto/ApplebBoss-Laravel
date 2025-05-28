import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ToastContainer, { showSuccess, showError } from '@/Components/ToastNotification';

export default function ComputadorasIndex({ computadoras }) {
  const [busqueda, setBusqueda] = useState('');

  const eliminar = (id) => {
    if (confirm('¿Seguro que deseas eliminar esta computadora?')) {
      router.delete(route('admin.computadoras.destroy', id), {
        onSuccess: () => showSuccess('Computadora eliminada correctamente'),
        onError: () => showError('Error al eliminar la computadora'),
      });
    }
  };

  const habilitar = (id) => {
    if (confirm('¿Deseas habilitar esta computadora para la venta?')) {
      router.patch(route('admin.computadoras.habilitar', id), {
        onSuccess: () => showSuccess('Computadora habilitada con éxito'),
        onError: () => showError('Error al habilitar la computadora'),
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

  const pcsFiltradas = computadoras.filter((pc) =>
    pc.numero_serie.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <AdminLayout>
      <Head title="Computadoras" />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">💻 Computadoras</h1>
        <Link
          href={route('admin.computadoras.create')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          + Registrar Computadora
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por número de serie"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-blue-100 text-gray-900 uppercase">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Procesador</th>
              <th className="px-4 py-3">Serie</th>
              <th className="px-4 py-3">RAM</th>
              <th className="px-4 py-3">Batería</th>
              <th className="px-4 py-3">Almacenamiento</th>
              <th className="px-4 py-3">Precio Venta (Bs)</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pcsFiltradas.length > 0 ? (
              pcsFiltradas.map((pc) => (
                <tr key={pc.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{pc.nombre}</td>
                  <td className="px-4 py-3">{pc.procesador || '—'}</td>
                  <td className="px-4 py-3">{pc.numero_serie}</td>
                  <td className="px-4 py-3">{pc.ram}</td>
                  <td className="px-4 py-3">{pc.bateria || '—'}</td>
                  <td className="px-4 py-3">{pc.almacenamiento || '—'}</td>
                  <td className="px-4 py-3">Bs {parseFloat(pc.precio_venta).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getBadgeColor(pc.estado)}`}>
                      {pc.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2 justify-center">
                    {pc.estado === 'permuta' ? (
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        onClick={() => habilitar(pc.id)}
                      >
                        Habilitar
                      </button>
                    ) : (
                      <Link
                        href={route('admin.computadoras.edit', pc.id)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Editar
                      </Link>
                    )}
                    <button
                      onClick={() => eliminar(pc.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-center text-gray-500 py-6">
                  No se encontraron computadoras con esa serie.
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
