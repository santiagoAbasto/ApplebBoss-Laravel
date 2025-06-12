import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm } from '@inertiajs/react';

export default function Edit({ cliente }) {
  const { data, setData, put, processing, errors } = useForm({
    nombre: cliente.nombre || '',
    telefono: cliente.telefono || '',
    correo: cliente.correo || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    put(route('admin.clientes.update', cliente.id));
  };

  return (
    <AdminLayout>
      <Head title="Editar Cliente" />

      <div className="max-w-3xl mx-auto mt-6">
        <h1 className="text-3xl font-bold text-[#003366] mb-6">✏️ Editar Cliente</h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              value={data.nombre}
              onChange={(e) => setData('nombre', e.target.value)}
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
            />
            {errors.nombre && <p className="text-sm text-red-600 mt-1">{errors.nombre}</p>}
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
            <input
              type="text"
              value={data.telefono}
              onChange={(e) => setData('telefono', e.target.value)}
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
            />
            {errors.telefono && <p className="text-sm text-red-600 mt-1">{errors.telefono}</p>}
          </div>

          {/* Correo */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
            <input
              type="email"
              value={data.correo}
              onChange={(e) => setData('correo', e.target.value)}
              className="mt-1 w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
            />
            {errors.correo && <p className="text-sm text-red-600 mt-1">{errors.correo}</p>}
          </div>

          {/* Botón */}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={processing}
              className="w-full bg-[#003366] text-white py-3 px-6 rounded-lg font-semibold shadow hover:bg-blue-900 transition disabled:opacity-50"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
