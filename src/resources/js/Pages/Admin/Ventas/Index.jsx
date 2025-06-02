import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';

export default function Index({ ventas }) {
  const itemsDesglosados = ventas.flatMap((venta) => {
    // Si es servicio técnico, devolvemos un ítem simulado
    if (venta.tipo_venta === 'servicio_tecnico') {
      const precioVenta = parseFloat(venta.precio_venta || 0);
      const descuento = parseFloat(venta.descuento || 0);
      const capital = parseFloat(venta.precio_invertido || 0);
      const permuta = 0;
      const ganancia = precioVenta - descuento - permuta - capital;

      return [{
        cliente: venta.nombre_cliente,
        producto: 'Servicio Técnico',
        precioVenta,
        descuento,
        permuta,
        capital,
        precioFinal: precioVenta - descuento - permuta,
        ganancia,
        vendedor: venta.vendedor?.name || '—',
        fecha: venta.created_at,
      }];
    }

    // Si no, iteramos los items normales
    return venta.items.map((item) => {
      const precioVenta = parseFloat(item.precio_venta || 0);
      const descuento = parseFloat(item.descuento || 0);
      const capital = parseFloat(item.precio_invertido || 0);

      const permuta =
        parseFloat(venta.entregado_celular?.precio_costo || 0) ||
        parseFloat(venta.entregado_computadora?.precio_costo || 0) ||
        parseFloat(venta.entregado_producto_general?.precio_costo || 0) ||
        0;

      const ganancia = precioVenta - descuento - permuta - capital;

      const nombre =
        item.tipo === 'celular'
          ? item.celular?.modelo || 'Celular'
          : item.tipo === 'computadora'
          ? item.computadora?.nombre || 'Computadora'
          : item.producto_general?.nombre || 'Producto';

      return {
        cliente: venta.nombre_cliente,
        producto: nombre,
        precioVenta,
        descuento,
        permuta,
        capital,
        precioFinal: precioVenta - descuento - permuta,
        ganancia,
        vendedor: venta.vendedor?.name || '—',
        fecha: venta.created_at,
      };
    });
  });

  const gananciaTotal = itemsDesglosados.reduce(
    (total, item) => (item.ganancia > 0 ? total + item.ganancia : total),
    0
  );

  return (
    <AdminLayout>
      <Head title="Listado de Ventas Detalladas" />
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">
          📋 Ventas Desglosadas por Producto
        </h1>
        <Link
          href={route('admin.ventas.create')}
          className="inline-block px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow transition"
        >
          ➕ Nueva Venta
        </Link>
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-x-auto">
        <table className="w-full table-auto text-sm text-left text-gray-700 dark:text-gray-200">
          <thead className="bg-blue-100 dark:bg-gray-800 uppercase text-xs text-blue-900 dark:text-blue-300">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3 text-right">Precio Venta</th>
              <th className="px-4 py-3 text-right">Descuento</th>
              <th className="px-4 py-3 text-right">Permuta</th>
              <th className="px-4 py-3 text-right">Capital</th>
              <th className="px-4 py-3 text-right">Precio Final</th>
              <th className="px-4 py-3 text-right">Ganancia</th>
              <th className="px-4 py-3">Vendedor</th>
              <th className="px-4 py-3">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {itemsDesglosados.length > 0 ? (
              itemsDesglosados.map((item, index) => (
                <tr
                  key={index}
                  className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <td className="px-4 py-3">{item.cliente}</td>
                  <td className="px-4 py-3">{item.producto}</td>
                  <td className="px-4 py-3 text-right">{item.precioVenta.toFixed(2)} Bs</td>
                  <td className="px-4 py-3 text-right text-red-600">- {item.descuento.toFixed(2)} Bs</td>
                  <td className="px-4 py-3 text-right text-yellow-600">- {item.permuta.toFixed(2)} Bs</td>
                  <td className="px-4 py-3 text-right text-blue-600">- {item.capital.toFixed(2)} Bs</td>
                  <td className="px-4 py-3 text-right font-medium">{item.precioFinal.toFixed(2)} Bs</td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      item.ganancia < 0 ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {item.ganancia < 0
                      ? `Se invirtió ${Math.abs(item.ganancia).toFixed(2)} Bs`
                      : `${item.ganancia.toFixed(2)} Bs`}
                  </td>
                  <td className="px-4 py-3">{item.vendedor}</td>
                  <td className="px-4 py-3">
                    {new Date(item.fecha).toLocaleDateString('es-BO')}
                    <br />
                    <span className="text-xs text-gray-500">{new Date(item.fecha).toLocaleTimeString('es-BO')}</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="px-4 py-6 text-center text-gray-500">
                  No hay ventas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Resumen final */}
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
