import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

export default function Index({ ventas }) {
  const itemsDesglosados = ventas.flatMap((venta) => {
    if (venta.tipo_venta === 'servicio_tecnico') {
      const subtotal = parseFloat(venta.subtotal || 0);
      const descuento = parseFloat(venta.descuento || 0);
      const capital = parseFloat(venta.precio_invertido || 0);

      return [{
        cliente: venta.nombre_cliente,
        producto: '🛠 Servicio Técnico',
        subtotal,
        descuento,
        permuta: 0,
        capital,
        vendedor: venta.vendedor?.name || '—',
        fecha: venta.created_at,
        ganancia: subtotal - descuento - capital,
        esServicioTecnico: true,
      }];
    }

    return venta.items.map((item) => {
      const isCelularOComputadora = ['celular', 'computadora'].includes(item.tipo);
      const permuta = isCelularOComputadora
        ? parseFloat(
            venta.entregado_celular?.precio_costo ||
            venta.entregado_computadora?.precio_costo || 0
          )
        : 0;

      let nombre = '—';
      if (item.tipo === 'celular') nombre = item.celular?.modelo || 'Celular';
      else if (item.tipo === 'computadora') nombre = item.computadora?.nombre || 'Computadora';
      else if (item.tipo === 'producto_general') nombre = item.producto_general?.nombre || 'Producto';

      const subtotal = parseFloat(item.subtotal || 0);
      const descuento = parseFloat(item.descuento || 0);
      const capital = parseFloat(item.precio_invertido || 0);
      const ganancia = subtotal - descuento - permuta - capital;

      return {
        cliente: venta.nombre_cliente,
        producto: nombre,
        subtotal,
        descuento,
        permuta,
        capital,
        vendedor: venta.vendedor?.name || '—',
        fecha: venta.created_at,
        ganancia,
        esServicioTecnico: false,
      };
    });
  });

  const gananciaTotal = itemsDesglosados.reduce((total, item) => {
    return item.ganancia > 0 ? total + item.ganancia : total;
  }, 0);

  return (
    <AdminLayout>
      <Head title="Listado de Ventas Detalladas" />

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">
          📋 Ventas Detalladas (Productos y Servicios)
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
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
              <th className="px-4 py-3 text-right">Descuento</th>
              <th className="px-4 py-3 text-right">Permuta</th>
              <th className="px-4 py-3 text-right">Capital</th>
              <th className="px-4 py-3">Vendedor</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3 text-right">Ganancia</th>
            </tr>
          </thead>
          <tbody>
            {itemsDesglosados.length > 0 ? (
              itemsDesglosados.map((item, index) => (
                <tr
                  key={index}
                  className={`border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition ${
                    item.esServicioTecnico ? 'bg-yellow-50 dark:bg-yellow-900' : ''
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{item.cliente}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Cliente</div>
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-blue-800 dark:text-blue-300">{item.producto}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {item.esServicioTecnico ? 'Servicio Técnico' : 'Producto Vendido'}
                    </div>
                  </td>

                  <td className="px-4 py-3 text-right">{item.subtotal.toFixed(2)} Bs</td>

                  <td className="px-4 py-3 text-right text-red-600">
                    - {item.descuento.toFixed(2)} Bs
                  </td>

                  <td className="px-4 py-3 text-right text-yellow-600">
                    - {item.permuta.toFixed(2)} Bs
                  </td>

                  <td className="px-4 py-3 text-right text-blue-600">
                    - {item.capital.toFixed(2)} Bs
                  </td>

                  <td className="px-4 py-3">
                    <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs font-semibold px-2 py-1 rounded">
                      {item.vendedor}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-800 dark:text-gray-100">
                      {new Date(item.fecha).toLocaleDateString('es-BO')}<br />
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.fecha).toLocaleTimeString('es-BO')}
                      </span>
                    </div>
                  </td>

                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      item.ganancia < 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {item.ganancia < 0
                      ? `Se invirtió ${Math.abs(item.ganancia).toFixed(2)} Bs`
                      : `${item.ganancia.toFixed(2)} Bs`}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                  No hay ventas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex justify-end items-center">
          <div className="text-right">
            <div className="text-sm text-gray-600 dark:text-gray-300">Ganancia Total Positiva</div>
            <div className="text-xl font-bold text-green-600">{gananciaTotal.toFixed(2)} Bs</div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
