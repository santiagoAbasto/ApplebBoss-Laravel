import VendedorLayout from '@/Layouts/VendedorLayout';
import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';
import axios from 'axios';

export default function Index({ ventas }) {
  const [codigoNota, setCodigoNota] = useState('');
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);

  const buscarNota = async (e) => {
    e.preventDefault();
    if (!codigoNota.trim()) return;

    try {
      const response = await axios.get(route('vendedor.ventas.buscarNota'), {
        params: { codigo_nota: codigoNota.trim() },
      });

      setResultadosBusqueda(response.data);
    } catch (error) {
      console.error('❌ Error al buscar nota:', error);
    }
  };


  const itemsDesglosados = ventas.flatMap((venta) => {
    if (venta.tipo_venta === 'servicio_tecnico') {
      const precioVenta = parseFloat(venta.precio_venta || 0);
      const descuento = parseFloat(venta.descuento || 0);
      const capital = parseFloat(venta.precio_invertido || 0);
      const permuta = 0;
      const ganancia = precioVenta - descuento - permuta - capital;

      return [{
        cliente: venta.nombre_cliente,
        producto: 'Servicio Técnico',
        codigoNota: venta.codigo_nota,
        id_venta: venta.id,
        servicio_tecnico_id: venta.servicio_tecnico?.id ?? null,
        tipo: 'servicio_tecnico', // ✅ corregido aquí
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
        codigoNota: venta.codigo_nota,
        id_venta: venta.id,
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
    <VendedorLayout>
      <Head title="Listado de Ventas Detalladas" />

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4 md:mb-0">
          📋 Ventas Desglosadas por Producto
        </h1>
        <Link
          href={route('vendedor.ventas.create')}
          className="inline-block px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow transition"
        >
          ➕ Nueva Venta
        </Link>
      </div>

      {/* Buscar código o nombre */}
      <form onSubmit={buscarNota} className="flex items-center gap-2 mb-6">
        <input
          type="text"
          value={codigoNota}
          onChange={(e) => setCodigoNota(e.target.value)}
          placeholder="Buscar por código o nombre del cliente"
          className="border px-3 py-2 rounded w-80"
        />
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          Buscar
        </button>
      </form>

      {/* Resultados de la búsqueda */}
      {resultadosBusqueda.length > 0 && (
        <div className="mb-8 bg-white dark:bg-gray-800 p-4 rounded-xl shadow">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
            Resultados encontrados:
          </h2>
          <ul className="space-y-2">
            {resultadosBusqueda.map((venta) => (
              <li
                key={`${venta.tipo}-${venta.id}`}
                className="flex items-center justify-between border-b border-gray-200 pb-2"
              >
                <div>
                  <p className="font-medium text-blue-700">
                    {venta.codigo_nota || 'Sin código'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Cliente: {venta.nombre_cliente} — {new Date(venta.created_at).toLocaleString('es-BO')}
                  </p>
                </div>
                <div className="px-4 py-3 text-center">
                  {venta.id?.toString().startsWith('st-') ? (
                    <a
                      href={route('vendedor.servicios.boleta', {
                        servicio: venta.id.replace('st-', ''),
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      🧾 Ver Nota de Servicio
                    </a>
                  ) : (
                    <a
                      href={route('vendedor.ventas.boleta', {
                        venta: venta.id.replace('v-', ''),
                      })}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      🧾 Ver Nota de Venta
                    </a>
                  )}
                </div>

              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabla de ventas desglosadas */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl overflow-x-auto">
        <table className="w-full table-auto text-sm text-left text-gray-700 dark:text-gray-200">
          <thead className="bg-blue-100 dark:bg-gray-800 uppercase text-xs text-blue-900 dark:text-blue-300">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3">Código Nota</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3 text-right">Precio Venta</th>
              <th className="px-4 py-3 text-right">Descuento</th>
              <th className="px-4 py-3 text-right">Permuta</th>
              <th className="px-4 py-3 text-right">Capital</th>
              <th className="px-4 py-3 text-right">Precio Final</th>
              <th className="px-4 py-3 text-right">Ganancia</th>
              <th className="px-4 py-3">Vendedor</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3 text-center">Nota</th>
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
                  <td className="px-4 py-3 text-blue-700 font-mono">{item.codigoNota || '—'}</td>
                  <td className="px-4 py-3">{item.producto}</td>
                  <td className="px-4 py-3 text-right">{item.precioVenta.toFixed(2)} Bs</td>
                  <td className="px-4 py-3 text-right text-red-600">- {item.descuento.toFixed(2)} Bs</td>
                  <td className="px-4 py-3 text-right text-yellow-600">- {item.permuta.toFixed(2)} Bs</td>
                  <td className="px-4 py-3 text-right text-blue-600">- {item.capital.toFixed(2)} Bs</td>
                  <td className="px-4 py-3 text-right font-medium">{item.precioFinal.toFixed(2)} Bs</td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${item.ganancia < 0 ? 'text-red-600' : 'text-green-600'
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
                  <td className="px-4 py-3 text-center">
                    {(() => {
                      const tipoNormalizado = item.tipo
                        ? item.tipo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                        : '';

                      const esServicio = tipoNormalizado.includes('servicio');
                      const servicioId = item.servicio_tecnico_id ?? null;
                      const ventaId = item.id_venta ?? null;

                      if (esServicio && servicioId) {
                        return (
                          <a
                            href={route('vendedor.servicios.boleta', {
                              servicio: servicioId.toString().startsWith('st-')
                                ? servicioId.replace('st-', '')
                                : servicioId,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                          >
                            🧾 Nota Servicio
                          </a>
                        );
                      }

                      if (ventaId) {
                        return (
                          <a
                            href={route('vendedor.ventas.boleta', {
                              venta: ventaId.toString().startsWith('v-')
                                ? ventaId.replace('v-', '')
                                : ventaId,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                          >
                            🧾 Nota Venta
                          </a>
                        );
                      }

                      return <span className="text-sm text-gray-400">—</span>;
                    })()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="12" className="px-4 py-6 text-center text-gray-500">
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
    </VendedorLayout>
  );
}