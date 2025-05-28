import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function EditComputadora({ computadora }) {
  const { data, setData, put, processing, errors } = useForm({
    nombre: computadora.nombre,
    procesador: computadora.procesador || '',
    numero_serie: computadora.numero_serie,
    color: computadora.color,
    bateria: computadora.bateria,
    ram: computadora.ram,
    almacenamiento: computadora.almacenamiento,
    procedencia: computadora.procedencia,
    precio_costo: computadora.precio_costo,
    precio_venta: computadora.precio_venta,
    estado: computadora.estado,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    put(route('admin.computadoras.update', computadora.id));
  };

  return (
    <AdminLayout>
      <Head title="Editar Computadora" />

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          ✏️ Editar computadora: <span className="text-blue-600">{computadora.nombre}</span>
        </h1>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md space-y-6"
      >
        <div className="grid md:grid-cols-2 gap-6">
          {/* Nombre */}
          <div>
            <label className="block font-semibold mb-1">Nombre</label>
            <input
              type="text"
              value={data.nombre}
              onChange={(e) => setData('nombre', e.target.value)}
              className="w-full border-gray-300 rounded px-4 py-2 focus:ring focus:ring-blue-200"
            />
            {errors.nombre && <p className="text-red-600 text-sm mt-1">{errors.nombre}</p>}
          </div>

          {/* Procesador */}
          <div>
            <label className="block font-semibold mb-1">Procesador</label>
            <input
              type="text"
              value={data.procesador}
              onChange={(e) => setData('procesador', e.target.value)}
              className="w-full border-gray-300 rounded px-4 py-2 focus:ring focus:ring-blue-200"
            />
            {errors.procesador && <p className="text-red-600 text-sm mt-1">{errors.procesador}</p>}
          </div>

          {/* Campos reutilizables */}
          {[
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
              <label className="block font-semibold mb-1">{label}</label>
              <input
                type={type}
                value={data[key]}
                onChange={(e) => setData(key, e.target.value)}
                className="w-full border-gray-300 rounded px-4 py-2 focus:ring focus:ring-blue-200"
              />
              {errors[key] && <p className="text-red-600 text-sm mt-1">{errors[key]}</p>}
            </div>
          ))}

          {/* Estado */}
          <div>
            <label className="block font-semibold mb-1">Estado</label>
            <select
              value={data.estado}
              onChange={(e) => setData('estado', e.target.value)}
              className="w-full border-gray-300 rounded px-4 py-2 focus:ring focus:ring-blue-200"
            >
              <option value="disponible">Disponible</option>
              <option value="vendido">Vendido</option>
              <option value="permuta">Permuta</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={processing}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded shadow disabled:opacity-50"
          >
            💾 Actualizar
          </button>
        </div>
      </form>
    </AdminLayout>
  );
}
