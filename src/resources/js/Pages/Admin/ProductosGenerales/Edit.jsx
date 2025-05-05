import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function Edit({ producto }) {
  const { data, setData, put, processing, errors } = useForm({
    codigo: producto.codigo,
    tipo: producto.tipo,
    nombre: producto.nombre,
    procedencia: producto.procedencia,
    precio_costo: producto.precio_costo,
    precio_venta: producto.precio_venta,
    estado: producto.estado,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    put(route('admin.productos-generales.update', producto.id));
  };

  return (
    <AdminLayout>
      <Head title="Editar Producto General" />
      
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <h1 className="h3 text-gray-800">Editar Producto</h1>
        <Link href={route('admin.productos-generales.index')} className="btn btn-secondary">
          ← Volver
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="card shadow p-4">
        <div className="row">
          {/* Código */}
          <div className="col-md-6 mb-3">
            <label>Código</label>
            <input
              type="text"
              className="form-control"
              value={data.codigo}
              onChange={(e) => setData('codigo', e.target.value)}
              disabled={processing}
            />
            {errors.codigo && <div className="text-danger">{errors.codigo}</div>}
          </div>

          {/* Tipo */}
          <div className="col-md-6 mb-3">
            <label>Tipo</label>
            <input
              type="text"
              className="form-control"
              value={data.tipo}
              onChange={(e) => setData('tipo', e.target.value)}
              disabled={processing}
            />
            {errors.tipo && <div className="text-danger">{errors.tipo}</div>}
          </div>

          {/* Nombre */}
          <div className="col-md-6 mb-3">
            <label>Nombre</label>
            <input
              type="text"
              className="form-control"
              value={data.nombre}
              onChange={(e) => setData('nombre', e.target.value)}
              disabled={processing}
            />
            {errors.nombre && <div className="text-danger">{errors.nombre}</div>}
          </div>

          {/* Procedencia */}
          <div className="col-md-6 mb-3">
            <label>Procedencia</label>
            <input
              type="text"
              className="form-control"
              value={data.procedencia}
              onChange={(e) => setData('procedencia', e.target.value)}
              disabled={processing}
            />
            {errors.procedencia && <div className="text-danger">{errors.procedencia}</div>}
          </div>

          {/* Precio costo */}
          <div className="col-md-6 mb-3">
            <label>Precio de Costo</label>
            <input
              type="number"
              className="form-control"
              value={data.precio_costo}
              onChange={(e) => setData('precio_costo', e.target.value)}
              disabled={processing}
            />
            {errors.precio_costo && <div className="text-danger">{errors.precio_costo}</div>}
          </div>

          {/* Precio venta */}
          <div className="col-md-6 mb-3">
            <label>Precio de Venta</label>
            <input
              type="number"
              className="form-control"
              value={data.precio_venta}
              onChange={(e) => setData('precio_venta', e.target.value)}
              disabled={processing}
            />
            {errors.precio_venta && <div className="text-danger">{errors.precio_venta}</div>}
          </div>

          {/* Estado */}
          <div className="col-md-6 mb-3">
            <label>Estado</label>
            <select
              className="form-select"
              value={data.estado}
              onChange={(e) => setData('estado', e.target.value)}
              disabled={processing}
            >
              <option value="disponible">Disponible</option>
              <option value="vendido">Vendido</option>
              <option value="permuta">Permuta</option>
            </select>
            {errors.estado && <div className="text-danger">{errors.estado}</div>}
          </div>
        </div>

        <div className="mt-4 d-flex justify-content-between">
          <Link href={route('admin.productos-generales.index')} className="btn btn-outline-secondary">
            Cancelar
          </Link>
          <button type="submit" className="btn btn-primary" disabled={processing}>
            Actualizar
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
