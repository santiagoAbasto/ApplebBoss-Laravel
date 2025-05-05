import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Edit({ celular }) {
  const { data, setData, put, errors } = useForm({
    modelo: celular.modelo || '',
    capacidad: celular.capacidad || '',
    color: celular.color || '',
    bateria: celular.bateria || '',
    imei_1: celular.imei_1 || '',
    imei_2: celular.imei_2 || '',
    estado_imei: celular.estado_imei || 'libre',
    procedencia: celular.procedencia || '',
    precio_costo: celular.precio_costo || '',
    precio_venta: celular.precio_venta || '',
    estado: celular.estado || 'disponible',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    put(route('admin.celulares.update', celular.id));
  };

  return (
    <AdminLayout>
      <Head title="Editar Celular" />
      <h1 className="h3 mb-4">Editar Celular</h1>

      <form onSubmit={handleSubmit}>
        <div className="row">
          {/* Modelo */}
          <div className="mb-3 col-md-4">
            <label className="form-label">Modelo</label>
            <input type="text" className="form-control" value={data.modelo} onChange={(e) => setData('modelo', e.target.value)} />
            {errors.modelo && <div className="text-danger">{errors.modelo}</div>}
          </div>

          {/* Capacidad */}
          <div className="mb-3 col-md-4">
            <label className="form-label">Capacidad</label>
            <input type="text" className="form-control" value={data.capacidad} onChange={(e) => setData('capacidad', e.target.value)} />
            {errors.capacidad && <div className="text-danger">{errors.capacidad}</div>}
          </div>

          {/* Color */}
          <div className="mb-3 col-md-4">
            <label className="form-label">Color</label>
            <input type="text" className="form-control" value={data.color} onChange={(e) => setData('color', e.target.value)} />
            {errors.color && <div className="text-danger">{errors.color}</div>}
          </div>

          {/* Batería */}
          <div className="mb-3 col-md-4">
            <label className="form-label">Batería</label>
            <input type="text" className="form-control" value={data.bateria} onChange={(e) => setData('bateria', e.target.value)} />
            {errors.bateria && <div className="text-danger">{errors.bateria}</div>}
          </div>

          {/* IMEI 1 */}
          <div className="mb-3 col-md-4">
            <label className="form-label">IMEI 1</label>
            <input type="text" className="form-control" value={data.imei_1} onChange={(e) => setData('imei_1', e.target.value)} />
            {errors.imei_1 && <div className="text-danger">{errors.imei_1}</div>}
          </div>

          {/* IMEI 2 */}
          <div className="mb-3 col-md-4">
            <label className="form-label">IMEI 2</label>
            <input type="text" className="form-control" value={data.imei_2} onChange={(e) => setData('imei_2', e.target.value)} />
            {errors.imei_2 && <div className="text-danger">{errors.imei_2}</div>}
          </div>

          {/* Estado IMEI */}
          <div className="mb-3 col-md-4">
            <label className="form-label">Estado IMEI</label>
            <select className="form-select" value={data.estado_imei} onChange={(e) => setData('estado_imei', e.target.value)}>
              <option value="libre">Libre</option>
              <option value="registrado">Registrado</option>
              <option value="imei1_libre_imei2_registrado">IMEI1 Libre / IMEI2 Registrado</option>
              <option value="imei1_registrado_imei2_libre">IMEI1 Registrado / IMEI2 Libre</option>
            </select>
            {errors.estado_imei && <div className="text-danger">{errors.estado_imei}</div>}
          </div>

          {/* Procedencia */}
          <div className="mb-3 col-md-4">
            <label className="form-label">Procedencia</label>
            <input type="text" className="form-control" value={data.procedencia} onChange={(e) => setData('procedencia', e.target.value)} />
            {errors.procedencia && <div className="text-danger">{errors.procedencia}</div>}
          </div>

          {/* Precio Costo */}
          <div className="mb-3 col-md-4">
            <label className="form-label">Precio Costo</label>
            <input type="number" className="form-control" value={data.precio_costo} onChange={(e) => setData('precio_costo', e.target.value)} />
            {errors.precio_costo && <div className="text-danger">{errors.precio_costo}</div>}
          </div>

          {/* Precio Venta */}
          <div className="mb-3 col-md-4">
            <label className="form-label">Precio Venta</label>
            <input type="number" className="form-control" value={data.precio_venta} onChange={(e) => setData('precio_venta', e.target.value)} />
            {errors.precio_venta && <div className="text-danger">{errors.precio_venta}</div>}
          </div>

          {/* Estado */}
          <div className="mb-3 col-md-4">
            <label className="form-label">Estado</label>
            <select className="form-select" value={data.estado} onChange={(e) => setData('estado', e.target.value)}>
              <option value="disponible">Disponible</option>
              <option value="vendido">Vendido</option>
              <option value="permuta">Permuta</option>
            </select>
            {errors.estado && <div className="text-danger">{errors.estado}</div>}
          </div>
        </div>

        <button type="submit" className="btn btn-success">💾 Actualizar</button>
      </form>
    </AdminLayout>
  );
}
