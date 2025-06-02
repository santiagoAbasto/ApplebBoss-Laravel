import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { route } from 'ziggy-js'; // ✅ CORRECTO



export default function CreateComputadora() {
  const { data, setData, post, processing, errors } = useForm({
    nombre: '',
    procesador: '',
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

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          💻 Registrar Nueva Computadora
        </h1>
        <p className="text-sm text-gray-500">Completa todos los campos para registrar una nueva computadora en el sistema.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Campos individuales */}
          {[
            { label: 'Nombre', key: 'nombre' },
            { label: 'Procesador', key: 'procesador' },
            { label: 'Número de Serie', key: 'numero_serie' },
            { label: 'Color', key: 'color' },
            { label: 'Batería (opcional)', key: 'bateria' },
            { label: 'RAM', key: 'ram' },
            { label: 'Almacenamiento', key: 'almacenamiento' },
            { label: 'Procedencia', key: 'procedencia' },
            { label: 'Precio Costo (Bs)', key: 'precio_costo', type: 'number' },
            { label: 'Precio Venta (Bs)', key: 'precio_venta', type: 'number' },
          ].map(({ label, key, type = 'text' }) => (
            <div key={key}>
              <label className="block font-medium text-sm text-gray-700 mb-1">{label}</label>
              <input
                type={type}
                value={data[key]}
                onChange={(e) => setData(key, e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-200 px-4 py-2"
              />
              {errors[key] && <p className="text-red-600 text-xs mt-1">{errors[key]}</p>}
            </div>
          ))}

          {/* Estado */}
          <div>
            <label className="block font-medium text-sm text-gray-700 mb-1">Estado</label>
            <select
              value={data.estado}
              onChange={(e) => setData('estado', e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm px-4 py-2 focus:ring focus:ring-blue-200"
            >
              <option value="disponible">Disponible</option>
              <option value="vendido">Vendido</option>
              <option value="permuta">Permuta</option>
            </select>
            {errors.estado && <p className="text-red-600 text-xs mt-1">{errors.estado}</p>}
          </div>
        </div>

        {/* Botón */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={processing}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded shadow disabled:opacity-50"
          >
            Guardar Computadora
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
