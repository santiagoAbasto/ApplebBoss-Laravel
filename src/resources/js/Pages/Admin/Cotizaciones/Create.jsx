import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Trash2, CheckCircle } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import Toast from '@/Components/Toast';

export default function Create({ celulares, computadoras, productosGenerales, fechaHoy }) {
  const { data, setData, post, reset } = useForm({
    nombre_cliente: '',
    telefono_completo: '',
    correo_cliente: '',
    fecha_cotizacion: fechaHoy,
    items: [],
    descuento: 0,
    total: 0,
    notas_adicionales: ''
  });

  const [nuevoItem, setNuevoItem] = useState({ nombre: '', cantidad: 1, precio: 0 });
  const [tipoItem, setTipoItem] = useState('producto');
  const [numeroCompleto, setNumeroCompleto] = useState('');
  const [telefonoInvalido, setTelefonoInvalido] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastType, setToastType] = useState('success');

  useEffect(() => {
    setData('telefono_completo', numeroCompleto);
    if (numeroCompleto && numeroCompleto.length < 10) {
      setTelefonoInvalido(true);
    } else {
      setTelefonoInvalido(false);
    }
  }, [numeroCompleto]);

  const calcularTotal = (items, descuento) => {
    const subtotal = items.reduce((acc, item) => acc + item.cantidad * item.precio_con_factura, 0);
    return Math.max(subtotal - descuento, 0);
  };

  const agregarItem = () => {
    if (nuevoItem.nombre && nuevoItem.cantidad > 0 && nuevoItem.precio > 0) {
      const sinFactura = nuevoItem.precio;
      const conFactura = parseFloat((nuevoItem.precio * 1.16).toFixed(2));
      const item = {
        nombre: nuevoItem.nombre,
        cantidad: nuevoItem.cantidad,
        precio_sin_factura: sinFactura,
        precio_con_factura: conFactura
      };
      setData('items', [...data.items, item]);
      setNuevoItem({ nombre: '', cantidad: 1, precio: 0 });
      const nuevoTotal = calcularTotal([...data.items, item], data.descuento);
      setData('total', nuevoTotal);
    }
  };

  const eliminarItem = (index) => {
    const nuevosItems = data.items.filter((_, i) => i !== index);
    setData('items', nuevosItems);
    setData('total', calcularTotal(nuevosItems, data.descuento));
  };

  const handleProductoSeleccionado = async (tipo, id) => {
    if (!id) return;
    let seleccionado = null;
    if (tipo === 'celular') seleccionado = celulares.find(c => c.id == id);
    if (tipo === 'computadora') seleccionado = computadoras.find(c => c.id == id);
    if (tipo === 'producto_general') seleccionado = productosGenerales.find(p => p.id == id);

    if (seleccionado) {
      setNuevoItem({
        nombre: seleccionado.modelo || seleccionado.nombre,
        cantidad: 1,
        precio: parseFloat(seleccionado.precio_venta || 0)
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('admin.cotizaciones.store'), {
      preserveScroll: true,
      onSuccess: () => {
        setToastType('success');
        setToastVisible(true);
        reset();
      },
      onError: () => {
        setToastType('error');
        setToastVisible(true);
      },
    });
  };

  const subtotalActual = calcularTotal(data.items, 0);

  return (
    <>
      <AdminLayout>
      <Head title="Nueva Cotización" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-blue-700 flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-green-500" /> Nueva Cotización
        </h1>
        <Link href={route('admin.cotizaciones.index')} className="text-sm text-gray-600 hover:underline">← Volver al listado</Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-md animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del Cliente</label>
              <input type="text" className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-blue-400" value={data.nombre_cliente} onChange={e => setData('nombre_cliente', e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Teléfono con código de país</label>
              <PhoneInput
                international
                value={numeroCompleto}
                onChange={setNumeroCompleto}
                className="w-full border border-gray-300 rounded-md px-4 py-2 text-sm"
                placeholder="Ej: +591 7XX XXXX"
              />
              {telefonoInvalido && <p className="text-red-500 text-xs mt-1">Número inválido o incompleto.</p>}
              {data.telefono_completo && <p className="text-gray-500 text-xs mt-1">Detectado: {data.telefono_completo}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Correo</label>
              <input type="email" className="w-full border border-gray-300 rounded-md px-4 py-2" value={data.correo_cliente} onChange={e => setData('correo_cliente', e.target.value)} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha</label>
              <input type="date" className="w-full border border-gray-300 rounded-md px-4 py-2" value={data.fecha_cotizacion} onChange={e => setData('fecha_cotizacion', e.target.value)} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tipo de Ítem</label>
              <select className="w-full border border-gray-300 rounded-md px-4 py-2" value={tipoItem} onChange={e => setTipoItem(e.target.value)}>
                <option value="producto">Producto del Inventario</option>
                <option value="servicio">Servicio Técnico (manual)</option>
              </select>
            </div>

            {tipoItem === 'producto' && (
              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                <select className="w-full border border-gray-300 rounded-md px-4 py-2" onChange={e => handleProductoSeleccionado('celular', e.target.value)}>
                  <option value="">-- Celulares --</option>
                  {celulares.map(c => <option key={c.id} value={c.id}>{c.modelo} (IMEI: {c.imei_1})</option>)}
                </select>
                <select className="w-full border border-gray-300 rounded-md px-4 py-2" onChange={e => handleProductoSeleccionado('computadora', e.target.value)}>
                  <option value="">-- Computadoras --</option>
                  {computadoras.map(c => <option key={c.id} value={c.id}>{c.nombre} (Serie: {c.numero_serie})</option>)}
                </select>
                <select className="w-full border border-gray-300 rounded-md px-4 py-2" onChange={e => handleProductoSeleccionado('producto_general', e.target.value)}>
                  <option value="">-- Productos Generales --</option>
                  {productosGenerales.map(p => <option key={p.id} value={p.id}>{p.nombre} (Código: {p.codigo})</option>)}
                </select>
              </div>
            )}

            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <input className="border rounded-md px-4 py-2" placeholder="Descripción" value={nuevoItem.nombre} onChange={e => setNuevoItem({ ...nuevoItem, nombre: e.target.value })} />
              <input type="number" className="border rounded-md px-4 py-2" placeholder="Cantidad" value={nuevoItem.cantidad} onChange={e => setNuevoItem({ ...nuevoItem, cantidad: parseInt(e.target.value) || 1 })} />
              <input type="number" className="border rounded-md px-4 py-2" placeholder="Precio Base" value={nuevoItem.precio} onChange={e => setNuevoItem({ ...nuevoItem, precio: parseFloat(e.target.value) || 0 })} />
              <button type="button" onClick={agregarItem} className="bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700 transition">Agregar</button>
            </div>

            <div className="md:col-span-2 overflow-x-auto rounded-md border border-gray-300">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2">Descripción</th>
                    <th className="px-4 py-2">Cantidad</th>
                    <th className="px-4 py-2">Precio Neto</th>
                    <th className="px-4 py-2">Precio c/Factura</th>
                    <th className="px-4 py-2">Total</th>
                    <th className="px-2 py-2 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-2">{item.nombre}</td>
                      <td className="px-4 py-2">{item.cantidad}</td>
                      <td className="px-4 py-2">{item.precio_sin_factura}</td>
                      <td className="px-4 py-2">{item.precio_con_factura}</td>
                      <td className="px-4 py-2">{(item.cantidad * item.precio_con_factura).toFixed(2)}</td>
                      <td className="px-2 py-2 text-center">
                        <button onClick={() => eliminarItem(index)} type="button" className="text-red-500 hover:text-red-700 transition" title="Eliminar">
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:col-span-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-semibold mb-1">Descuento (Bs)</label>
                <input type="number" className="w-full border rounded-md px-4 py-2" value={data.descuento} onChange={e => {
                  const value = parseFloat(e.target.value) || 0;
                  const descuento = Math.min(value, subtotalActual);
                  setData('descuento', descuento);
                  setData('total', calcularTotal(data.items, descuento));
                }} />
              </div>
              <div className="text-end space-y-1 w-full md:w-auto">
                <p>Subtotal: <strong>Bs {subtotalActual.toFixed(2)}</strong></p>
                <p>Descuento: <strong>Bs {data.descuento.toFixed(2)}</strong></p>
                <h5 className="text-lg font-bold">Total: Bs {data.total.toFixed(2)}</h5>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Notas adicionales</label>
              <textarea className="w-full border rounded-md px-4 py-2" rows={3} value={data.notas_adicionales} onChange={e => setData('notas_adicionales', e.target.value)} />
            </div>

            <div className="md:col-span-2 flex justify-end gap-4 pt-4">
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition">Guardar Cotización</button>
            <Link href={route('admin.cotizaciones.index')} className="bg-gray-300 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-400 transition">Cancelar</Link>
          </div>
        </div>
      </form>

      <Toast
        show={toastVisible}
        type={toastType}
        message={
          toastType === 'success'
            ? '✅ Cotización creada con éxito'
            : '❌ Ocurrió un error al guardar la cotización'
        }
      />
    </AdminLayout>
    </>
  );
}
