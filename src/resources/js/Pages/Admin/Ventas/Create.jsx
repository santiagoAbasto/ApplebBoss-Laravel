import { useForm, Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { useState } from 'react';

export default function Create({ celulares, computadoras, productosGenerales }) {
  const [permutaActiva, setPermutaActiva] = useState(false);
  const [tipoPermuta, setTipoPermuta] = useState('');

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
    permuta: {},
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('admin.ventas.store'));
  };

  const handlePermutaChange = (field, value) => {
    setData('permuta', {
      ...data.permuta,
      [field]: value,
    });
  };

  return (
    <AdminLayout>
      <Head title="Registrar Venta" />
      <h1 className="h3 mb-4">🛒 Registrar Venta</h1>

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label>Cliente</label>
            <input type="text" className="form-control" value={data.nombre_cliente} onChange={e => setData('nombre_cliente', e.target.value)} />
          </div>
          <div className="col-md-6 mb-3">
            <label>Teléfono</label>
            <input type="text" className="form-control" value={data.telefono_cliente} onChange={e => setData('telefono_cliente', e.target.value)} />
          </div>

          <div className="col-md-6 mb-3">
            <label>Producto vendido</label>
            <select className="form-control" onChange={e => {
              setData('celular_id', e.target.value);
              setData('computadora_id', '');
              setData('producto_general_id', '');
            }}>
              <option value="">-- Celulares disponibles --</option>
              {celulares.map(c => (
                <option key={c.id} value={c.id}>{c.modelo} - {c.imei_1}</option>
              ))}
            </select>
          </div>

          <div className="col-md-6 mb-3">
            <label>Permuta</label>
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

              {tipoPermuta === 'celular' && (
                <>
                  <div className="col-md-4 mb-3">
                    <label>Modelo</label>
                    <input className="form-control" onChange={e => handlePermutaChange('modelo', e.target.value)} />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label>IMEI 1</label>
                    <input className="form-control" onChange={e => handlePermutaChange('imei_1', e.target.value)} />
                  </div>
                  <div className="col-md-4 mb-3">
                    <label>Capacidad</label>
                    <input className="form-control" onChange={e => handlePermutaChange('capacidad', e.target.value)} />
                  </div>
                </>
              )}

              {tipoPermuta === 'computadora' && (
                <>
                  <div className="col-md-6 mb-3">
                    <label>Modelo</label>
                    <input className="form-control" onChange={e => handlePermutaChange('modelo', e.target.value)} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label>RAM</label>
                    <input className="form-control" onChange={e => handlePermutaChange('ram', e.target.value)} />
                  </div>
                </>
              )}

              {tipoPermuta === 'producto_general' && (
                <>
                  <div className="col-md-6 mb-3">
                    <label>Nombre del producto</label>
                    <input className="form-control" onChange={e => handlePermutaChange('nombre', e.target.value)} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label>Código</label>
                    <input className="form-control" onChange={e => handlePermutaChange('codigo', e.target.value)} />
                  </div>
                </>
              )}
            </>
          )}

          <div className="col-md-4 mb-3">
            <label>Precio Venta (Bs)</label>
            <input className="form-control" type="number" onChange={e => setData('precio_venta', e.target.value)} />
          </div>
          <div className="col-md-4 mb-3">
            <label>Precio Costo (Bs)</label>
            <input className="form-control" type="number" onChange={e => setData('precio_invertido', e.target.value)} />
          </div>
          <div className="col-md-4 mb-3">
            <label>Descuento (Bs)</label>
            <input className="form-control" type="number" onChange={e => setData('descuento', e.target.value)} />
          </div>
        </div>

        <button type="submit" className="btn btn-success">Registrar Venta</button>
        <Link href={route('admin.ventas.index')} className="btn btn-secondary ms-2">Cancelar</Link>
      </form>
    </AdminLayout>
  );
}
