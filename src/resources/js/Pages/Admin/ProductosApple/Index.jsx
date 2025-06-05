import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage, router } from '@inertiajs/react';

export default function Index({ productos }) {
  const flash = usePage().props?.flash || {};

  const handleDelete = (id) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      router.delete(route('admin.productos-apple.destroy', id));
    }
  };

  return (
    <AdminLayout>
      <Head title="Productos Apple" />

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-800">🍏 Productos Apple</h1>
        <Link
          href={route('admin.productos-apple.create')}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow"
        >
          + Nuevo producto
        </Link>
      </div>

      {flash.success && (
        <div className="bg-green-100 text-green-800 px-4 py-2 rounded mb-4 border border-green-300">
          ✅ {flash.success}
        </div>
      )}

      <div className="overflow-x-auto shadow border rounded">
        <table className="min-w-full text-sm text-gray-700">
          <thead className="bg-gray-100 border-b text-xs uppercase font-semibold">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Modelo</th>
              <th className="px-3 py-2 text-left">Capacidad</th>
              <th className="px-3 py-2 text-left">Color</th>
              <th className="px-3 py-2 text-right">Precio Venta</th>
              <th className="px-3 py-2 text-left">N° Serie / IMEI</th>
              <th className="px-3 py-2 text-left">IMEI 1</th>
              <th className="px-3 py-2 text-left">IMEI 2</th>
              <th className="px-3 py-2 text-left">Estado IMEI</th>
              <th className="px-3 py-2 text-left">Estado</th>
              <th className="px-3 py-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center py-4 text-gray-500">
                  No hay productos registrados.
                </td>
              </tr>
            ) : (
              productos.map((p, index) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2">{index + 1}</td>
                  <td className="px-3 py-2">{p.modelo}</td>
                  <td className="px-3 py-2">{p.capacidad}</td>
                  <td className="px-3 py-2">{p.color}</td>
                  <td className="px-3 py-2 text-right">Bs {p.precio_venta}</td>
                  <td className="px-3 py-2">
                    {p.tiene_imei ? '—' : p.numero_serie || '-'}
                  </td>
                  <td className="px-3 py-2">
                    {p.tiene_imei ? p.imei_1 || '-' : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {p.tiene_imei ? p.imei_2 || '-' : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {p.tiene_imei ? p.estado_imei || '-' : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        p.estado === 'disponible'
                          ? 'bg-green-100 text-green-700'
                          : p.estado === 'vendido'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {p.estado}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center space-x-2">
                    <Link
                      href={route('admin.productos-apple.edit', p.id)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      ✏️ Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(p.id)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      🗑️ Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
