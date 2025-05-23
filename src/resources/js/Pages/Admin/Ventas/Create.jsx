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
      <h1 className="h3 mb-4">🛒 Registrar Venta</h1>

      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Datos del cliente */}
          <div className="col-md-6 mb-3">
            <label>Cliente</label>
            <input type="text" className={`form-control ${errors.nombre_cliente ? 'is-invalid' : ''}`} value={data.nombre_cliente} onChange={e => setData('nombre_cliente', e.target.value)} />
            {errors.nombre_cliente && <div className="invalid-feedback">{errors.nombre_cliente}</div>}
          </div>
          <div className="col-md-6 mb-3">
            <label>Teléfono</label>
            <input type="text" className="form-control" value={data.telefono_cliente} onChange={e => setData('telefono_cliente', e.target.value)} />
          </div>

          {/* Producto vendido */}
          <div className="col-md-6 mb-3">
            <label>Tipo de producto vendido</label>
            <select className="form-control" value={productoTipo} onChange={e => {
              const tipo = e.target.value;
              setProductoTipo(tipo);
              setData('celular_id', '');
              setData('computadora_id', '');
              setData('producto_general_id', '');
            }}>
              <option value="">-- Seleccionar --</option>
              <option value="celular">Celular</option>
              <option value="computadora">Computadora</option>
              <option value="producto_general">Producto General</option>
            </select>
          </div>

          {/* Selección específica */}
          {productoTipo === 'celular' && (
            <div className="col-md-6 mb-3">
              <label>IMEI</label>
              <select className="form-control" value={data.celular_id} onChange={e => setData('celular_id', e.target.value)}>
                <option value="">-- Seleccionar Celular --</option>
                {celulares.map(c => (
                  <option key={c.id} value={c.id}>{c.modelo} - {c.imei_1}</option>
                ))}
              </select>
            </div>
          )}
          {productoTipo === 'computadora' && (
            <div className="col-md-6 mb-3">
              <label>Número de Serie</label>
              <select className="form-control" value={data.computadora_id} onChange={e => setData('computadora_id', e.target.value)}>
                <option value="">-- Seleccionar Computadora --</option>
                {computadoras.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} - {c.numero_serie}</option>
                ))}
              </select>
            </div>
          )}
          {productoTipo === 'producto_general' && (
            <div className="col-md-6 mb-3">
              <label>Código</label>
              <select className="form-control" value={data.producto_general_id} onChange={e => setData('producto_general_id', e.target.value)}>
                <option value="">-- Seleccionar Producto --</option>
                {productosGenerales.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} - {p.codigo}</option>
                ))}
              </select>
            </div>
          )}

          {/* Permuta */}
          <div className="col-md-6 mb-3">
            <label>¿Es Permuta?</label>
            <select className="form-control" value={data.es_permuta ? '1' : ''} onChange={e => {
              const es = e.target.value === '1';
              setPermutaActiva(es);
              setData('es_permuta', es);
            }}>
              <option value="">No</option>
              <option value="1">Sí</option>
            </select>
          </div>

          {permutaActiva && (
            <>
              <div className="col-md-6 mb-3">
                <label>Tipo de producto entregado</label>
                <select className="form-control" value={tipoPermuta} onChange={e => {
                  setTipoPermuta(e.target.value);
                  setData('tipo_permuta', e.target.value);
                }}>
                  <option value="">-- Seleccionar --</option>
                  <option value="celular">Celular</option>
                  <option value="computadora">Computadora</option>
                  <option value="producto_general">Producto General</option>
                </select>
              </div>


              {opcionesPermuta.length > 0 && (
                <div className="col-md-12 mb-3">
                  <label>Seleccionar producto entregado registrado</label>
                  <select className="form-control" onChange={e => {
                    const seleccion = opcionesPermuta.find(p => p.id == e.target.value);
                    if (seleccion) {
                      setData('permuta', {
                        ...seleccion,
                        precio_costo: seleccion.precio_costo,
                        precio_venta: seleccion.precio_venta
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

              {tipoPermuta && (
                <div className="col-md-12 mb-3">
                  <button
                    type="button"
                    className="btn btn-outline-info"
                    onClick={() => setShowModal(true)}
                  >
                    ➕ Registrar producto entregado (modal)
                  </button>
                </div>
              )}
            </>
          )}

          {/* Precios y notas */}
          <div className="col-md-4 mb-3">
            <label>Precio Venta</label>
            <input type="number" className="form-control" value={data.precio_venta} onChange={e => setData('precio_venta', e.target.value)} />
          </div>
          <div className="col-md-4 mb-3">
            <label>Precio Costo</label>
            <input type="number" className="form-control" value={data.precio_invertido} onChange={e => setData('precio_invertido', e.target.value)} />
          </div>
          <div className="col-md-4 mb-3">
            <label>Descuento</label>
            <input type="number" className="form-control" value={data.descuento} onChange={e => setData('descuento', e.target.value)} />
          </div>

          <div className="col-md-4 mb-3">
            <label>Método de Pago</label>
            <select className="form-control" value={data.metodo_pago} onChange={e => setData('metodo_pago', e.target.value)}>
              <option value="">-- Seleccionar --</option>
              <option value="efectivo">Efectivo</option>
              <option value="qr">QR</option>
              <option value="tarjeta">Tarjeta</option>
            </select>
          </div>

          {data.metodo_pago === 'tarjeta' && (
            <>
              <div className="col-md-4 mb-3">
                <label>Inicio Tarjeta</label>
                <input className="form-control" value={data.tarjeta_inicio} onChange={e => setData('tarjeta_inicio', e.target.value)} />
              </div>
              <div className="col-md-4 mb-3">
                <label>Fin Tarjeta</label>
                <input className="form-control" value={data.tarjeta_fin} onChange={e => setData('tarjeta_fin', e.target.value)} />
              </div>
            </>
          )}

          <div className="col-md-12 mb-3">
            <label>Notas adicionales</label>
            <textarea className="form-control" value={data.notas_adicionales} onChange={e => setData('notas_adicionales', e.target.value)} />
          </div>
        </div>

        <button type="submit" className="btn btn-success">Registrar Venta</button>
        <Link href={route('admin.ventas.index')} className="btn btn-secondary ms-2">Cancelar</Link>
      </form>

      {/* Modal para registrar producto entregado */}
      <ModalPermuta
        show={showModal}
        onClose={() => setShowModal(false)}
        tipo={tipoPermuta}
        onGuardar={handleGuardarPermuta}
      />
    </AdminLayout>
  );
}
