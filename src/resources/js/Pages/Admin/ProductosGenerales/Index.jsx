import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ToastContainer, { showSuccess, showError } from '@/Components/ToastNotification';
import { route } from 'ziggy-js'; // ✅ CORRECTO


export default function ProductosGeneralesIndex({ productos }) {
  const [busqueda, setBusqueda] = useState('');

  const eliminar = (id) => {
    if (confirm('¿Seguro que deseas eliminar este producto?')) {
      router.delete(route('admin.productos-generales.destroy', id), {
        onSuccess: () => showSuccess('Producto eliminado correctamente'),
        onError: () => showError('Error al eliminar el producto'),
      });
    }
  };

  const habilitar = (id) => {
    if (confirm('¿Deseas habilitar este producto para la venta?')) {
      router.patch(route('admin.productos-generales.habilitar', id), {
        onSuccess: () => showSuccess('Producto habilitado con éxito'),
        onError: () => showError('Error al habilitar el producto'),
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

  const filtrados = productos
  .filter((p) =>
    p.codigo.toLowerCase().includes(busqueda.toLowerCase())
  )
  .sort((a, b) => {
    const getTipo = (codigo) => codigo.split(':')[0].toLowerCase();
    const getNumero = (codigo) => parseInt(codigo.split(':')[1]) || 0;

    const tipoA = getTipo(a.codigo);
    const tipoB = getTipo(b.codigo);

    if (tipoA === tipoB) {
      const numA = getNumero(a.codigo);
      const numB = getNumero(b.codigo);

      if (numA === numB) {
        return new Date(b.created_at) - new Date(a.created_at); // más reciente primero
      }

      return numB - numA; // mayor a menor
    }

    return tipoB.localeCompare(tipoA);
  })
  .slice(0, 10);
  
  return (
    <AdminLayout>
      <Head title="Productos Generales" />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📦 Productos Generales</h1>
        <Link
          href={route('admin.productos-generales.create')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          + Registrar Producto
        </Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Buscar por código"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm text-left text-gray-700">
          <thead className="bg-blue-100 text-gray-900 uppercase">
            <tr>
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Procedencia</th>
              <th className="px-4 py-3">Precio Venta (Bs)</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length > 0 ? (
              filtrados.map((p) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{p.codigo}</td>
                  <td className="px-4 py-3 capitalize">{p.tipo.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-3">{p.nombre || '—'}</td>
                  <td className="px-4 py-3">{p.procedencia || '—'}</td>
                  <td className="px-4 py-3">Bs {parseFloat(p.precio_venta).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getBadgeColor(p.estado)}`}>
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2 justify-center">
                    {p.estado === 'permuta' ? (
                      <button
                        onClick={() => habilitar(p.id)}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Habilitar
                      </button>
                    ) : (
                      <Link
                        href={route('admin.productos-generales.edit', p.id)}
                        className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded text-sm"
                      >
                        Editar
                      </Link>
                    )}
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
                <td colSpan="7" className="text-center text-gray-500 py-6">
                  No se encontraron productos con ese código.
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
