import React, { useState, useEffect } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import PhoneInput, { parsePhoneNumber } from 'react-phone-number-input';
import 'react-phone-number-input/style.css';



export default function Create({ fechaHoy, celulares = [], computadoras = [], productosGenerales = [] }) {
  const { data, setData, post, errors } = useForm({
    nombre_cliente: '',
    codigo_pais: '',
    codigo_area: '',
    telefono_cliente: '',
    correo_cliente: '',
    fecha_cotizacion: fechaHoy,
    items: [],
    total: 0,
    descuento: 0,
    notas_adicionales: ''
  });

  const [nuevoItem, setNuevoItem] = useState({ nombre: '', cantidad: 1, precio: 0 });
  const [tipoItem, setTipoItem] = useState('producto');
  const [numeroCompleto, setNumeroCompleto] = useState('');
  const [telefonoInvalido, setTelefonoInvalido] = useState(false);

  useEffect(() => {
    if (numeroCompleto) {
      try {
        const parsed = parsePhoneNumber(numeroCompleto);
        if (parsed && parsed.isValid()) {
          setTelefonoInvalido(false);
          setData('codigo_pais', `+${parsed.countryCallingCode}`);
          const national = parsed.nationalNumber;
          const area = national.length >= 10 ? national.slice(0, 3) : national.slice(0, 2);
          const phone = national.slice(area.length);
          setData('codigo_area', area);
          setData('telefono_cliente', phone);
        }
      } catch (e) {
        setTelefonoInvalido(true);
        console.warn('Número inválido o incompleto:', e.message);
      }
    } else {
      setTelefonoInvalido(false);
    }
  }, [numeroCompleto]);

  const agregarItem = () => {
    if (!nuevoItem.nombre || nuevoItem.cantidad <= 0 || nuevoItem.precio < 0) return;

    const base = parseFloat(nuevoItem.precio) || 0;
    const iva = base * 0.13;
    const it = base * 0.03;

    const itemFinal = {
      ...nuevoItem,
      precio_base: base,
      precio_sin_factura: base,
      precio_con_factura: parseFloat((base + iva + it).toFixed(2))
    };

    const nuevosItems = [...data.items, itemFinal];
    const subtotal = calcularTotal(nuevosItems, 0);
    const descuentoAjustado = Math.min(data.descuento, subtotal);

    setData('items', nuevosItems);
    setData('total', calcularTotal(nuevosItems, descuentoAjustado));
  };

  const calcularTotal = (items, descuento = 0) => {
    const subtotal = items.reduce((sum, item) => sum + (item.cantidad * (item.precio_con_factura || item.precio)), 0);
    return Math.max(0, subtotal - descuento);
  };

  const handleProductoSeleccionado = (tipo, value) => {
    let producto = null;
    if (tipo === 'celular') producto = celulares.find(p => p.id.toString() === value);
    if (tipo === 'computadora') producto = computadoras.find(p => p.id.toString() === value);
    if (tipo === 'producto_general') producto = productosGenerales.find(p => p.id.toString() === value);

    if (producto) {
      const precio = parseFloat(producto.precio_venta);
      setNuevoItem({
        nombre: producto.nombre || producto.modelo || 'Producto',
        cantidad: 1,
        precio: isNaN(precio) ? 0 : precio
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('admin.cotizaciones.store'));
  };

  const subtotalActual = calcularTotal(data.items, 0);

  return (
    <AdminLayout>
      <Head title="Nueva Cotización" />
      <h1 className="h3 mb-4">📝 Nueva Cotización</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre del Cliente</label>
            <input className="form-control" value={data.nombre_cliente} onChange={e => setData('nombre_cliente', e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono con código de país</label>
            <PhoneInput
              international
              countryCallingCodeEditable={true}
              value={numeroCompleto}
              onChange={setNumeroCompleto}
              className="!w-full !rounded-md !border-gray-300 !shadow-sm focus:!border-blue-500 focus:!ring focus:!ring-blue-200 focus:!ring-opacity-50 text-sm"
              placeholder="Ej: +54 9 11 3416 6916"
            />
            {telefonoInvalido && (
              <p className="text-red-500 text-xs mt-1">
                Número inválido o incompleto. Revisa el código de país y área.
              </p>
            )}
            {data.codigo_pais && data.codigo_area && data.telefono_cliente && (
              <p className="text-gray-500 text-xs mt-1">
                Número detectado: {data.codigo_pais} {data.codigo_area} {data.telefono_cliente}
              </p>
            )}
          </div>
          <div className="col-md-6 mb-3">
            <label>Correo</label>
            <input className="form-control" type="email" value={data.correo_cliente} onChange={e => setData('correo_cliente', e.target.value)} />
          </div>

          <div className="col-md-6 mb-3">
            <label>Fecha</label>
            <input type="date" className="form-control" value={data.fecha_cotizacion} onChange={e => setData('fecha_cotizacion', e.target.value)} />
          </div>

          <div className="col-md-12 mb-3">
            <label>Tipo de ítem</label>
            <select className="form-control" value={tipoItem} onChange={e => setTipoItem(e.target.value)}>
              <option value="producto">Producto del Inventario</option>
              <option value="servicio">Servicio Técnico (manual)</option>
            </select>
          </div>

          {tipoItem === 'producto' && (
            <div className="col-md-12 mb-3">
              <label>Seleccionar producto</label>
              <div className="row">
                <div className="col-md-4">
                  <select className="form-control" onChange={e => handleProductoSeleccionado('celular', e.target.value)}>
                    <option value="">-- Celulares --</option>
                    {celulares.map(c => (
                      <option key={c.id} value={c.id}>{c.modelo} (IMEI: {c.imei_1})</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <select className="form-control" onChange={e => handleProductoSeleccionado('computadora', e.target.value)}>
                    <option value="">-- Computadoras --</option>
                    {computadoras.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} (Serie: {c.numero_serie})</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4">
                  <select className="form-control" onChange={e => handleProductoSeleccionado('producto_general', e.target.value)}>
                    <option value="">-- Productos Generales --</option>
                    {productosGenerales.map(p => (
                      <option key={p.id} value={p.id}>{p.nombre} (Código: {p.codigo})</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {(tipoItem === 'servicio' || tipoItem === 'producto') && (
            <div className="col-md-12 mb-3">
              <h5>Agregar Ítem</h5>
              <div className="row">
                <div className="col-md-5">
                  <input className="form-control" placeholder="Descripción" value={nuevoItem.nombre} onChange={e => setNuevoItem({ ...nuevoItem, nombre: e.target.value })} />
                </div>
                <div className="col-md-2">
                  <input type="number" className="form-control" placeholder="Cantidad" value={nuevoItem.cantidad} onChange={e => setNuevoItem({ ...nuevoItem, cantidad: parseInt(e.target.value) || 1 })} />
                </div>
                <div className="col-md-3">
                  <input type="number" className="form-control" placeholder="Precio Base" value={nuevoItem.precio} onChange={e => setNuevoItem({ ...nuevoItem, precio: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="col-md-2">
                  <button type="button" className="btn btn-primary w-100" onClick={agregarItem}>Agregar</button>
                </div>
              </div>
            </div>
          )}

          <div className="col-md-12 mb-3">
            <table className="table table-bordered">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Cantidad</th>
                  <th>Precio Neto</th>
                  <th>Precio c/Factura</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, index) => (
                  <tr key={index}>
                    <td>{item.nombre}</td>
                    <td>{item.cantidad}</td>
                    <td>{item.precio_sin_factura}</td>
                    <td>{item.precio_con_factura}</td>
                    <td>{(item.cantidad * item.precio_con_factura).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="col-md-4 mb-3">
            <label>Descuento (Bs)</label>
            <input type="number" className="form-control" value={data.descuento} onChange={(e) => {
              const value = parseFloat(e.target.value) || 0;
              const descuento = Math.min(value, subtotalActual);
              setData('descuento', descuento);
              setData('total', calcularTotal(data.items, descuento));
            }} />
          </div>

          <div className="col-md-12 text-end mb-2">
            <p>Subtotal: <strong>Bs {subtotalActual.toFixed(2)}</strong></p>
            <p>Descuento aplicado: <strong>Bs {data.descuento.toFixed(2)}</strong></p>
            <h5>Total con Descuento: <strong>Bs {data.total.toFixed(2)}</strong></h5>
          </div>

          <div className="col-md-12 mb-3">
            <label>Notas adicionales</label>
            <textarea className="form-control" value={data.notas_adicionales} onChange={e => setData('notas_adicionales', e.target.value)} />
          </div>

          <div className="col-md-12 text-end">
            <button type="submit" className="btn btn-success">Guardar Cotización</button>
            <Link href={route('admin.cotizaciones.index')} className="btn btn-secondary ms-2">Cancelar</Link>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
