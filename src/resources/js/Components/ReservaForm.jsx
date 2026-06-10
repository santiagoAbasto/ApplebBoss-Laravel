import { Head, router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { route } from 'ziggy-js';
import NeonInput from '@/Components/NeonInput';
import { NeonBox } from '@/Components/NeonBox';
import { NeonField } from '@/Components/NeonField';
import { notifyRecordsUpdated, useAutoRefreshCallback } from '@/Hooks/useAutoRefresh';

const defaultTerms = 'La reserva se descuenta del precio final al concretar la venta. El producto queda separado mientras la reserva permanezca activa. En caso de cancelacion, vencimiento o cambio de producto, Apple Boss debe autorizar el ajuste antes de liberar el inventario.';

export default function ReservaForm({ role, Layout }) {
  const [data, setData] = useState({
    nombre_cliente: '',
    telefono_cliente: '',
    monto_reserva: '',
    terminos_condiciones: defaultTerms,
  });
  const [stocks, setStocks] = useState({ celulares: [], computadoras: [], productosGenerales: [], productosApple: [] });
  const [productoSeleccionado, setProductoSeleccionado] = useState({ tipo: '', codigo: '', cantidad: 1, descuento: 0, producto: null });
  const [sugerenciasProductos, setSugerenciasProductos] = useState([]);
  const [mostrarProductos, setMostrarProductos] = useState(false);
  const [items, setItems] = useState([]);
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);

  const normalizarTexto = (valor) => String(valor ?? '').trim().toLowerCase();
  const formatoBs = (valor) => Number(valor || 0).toFixed(2);
  const routePrefix = role === 'admin' ? 'admin' : 'vendedor';

  const camposBusquedaExacta = (producto) => [
    producto.codigo,
    producto.imei_1,
    producto.imei_2,
    producto.numero_serie,
    producto.nombre,
    producto.modelo,
  ];

  const claveProducto = (producto) =>
    producto.codigo || producto.imei_1 || producto.imei_2 || producto.numero_serie || producto.nombre || producto.modelo || '';

  const prepararProducto = (producto) => ({
    ...producto,
    precio_venta: Number(producto.precio_venta ?? 0),
    precio_costo: Number(producto.precio_costo ?? 0),
  });

  const fetchStock = async () => {
    const [c, comp, pg, apple] = await Promise.all([
      axios.get(route('api.stock.celulares')),
      axios.get(route('api.stock.computadoras')),
      axios.get(route('api.stock.productos_generales')),
      axios.get(route('api.stock.productos_apple')),
    ]);
    setStocks({
      celulares: c.data,
      computadoras: comp.data,
      productosGenerales: pg.data,
      productosApple: apple.data,
    });
  };

  useEffect(() => { fetchStock(); }, []);
  useAutoRefreshCallback(fetchStock, 7000);

  const subtotal = useMemo(() => items.reduce((acc, item) => acc + Number(item.subtotal || 0), 0), [items]);
  const saldo = Math.max(0, subtotal - Number(data.monto_reserva || 0));

  const buscarSugerencias = (texto) => {
    const term = normalizarTexto(texto);
    if (!productoSeleccionado.tipo || term.length < 1) {
      setMostrarProductos(false);
      return;
    }

    const fuente = {
      celular: stocks.celulares,
      computadora: stocks.computadoras,
      producto_general: stocks.productosGenerales,
      producto_apple: stocks.productosApple,
    }[productoSeleccionado.tipo] || [];

    const resultados = fuente.filter((p) =>
      camposBusquedaExacta(p).some((campo) => normalizarTexto(campo) === term)
    ).map((p) => ({ ...prepararProducto(p), tipo: productoSeleccionado.tipo }));

    setSugerenciasProductos(resultados.slice(0, 10));
    setMostrarProductos(resultados.length > 0);
  };

  const seleccionarProducto = (producto) => {
    const preparado = prepararProducto(producto);
    setProductoSeleccionado({
      tipo: productoSeleccionado.tipo,
      codigo: claveProducto(preparado),
      cantidad: 1,
      descuento: 0,
      producto: preparado,
    });
    setMostrarProductos(false);
  };

  const buscarProductoPorCodigo = (tipo, codigo) => {
    const termino = normalizarTexto(codigo);
    const coincideExacto = (p) => camposBusquedaExacta(p).some((campo) => normalizarTexto(campo) === termino);
    if (tipo === 'celular') return stocks.celulares.find(coincideExacto);
    if (tipo === 'computadora') return stocks.computadoras.find(coincideExacto);
    if (tipo === 'producto_general') return stocks.productosGenerales.find(coincideExacto);
    if (tipo === 'producto_apple') return stocks.productosApple.find(coincideExacto);
    return null;
  };

  const agregarItem = () => {
    const { tipo, producto, cantidad, descuento, codigo } = productoSeleccionado;
    if (!producto || !tipo || cantidad <= 0 || !codigo) return alert('Selecciona un producto disponible.');
    if (cantidad > 1) return alert('Solo puedes reservar una unidad a la vez.');
    if (items.some((i) => i.tipo === tipo && Number(i.producto_id) === Number(producto.id))) return alert('Este producto ya esta en la reserva.');

    const productoExacto = buscarProductoPorCodigo(tipo, codigo);
    if (!productoExacto || Number(productoExacto.id) !== Number(producto.id)) {
      return alert('Selecciona un producto disponible con codigo, IMEI, serie o nombre exacto.');
    }

    const precioVenta = Number(producto.precio_venta || 0);
    const descuentoAplicado = Number(descuento || 0);
    if (descuentoAplicado > precioVenta) return alert('El descuento no puede superar el precio de venta.');

    setItems([...items, {
      tipo,
      producto_id: producto.id,
      cantidad: 1,
      precio_venta: precioVenta,
      descuento: descuentoAplicado,
      subtotal: precioVenta - descuentoAplicado,
      nombre: producto.nombre || producto.modelo || 'Producto',
      detalles: producto,
    }]);
    setProductoSeleccionado({ tipo: '', codigo: '', cantidad: 1, descuento: 0, producto: null });
  };

  const registrarReserva = async () => {
    if (items.length === 0) return alert('Agrega al menos un producto.');
    if (Number(data.monto_reserva || 0) <= 0) return alert('Indica el monto de la reserva.');
    if (Number(data.monto_reserva || 0) > subtotal) return alert('El monto de la reserva no puede superar el total.');

    setGuardando(true);
    setErrores({});

    try {
      const response = await axios.post(route(`${routePrefix}.reservas.store`), { ...data, items });
      notifyRecordsUpdated();
      const reservaId = response.data.reserva_id;
      if (reservaId) window.open(`/${routePrefix}/reservas/${reservaId}/boleta`, '_blank');
      router.visit(route(`${routePrefix}.reservas.index`));
    } catch (error) {
      if (error.response?.status === 422) setErrores(error.response.data.errors);
      else console.error('Error al registrar reserva:', error);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Layout>
      <Head title="Registrar Reserva" />

      <div className="mb-5">
        <h1 className="text-3xl font-bold text-slate-800">Registrar Reserva</h1>
        <p className="text-slate-500">Separa productos, registra el abono y genera la boleta para el cliente.</p>
      </div>

      <NeonBox className="mb-6">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Cliente y condiciones</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del cliente</label>
            <NeonInput value={data.nombre_cliente} onChange={(e) => setData({ ...data, nombre_cliente: e.target.value })} />
            {errores.nombre_cliente && <div className="text-xs text-red-600 mt-1">{errores.nombre_cliente}</div>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
            <NeonInput value={data.telefono_cliente} onChange={(e) => setData({ ...data, telefono_cliente: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto de reserva (Bs)</label>
            <NeonInput type="number" min={0} value={data.monto_reserva} onChange={(e) => setData({ ...data, monto_reserva: e.target.value })} />
            {errores.monto_reserva && <div className="text-xs text-red-600 mt-1">{errores.monto_reserva}</div>}
          </div>
        </div>
      </NeonBox>

      <NeonBox className={`mb-6 relative overflow-visible ${mostrarProductos ? 'z-[9999]' : 'z-0'}`}>
        <h2 className="text-xl font-semibold mb-4">Producto a reservar</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de producto</label>
            <NeonField>
              <select
                value={productoSeleccionado.tipo}
                onChange={(e) => setProductoSeleccionado({ tipo: e.target.value, codigo: '', cantidad: 1, descuento: 0, producto: null })}
              >
                <option value="">Seleccionar tipo</option>
                <option value="celular">Celular</option>
                <option value="computadora">Computadora</option>
                <option value="producto_general">Producto General</option>
                <option value="producto_apple">Producto Apple</option>
              </select>
            </NeonField>
          </div>
          <div className="md:col-span-2 relative">
            <label className="block text-xs font-medium text-gray-500 mb-1">Codigo / IMEI / Serie / Nombre exacto</label>
            <NeonInput
              value={productoSeleccionado.codigo}
              onChange={(e) => {
                const value = e.target.value;
                setProductoSeleccionado((p) => ({ ...p, codigo: value }));
                buscarSugerencias(value);
              }}
            />
            {mostrarProductos && (
              <ul className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-emerald-100 z-[99999] max-h-64 overflow-auto">
                {sugerenciasProductos.map((p, i) => (
                  <li key={i} className="px-4 py-2 hover:bg-emerald-50 cursor-pointer transition" onClick={() => seleccionarProducto(p)}>
                    <div className="font-semibold">{p.nombre || p.modelo}</div>
                    <div className="text-xs text-gray-500">{p.tipo?.toUpperCase()} - {p.codigo || p.imei_1 || p.numero_serie}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {productoSeleccionado.producto && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              <div className="font-semibold">{productoSeleccionado.producto.modelo || productoSeleccionado.producto.nombre}</div>
              <div className="text-xs">Precio: Bs {formatoBs(productoSeleccionado.producto.precio_venta)}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Descuento (Bs)</label>
              <NeonInput type="number" min={0} value={productoSeleccionado.descuento} onChange={(e) => setProductoSeleccionado({ ...productoSeleccionado, descuento: Number(e.target.value) })} />
            </div>
            <button type="button" onClick={agregarItem} className="h-[46px] rounded-xl bg-emerald-600 text-white font-semibold px-6 hover:bg-emerald-700 transition">
              Agregar a reserva
            </button>
          </div>
        )}
      </NeonBox>

      <NeonBox className="mb-6 overflow-x-auto">
        <h2 className="text-lg font-semibold mb-3">Productos reservados</h2>
        <table className="w-full text-sm">
          <thead className="bg-emerald-50 text-emerald-800">
            <tr>
              <th>#</th>
              <th>Producto</th>
              <th>Precio</th>
              <th>Descuento</th>
              <th>Subtotal</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan="6" className="text-center py-4 text-gray-400">No hay productos reservados</td></tr>
            )}
            {items.map((item, i) => (
              <tr key={`${item.tipo}-${item.producto_id}`} className="border-t hover:bg-emerald-50">
                <td>{i + 1}</td>
                <td>{item.nombre}</td>
                <td>Bs {formatoBs(item.precio_venta)}</td>
                <td>Bs {formatoBs(item.descuento)}</td>
                <td className="font-semibold text-emerald-700">Bs {formatoBs(item.subtotal)}</td>
                <td><button className="text-red-600" onClick={() => setItems(items.filter((_, idx) => idx !== i))}>Quitar</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </NeonBox>

      <NeonBox className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-xl border bg-white px-4 py-3">
            <div className="text-xs text-slate-500">Total reservado</div>
            <div className="text-xl font-bold text-slate-800">Bs {formatoBs(subtotal)}</div>
          </div>
          <div className="rounded-xl border bg-white px-4 py-3">
            <div className="text-xs text-slate-500">Abono</div>
            <div className="text-xl font-bold text-emerald-600">Bs {formatoBs(data.monto_reserva)}</div>
          </div>
          <div className="rounded-xl border bg-white px-4 py-3">
            <div className="text-xs text-slate-500">Saldo al vender</div>
            <div className="text-xl font-bold text-blue-700">Bs {formatoBs(saldo)}</div>
          </div>
        </div>

        <NeonField>
          <textarea
            rows={5}
            value={data.terminos_condiciones}
            onChange={(e) => setData({ ...data, terminos_condiciones: e.target.value })}
          />
        </NeonField>

        <div className="text-center">
          <button className="btn btn-success px-8 py-2 text-lg" disabled={guardando} onClick={registrarReserva}>
            {guardando ? 'Guardando...' : 'Registrar Reserva'}
          </button>
        </div>
      </NeonBox>
    </Layout>
  );
}
