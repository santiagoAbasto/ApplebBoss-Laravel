import VendedorLayout from '@/Layouts/VendedorLayout';
import { Head, useForm } from '@inertiajs/react';

export default function Edit({ cliente }) {
  const { data, setData, put, processing, errors } = useForm({
    nombre: cliente.nombre || '',
    telefono: cliente.telefono || '',
    correo: cliente.correo || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    put(route('vendedor.clientes.update', cliente.id));
  };

  return (
    <VendedorLayout>
      <Head title="Editar Cliente" />

      <div className="max-w-3xl mx-auto bg-white p-6 rounded shadow">
        <h1 className="text-2xl font-bold text-[#003366] mb-6">✏️ Editar Cliente</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input
              type="text"
              className="input w-full"
              value={data.nombre}
              onChange={(e) => setData('nombre', e.target.value)}
              required
            />
            {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="tel"
              className="input w-full"
              value={data.telefono}
              onChange={(e) => setData('telefono', e.target.value)}
              required
            />
            {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo (opcional)</label>
            <input
              type="email"
              className="input w-full"
              value={data.correo}
              onChange={(e) => setData('correo', e.target.value)}
            />
            {errors.correo && <p className="text-red-500 text-sm mt-1">{errors.correo}</p>}
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={processing}
              className="btn btn-primary px-5 py-2 rounded text-white bg-[#003366] hover:bg-[#002244] shadow"
            >
              💾 Guardar cambios
            </button>
          </div>
        </form>
      </div>
    </VendedorLayout>
  );
}
