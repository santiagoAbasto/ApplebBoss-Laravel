import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function CreateCelular() {
  const { data, setData, post, processing, errors } = useForm({
    modelo: '',
    capacidad: '',
    color: '',
    bateria: '',
    imei_1: '',
    imei_2: '',
    estado_imei: 'libre',
    procedencia: '',
    precio_costo: '',
    precio_venta: '',
    estado: 'disponible',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('admin.celulares.store'));
  };

  return (
    <AdminLayout>
      <Head title="Registrar Celular" />

      <div className="mb-4 d-flex justify-content-between align-items-center">
        <h1 className="h3 text-gray-800">Registrar nuevo celular</h1>
        <Link href={route('admin.celulares.index')} className="btn btn-secondary">← Volver</Link>
      </div>

      <form onSubmit={handleSubmit} className="card shadow p-4">
        <div className="row">
          {/* Modelo */}
          <div className="col-md-6 mb-3">
            <label>Modelo</label>
            <input type="text" className="form-control" value={data.modelo} onChange={(e) => setData('modelo', e.target.value)} disabled={processing} />
            {errors.modelo && <div className="text-danger">{errors.modelo}</div>}
          </div>

          {/* Capacidad */}
          <div className="col-md-6 mb-3">
            <label>Capacidad</label>
            <input type="text" className="form-control" value={data.capacidad} onChange={(e) => setData('capacidad', e.target.value)} disabled={processing} />
            {errors.capacidad && <div className="text-danger">{errors.capacidad}</div>}
          </div>

          {/* Color */}
          <div className="col-md-6 mb-3">
            <label>Color</label>
            <input type="text" className="form-control" value={data.color} onChange={(e) => setData('color', e.target.value)} disabled={processing} />
            {errors.color && <div className="text-danger">{errors.color}</div>}
          </div>

          {/* Batería */}
          <div className="col-md-6 mb-3">
            <label>Batería (opcional)</label>
            <input type="text" className="form-control" value={data.bateria} onChange={(e) => setData('bateria', e.target.value)} disabled={processing} />
            {errors.bateria && <div className="text-danger">{errors.bateria}</div>}
          </div>

          {/* IMEI 1 */}
          <div className="col-md-6 mb-3">
            <label>IMEI 1</label>
            <input type="text" className="form-control" value={data.imei_1} onChange={(e) => setData('imei_1', e.target.value)} disabled={processing} />
            {errors.imei_1 && <div className="text-danger">{errors.imei_1}</div>}
          </div>

          {/* IMEI 2 */}
          <div className="col-md-6 mb-3">
            <label>IMEI 2 (opcional)</label>
            <input type="text" className="form-control" value={data.imei_2} onChange={(e) => setData('imei_2', e.target.value)} disabled={processing} />
            {errors.imei_2 && <div className="text-danger">{errors.imei_2}</div>}
          </div>

          {/* Estado IMEI */}
          <div className="col-md-6 mb-3">
            <label>Estado IMEI</label>
            <select className="form-select" value={data.estado_imei} onChange={(e) => setData('estado_imei', e.target.value)} disabled={processing}>
              <option value="libre">Libre</option>
              <option value="registrado">Registrado</option>
              <option value="imei1_libre_imei2_registrado">IMEI 1 libre, IMEI 2 registrado</option>
              <option value="imei1_registrado_imei2_libre">IMEI 1 registrado, IMEI 2 libre</option>
            </select>
            {errors.estado_imei && <div className="text-danger">{errors.estado_imei}</div>}
          </div>

          {/* Procedencia */}
          <div className="col-md-6 mb-3">
            <label>Procedencia</label>
            <input type="text" className="form-control" value={data.procedencia} onChange={(e) => setData('procedencia', e.target.value)} disabled={processing} />
            {errors.procedencia && <div className="text-danger">{errors.procedencia}</div>}
          </div>

          {/* Precio costo */}
          <div className="col-md-6 mb-3">
            <label>Precio de Costo</label>
            <input type="number" className="form-control" value={data.precio_costo} onChange={(e) => setData('precio_costo', e.target.value)} disabled={processing} />
            {errors.precio_costo && <div className="text-danger">{errors.precio_costo}</div>}
          </div>

          {/* Precio venta */}
          <div className="col-md-6 mb-3">
            <label>Precio de Venta</label>
            <input type="number" className="form-control" value={data.precio_venta} onChange={(e) => setData('precio_venta', e.target.value)} disabled={processing} />
            {errors.precio_venta && <div className="text-danger">{errors.precio_venta}</div>}
          </div>

          {/* Estado */}
          <div className="col-md-6 mb-3">
            <label>Estado</label>
            <select className="form-select" value={data.estado} onChange={(e) => setData('estado', e.target.value)} disabled={processing}>
              <option value="disponible">Disponible</option>
              <option value="vendido">Vendido</option>
              <option value="permuta">Permuta</option>
            </select>
            {errors.estado && <div className="text-danger">{errors.estado}</div>}
          </div>
        </div>

        <div className="mt-4 d-flex justify-content-between">
          <Link href={route('admin.celulares.index')} className="btn btn-outline-secondary">
            Cancelar
          </Link>
          <button type="submit" className="btn btn-primary" disabled={processing}>
            Guardar
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
