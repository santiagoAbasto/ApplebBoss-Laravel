import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Index({ productos }) {
  const flash = usePage().props?.flash || {};

  return (
    <AdminLayout>
      <Head title="Productos Apple" />

      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">🍏 Productos Apple</h1>
        <Link
          href={route('admin.productos-apple.create')}
          className="btn btn-success"
        >
          + Nuevo producto
        </Link>
      </div>

      {flash.success && (
        <div className="bg-green-100 text-green-800 p-2 rounded mb-4">
          ✅ {flash.success}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="table-auto w-full border border-gray-300 text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-1 border">#</th>
              <th className="px-2 py-1 border">Modelo</th>
              <th className="px-2 py-1 border">Capacidad</th>
              <th className="px-2 py-1 border">Color</th>
              <th className="px-2 py-1 border">Precio</th>
              <th className="px-2 py-1 border">Número Serie / IMEI</th>
              <th className="px-2 py-1 border">IMEI 1</th>
              <th className="px-2 py-1 border">IMEI 2</th>
              <th className="px-2 py-1 border">Estado IMEI</th>
              <th className="px-2 py-1 border">Estado</th>
            </tr>
          </thead>
          <tbody>
            {productos.length === 0 ? (
              <tr>
                <td colSpan="10" className="text-center p-4 text-gray-500">
                  No hay productos registrados.
                </td>
              </tr>
            ) : (
              productos.map((p, index) => (
                <tr key={p.id} className="text-center">
                  <td className="border px-2 py-1">{index + 1}</td>
                  <td className="border px-2 py-1">{p.modelo}</td>
                  <td className="border px-2 py-1">{p.capacidad}</td>
                  <td className="border px-2 py-1">{p.color}</td>
                  <td className="border px-2 py-1">Bs {p.precio_venta}</td>
                  <td className="border px-2 py-1">
                    {p.tiene_imei ? '—' : p.numero_serie || '-'}
                  </td>
                  <td className="border px-2 py-1">
                    {p.tiene_imei ? p.imei_1 || '-' : '—'}
                  </td>
                  <td className="border px-2 py-1">
                    {p.tiene_imei ? p.imei_2 || '-' : '—'}
                  </td>
                  <td className="border px-2 py-1">
                    {p.tiene_imei ? p.estado_imei || '-' : '—'}
                  </td>
                  <td className="border px-2 py-1">{p.estado}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
