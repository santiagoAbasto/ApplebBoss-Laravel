import VendedorLayout from '@/Layouts/VendedorLayout';
import { Head, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';
import axios from 'axios';
import { Pencil, PlusCircle, Printer, Receipt } from 'lucide-react';

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
      console.error('Error al buscar nota:', error);
    }
  };

  /* ===============================
     DESGLOSE DE ITEMS (NO TOCADO)
  =============================== */
  const itemsDesglosados = ventas.flatMap((venta) => {
    if (venta.tipo_venta === 'servicio_tecnico') {
      const precioVenta = parseFloat(venta.precio_venta || 0);
      const descuento = parseFloat(venta.descuento || 0);
      const capital = parseFloat(venta.precio_invertido || 0);
      const ganancia = precioVenta - descuento - capital;

      return [{
        cliente: venta.nombre_cliente,
        producto: 'Servicio Técnico',
        codigoNota: venta.servicio_tecnico?.codigo_nota ?? venta.codigo_nota,
        id_venta: venta.id,
        tipo: 'servicio_tecnico',
        precioVenta,
        descuento,
        permuta: 0,
        capital,
        precioFinal: precioVenta - descuento,
        ganancia,
        vendedor: venta.vendedor?.name || '—',
        fecha: venta.created_at,
      }];
    }

    return venta.items.map((item, itemIndex) => {
      const precioVenta = parseFloat(item.precio_venta || 0);
      const descuento = parseFloat(item.descuento || 0);
      const capital = parseFloat(item.precio_invertido || 0);
      const permuta = itemIndex === 0 ? parseFloat(venta.valor_permuta || 0) : 0;
      const ganancia = precioVenta - descuento - permuta - capital;

      const nombre =
        item.tipo === 'celular'
          ? item.celular?.modelo
          : item.tipo === 'computadora'
            ? item.computadora?.nombre
            : item.tipo === 'producto_apple'
              ? item.producto_apple?.modelo
              : item.producto_general?.nombre;

      return {
        cliente: venta.nombre_cliente,
        producto: nombre,
        codigoNota: venta.codigo_nota,
        id_venta: venta.id,
        tipo: item.tipo,
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
    (acc, i) => (i.ganancia > 0 ? acc + i.ganancia : acc),
    0
  );
  const totalFinal = itemsDesglosados.reduce((acc, i) => acc + i.precioFinal, 0);

  return (
    <VendedorLayout>
      <Head title="Ventas Desglosadas" />

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            Ventas Desglosadas
          </h1>
          <p className="text-slate-500">
            Detalle completo de ventas y servicios registrados
          </p>
        </div>

        <Link
          href={route('vendedor.ventas.create')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl
            bg-emerald-600 hover:bg-emerald-700
            text-white text-sm font-semibold shadow transition"
        >
          <PlusCircle size={18} />
          Nueva Venta
        </Link>
      </div>

      {/* BUSCADOR */}
      <form onSubmit={buscarNota} className="mb-5 rounded-xl border bg-white p-3 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-emerald-700">
              Buscar nota
            </label>
            <input
              value={codigoNota}
              onChange={(e) => setCodigoNota(e.target.value)}
              placeholder="Código de nota o cliente"
              className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-sm
                focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <button
            className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700
              text-white text-sm font-semibold transition shadow"
          >
            Buscar
          </button>
        </div>
      </form>

      {/* RESULTADOS BUSQUEDA */}
      {resultadosBusqueda.length > 0 && (
        <div className="mb-5 rounded-xl border bg-white shadow-sm">
          <div className="px-4 py-2.5 border-b bg-slate-50 font-semibold text-slate-700">
            Resultados encontrados
          </div>

          {resultadosBusqueda.map((r) => (
            <div
              key={r.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between
                px-4 py-3 border-b last:border-b-0"
            >
              <div>
                <div className="font-mono text-emerald-700 font-semibold">
                  {r.codigo_nota}
                </div>
                <div className="text-sm text-slate-600">
                  {r.nombre_cliente}
                </div>
              </div>

              <div className="flex gap-4 mt-3 sm:mt-0 text-sm">
                {r.tipo === 'venta' && (
                  <Link
                    href={route('vendedor.ventas.edit', r.id_real)}
                    className="text-slate-700 hover:underline font-medium"
                  >
                    Editar
                  </Link>
                )}

                <a
                  href={
                    r.tipo === 'servicio_tecnico'
                      ? route('vendedor.servicios.boleta', r.id_real)
                      : route('vendedor.ventas.boleta', r.id_real)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-600 hover:underline font-medium"
                >
                  <span className="inline-flex items-center gap-1">
                    <Receipt size={14} />
                    Normal
                  </span>
                </a>

                <a
                  href={
                    r.tipo === 'servicio_tecnico'
                      ? route('vendedor.servicios.recibo80mm', r.id_real)
                      : route('vendedor.ventas.boleta80', r.id_real)
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  <span className="inline-flex items-center gap-1">
                    <Printer size={14} />
                    Térmica
                  </span>
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TABLA */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 mb-5">
        <div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
          <div className="text-xs text-slate-500">Movimientos</div>
          <div className="text-xl font-bold text-slate-800">{itemsDesglosados.length}</div>
        </div>
        <div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
          <div className="text-xs text-slate-500">Total final</div>
          <div className="text-xl font-bold text-slate-800">{totalFinal.toFixed(2)} Bs</div>
        </div>
        <div className="rounded-xl border bg-white px-4 py-3 shadow-sm">
          <div className="text-xs text-slate-500">Ganancia positiva</div>
          <div className="text-xl font-bold text-emerald-600">{gananciaTotal.toFixed(2)} Bs</div>
        </div>
      </div>

      <div className="hidden md:block rounded-xl border bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-sm min-w-[1180px]">
          <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
            <tr>
              <th className="px-3 py-2.5 text-left">Cliente</th>
              <th className="px-3 py-2.5">Código</th>
              <th className="px-3 py-2.5">Producto</th>
              <th className="px-3 py-2.5 text-right">Venta</th>
              <th className="px-3 py-2.5 text-right">Desc.</th>
              <th className="px-3 py-2.5 text-right">Permuta</th>
              <th className="px-3 py-2.5 text-right">Capital</th>
              <th className="px-3 py-2.5 text-right">Final</th>
              <th className="px-3 py-2.5 text-right">Ganancia</th>
              <th className="px-3 py-2.5">Vendedor</th>
              <th className="px-3 py-2.5">Fecha</th>
              <th className="px-3 py-2.5 text-center">Boleta</th>
              <th className="px-3 py-2.5 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {itemsDesglosados.map((i, idx) => (
              <tr key={idx} className="hover:bg-emerald-50/40 transition">
                <td className="px-3 py-2.5">{i.cliente}</td>
                <td className="px-3 py-2.5 font-mono text-emerald-700">
                  {i.codigoNota}
                </td>
                <td className="px-3 py-2.5">{i.producto}</td>
                <td className="px-3 py-2.5 text-right">{i.precioVenta.toFixed(2)}</td>
                <td className="px-3 py-2.5 text-right text-rose-600">
                  -{i.descuento.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-right text-amber-600">
                  -{i.permuta.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-right text-blue-600">
                  -{i.capital.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-right font-medium">
                  {i.precioFinal.toFixed(2)}
                </td>
                <td
                  className={`px-3 py-2.5 text-right font-bold ${i.ganancia < 0 ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                >
                  {i.ganancia < 0
                    ? `Se invirtió ${Math.abs(i.ganancia).toFixed(2)}`
                    : i.ganancia.toFixed(2)}
                </td>
                <td className="px-3 py-2.5">{i.vendedor}</td>
                <td className="px-3 py-2.5 text-xs">
                  {new Date(i.fecha).toLocaleDateString('es-BO')}
                  <br />
                  <span className="text-slate-500">
                    {new Date(i.fecha).toLocaleTimeString('es-BO')}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <div className="flex flex-col gap-1 text-xs">
                    <a
                      href={route('vendedor.ventas.boleta', i.id_venta)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:underline"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Receipt size={14} />
                        Normal
                      </span>
                    </a>
                    <a
                      href={route('vendedor.ventas.boleta80', i.id_venta)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      <span className="inline-flex items-center gap-1">
                        <Printer size={14} />
                        Térmica
                      </span>
                    </a>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center">
                  <Link
                    href={route('vendedor.ventas.edit', i.id_venta)}
                    className="inline-flex items-center justify-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil size={13} />
                    Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* RESUMEN */}
        <div className="px-5 py-3 border-t bg-slate-50 flex justify-end">
          <div className="text-right">
            <div className="text-sm text-slate-600">
              Ganancia Total Positiva
            </div>
            <div className="text-2xl font-bold text-emerald-600">
              {gananciaTotal.toFixed(2)} Bs
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:hidden">
        {itemsDesglosados.map((i, idx) => (
          <div key={idx} className="rounded-2xl border bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold text-slate-800">{i.cliente}</div>
                <div className="font-mono text-sm text-emerald-700">{i.codigoNota}</div>
              </div>
              <div className="text-right text-xs text-slate-500">
                {new Date(i.fecha).toLocaleDateString('es-BO')}
              </div>
            </div>

            <div className="mt-3 grid gap-2 text-sm text-slate-600">
              <div><strong>Producto:</strong> {i.producto}</div>
              <div><strong>Venta:</strong> {i.precioVenta.toFixed(2)} Bs</div>
              <div><strong>Desc.:</strong> -{i.descuento.toFixed(2)} Bs</div>
              <div><strong>Permuta:</strong> -{i.permuta.toFixed(2)} Bs</div>
              <div><strong>Capital:</strong> -{i.capital.toFixed(2)} Bs</div>
              <div><strong>Final:</strong> {i.precioFinal.toFixed(2)} Bs</div>
              <div className={i.ganancia < 0 ? 'text-rose-600 font-semibold' : 'text-emerald-600 font-semibold'}>
                <strong>Ganancia:</strong> {i.ganancia < 0 ? `Se invirtió ${Math.abs(i.ganancia).toFixed(2)}` : `${i.ganancia.toFixed(2)} Bs`}
              </div>
              <div><strong>Vendedor:</strong> {i.vendedor}</div>
            </div>

            <div className="mt-4 flex gap-4 text-sm">
              <Link
                href={route('vendedor.ventas.edit', i.id_venta)}
                className="text-slate-700 hover:underline font-medium"
              >
                <span className="inline-flex items-center gap-1">
                  <Pencil size={14} />
                  Editar
                </span>
              </Link>
              <a
                href={route('vendedor.ventas.boleta', i.id_venta)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:underline font-medium"
              >
                <span className="inline-flex items-center gap-1">
                  <Receipt size={14} />
                  Normal
                </span>
              </a>
              <a
                href={route('vendedor.ventas.boleta80', i.id_venta)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                <span className="inline-flex items-center gap-1">
                  <Printer size={14} />
                  Térmica
                </span>
              </a>
            </div>
          </div>
        ))}

        <div className="rounded-2xl border bg-slate-50 px-4 py-5 text-right">
          <div className="text-sm text-slate-600">Ganancia Total Positiva</div>
          <div className="text-2xl font-bold text-emerald-600">
            {gananciaTotal.toFixed(2)} Bs
          </div>
        </div>
      </div>
    </VendedorLayout>
  );
}
