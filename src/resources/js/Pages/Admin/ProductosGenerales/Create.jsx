import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function CreateProductoGeneral() {
  const { data, setData, post, processing, errors } = useForm({
    codigo: '',
    tipo: '',
    nombre: '',
    procedencia: '',
    precio_costo: '',
    precio_venta: '',
    estado: 'disponible',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('admin.productos-generales.store'));
  };

  return (
    <AdminLayout>
      <Head title="Registrar Producto General" />

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 text-gray-800">Registrar nuevo producto general</h1>
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
            <select
              className="form-select"
              value={data.tipo}
              onChange={(e) => setData('tipo', e.target.value)}
              disabled={processing}
            >
              <option value="">-- Selecciona --</option>
              <option value="vidrio_templado">Vidrio Templado</option>
              <option value="vidrio_camara">Vidrio de Cámara</option>
              <option value="funda">Funda</option>
              <option value="accesorio">Accesorio</option>
              <option value="cargador_5w">Cargador 5W</option>
              <option value="cargador_20w">Cargador 20W</option>
              <option value="otro">Otro</option>
            </select>
            {errors.tipo && <div className="text-danger">{errors.tipo}</div>}
          </div>

          {/* Nombre (opcional) */}
          <div className="col-md-6 mb-3">
            <label>Nombre (opcional)</label>
            <input
              type="text"
              className="form-control"
              value={data.nombre}
              onChange={(e) => setData('nombre', e.target.value)}
              disabled={processing}
            />
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
        </div>

        <div className="mt-3 d-flex justify-content-between">
          <Link href={route('admin.productos-generales.index')} className="btn btn-outline-secondary">
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
