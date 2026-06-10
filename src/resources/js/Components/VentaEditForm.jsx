import { Head, Link, useForm } from '@inertiajs/react';
import { route } from 'ziggy-js';
import { useState } from 'react';
import { ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
import CardPaymentFields from '@/Components/CardPaymentFields';

const money = (value) => Number(value || 0);

const productoNombre = (item) => {
  if (item.nombre_producto) return item.nombre_producto;
  if (item.celular?.modelo) return item.celular.modelo;
  if (item.computadora?.nombre) return item.computadora.nombre;
  if (item.producto_apple?.modelo) return item.producto_apple.modelo;
  if (item.producto_general?.nombre) return item.producto_general.nombre;
  return 'Producto';
};

export default function VentaEditForm({ venta, productosGenerales = [], routePrefix, accent = 'emerald' }) {
  const servicio = venta.servicio_tecnico || {};
  const esServicio = venta.tipo_venta === 'servicio_tecnico' && Boolean(servicio.id);
  const [codigoProductoGeneral, setCodigoProductoGeneral] = useState('');
  const [productoGeneralEncontrado, setProductoGeneralEncontrado] = useState(null);
  const [errorProductoGeneral, setErrorProductoGeneral] = useState('');

  const { data, setData, put, processing, errors } = useForm({
    nombre_cliente: venta.nombre_cliente || '',
    telefono_cliente: venta.telefono_cliente || '',
    metodo_pago: venta.metodo_pago || 'efectivo',
    inicio_tarjeta: venta.inicio_tarjeta || '',
    fin_tarjeta: venta.fin_tarjeta || '',
    notas_adicionales: venta.notas_adicionales || servicio.notas_adicionales || '',
    descuento: money(venta.descuento),
    valor_permuta: money(venta.valor_permuta),
    items: (venta.items || []).map((item) => ({
      id: item.id,
      tipo: item.tipo,
      nombre: productoNombre(item),
      cantidad: item.cantidad || 1,
      precio_venta: money(item.precio_venta),
      precio_invertido: money(item.precio_invertido),
	      descuento: money(item.descuento),
	    })),
    servicio_tecnico: {
      equipo: servicio.equipo || '',
      detalle_servicio: servicio.detalle_servicio || '',
      tecnico: servicio.tecnico || '',
      precio_costo: money(servicio.precio_costo ?? venta.precio_invertido),
      precio_venta: money(servicio.precio_venta ?? venta.precio_venta),
    },
	  });

  const buscarProductoGeneral = (codigo) => {
    const termino = String(codigo || '').trim().toLowerCase();

    if (!termino) {
      setProductoGeneralEncontrado(null);
      setErrorProductoGeneral('');
      return null;
    }

    const producto = productosGenerales.find((item) =>
      String(item.codigo || '').trim().toLowerCase() === termino
    );

    setProductoGeneralEncontrado(producto || null);
    setErrorProductoGeneral(producto ? '' : 'No hay un producto general disponible con ese codigo exacto.');
    return producto || null;
  };

  const addProductoGeneral = () => {
    const producto = productoGeneralEncontrado || buscarProductoGeneral(codigoProductoGeneral);
    if (!producto) return;

    const yaExiste = data.items.some((item) =>
      item.tipo === 'producto_general' && Number(item.producto_id) === Number(producto.id)
    );

    if (yaExiste) {
      setErrorProductoGeneral('Ese producto ya esta agregado a la venta.');
      return;
    }

    setData('items', [
      ...data.items,
      {
        id: null,
        local_id: `producto-general-${producto.id}-${Date.now()}`,
        tipo: 'producto_general',
        producto_id: producto.id,
        nombre: producto.nombre,
        cantidad: 1,
        precio_venta: money(producto.precio_venta),
        precio_invertido: money(producto.precio_costo),
        descuento: 0,
      },
    ]);
    setCodigoProductoGeneral('');
    setProductoGeneralEncontrado(null);
    setErrorProductoGeneral('');
  };

  const removeNewItem = (index) => {
    setData('items', data.items.filter((_, i) => i !== index));
  };

  const updateItem = (index, field, value) => {
    setData('items', data.items.map((item, i) => (
      i === index ? { ...item, [field]: value } : item
    )));
  };

  const updateServicio = (field, value) => {
    setData('servicio_tecnico', {
      ...data.servicio_tecnico,
      [field]: value,
    });
  };

  const subtotalProductos = data.items.reduce((total, item) => (
    total + Math.max(0, (money(item.precio_venta) - money(item.descuento)) * Number(item.cantidad || 1))
  ), 0);

  const capitalProductos = data.items.reduce((total, item) => total + money(item.precio_invertido), 0);
  const totalProductos = Math.max(0, subtotalProductos - money(data.descuento) - money(data.valor_permuta));
  const reservaAplicada = money(venta.monto_reserva_aplicado);
  const totalProductosACobrar = Math.max(0, totalProductos - reservaAplicada);
  const gananciaProductos = subtotalProductos - money(data.descuento) - money(data.valor_permuta) - capitalProductos;

  const subtotalServicio = Math.max(0, money(data.servicio_tecnico.precio_venta) - money(data.descuento));
  const gananciaServicio = subtotalServicio - money(data.servicio_tecnico.precio_costo);

  const submit = (e) => {
    e.preventDefault();
    put(route(`${routePrefix}.ventas.update`, venta.id), {
      preserveScroll: true,
    });
  };

  const accentClasses = {
    blue: {
      input: 'focus:border-blue-500 focus:ring-blue-500',
      button: 'bg-blue-600 hover:bg-blue-700',
    },
    emerald: {
      input: 'focus:border-emerald-500 focus:ring-emerald-500',
      button: 'bg-emerald-600 hover:bg-emerald-700',
    },
  };
  const theme = accentClasses[accent] || accentClasses.emerald;
  const inputClass = `w-full rounded-lg border border-slate-200 px-3 py-2 text-sm ${theme.input}`;
  const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1';

  return (
    <>
      <Head title={`Editar venta ${venta.codigo_nota}`} />

      <form onSubmit={submit} className="space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Editar venta</h1>
            <p className="text-sm text-slate-500">
              {venta.codigo_nota} · Ajusta datos y montos sin cambiar el producto vendido.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href={route(`${routePrefix}.ventas.index`)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft size={16} />
              Volver
            </Link>
            <button
              type="submit"
              disabled={processing}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${theme.button}`}
            >
              <Save size={16} />
              Guardar
            </button>
          </div>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Datos del cliente</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelClass}>Nombre</label>
              <input
                className={inputClass}
                value={data.nombre_cliente}
                onChange={(e) => setData('nombre_cliente', e.target.value)}
              />
              {errors.nombre_cliente && <p className="mt-1 text-xs text-rose-600">{errors.nombre_cliente}</p>}
            </div>
            <div>
              <label className={labelClass}>Telefono</label>
              <input
                className={inputClass}
                value={data.telefono_cliente}
                onChange={(e) => setData('telefono_cliente', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Metodo de pago</label>
              <select
                className={inputClass}
                value={data.metodo_pago}
                onChange={(e) => setData('metodo_pago', e.target.value)}
              >
                <option value="efectivo">Efectivo</option>
                <option value="qr">QR</option>
                <option value="tarjeta">Tarjeta</option>
              </select>
            </div>
            {data.metodo_pago === 'tarjeta' && (
              <CardPaymentFields
                inicio={data.inicio_tarjeta}
                fin={data.fin_tarjeta}
                errors={errors}
                onChangeInicio={(value) => setData('inicio_tarjeta', value)}
                onChangeFin={(value) => setData('fin_tarjeta', value)}
              />
            )}
          </div>
        </section>

        {esServicio ? (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Servicio tecnico</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className={labelClass}>Equipo</label>
                <input className={inputClass} value={data.servicio_tecnico.equipo} onChange={(e) => updateServicio('equipo', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Tecnico</label>
                <input className={inputClass} value={data.servicio_tecnico.tecnico} onChange={(e) => updateServicio('tecnico', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Costo</label>
                <input type="number" min="0" step="0.01" className={inputClass} value={data.servicio_tecnico.precio_costo} onChange={(e) => updateServicio('precio_costo', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Venta</label>
                <input type="number" min="0" step="0.01" className={inputClass} value={data.servicio_tecnico.precio_venta} onChange={(e) => updateServicio('precio_venta', e.target.value)} />
              </div>
              <div className="md:col-span-2">
                <label className={labelClass}>Detalle</label>
                <textarea className={inputClass} rows="3" value={data.servicio_tecnico.detalle_servicio} onChange={(e) => updateServicio('detalle_servicio', e.target.value)} />
              </div>
            </div>
          </section>
        ) : (
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">Montos por producto</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
	                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
	                  <tr>
	                    <th className="px-3 py-2 text-left">Producto</th>
	                    <th className="px-3 py-2 text-right">Cantidad</th>
	                    <th className="px-3 py-2 text-right">Venta</th>
	                    <th className="px-3 py-2 text-right">Descuento</th>
	                    <th className="px-3 py-2 text-right">Capital</th>
	                    <th className="px-3 py-2 text-right">Subtotal</th>
	                    <th className="px-3 py-2 text-right"></th>
	                  </tr>
	                </thead>
	                <tbody className="divide-y">
	                  {data.items.map((item, index) => {
	                    const subtotal = Math.max(0, (money(item.precio_venta) - money(item.descuento)) * Number(item.cantidad || 1));
	                    return (
	                      <tr key={item.id || item.local_id}>
	                        <td className="px-3 py-3">
	                          <div className="font-semibold text-slate-700">{item.nombre}</div>
	                          <div className="text-xs text-slate-400">{item.id ? item.tipo : 'producto_general nuevo'}</div>
	                        </td>
                        <td className="px-3 py-3">
                          <input type="number" min="1" className={`${inputClass} text-right`} value={item.cantidad} onChange={(e) => updateItem(index, 'cantidad', e.target.value)} />
                        </td>
                        <td className="px-3 py-3">
                          <input type="number" min="0" step="0.01" className={`${inputClass} text-right`} value={item.precio_venta} onChange={(e) => updateItem(index, 'precio_venta', e.target.value)} />
                        </td>
                        <td className="px-3 py-3">
                          <input type="number" min="0" step="0.01" className={`${inputClass} text-right`} value={item.descuento} onChange={(e) => updateItem(index, 'descuento', e.target.value)} />
                        </td>
                        <td className="px-3 py-3">
                          <input type="number" min="0" step="0.01" className={`${inputClass} text-right`} value={item.precio_invertido} onChange={(e) => updateItem(index, 'precio_invertido', e.target.value)} />
                        </td>
	                        <td className="px-3 py-3 text-right font-semibold text-slate-700">
	                          {subtotal.toFixed(2)} Bs
	                        </td>
	                        <td className="px-3 py-3 text-right">
	                          {!item.id && (
	                            <button
	                              type="button"
	                              onClick={() => removeNewItem(index)}
	                              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50"
	                              title="Quitar producto"
	                            >
	                              <Trash2 size={16} />
	                            </button>
	                          )}
	                        </td>
	                      </tr>
	                    );
	                  })}
	                </tbody>
	              </table>
	            </div>
	            {errors.items && <p className="mt-3 text-sm text-rose-600">{errors.items}</p>}
	            {productosGenerales.length > 0 && (
	              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
	                <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
	                  <input
	                    className={inputClass}
	                    value={codigoProductoGeneral}
	                    placeholder="Codigo exacto del accesorio"
	                    onChange={(e) => {
	                      const value = e.target.value;
	                      setCodigoProductoGeneral(value);
	                      buscarProductoGeneral(value);
	                    }}
	                    onKeyDown={(e) => {
	                      if (e.key === 'Enter') {
	                        e.preventDefault();
	                        addProductoGeneral();
	                      }
	                    }}
	                  />
	                  <button
	                    type="button"
	                    onClick={() => buscarProductoGeneral(codigoProductoGeneral)}
	                    className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
	                  >
	                    Buscar
	                  </button>
	                  <button
	                    type="button"
	                    onClick={addProductoGeneral}
	                    disabled={!productoGeneralEncontrado}
	                    className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${theme.button}`}
	                  >
	                    <Plus size={16} />
	                    Agregar
	                  </button>
	                </div>
	                {productoGeneralEncontrado && (
	                  <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
	                    {productoGeneralEncontrado.codigo} - {productoGeneralEncontrado.nombre} - Bs {money(productoGeneralEncontrado.precio_venta).toFixed(2)}
	                  </div>
	                )}
	                {errorProductoGeneral && (
	                  <p className="mt-2 text-sm text-rose-600">{errorProductoGeneral}</p>
	                )}
	              </div>
	            )}
	          </section>
	        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className={labelClass}>Descuento general</label>
              <input type="number" min="0" step="0.01" className={inputClass} value={data.descuento} onChange={(e) => setData('descuento', e.target.value)} />
            </div>
            {!esServicio && venta.es_permuta && (
              <div>
                <label className={labelClass}>Valor permuta</label>
                <input type="number" min="0" step="0.01" className={inputClass} value={data.valor_permuta} onChange={(e) => setData('valor_permuta', e.target.value)} />
              </div>
            )}
            <div className="md:col-span-3">
              <label className={labelClass}>Notas adicionales</label>
              <textarea className={inputClass} rows="3" value={data.notas_adicionales} onChange={(e) => setData('notas_adicionales', e.target.value)} />
            </div>
          </div>

          <div className="mt-5 grid gap-3 rounded-lg bg-slate-50 p-4 text-right md:grid-cols-3">
            <div>
	              <div className="text-xs uppercase text-slate-500">Total a pagar</div>
	              <div className="text-xl font-bold text-slate-800">
	                {(esServicio ? subtotalServicio : totalProductosACobrar).toFixed(2)} Bs
	              </div>
	              {!esServicio && reservaAplicada > 0 && (
	                <div className="text-xs font-semibold text-blue-600">
	                  Reserva aplicada: -{reservaAplicada.toFixed(2)} Bs
	                </div>
	              )}
	            </div>
            <div>
              <div className="text-xs uppercase text-slate-500">Capital</div>
              <div className="text-xl font-bold text-blue-600">
                {(esServicio ? money(data.servicio_tecnico.precio_costo) : capitalProductos).toFixed(2)} Bs
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-slate-500">Ganancia recalculada</div>
              <div className={`text-xl font-bold ${(esServicio ? gananciaServicio : gananciaProductos) < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {(esServicio ? gananciaServicio : gananciaProductos).toFixed(2)} Bs
              </div>
            </div>
          </div>
        </section>
      </form>
    </>
  );
}
