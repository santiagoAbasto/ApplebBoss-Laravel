import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';

export default function Create() {
  const { data, setData, post, processing, errors } = useForm({
    modelo: '',
    capacidad: '',
    bateria: '',
    color: '',
    numero_serie: '',
    procedencia: '',
    precio_costo: '',
    precio_venta: '',
    tiene_imei: false,
    imei_1: '',
    imei_2: '',
    estado_imei: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('admin.productos-apple.store'));
  };

  return (
    <AdminLayout>
      <Head title="Crear Producto Apple" />

      <h1 className="text-2xl font-bold mb-4">📱 Crear Producto Apple</h1>

      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">

        <div>
          <label>Modelo</label>
          <input type="text" value={data.modelo} onChange={e => setData('modelo', e.target.value)} className="form-control" />
          {errors.modelo && <p className="text-red-600">{errors.modelo}</p>}
        </div>

        <div>
          <label>Capacidad</label>
          <input type="text" value={data.capacidad} onChange={e => setData('capacidad', e.target.value)} className="form-control" />
          {errors.capacidad && <p className="text-red-600">{errors.capacidad}</p>}
        </div>

        <div>
          <label>Batería</label>
          <input type="text" value={data.bateria} onChange={e => setData('bateria', e.target.value)} className="form-control" />
          {errors.bateria && <p className="text-red-600">{errors.bateria}</p>}
        </div>

        <div>
          <label>Color</label>
          <input type="text" value={data.color} onChange={e => setData('color', e.target.value)} className="form-control" />
          {errors.color && <p className="text-red-600">{errors.color}</p>}
        </div>

        <div>
          <label>Número de serie / IMEI general</label>
          <input type="text" value={data.numero_serie} onChange={e => setData('numero_serie', e.target.value)} className="form-control" />
          {errors.numero_serie && <p className="text-red-600">{errors.numero_serie}</p>}
        </div>

        <div>
          <label>Procedencia</label>
          <input type="text" value={data.procedencia} onChange={e => setData('procedencia', e.target.value)} className="form-control" />
          {errors.procedencia && <p className="text-red-600">{errors.procedencia}</p>}
        </div>

        <div>
          <label>Precio costo</label>
          <input type="number" value={data.precio_costo} onChange={e => setData('precio_costo', e.target.value)} className="form-control" />
          {errors.precio_costo && <p className="text-red-600">{errors.precio_costo}</p>}
        </div>

        <div>
          <label>Precio venta</label>
          <input type="number" value={data.precio_venta} onChange={e => setData('precio_venta', e.target.value)} className="form-control" />
          {errors.precio_venta && <p className="text-red-600">{errors.precio_venta}</p>}
        </div>

        <div>
          <label>¿El producto tiene IMEI?</label>
          <select value={data.tiene_imei} onChange={e => setData('tiene_imei', e.target.value === 'true')} className="form-control">
            <option value="false">No</option>
            <option value="true">Sí</option>
          </select>
          {errors.tiene_imei && <p className="text-red-600">{errors.tiene_imei}</p>}
        </div>

        {data.tiene_imei && (
          <>
            <div>
              <label>IMEI 1</label>
              <input type="text" value={data.imei_1} onChange={e => setData('imei_1', e.target.value)} className="form-control" />
              {errors.imei_1 && <p className="text-red-600">{errors.imei_1}</p>}
            </div>

            <div>
              <label>IMEI 2</label>
              <input type="text" value={data.imei_2} onChange={e => setData('imei_2', e.target.value)} className="form-control" />
              {errors.imei_2 && <p className="text-red-600">{errors.imei_2}</p>}
            </div>

            <div>
              <label>Estado del IMEI</label>
              <select value={data.estado_imei} onChange={e => setData('estado_imei', e.target.value)} className="form-control">
                <option value="">Seleccionar</option>
                <option>Libre</option>
                <option>Registro seguro</option>
                <option>IMEI 1 libre y IMEI 2 registrado</option>
                <option>IMEI 2 libre y IMEI 1 registrado</option>
              </select>
              {errors.estado_imei && <p className="text-red-600">{errors.estado_imei}</p>}
            </div>
          </>
        )}

        <button type="submit" disabled={processing} className="btn btn-primary">Guardar Producto</button>
      </form>
    </AdminLayout>
  );
}
