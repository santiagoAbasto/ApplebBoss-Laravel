import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function CreateServicio() {
  const { data, setData, post, errors } = useForm({
    cliente: '',
    telefono: '',
    equipo: '',
    detalle_servicio: '',
    precio_costo: '',
    precio_venta: '',
    tecnico: '',
    fecha: new Date().toISOString().split('T')[0], // fecha actual
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('admin.servicios.store'));
  };

  return (
    <AdminLayout>
      <Head title="Registrar Servicio Técnico" />

      <h1 className="h3 mb-4">🧰 Registrar Servicio Técnico</h1>

      <form onSubmit={handleSubmit} className="card card-body shadow">
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Nombre del Cliente</label>
            <input type="text" className="form-control" value={data.cliente} onChange={e => setData('cliente', e.target.value)} />
            {errors.cliente && <div className="text-danger">{errors.cliente}</div>}
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Teléfono</label>
            <input type="text" className="form-control" value={data.telefono} onChange={e => setData('telefono', e.target.value)} />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Equipo</label>
            <input type="text" className="form-control" value={data.equipo} onChange={e => setData('equipo', e.target.value)} />
            {errors.equipo && <div className="text-danger">{errors.equipo}</div>}
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label">Técnico Encargado</label>
            <input type="text" className="form-control" value={data.tecnico} onChange={e => setData('tecnico', e.target.value)} />
            {errors.tecnico && <div className="text-danger">{errors.tecnico}</div>}
          </div>

          <div className="col-md-12 mb-3">
            <label className="form-label">Detalle del Servicio</label>
            <textarea className="form-control" rows="3" value={data.detalle_servicio} onChange={e => setData('detalle_servicio', e.target.value)} />
            {errors.detalle_servicio && <div className="text-danger">{errors.detalle_servicio}</div>}
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Precio Costo (Bs)</label>
            <input type="number" step="0.01" className="form-control" value={data.precio_costo} onChange={e => setData('precio_costo', e.target.value)} />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Precio Venta (Bs)</label>
            <input type="number" step="0.01" className="form-control" value={data.precio_venta} onChange={e => setData('precio_venta', e.target.value)} />
          </div>

          <div className="col-md-4 mb-3">
            <label className="form-label">Fecha</label>
            <input type="date" className="form-control" value={data.fecha} onChange={e => setData('fecha', e.target.value)} />
          </div>
        </div>

        <button type="submit" className="btn btn-success">Guardar</button>
      </form>
    </AdminLayout>
  );
}
