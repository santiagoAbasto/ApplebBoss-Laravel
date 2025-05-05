import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function CreateComputadora() {
  const { data, setData, post, processing, errors } = useForm({
    nombre: '',
    numero_serie: '',
    color: '',
    bateria: '',
    ram: '',
    almacenamiento: '',
    procedencia: '',
    precio_costo: '',
    precio_venta: '',
    estado: 'disponible',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    post(route('admin.computadoras.store'));
  };

  return (
    <AdminLayout>
      <Head title="Registrar Computadora" />

      <div className="mb-4">
        <h1 className="h3 text-gray-800">Registrar nueva computadora</h1>
      </div>

      <form onSubmit={handleSubmit} className="card shadow p-4">
        <div className="row">
          {[
            { label: 'Nombre', key: 'nombre' },
            { label: 'Número de Serie', key: 'numero_serie' },
            { label: 'Color', key: 'color' },
            { label: 'Batería (opcional)', key: 'bateria' },
            { label: 'RAM', key: 'ram' },
            { label: 'Almacenamiento', key: 'almacenamiento' },
            { label: 'Procedencia', key: 'procedencia' },
            { label: 'Precio Costo', key: 'precio_costo', type: 'number' },
            { label: 'Precio Venta', key: 'precio_venta', type: 'number' },
          ].map(({ label, key, type = 'text' }) => (
            <div className="col-md-6 mb-3" key={key}>
              <label>{label}</label>
              <input
                type={type}
                className="form-control"
                value={data[key]}
                onChange={(e) => setData(key, e.target.value)}
              />
              {errors[key] && <div className="text-danger">{errors[key]}</div>}
            </div>
          ))}

          <div className="col-md-6 mb-3">
            <label>Estado</label>
            <select
              className="form-select"
              value={data.estado}
              onChange={(e) => setData('estado', e.target.value)}
            >
              <option value="disponible">Disponible</option>
              <option value="vendido">Vendido</option>
              <option value="permuta">Permuta</option>
            </select>
          </div>
        </div>

        <div className="mt-3">
          <button type="submit" className="btn btn-primary" disabled={processing}>
            Guardar
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
