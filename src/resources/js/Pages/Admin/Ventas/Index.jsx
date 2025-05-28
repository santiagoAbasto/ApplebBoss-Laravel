import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';

export default function Index({ ventas }) {
  const gananciaTotal = ventas.reduce((total, v) => {
    const precioVenta = parseFloat(v.precio_venta || 0);
    const descuento = parseFloat(v.descuento || 0);
    const capital = parseFloat(v.precio_invertido || 0);
    const permuta =
      parseFloat(v.entregado_celular?.precio_costo || 0) ||
      parseFloat(v.entregado_computadora?.precio_costo || 0) ||
      parseFloat(v.entregado_producto_general?.precio_costo || 0) ||
      0;

    // Ganancia real = precio venta - precio costo - descuento - permuta
    const ganancia = precioVenta - capital - descuento - permuta;

    return ganancia > 0 ? total + ganancia : total;
  }, 0);

  return (
    <AdminLayout>
      <Head title="Listado de Ventas" />

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">
          📋 Ventas Registradas
        </h1>
        <Link
          href={route('admin.ventas.create')}
          className="inline-block px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow transition"
        >
          ➕ Nueva Venta
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-x-auto">
        <table className="w-full table-auto text-sm text-left text-gray-700 dark:text-gray-200">
          <thead className="bg-blue-100 dark:bg-gray-800 uppercase text-xs text-blue-900 dark:text-blue-300">
            <tr>
              <th className="px-4 py-3 text-center">Cliente</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3 text-right">Precio Venta</th>
              <th className="px-4 py-3 text-right">Descuento</th>
              <th className="px-4 py-3 text-right">Permuta</th>
              <th className="px-4 py-3 text-right">Precio Final</th>
              <th className="px-4 py-3 text-right">Ganancia</th>
              <th className="px-4 py-3">Vendedor</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {ventas.length > 0 ? (
              ventas.map((v) => {
                const precioVenta = parseFloat(v.precio_venta || 0);
                const descuento = parseFloat(v.descuento || 0);
                const capital = parseFloat(v.precio_invertido || 0);
                const permuta =
                  parseFloat(v.entregado_celular?.precio_costo || 0) ||
                  parseFloat(v.entregado_computadora?.precio_costo || 0) ||
                  parseFloat(v.entregado_producto_general?.precio_costo || 0) ||
                  0;

                // Calculamos la ganancia real de acuerdo a la fórmula
                const ganancia = precioVenta - capital - descuento - permuta;

                const productoVendido =
                  v.tipo_venta === 'servicio_tecnico'
                    ? 'Servicio Técnico'
                    : v.celular?.modelo ||
                      v.computadora?.nombre ||
                      v.producto_general?.nombre ||
                      '—';

                return (
                  <tr
                    key={v.id}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <td className="px-4 py-3 text-center">{v.nombre_cliente}</td>
                    <td className="px-4 py-3">{productoVendido}</td>
                    <td className="px-4 py-3 text-right">{precioVenta.toFixed(2)} Bs</td>
                    <td className="px-4 py-3 text-right text-red-500">- {descuento.toFixed(2)} Bs</td>
                    <td className="px-4 py-3 text-right text-yellow-500">- {permuta.toFixed(2)} Bs</td>
                    <td className="px-4 py-3 text-right font-semibold">{(precioVenta - descuento - permuta).toFixed(2)} Bs</td>
                    <td
                      className={`px-4 py-3 text-right font-semibold ${
                        ganancia < 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {ganancia < 0
                        ? `Se invirtió ${Math.abs(ganancia).toFixed(2)} Bs`
                        : `${ganancia.toFixed(2)} Bs`}
                    </td>
                    <td className="px-4 py-3">{v.vendedor?.name || '—'}</td>
                    <td className="px-4 py-3">{new Date(v.created_at).toLocaleString()}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  No hay ventas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Ganancia total */}
        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end items-center">
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-300">Ganancia Total Positiva</div>
            <div className="text-xl font-bold text-green-600">
              {gananciaTotal.toFixed(2)} Bs
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
