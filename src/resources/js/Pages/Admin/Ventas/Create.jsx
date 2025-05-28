import { useForm, Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState, useEffect } from 'react';
import ModalPermuta from '@/Components/ModalPermutaComponent';

export default function Create({ celulares, computadoras, productosGenerales }) {
  const [permutaActiva, setPermutaActiva] = useState(false);
  const [tipoPermuta, setTipoPermuta] = useState('');
  const [productoTipo, setProductoTipo] = useState('');
  const [opcionesPermuta, setOpcionesPermuta] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [busquedaCodigo, setBusquedaCodigo] = useState('');

  const rutasCRUD = {
    celular: '/admin/celulares/create?return_to=/admin/ventas/create',
    computadora: '/admin/computadoras/create?return_to=/admin/ventas/create',
    producto_general: '/admin/productos-generales/create?return_to=/admin/ventas/create',
  };

  const { data, setData, post, errors } = useForm({
    nombre_cliente: '',
    telefono_cliente: '',
    tipo_venta: 'producto',
    es_permuta: false,
    tipo_permuta: '',
    celular_id: '',
    computadora_id: '',
    producto_general_id: '',
    cantidad: 1,
    precio_invertido: 0,
    precio_venta: 0,
    ganancia_neta: 0,
    subtotal: 0,
    descuento: 0,
    metodo_pago: '',
    tarjeta_inicio: '',
    tarjeta_fin: '',
    notas_adicionales: '',
    permuta: {},
  });

  const manejarBusquedaCodigo = () => {
    let producto = null;
    if (productoTipo === 'celular') {
      producto = celulares.find(p => p.imei_1 === busquedaCodigo);
      if (producto) setData('celular_id', producto.id);
    } else if (productoTipo === 'computadora') {
      producto = computadoras.find(p => p.numero_serie === busquedaCodigo);
      if (producto) setData('computadora_id', producto.id);
    } else if (productoTipo === 'producto_general') {
      producto = productosGenerales.find(p => p.codigo === busquedaCodigo);
      if (producto) setData('producto_general_id', producto.id);
    }
    if (producto) {
      setData('precio_venta', producto.precio_venta || 0);
      setData('precio_invertido', producto.precio_costo || 0);
    } else {
      alert('Producto no encontrado con ese código.');
    }
  };

  const handleGuardarPermuta = (producto) => {
    setData('permuta', producto);
    setShowModal(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (permutaActiva && (!data.permuta || !data.permuta.precio_costo)) {
      alert('Debes seleccionar el producto entregado para completar la permuta.');
      return;
    }
    post(route('admin.ventas.store'));
  };

  useEffect(() => {
    if (['celular', 'computadora', 'producto_general'].includes(productoTipo)) {
      setData('tipo_venta', 'producto');
    } else {
      setData('tipo_venta', productoTipo);
    }
  }, [productoTipo]);

  useEffect(() => {
    const precioVenta = parseFloat(data.precio_venta) || 0;
    const descuento = parseFloat(data.descuento) || 0;
    const permutaCosto = permutaActiva ? parseFloat(data.permuta?.precio_costo || 0) : 0;
    const subtotal = Math.max(0, precioVenta - permutaCosto - descuento);
    setData('subtotal', subtotal);
  }, [data.precio_venta, data.permuta?.precio_costo, data.descuento, permutaActiva]);

  useEffect(() => {
    if (tipoPermuta) {
      fetch(`/api/permuta/${tipoPermuta}`)
        .then(res => res.json())
        .then(data => setOpcionesPermuta(data))
        .catch(() => setOpcionesPermuta([]));
    }
  }, [tipoPermuta]);

  useEffect(() => {
    let producto = null;
    if (productoTipo === 'celular' && data.celular_id) {
      producto = celulares.find(c => c.id == data.celular_id);
    } else if (productoTipo === 'computadora' && data.computadora_id) {
      producto = computadoras.find(c => c.id == data.computadora_id);
    } else if (productoTipo === 'producto_general' && data.producto_general_id) {
      producto = productosGenerales.find(c => c.id == data.producto_general_id);
    }
    if (producto) {
      setData('precio_venta', producto.precio_venta || 0);
      setData('precio_invertido', producto.precio_costo || 0);
    }
  }, [data.celular_id, data.computadora_id, data.producto_general_id]);

  return (
    <AdminLayout>
      <Head title="Registrar Venta" />
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">🛒 Registrar Venta</h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium text-sm text-gray-700 dark:text-gray-200 mb-1">Cliente</label>
            <input type="text" className="w-full border rounded-xl px-4 py-2 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white" value={data.nombre_cliente} onChange={e => setData('nombre_cliente', e.target.value)} />
            {errors.nombre_cliente && <p className="text-sm text-red-500 mt-1">{errors.nombre_cliente}</p>}
          </div>
          <div>
            <label className="block font-medium text-sm text-gray-700 dark:text-gray-200 mb-1">Teléfono</label>
            <input type="text" className="w-full border rounded-xl px-4 py-2 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white" value={data.telefono_cliente} onChange={e => setData('telefono_cliente', e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium text-sm text-gray-700 dark:text-gray-200 mb-1">Tipo de producto vendido</label>
            <select className="w-full border rounded-xl px-4 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white" value={productoTipo} onChange={e => {
              const tipo = e.target.value;
              setProductoTipo(tipo);
              setData('celular_id', '');
              setData('computadora_id', '');
              setData('producto_general_id', '');
              setBusquedaCodigo('');
            }}>
              <option value="">-- Seleccionar --</option>
              <option value="celular">Celular</option>
              <option value="computadora">Computadora</option>
              <option value="producto_general">Producto General</option>
            </select>
          </div>

          {productoTipo && (
            <div>
              <label className="block font-medium text-sm text-gray-700 dark:text-gray-200 mb-1">
                {productoTipo === 'celular' && 'Ingrese IMEI'}
                {productoTipo === 'computadora' && 'Ingrese Número de Serie'}
                {productoTipo === 'producto_general' && 'Ingrese Código del Producto'}
              </label>
              <input
                type="text"
                className="w-full border rounded-xl px-4 py-2 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                value={busquedaCodigo}
                onChange={e => setBusquedaCodigo(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    manejarBusquedaCodigo();
                  }
                }}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block font-medium text-sm text-gray-700 dark:text-gray-200 mb-1">¿Es Permuta?</label>
            <select className="w-full border rounded-xl px-4 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white" value={data.es_permuta ? '1' : ''} onChange={e => {
              const es = e.target.value === '1';
              setPermutaActiva(es);
              setData('es_permuta', es);
            }}>
              <option value="">No</option>
              <option value="1">Sí</option>
            </select>
          </div>

          {permutaActiva && (
            <div>
              <label className="block font-medium text-sm text-gray-700 dark:text-gray-200 mb-1">Tipo de producto entregado</label>
              <select className="w-full border rounded-xl px-4 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white" value={tipoPermuta} onChange={e => {
                setTipoPermuta(e.target.value);
                setData('tipo_permuta', e.target.value);
              }}>
                <option value="">-- Seleccionar --</option>
                <option value="celular">Celular</option>
                <option value="computadora">Computadora</option>
                <option value="producto_general">Producto General</option>
              </select>
            </div>
          )}
        </div>

        {permutaActiva && opcionesPermuta.length > 0 && (
          <div>
            <label className="block font-medium text-sm text-gray-700 dark:text-gray-200 mb-1">Seleccionar producto entregado registrado</label>
            <select className="w-full border rounded-xl px-4 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white" onChange={e => {
              const seleccion = opcionesPermuta.find(p => p.id == e.target.value);
              if (seleccion) {
                setData('permuta', {
                  ...seleccion,
                  precio_costo: seleccion.precio_costo,
                  precio_venta: seleccion.precio_venta,
                });
              }
            }}>
              <option value="">-- Seleccionar --</option>
              {opcionesPermuta.map(p => (
                <option key={p.id} value={p.id}>
                  {tipoPermuta === 'celular' && `${p.modelo} - ${p.imei_1}`}
                  {tipoPermuta === 'computadora' && `${p.nombre} - ${p.numero_serie}`}
                  {tipoPermuta === 'producto_general' && `${p.nombre} - ${p.codigo}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {permutaActiva && tipoPermuta && (
          <div className="text-right">
            <button type="button" onClick={() => setShowModal(true)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl shadow">➕ Registrar producto entregado</button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block font-medium text-sm text-gray-700 dark:text-gray-200 mb-1">Precio Venta (Bs)</label>
            <input type="number" value={data.precio_venta} onChange={e => setData('precio_venta', e.target.value)} className="w-full border rounded-xl px-4 py-2 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block font-medium text-sm text-gray-700 dark:text-gray-200 mb-1">Precio Costo (Bs)</label>
            <input type="number" value={data.precio_invertido} onChange={e => setData('precio_invertido', e.target.value)} className="w-full border rounded-xl px-4 py-2 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block font-medium text-sm text-gray-700 dark:text-gray-200 mb-1">Descuento (Bs)</label>
            <input type="number" value={data.descuento} onChange={e => setData('descuento', e.target.value)} className="w-full border rounded-xl px-4 py-2 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block font-medium text-sm text-gray-700 dark:text-gray-200 mb-1">Método de Pago</label>
            <select className="w-full border rounded-xl px-4 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-white" value={data.metodo_pago} onChange={e => setData('metodo_pago', e.target.value)}>
              <option value="">-- Seleccionar --</option>
              <option value="efectivo">Efectivo</option>
              <option value="qr">QR</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </div>

          {data.metodo_pago === 'tarjeta' && (
            <>
              <div>
                <label className="block font-medium text-sm text-gray-700 dark:text-gray-200 mb-1">Inicio Tarjeta</label>
                <input className="w-full border rounded-xl px-4 py-2 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white" value={data.tarjeta_inicio} onChange={e => setData('tarjeta_inicio', e.target.value)} />
              </div>
              <div>
                <label className="block font-medium text-sm text-gray-700 dark:text-gray-200 mb-1">Fin Tarjeta</label>
                <input className="w-full border rounded-xl px-4 py-2 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white" value={data.tarjeta_fin} onChange={e => setData('tarjeta_fin', e.target.value)} />
              </div>
            </>
          )}
        </div>

        <div>
          <label className="block font-medium text-sm text-gray-700 dark:text-gray-200 mb-1">Notas adicionales</label>
          <textarea rows="3" className="w-full border rounded-xl px-4 py-2 shadow-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white" value={data.notas_adicionales} onChange={e => setData('notas_adicionales', e.target.value)} />
        </div>

        <div className="flex justify-end gap-4">
          <button type="submit" className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl shadow transition">Registrar Venta</button>
          <Link href={route('admin.ventas.index')} className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 text-sm font-medium rounded-xl shadow transition">Cancelar</Link>
        </div>
      </form>

      <ModalPermuta
        show={showModal}
        onClose={() => setShowModal(false)}
        tipo={tipoPermuta}
        onGuardar={handleGuardarPermuta}
      />
    </AdminLayout>
  );
}
